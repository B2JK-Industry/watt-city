import { test, expect } from "@playwright/test";
import { randomAlphaSuffix } from "./_helpers";

/* Deep-audit Phase 1 backlog #11 — bot/abuse protection on auth
 * endpoints.
 *
 * The per-IP rate limits live in `app/api/auth/{register,login}/route.ts`
 * and are configurable via env (`REGISTER_IP_LIMIT` etc.). The dev
 * server keeps the defaults (5 registers/min, 20 logins/min) unless
 * playwright.config.ts overrides them. */

const PROD_HOST = "watt-city.vercel.app";
const isProd = (process.env.PLAYWRIGHT_BASE_URL ?? "").includes(PROD_HOST);

test.describe("bot protection — /api/auth/register IP rate limit", () => {
  test.skip(isProd, "mutating");

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
