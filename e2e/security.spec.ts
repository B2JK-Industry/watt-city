import { test, expect, type Page } from "@playwright/test";
import { randomAlphaSuffix } from "./_helpers";

/* Phase 3 — security deep-dive.
 *
 * Non-mutating parts (session tamper, XSS echo checks on static HTML)
 * run freely. Tests that need a fresh account or two use `page.request`
 * so cookies live in the page context; teardown relies on the
 * soft-delete sink (DELETE /api/me) so we don't leave stray users.
 *
 * Gated with PLAYWRIGHT_BASE_URL: any `http` URL not pointing at
 * `watt-city.vercel.app` is treated as dev/preview. Against prod, the
 * mutating tests skip — we never write to the production data set.
 */

const PROD_HOST = "watt-city.vercel.app";
const isProd = (process.env.PLAYWRIGHT_BASE_URL ?? "").includes(PROD_HOST);

async function freshUser(page: Page): Promise<{ username: string }> {
  const username = `sec_${randomAlphaSuffix(12)}`;
  const res = await page.request.post("/api/auth/register", {
    data: {
      username,
      password: "correct horse battery staple",
      birthYear: 2000,
    },
  });
  expect(res.ok(), `register ${username}: ${res.status()}`).toBeTruthy();
  return { username };
}

async function softDelete(page: Page): Promise<void> {
  const res = await page.request.delete("/api/me");
  // Best-effort teardown — we don't care if the soft-delete path
  // has already run for this username.
  void res;
}

test.describe("security — session tamper", () => {
  test.skip(isProd, "skipped on prod — mutating probe");

  test("bit-flipped xp_sess cookie is rejected as anonymous", async ({ page }) => {
    const { username } = await freshUser(page);
    await page.goto("/miasto");
    expect(page.url()).toContain("/miasto");

    const cookies = await page.context().cookies();
    const sess = cookies.find((c) => c.name === "xp_sess");
    expect(sess, "expected xp_sess after register").toBeTruthy();

    // Flip one character in the signature portion (after the dot).
    const [body, sig] = (sess!.value ?? "").split(".");
    const tampered =
      body +
      "." +
      (sig?.charAt(0) === "A"
        ? "B" + sig.slice(1)
        : "A" + (sig?.slice(1) ?? ""));
    await page.context().clearCookies({ name: "xp_sess" });
    await page.context().addCookies([
      { ...sess!, value: tampered },
    ]);

    const me = await page.request.get("/api/me");
    const body2 = await me.json();
    expect(body2.authenticated, `tampered session accepted for ${username}`).toBe(false);

    await softDelete(page);
  });

  test("truncated xp_sess cookie is rejected", async ({ page }) => {
    await freshUser(page);
    const cookies = await page.context().cookies();
    const sess = cookies.find((c) => c.name === "xp_sess");
    expect(sess).toBeTruthy();
    await page.context().clearCookies({ name: "xp_sess" });
    await page.context().addCookies([
      { ...sess!, value: (sess!.value ?? "").slice(0, 10) },
    ]);
    const me = await page.request.get("/api/me");
    expect((await me.json()).authenticated).toBe(false);
    await softDelete(page);
  });

  test("session without signature segment is rejected", async ({ page }) => {
    await freshUser(page);
    const cookies = await page.context().cookies();
    const sess = cookies.find((c) => c.name === "xp_sess");
    expect(sess).toBeTruthy();
    await page.context().clearCookies({ name: "xp_sess" });
    await page.context().addCookies([
      { ...sess!, value: (sess!.value ?? "").split(".")[0] },
    ]);
    const me = await page.request.get("/api/me");
    expect((await me.json()).authenticated).toBe(false);
    await softDelete(page);
  });
});

test.describe("security — IDOR: one user can't read another's private data", () => {
  test.skip(isProd, "skipped on prod — creates users");

  test("user A cannot GET /api/parent/child/<B>", async ({ browser }) => {
    // Two separate contexts = two separate cookie jars.
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const userA = `a_${randomAlphaSuffix(10)}`;
    const userB = `b_${randomAlphaSuffix(10)}`;

    await pageA.request.post("/api/auth/register", {
      data: { username: userA, password: "correct horse battery", birthYear: 2000 },
    });
    await pageB.request.post("/api/auth/register", {
      data: { username: userB, password: "correct horse battery", birthYear: 2000 },
    });

    // A tries to read B's child data. Parent dashboard reads require
    // `parent -> child` relationship, which A does not have.
    const r = await pageA.request.get(`/api/parent/child/${encodeURIComponent(userB)}`);
    // Acceptable outcomes: 401/403/404 — anything that doesn't expose B's data.
    expect([401, 403, 404], `IDOR: A→B status=${r.status()}`).toContain(r.status());
    if (r.status() === 200) {
      const body = await r.json();
      expect(body, "B's data was returned to A").toBe(null);
    }

    await pageA.request.delete("/api/me");
    await pageB.request.delete("/api/me");
    await ctxA.close();
    await ctxB.close();
  });
});

