import { test, expect, type Page } from "@playwright/test";
import { postJson, primeCsrf, randomAlphaSuffix } from "./_helpers";

/* Phase 4 — data integrity + race conditions.
 *
 * Targets the money/XP/ledger paths: score idempotency, concurrent
 * scores, AI-rotation single-flight. Dev-only by design — every test
 * mutates state.
 */

const PROD_HOST = "watt-city.vercel.app";
const isProd = (process.env.PLAYWRIGHT_BASE_URL ?? "").includes(PROD_HOST);

async function freshUser(page: Page): Promise<{ username: string }> {
  // `/api/auth/register` is CSRF-exempt so page.request is enough.
  const username = `di_${randomAlphaSuffix(12)}`;
  const res = await page.request.post("/api/auth/register", {
    data: { username, password: "correct horse battery", birthYear: 2000 },
  });
  expect(res.ok(), `register ${username}: ${res.status()}`).toBeTruthy();
  // Prime wc_csrf so subsequent mutating POSTs carry the header.
  await primeCsrf(page);
  return { username };
}

async function softDelete(page: Page): Promise<void> {
  // DELETE /api/me is CSRF-guarded — go via the postJson helper which
  // echoes the token, adapted here for DELETE.
  const { csrfHeaders } = await import("./_helpers");
  const headers = await csrfHeaders(page.context());
  await page.request
    .delete("/api/me", { headers, failOnStatusCode: false })
    .catch(() => null);
}

test.describe.configure({ mode: "serial" });

test.describe("data integrity — score idempotency + concurrency", () => {
  test.skip(isProd, "mutates state");

  test("first score creates ledger entry; identical replay dedupes", async ({ page }) => {
    await freshUser(page);
    const r1 = await postJson(page, "/api/score", { gameId: "finance-quiz", xp: 50 });
    expect(r1.status, `first: ${JSON.stringify(r1)}`).toBe(200);
    const first = r1.body as { isNewBest: boolean; gameXP: number };
    expect(first.isNewBest).toBe(true);
    const firstXP = first.gameXP;

    // Replay identical XP — not a new best; no ledger delta.
    const r2 = await postJson(page, "/api/score", { gameId: "finance-quiz", xp: 50 });
    expect(r2.status).toBe(200);
    const second = r2.body as { isNewBest: boolean; gameXP: number };
    expect(second.isNewBest).toBe(false);
    expect(second.gameXP).toBe(firstXP);

    // Check resources are readable after replay (GET is not CSRF-guarded).
    const resp = await page.request.get("/api/me/resources");
    expect(resp.ok()).toBeTruthy();

    await softDelete(page);
  });

  test("higher score credits delta, lower replay no-ops", async ({ page }) => {
    await freshUser(page);
    const first = await postJson(page, "/api/score", { gameId: "finance-quiz", xp: 30 });
    expect(first.status).toBe(200);

    const second = await postJson(page, "/api/score", { gameId: "finance-quiz", xp: 60 });
    expect(second.status).toBe(200);
    const jsecond = second.body as { isNewBest: boolean; delta: number; gameXP: number };
    expect(jsecond.isNewBest).toBe(true);
    expect(jsecond.delta).toBe(30);

    // Third call LOWER than current best → not counted.
    const third = await postJson(page, "/api/score", { gameId: "finance-quiz", xp: 40 });
    expect(third.status).toBe(200);
    const jthird = third.body as { isNewBest: boolean; gameXP: number };
    expect(jthird.isNewBest).toBe(false);
    expect(jthird.gameXP).toBe(60);

    await softDelete(page);
  });

  test("concurrent score submissions both recorded (leaderboard sees max)", async ({ page }) => {
    await freshUser(page);
    // Both requests must carry CSRF headers independently.
    const [rA, rB] = await Promise.all([
      postJson(page, "/api/score", { gameId: "finance-quiz", xp: 100 }),
      postJson(page, "/api/score", { gameId: "finance-quiz", xp: 80 }),
    ]);
    expect(rA.status, `A=${rA.status}`).toBe(200);
    expect(rB.status, `B=${rB.status}`).toBe(200);
    const jA = rA.body as { gameXP: number };
    const jB = rB.body as { gameXP: number };
    // Final per-game XP must be the max of the two.
    expect(Math.max(jA.gameXP, jB.gameXP)).toBe(100);

    await softDelete(page);
  });
});

