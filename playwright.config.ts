import { defineConfig, devices } from "@playwright/test";

/* Phase 6.7.3 — E2E config.
 *
 * - tests live under `e2e/`
 * - runs against `http://localhost:3000` by default; override with
 *   `PLAYWRIGHT_BASE_URL` for preview-URL runs.
 * - `webServer` auto-starts `next dev` when PLAYWRIGHT_WEBSERVER != 0.
 * - Chromium-only by default (Firefox + WebKit can be added locally;
 *   CI keeps runs fast).
 */

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  /* Four projects; running the full matrix is opt-in via `--project`.
   * `pnpm test:e2e` without a filter uses chromium only (CI-fast).
   * Cross-browser probes live in `*.cross.spec.ts` files; mobile
   * probes in `*.mobile.spec.ts`. Keep the production-level spec set
   * (smoke, prod-smoke, api-contracts, …) on chromium so CI time
   * stays predictable; run the cross-browser + mobile matrix before
   * a release. */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/.*\.mobile\.spec\.ts/, /.*\.cross\.spec\.ts/],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /.*\.cross\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /.*\.cross\.spec\.ts/,
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_WEBSERVER === "0"
      ? undefined
      : {
          command: "pnpm dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          // Run the dev server under test-only secrets so the cron /
          // admin auth paths behave the way they would in prod — no
          // NODE_ENV-gated bypass. The API contract sweep relies on
          // anonymous callers being rejected, not silently allowed.
          env: {
            CRON_SECRET:
              process.env.E2E_CRON_SECRET ?? "e2e-cron-secret-not-for-production",
            ADMIN_SECRET:
              process.env.E2E_ADMIN_SECRET ?? "e2e-admin-secret-not-for-production",
            SESSION_SECRET:
              process.env.E2E_SESSION_SECRET ?? "e2e-session-secret-16char",
          },
        },
});