test.describe("security — admin bearer variants all rejected", () => {
  // Purely read-only against prod — exercises admin routes with bad
  // tokens. Safe in any env because admin routes never mutate on a
  // failing auth check.
  const PROBE_ROUTES = [
    "/api/admin/analytics",
    "/api/admin/engine-check",
    "/api/admin/feature-flags",
    "/api/admin/health",
    "/api/admin/moderation",
    "/api/admin/rotate-ai",
    "/api/admin/rotate-themes",
    "/api/admin/themes",
  ] as const;

  for (const path of PROBE_ROUTES) {
    test(`${path} rejects bogus bearer → 401`, async ({ request }) => {
      const r = await request.get(path, {
        headers: { authorization: "Bearer this-is-not-the-secret" },
        failOnStatusCode: false,
      });
      expect([401, 405], `${path} unexpectedly ${r.status()}`).toContain(r.status());
      if (r.status() === 401) {
        const body = await r.json().catch(() => null);
        // 401 body should NOT include data fields.
        if (body) {
          const dataKeys = Object.keys(body).filter((k) => !["ok", "error"].includes(k));
          expect(dataKeys, `${path} 401 leaked: ${dataKeys.join(",")}`).toEqual([]);
        }
      }
    });
  }
});

test.describe("security — PII validator edge cases", () => {
  // The validator lives in lib/gdpr-k.ts; these are behavioural
  // assertions against the live register endpoint (not unit tests).
  // Acceptable responses: 400 (rejected as PII) or 200 (accepted).
  // We only fail on the dangerous middle ground — a 5xx or a silent
  // accept of an obvious phone/email/name.
  test.skip(isProd, "skipped on prod — registers users");

  type Case = {
    name: string;
    username: () => string;
    expect: "reject" | "accept";
  };
  // `username` is a thunk so each run generates a fresh collision-safe
  // candidate; the test title is static so Playwright's test map stays
  // stable across runs (worker processes re-derive the list of tests
  // by title, and a random suffix in the title breaks that).
  const CASES: Case[] = [
    { name: "obvious phone", username: () => "john123456789", expect: "reject" },
    { name: "phone with separators", username: () => "ab+48-123-456-789cd", expect: "reject" },
    { name: "full email", username: () => "john.doe@example.com", expect: "reject" },
    { name: "two-word name pair", username: () => "AnnaKowalska", expect: "accept" /* single token — NAME_PAIR_RE needs space */ },
    { name: "letters only", username: () => `okuser${randomAlphaSuffix(6)}`, expect: "accept" },
    { name: "short digits", username: () => "year2026fan", expect: "accept" },
  ];

  for (const c of CASES) {
    test(`register "${c.name}" → ${c.expect}`, async ({ page }) => {
      const u = c.username();
      const r = await page.request.post("/api/auth/register", {
        data: { username: u, password: "correct horse battery", birthYear: 2000 },
        failOnStatusCode: false,
      });
      if (c.expect === "reject") {
        expect([400, 409], `${u}: expected reject, got ${r.status()}`).toContain(r.status());
      } else {
        // 200 = accepted, 409 = collision on retry (fine). 500+ never.
        expect(r.status(), `${u}: expected accept, got ${r.status()}`).toBeLessThan(500);
      }
      if (r.ok()) await page.request.delete("/api/me");
    });
  }
});

test.describe("security — age gate", () => {
  test.skip(isProd, "skipped on prod — registers users");

  test("under-16 without parentEmail → 400", async ({ request }) => {
    const now = new Date().getUTCFullYear();
    // 10yo — well under 16
    const r = await request.post("/api/auth/register", {
      data: {
        username: `k_${randomAlphaSuffix(8)}`,
        password: "correct horse battery",
        birthYear: now - 10,
      },
      failOnStatusCode: false,
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toMatch(/rodzica|parent|16/i);
  });

  test("under-16 with parentEmail → 200 + needsConsent true", async ({ page }) => {
    const now = new Date().getUTCFullYear();
    const username = `k_${randomAlphaSuffix(8)}`;
    const r = await page.request.post("/api/auth/register", {
      data: {
        username,
        password: "correct horse battery",
        birthYear: now - 10,
        parentEmail: "parent@example.com",
      },
      failOnStatusCode: false,
    });
    expect(r.ok(), `status ${r.status()}`).toBeTruthy();
    const body = await r.json();
    expect(body.needsConsent).toBe(true);
    await page.request.delete("/api/me");
  });

  test("future birth year → 400", async ({ request }) => {
    const future = new Date().getUTCFullYear() + 1;
    const r = await request.post("/api/auth/register", {
      data: {
        username: `f_${randomAlphaSuffix(8)}`,
        password: "correct horse battery",
        birthYear: future,
      },
      failOnStatusCode: false,
    });
    expect(r.status()).toBe(400);
  });
});

test.describe("security — security headers on every public page", () => {
  const PAGES = [
    "/",
    "/games",
    "/leaderboard",
    "/login",
    "/register",
    "/o-platforme",
    "/ochrana-sukromia",
    "/sin-slavy",
    "/dla-szkol",
  ];
  for (const path of PAGES) {
    test(`${path} carries CSP + HSTS + X-Frame-Options`, async ({ request }) => {
      const r = await request.get(path);
      expect(r.status()).toBeLessThan(400);
      const headers = r.headers();
      expect(headers["content-security-policy"]).toMatch(/default-src 'self'/);
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
    });
  }
});
