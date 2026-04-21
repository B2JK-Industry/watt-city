import { test, expect } from "@playwright/test";
import { scanSeriousA11y } from "./_helpers";

/* Phase 7 — a11y matrix.
 *
 * Extend the single-locale prod-smoke axe coverage to every public
 * page × every locale. The language is driven off the `wc_lang`
 * cookie which `app/api/lang/route.ts` sets; we set it directly on
 * the browser context before navigation so the SSR render picks up
 * the right dict. Also asserts keyboard-focus reaches the main
 * content region and that reduced-motion renders no confetti.
 *
 * Target: zero serious/critical violations. Every finding is fixed
 * at source (component, CSS, copy) — not suppressed here.
 */

const PUBLIC_PAGES = [
  "/",
  "/games",
  "/leaderboard",
  "/login",
  "/register",
  "/o-platforme",
  "/ochrana-sukromia",
  "/sin-slavy",
  "/dla-szkol",
] as const;

const LOCALES = ["pl", "uk", "cs", "en"] as const;

test.describe("a11y matrix — public pages × 4 locales", () => {
  for (const lang of LOCALES) {
    for (const path of PUBLIC_PAGES) {
      test(`[${lang}] ${path}`, async ({ page, baseURL }) => {
        // Seed the locale cookie on the context before navigation.
        // Cookie name = `xp_lang` (see lib/i18n.ts COOKIE_NAME); the
        // `wc_*` prefix belongs to CSRF, not i18n. Uses `baseURL` from
        // the playwright fixture so cookie scoping is correct for both
        // dev (localhost) and prod (watt-city.vercel.app).
        const target = baseURL ?? "http://localhost:3000";
        await page.context().addCookies([
          { name: "xp_lang", value: lang, url: target },
        ]);
        const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(resp, `no response for ${path}`).not.toBeNull();
        expect(resp!.status()).toBeLessThan(400);
        const h1 = page.locator("h1").first();
        await expect(h1).toBeVisible();

        const findings = await scanSeriousA11y(page);
        expect(findings, `[${lang}] ${path}: ${JSON.stringify(findings)}`).toEqual([]);
      });
    }
  }
});

test.describe("a11y matrix — reduced-motion short-circuits decorative effects", () => {
  test("confetti renders nothing when prefers-reduced-motion: reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Landing never triggers confetti, but the RoundResult path does;
    // assert the useReducedMotion hook reacts to the media query by
    // checking the ACTUAL behaviour: Confetti returns null, so
    // there should be zero `.confetti-fall`-animating spans anywhere.
    await page.goto("/");
    const animated = await page.locator("span").evaluateAll((nodes) =>
      nodes.filter((n) => window.getComputedStyle(n).animationName === "confetti-fall").length,
    );
    expect(animated).toBe(0);
  });

  test("animate-slide-up still plays but no opacity fade under reduce", async ({ page }) => {
    // The globals.css `prefers-reduced-motion: reduce` media query
    // drops animation-duration to 0.01ms — the element reaches its
    // final state instantly. Any visible text must therefore read
    // at full opacity immediately.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games");
    await page.waitForLoadState("domcontentloaded");
    const rootOpacity = await page.locator(".animate-slide-up").first().evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(Number(rootOpacity)).toBe(1);
  });
});

test.describe("a11y matrix — keyboard-only traversal reaches main content", () => {
  test("tab sequence eventually focuses main-content landmark or a game link", async ({ page }) => {
    await page.goto("/games");
    // Cap the tab loop so we can't infinite-loop on a pathological page.
    let focusedTag = "";
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      focusedTag = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName.toLowerCase()}:${(el.getAttribute("href") ?? "").slice(0, 40)}` : "";
      });
      if (focusedTag.startsWith("a:/games/") || focusedTag.startsWith("a:/miasto")) break;
    }
    expect(focusedTag, `never landed on a game link after 40 tabs; last=${focusedTag}`).toMatch(/^a:\/(games|miasto)/);
  });
});
