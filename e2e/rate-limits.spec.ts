import { test, expect, type Page } from "@playwright/test";
import {
  csrfHeaders,
  postJson,
  primeCsrf,
  randomAlphaSuffix,
} from "./_helpers";

/* Deep-audit Phase 1 backlog #7 — rate-limit behavioural test.
 *
 * The inventory flags which routes call `rateLimit()` but nobody
 * previously verified that the 429 path actually fires. This spec
 * drives a single user past each limit and asserts the contract:
 *   - exactly the first N requests within the window return their
 *     normal response shape,
 *   - request N+1 returns 429 with `{ ok: false, error: "rate-limited",
 *     resetAt: <future epoch ms> }`.
 *
 * Dev-only (mutating); same pattern as data-integrity.spec.ts. */

const PROD_HOST = "watt-city.vercel.app";
const isProd = (process.env.PLAYWRIGHT_BASE_URL ?? "").includes(PROD_HOST);

async function register(page: Page): Promise<void> {
  const username = `rl_${randomAlphaSuffix(12)}`;
  const r = await page.request.post("/api/auth/register", {
    data: { username, password: "correct horse battery", birthYear: 2000 },
  });
  expect(r.ok(), `register ${username}: ${r.status()}`).toBeTruthy();
  await primeCsrf(page);
}

async function teardown(page: Page): Promise<void> {
  const headers = await csrfHeaders(page.context());
  await page.request
    .delete("/api/me", { headers, failOnStatusCode: false })
    .catch(() => null);
}

test.describe("rate limits — 429 fires after N requests within window", () => {
  test.skip(isProd, "mutating — registers users");

  test("/api/parent POST generate-code returns 429 on the 11th request (limit 10/min)", async ({ page }) => {
    await register(page);
    const statuses: number[] = [];
    // 11 sequential hits — the 11th must land 429.
    for (let i = 0; i < 11; i++) {
      const r = await postJson(page, "/api/parent", {
        action: "generate-code",
      });
      statuses.push(r.status);
    }
    // First 10 are 200, 11th is 429.
    const early = statuses.slice(0, 10);
    const last = statuses[10];
    expect(
      early.every((s) => s < 400),
      `first 10 statuses: ${early.join(",")}`,
    ).toBe(true);
    expect(last, `11th status: ${statuses.join(",")}`).toBe(429);

    // Verify the 429 body carries the contract shape.
    const r = await postJson(page, "/api/parent", { action: "generate-code" });
    expect(r.status).toBe(429);
    const body = r.body as { ok: boolean; error: string; resetAt?: number };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate-limited");
    expect(body.resetAt, `resetAt should be future: ${JSON.stringify(body)}`).toBeGreaterThan(Date.now());

    await teardown(page);
  });

  test("/api/community/theme-proposals POST returns 429 past its quota (limit 10/min)", async ({ page }) => {
    await register(page);
    // Body schema (per route.ts): `{ action: "submit", text: 8-100 chars }`.
    // Rate-limit fires BEFORE Zod so we must send a well-formed body
    // on every call — otherwise a 400 from validation hides whether
    // the limiter actually ran.
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const r = await postJson(page, "/api/community/theme-proposals", {
        action: "submit",
        text: `e2e probe proposal ${i} ${randomAlphaSuffix(6)}`,
      });
      statuses.push(r.status);
    }
    const last = statuses[10];
    expect(last, `statuses: ${statuses.join(",")}`).toBe(429);

    await teardown(page);
  });
});
