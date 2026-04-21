import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Phase 2 — API contract sweep (revised for defense-in-depth ordering).
 *
 * Consumes `tmp/api-inventory.json` (produced by
 * `scripts/audit-api-contracts.mjs`) and exercises every route's
 * contract against the live dev server. Intentional scope: do NOT run
 * against production — some probes land on routes that would mutate
 * shared state if the gate ever slipped (admin, DELETE on /api/me).
 *
 * Contract matrix (enforced per route):
 *
 *   non-CSRF-exempt  +  mutating (POST/PATCH/PUT/DELETE)
 *     → 403 csrf-failed (edge middleware fires first)
 *   CSRF-exempt + admin-gated
 *     → 401 unauthorized on missing/invalid Bearer
 *   CSRF-exempt + cron-gated
 *     → 401 unauthorized (when CRON_SECRET is set in the env)
 *   CSRF-exempt + session-gated + mutating
 *     → 401 unauthorized (no cookie; no CSRF to fail first)
 *   CSRF-exempt + session-gated + GET
 *     → 401 unauthorized (plain session check)
 *   unsupported method + mutating verb on non-exempt
 *     → 403 (CSRF wins first — also acceptable)
 *   unsupported method + GET on POST-only route
 *     → 405
 *
 * Per-route overrides live in CONTRACT_OVERRIDES with a short reason;
 * they are the documented exceptions, not a silent skip list.
 */

type RouteRow = {
  path: string;
  file: string;
  methods: string[];
  usesSession: boolean;
  requiresAdminSecret: boolean;
  requiresCronSecret: boolean;
  csrfExempt: boolean;
  usesZod: boolean;
  usesRateLimit: boolean;
};

type Inventory = { exempt: string[]; routes: RouteRow[] };

const INVENTORY: Inventory = JSON.parse(
  readFileSync(join(__dirname, "..", "tmp", "api-inventory.json"), "utf8"),
);

const ALL_METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;

/* Path param placeholder — deliberately opaque so routes that
 * short-circuit on well-known ids ("me", "global", etc.) can't mask
 * a bug. The substituted segment is URL-safe and unlikely to collide
 * with real data in any test fixture. */
function concretize(path: string): string {
  return path.replace(/\[([^\]]+)]/g, (_m, name) => `__e2e_${name}__`);
}

async function probe(
  request: APIRequestContext,
  method: string,
  path: string,
  opts: { body?: unknown; headers?: Record<string, string> } = {},
) {
  const url = concretize(path);
  const init: Parameters<APIRequestContext["fetch"]>[1] = {
    method,
    failOnStatusCode: false,
    headers: opts.headers ?? {},
  };
  if (opts.body !== undefined) {
    init.data = opts.body;
    init.headers = { "content-type": "application/json", ...init.headers };
  }
  return request.fetch(url, init);
}

/* Explicit per-route contract deviations. Every entry has a `reason`
 * so the next auditor understands *why* — no silent skips. */
const CONTRACT_OVERRIDES: Record<
  string,
  {
    noAuthGet?: number | number[];
    noAuthPost?: number | number[];
    reason: string;
  }
> = {
  // CSRF-exempt auth surfaces accept anon traffic; the body-level
  // validation (Zod / existence of session) decides the response.
  "/api/auth/login": { noAuthPost: 400, reason: "CSRF-exempt + Zod rejects empty body" },
  "/api/auth/register": { noAuthPost: 400, reason: "CSRF-exempt + Zod rejects empty body" },
  // Logout is deliberately *not* in EXEMPT_PATH_PREFIXES — keeping it
  // CSRF-guarded blocks forced-logout CSRF from a malicious page
  // iframe. Real users always have the seed cookie by then; anon
  // callers have nothing to log out of, so a 403 for them is fine.
  "/api/lang": { noAuthPost: 400, reason: "CSRF-exempt + Zod rejects empty body" },
  "/api/analytics/web-vitals": { noAuthPost: 204, reason: "CSRF-exempt + sink-pattern: 204 no-content even on bad body (never block the user)" },
  "/api/consent/[token]": { noAuthPost: 400, reason: "CSRF-exempt + bogus token returns 400 unknown-or-expired-token" },

  // Public reads that DO surface data, by design.
  "/api/leaderboard": { noAuthGet: 200, reason: "public read — homepage + landing use it" },
  "/api/events/latest-game": { noAuthGet: 200, reason: "public read — landing polls this every 30s for new-game toast" },
  "/api/dla-szkol/pitch": { noAuthGet: 200, reason: "public read — PDF pitch deck for school leads" },

  // /api/me is a designed inspection endpoint — anonymous callers are
  // told they're anonymous rather than 401'd (the UI uses this to
  // decide what nav to render).
  "/api/me": { noAuthGet: 200, reason: "inspection endpoint — returns {authenticated:false} for anon, 401 would break the public nav" },
  "/api/nauczyciel/signup": { noAuthGet: 200, reason: "teacher-state probe — anon sees {ok:false, teacher:false}" },

  // Admin POST-only routes expose a minimal GET 405 "use POST" hint
  // for developer ergonomics (curl without -X POST shouldn't hang).
  // The 405 carries NO data fields — guarded separately by the
  // information-disclosure assertion block below.
  "/api/admin/archive-cleanup": { noAuthGet: 405, reason: "admin POST-only; GET returns 405 'use POST' (no data leak)" },
  "/api/admin/leaderboard": { noAuthGet: 405, reason: "admin POST-only; GET returns 405 'use POST' (no data leak)" },

  // Public read feeds. The zTopN enumerators + Redis reads are safe
  // to expose anonymously — the page itself renders them without a
  // session.
  "/api/community/comments/[gameId]": { noAuthGet: 200, reason: "public comment feed — the SSR page reads these without a session" },
  "/api/community/theme-proposals": { noAuthGet: 200, reason: "public theme-proposal feed" },
  "/api/loans/take-generic": { noAuthGet: 200, reason: "public loan-product catalog (APRs, allowed terms); the POST is session-gated" },
};

