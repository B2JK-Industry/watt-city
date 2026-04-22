import { test, expect } from "@playwright/test";
import { scanSeriousA11y } from "./_helpers";

/* Deep-audit Phase 1 backlog #4 — cross-browser smoke.
 *
 * Runs against Firefox + WebKit projects (see playwright.config.ts).
 * Chromium owns the full spec set; this file is the minimum useful
 * cross-browser surface: landing loads, h1 visible, security headers
 * present, axe-clean. If any browser-specific CSS or middleware
 * behaviour regresses, this is the tripwire. */

const PUBLIC_PAGES = ["/", "/games", "/leaderboard", "/register"] as const;

test.describe("cross-browser smoke — public pages render + axe-clean", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} loads + passes axe`, async ({ page }) => {
      const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(resp, `no response for ${path}`).not.toBeNull();
      expect(resp!.status(), `status ${resp!.status()}`).toBeLessThan(400);
      await expect(page.locator("h1").first()).toBeVisible();
      const findings = await scanSeriousA11y(page);
      expect(
        findings,
        `a11y on ${path}: ${JSON.stringify(findings)}`,
      ).toEqual([]);
    });
  }
});

test.describe("cross-browser smoke — CSP + HSTS headers are present", () => {
  test("landing HTML carries the security-header set on every browser", async ({ request }) => {
    const r = await request.get("/");
    expect(r.status()).toBe(200);
    const headers = r.headers();
    expect(headers["content-security-policy"]).toMatch(/default-src 'self'/);
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/);
  });
});
