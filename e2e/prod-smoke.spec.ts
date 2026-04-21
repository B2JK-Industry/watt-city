import { test, expect, type APIResponse } from "@playwright/test";
import { scanSeriousA11y } from "./_helpers";

/* Production smoke — read-only health checks against a deployed URL.
 *
 * Run: PLAYWRIGHT_BASE_URL=https://watt-city.vercel.app \
 *      PLAYWRIGHT_WEBSERVER=0 pnpm test:e2e -- prod-smoke
 *
 * Intent: zero state mutation. No register, no login, no score POST —
 * anything that writes to Upstash would pollute the production data set.
 * Everything here is GET-only + axe scans on anonymous renders.
 *
 * Coverage:
 *  - every top-level public page renders an <h1>
 *  - axe WCAG 2 A/AA serious+critical violation list is empty for each
 *  - security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc.)
 *    match next.config.ts on the landing HTML
 *  - auth-gated pages redirect to /login when anonymous
 *  - JSON API contracts answer cleanly for the unauthenticated path:
 *      GET /api/me        → { authenticated: false }
 *      GET /api/leaderboard → 200 + JSON body
 *  - favicon + icon assets return 200 with long-max-age Cache-Control
 *  - CSRF cookie seed (wc_csrf) is set on first HTML response
 *
 * All selectors are framework-agnostic (getByRole) and i18n-safe (match
 * any locale's h1 by regex only when text is not hardcoded per locale).
 *
 * IMPORTANT — no hardcoded URLs. PLAYWRIGHT_BASE_URL drives everything;
 * if unset, playwright.config.ts falls back to localhost:3000.
 */

const PUBLIC_PAGES = [
  { path: "/", label: "landing" },
  { path: "/games", label: "games hub" },
  { path: "/leaderboard", label: "leaderboard" },
  { path: "/login", label: "login" },
  { path: "/register", label: "register" },
  { path: "/o-platforme", label: "about (o-platforme)" },
  { path: "/ochrana-sukromia", label: "privacy (ochrana-sukromia)" },
  { path: "/sin-slavy", label: "hall of fame (sin-slavy)" },
  { path: "/dla-szkol", label: "for schools (dla-szkol)" },
] as const;

const AUTH_REDIRECT_PAGES = [
  { path: "/miasto", to: /\/login/ },
  { path: "/profile", to: /\/login/ },
  { path: "/friends", to: /\/login/ },
] as const;

const EXPECTED_SECURITY_HEADERS: Array<{
  header: string;
  matcher: (v: string | null) => boolean;
  why: string;
}> = [
  {
    header: "content-security-policy",
    matcher: (v) => !!v && /default-src 'self'/.test(v) && /frame-ancestors 'none'/.test(v),
    why: "CSP default-src self + frame-ancestors none must be present",
  },
  {
    header: "strict-transport-security",
    matcher: (v) => !!v && /max-age=\d{7,}/.test(v) && /includeSubDomains/.test(v),
    why: "HSTS must include long max-age + includeSubDomains",
  },
  {
    header: "x-frame-options",
    matcher: (v) => v === "DENY",
    why: "X-Frame-Options DENY blocks clickjacking beyond CSP frame-ancestors",
  },
  {
    header: "x-content-type-options",
    matcher: (v) => v === "nosniff",
    why: "X-Content-Type-Options nosniff blocks MIME confusion",
  },
  {
    header: "referrer-policy",
    matcher: (v) => v === "strict-origin-when-cross-origin",
    why: "Referrer-Policy restricts cross-origin referrer leaking",
  },
  {
    header: "permissions-policy",
    matcher: (v) =>
      !!v &&
      /camera=\(\)/.test(v) &&
      /microphone=\(\)/.test(v) &&
      /geolocation=\(\)/.test(v) &&
      /payment=\(\)/.test(v),
    why: "Permissions-Policy must disable camera/mic/geolocation/payment",
  },
];

function pretty(res: APIResponse | null, body?: unknown): string {
  if (!res) return "(no response)";
  const bodyStr = body === undefined ? "" : `\nbody: ${JSON.stringify(body).slice(0, 300)}`;
  return `status=${res.status()} url=${res.url()}${bodyStr}`;
}

test.describe("prod smoke — public pages render + pass axe", () => {
  for (const { path, label } of PUBLIC_PAGES) {
    test(`${label} (${path}) renders h1 + zero serious/critical a11y`, async ({ page }) => {
      const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(resp, `no response for ${path}`).not.toBeNull();
      expect(resp!.status(), `status for ${path}`).toBeGreaterThanOrEqual(200);
      expect(resp!.status(), `status for ${path}`).toBeLessThan(400);

      const h1 = page.locator("h1").first();
      await expect(h1, `h1 on ${path}`).toBeVisible();

      const findings = await scanSeriousA11y(page);
      expect(findings, `a11y on ${path}: ${JSON.stringify(findings)}`).toEqual([]);
    });
  }
});

test.describe("prod smoke — auth-gated pages redirect when anonymous", () => {
  for (const { path, to } of AUTH_REDIRECT_PAGES) {
    test(`${path} redirects to ${to.source}`, async ({ page }) => {
      await page.goto(path);
      // page.url() after navigation reflects the final redirect target.
      expect(page.url()).toMatch(to);
    });
  }
});

test.describe("prod smoke — security headers on HTML response", () => {
  test("landing HTML carries the full security-header set", async ({ request }) => {
    const r = await request.get("/");
    expect(r.status()).toBe(200);
    const headers = r.headers();
    for (const { header, matcher, why } of EXPECTED_SECURITY_HEADERS) {
      const v = headers[header] ?? null;
      expect(matcher(v), `${header}: ${v ?? "<missing>"} — ${why}`).toBe(true);
    }
  });

  test("CSRF seed cookie is set on first HTML response", async ({ request }) => {
    const r = await request.get("/");
    const cookie = r.headers()["set-cookie"] ?? "";
    expect(cookie, `expected wc_csrf in set-cookie, got: ${cookie}`).toMatch(/wc_csrf=[^;]+/);
  });
});

test.describe("prod smoke — JSON API contracts (anonymous)", () => {
  test("/api/me returns { authenticated: false } for anonymous caller", async ({ request }) => {
    const r = await request.get("/api/me");
    expect(r.status(), pretty(r)).toBe(200);
    const body = await r.json();
    expect(body, pretty(r, body)).toMatchObject({ authenticated: false });
  });

  test("/api/leaderboard returns 200 JSON for anonymous caller", async ({ request }) => {
    const r = await request.get("/api/leaderboard");
    expect(r.status(), pretty(r)).toBe(200);
    // Shape is flexible — just assert it parses as JSON without throwing.
    await r.json();
  });
});

test.describe("prod smoke — static asset caching", () => {
  test("/favicon.ico returns 200 with long-max-age immutable Cache-Control", async ({ request }) => {
    const r = await request.get("/favicon.ico");
    expect(r.status(), pretty(r)).toBe(200);
    const cc = r.headers()["cache-control"] ?? "";
    expect(cc, `cache-control for favicon: ${cc}`).toMatch(/max-age=\d{6,}/);
    expect(cc, `cache-control for favicon: ${cc}`).toMatch(/immutable/);
  });
});