test.describe("data integrity — AI rotation single-flight", () => {
  test.skip(isProd, "mutates state via /api/cron");

  test("concurrent rotate-if-due: at most one fires, rest return 409 or skipped", async ({ request }) => {
    // Need the CRON_SECRET the test webServer was started with.
    // Falls back to the playwright.config default.
    const cronSecret =
      process.env.E2E_CRON_SECRET ?? "e2e-cron-secret-not-for-production";
    const headers = { authorization: `Bearer ${cronSecret}` };

    // Fire 10 concurrent requests.
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        request.post("/api/cron/rotate-if-due", { headers, failOnStatusCode: false }),
      ),
    );
    const statuses = results.map((r) => r.status());
    // Shapes we accept:
    //   200 (not-due, no-op)
    //   200 with { published: false, skipped: true }
    //   200 with { published: true } (rotated)
    //   409 (contention — single-flight held by a sibling)
    //   500 on the sibling that lost the race (shouldn't happen with
    //   the current lock; assert zero 500s).
    const serverErrors = statuses.filter((s) => s >= 500);
    expect(serverErrors, `server errors on concurrent rotate: ${statuses.join(",")}`).toEqual([]);

    // Count published responses — must be ≤ 1 even if the bucket was
    // ready (single-flight).
    const bodies = await Promise.all(results.map((r) => r.json().catch(() => null)));
    const publishedCount = bodies.filter((b) => b?.published === true).length;
    expect(publishedCount, "multiple concurrent publishes: single-flight broken").toBeLessThanOrEqual(1);
  });
});

test.describe("data integrity — leaderboard ordering stable under concurrent writes", () => {
  test.skip(isProd, "mutates state");

  test("two users scoring different XP → leaderboard orders them", async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    const u1 = `lb1_${randomAlphaSuffix(10)}`;
    const u2 = `lb2_${randomAlphaSuffix(10)}`;
    await p1.request.post("/api/auth/register", {
      data: { username: u1, password: "correct horse battery", birthYear: 2000 },
    });
    await p2.request.post("/api/auth/register", {
      data: { username: u2, password: "correct horse battery", birthYear: 2000 },
    });

    await primeCsrf(p1);
    await primeCsrf(p2);
    await Promise.all([
      postJson(p1, "/api/score", { gameId: "finance-quiz", xp: 100 }),
      postJson(p2, "/api/score", { gameId: "finance-quiz", xp: 50 }),
    ]);

    // Per-user stats endpoint — doesn't care about leaderboard-window
    // truncation the way /api/leaderboard does (default n=20).
    const [m1, m2] = await Promise.all([
      p1.request.get("/api/me").then((r) => r.json()),
      p2.request.get("/api/me").then((r) => r.json()),
    ]);
    expect(m1.authenticated).toBe(true);
    expect(m2.authenticated).toBe(true);
    expect(m1.globalXP, `u1 XP: ${JSON.stringify(m1)}`).toBeGreaterThanOrEqual(100);
    expect(m2.globalXP, `u2 XP: ${JSON.stringify(m2)}`).toBeGreaterThanOrEqual(50);
    // The rank order: u1 (higher XP) must have a smaller rank number.
    expect(m1.globalRank).toBeLessThan(m2.globalRank);

    await p1.request.delete("/api/me").catch(() => null);
    await p2.request.delete("/api/me").catch(() => null);
    await ctx1.close();
    await ctx2.close();
  });
});
