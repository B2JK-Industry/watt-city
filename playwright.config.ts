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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
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
        },
});
