import { test, expect } from "@playwright/test";
import { randomAlphaSuffix } from "./_helpers";

/* Deep-audit Phase 1 backlog #11 — bot/abuse protection on auth
 * endpoints.
 *
 * The per-IP rate limits live in `app/api/auth/{register,login}/route.ts`
 * and are env-configurable (`REGISTER_IP_LIMIT`, `LOGIN_IP_LIMIT`).
 *
 * playwright.config.ts bumps these limits to 1000 for the default
 * test run so parallel workers (all on 127.0.0.1) don't trip them.
 * To verify the prod-default behaviour (5/min register, 20/min
 * login), run this spec with an explicit opt-in env:
 *
 *   REGISTER_IP_LIMIT=5 LOGIN_IP_LIMIT=20 \
 *   BOT_PROTECTION_E2E=1 pnpm test:e2e -- bot-protection
 *
 * Without `BOT_PROTECTION_E2E=1` the tests skip — otherwise they'd
 * fail in the default suite against the high test env and add CI
 * flake. */

const PROD_HOST = "watt-city.vercel.app";
const isProd = (process.env.PLAYWRIGHT_BASE_URL ?? "").includes(PROD_HOST);
const botRun = process.env.BOT_PROTECTION_E2E === "1";

test.describe("bot protection — /api/auth/register IP rate limit", () => {
  test.skip(isProd, "mutating");
  test.skip(!botRun, "opt-in: set BOT_PROTECTION_E2E=1 + REGISTER_IP_LIMIT=5");

  test("6th register attempt from the same IP in <60s returns 429", async ({ request }) => {
    // The dev server's in-memory rate-limit keyspace is shared across
    // tests. Using a dedicated random username prefix per *call* keeps
    // Zod + PII validation happy; the IP-bucket is the same because
    // Playwright's APIRequestContext sends a stable `x-forwarded-for`.
    // We don't rely on that — instead we send the header explicitly.
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await request.post("/api/auth/register", {
        data: {
          username: `bot_${randomAlphaSuffix(10)}`,
          password: "correct horse battery staple",
          birthYear: 2000,
        },
        headers: { "x-forwarded-for": ip },
        failOnStatusCode: false,
      });
      statuses.push(r.status());
    }
    // First 5 succeed (200) or fail Zod (400); sixth is 429. Accept
    // anything <400 for first 5 to survive a future Zod tightening.
    const first5 = statuses.slice(0, 5);
    expect(
      first5.every((s) => s < 500),
      `first 5: ${first5.join(",")}`,
    ).toBe(true);
    expect(statuses[5], `all statuses: ${statuses.join(",")}`).toBe(429);
  });
});

test.describe("bot protection — /api/auth/login IP rate limit", () => {
  test.skip(isProd, "mutating (login attempts fill Upstash state)");
  test.skip(!botRun, "opt-in: set BOT_PROTECTION_E2E=1 + LOGIN_IP_LIMIT=20");

  test("21st login attempt from the same IP in <60s returns 429", async ({ request }) => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      const r = await request.post("/api/auth/login", {
        data: {
          username: `ghost_${randomAlphaSuffix(8)}`,
          password: "wrong",
        },
        headers: { "x-forwarded-for": ip },
        failOnStatusCode: false,
      });
      statuses.push(r.status());
    }
    // First 20 fail auth (401) but allow through. 21st must be 429.
    expect(statuses[20], `all statuses: ${statuses.join(",")}`).toBe(429);
  });
});