function expectOneOf(actual: number, expected: number | number[]): void {
  const allowed = Array.isArray(expected) ? expected : [expected];
  expect(allowed, `status ${actual} not in ${allowed.join("|")}`).toContain(actual);
}

test.describe("API contracts — auth gating", () => {
  for (const route of INVENTORY.routes) {
    const override = CONTRACT_OVERRIDES[route.path] ?? { reason: "default contract" };

    // Override wins over the category default — lets an admin POST-only
    // route declare `noAuthGet: 405` instead of the admin-default 401.
    if (route.methods.includes("GET")) {
      let expected: number | number[];
      if (override.noAuthGet !== undefined) expected = override.noAuthGet;
      else if (route.requiresAdminSecret || route.requiresCronSecret) expected = 401;
      else if (route.usesSession) expected = 401;
      else expected = 200;
      const label = route.requiresAdminSecret ? "admin" : route.requiresCronSecret ? "cron" : route.usesSession ? "session" : "public";
      test(`[${label}] GET ${route.path} anonymous → ${expected} (${override.reason})`, async ({ request }) => {
        const r = await probe(request, "GET", route.path);
        expectOneOf(r.status(), expected);
      });
    }

    const mutating = route.methods.find((m) => m !== "GET");
    if (mutating) {
      // CSRF is the first gate for mutating methods on non-exempt paths;
      // override still wins if an operator explicitly carved one out.
      let expected: number | number[];
      if (override.noAuthPost !== undefined) expected = override.noAuthPost;
      else if (!route.csrfExempt) expected = 403;
      else if (route.requiresAdminSecret || route.requiresCronSecret) expected = 401;
      else if (route.usesSession) expected = 401;
      else expected = 200;
      const label = !route.csrfExempt ? "csrf-guarded" : route.requiresAdminSecret ? "admin" : route.requiresCronSecret ? "cron" : route.usesSession ? "session" : "public";
      test(`[${label}] ${mutating} ${route.path} anonymous → ${expected} (${override.reason})`, async ({ request }) => {
        const r = await probe(request, mutating, route.path, { body: {} });
        expectOneOf(r.status(), expected);
      });
    }
  }
});

test.describe("API contracts — CSRF token needed for non-exempt mutations", () => {
  for (const route of INVENTORY.routes) {
    if (route.csrfExempt) continue;
    const mutating = route.methods.find((m) => m !== "GET");
    if (!mutating) continue;
    test(`${mutating} ${route.path} missing wc_csrf → 403 csrf-failed`, async ({ request }) => {
      const r = await probe(request, mutating, route.path, { body: {} });
      expect(r.status(), `${route.path} ${mutating}`).toBe(403);
      const body = await r.json().catch(() => null);
      expect(body?.error).toBe("csrf-failed");
    });
  }
});

test.describe("API contracts — unsupported method never 5xx", () => {
  for (const route of INVENTORY.routes) {
    const unsupported = ALL_METHODS.filter((m) => !route.methods.includes(m));
    // Probe one unsupported mutating method AND the GET shape when GET
    // is unsupported — both classes have different expected outcomes.
    for (const method of unsupported) {
      const isMutating = method !== "GET";
      // Mutating unsupported on non-exempt CSRF-guarded path → 403
      // (middleware wins). Otherwise the framework returns 405.
      const allowed = isMutating && !route.csrfExempt ? [403, 404, 405] : [404, 405];
      test(`${method} ${route.path} → ${allowed.join("|")}`, async ({ request }) => {
        const r = await probe(request, method, route.path, isMutating ? { body: {} } : {});
        expectOneOf(r.status(), allowed);
      });
    }
  }
});

test.describe("API contracts — information disclosure on admin GETs", () => {
  // rotate-ai used to leak the full theme pool in its 405/error body.
  // Assert that an anonymous GET to any admin route never surfaces
  // object-shaped data beyond `{ok:false, error:"..."}`.
  for (const route of INVENTORY.routes.filter((r) => r.requiresAdminSecret && r.methods.includes("GET"))) {
    test(`GET ${route.path} anonymous body carries no data fields`, async ({ request }) => {
      const r = await probe(request, "GET", route.path);
      const body = await r.json().catch(() => null);
      if (!body) return; // empty body is fine
      // Allowed keys: ok, error. Anything else is a leak.
      const dataKeys = Object.keys(body).filter((k) => !["ok", "error"].includes(k));
      expect(dataKeys, `${route.path} leaked keys: ${dataKeys.join(",")}`).toEqual([]);
    });
  }
});
