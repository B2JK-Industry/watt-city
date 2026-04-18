import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/* Phase 6.7.3 — smoke E2E.
 *
 * Run with `pnpm test:e2e`. Assumes Playwright browsers are installed
 * (`npx playwright install chromium`). The webServer config in
 * playwright.config.ts auto-starts `pnpm dev` unless
 * `PLAYWRIGHT_WEBSERVER=0`.
 *
 * These three tests are the first three of the ten "critical flows"
 * listed in the backlog (6.7.3). The remaining seven land as follow-ups
 * — each with its own spec file so the suite stays readable.
 */

test.describe("smoke — landing + auth + city", () => {
  test("landing page loads + passes axe accessibility scan", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    // Phase 6.4 fixed the high-impact issues; assert no new regressions.
    const critical = a11y.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test("register flow creates a fresh account", async ({ page }) => {
    // Unique username per test run
    const u = `smoke_${Date.now()}`;
    await page.goto("/register");
    await page.getByLabel(/Użytkownik|Username|Ім'я|Jméno/i).fill(u);
    await page.getByLabel(/Hasło|Password|Пароль|Heslo/i).fill("correct horse battery");
    // 16-plus birth year to skip parent-email
    await page
      .getByLabel(/Rok urodzenia|RODO-K/i)
      .selectOption({ value: "2000" });
    await page.getByRole("button", { name: /Rejestracja|Sign up|Registrace/i }).click();
    await page.waitForURL(/\/games/);
    await expect(page.locator("nav")).toContainText(u, { ignoreCase: true });
  });

  test("logged-in user can open /miasto", async ({ page, request }) => {
    const u = `smoke2_${Date.now()}`;
    // Direct API register skips the form — faster and less brittle.
    const res = await request.post("/api/auth/register", {
      data: {
        username: u,
        password: "correct horse battery",
        birthYear: 2000,
      },
    });
    expect(res.ok()).toBeTruthy();
    await page.goto("/miasto");
    await expect(page.getByRole("heading", { name: /Watt City|Miasteczko/i })).toBeVisible();
  });
});
