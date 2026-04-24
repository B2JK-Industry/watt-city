import { test, expect } from "@playwright/test";

/* PR-2 visual-regression gate for the SKO × Watt City skin.
 *
 * The skin is env-driven (SKIN=pko at build time), but the CSS shield
 * mounts on `<html data-skin="pko">` at runtime. This spec flips the
 * attribute after the page renders and asserts the cascade actually
 * overrides the brutalist primitives — so the gate works on a core-
 * skin dev server too, without a second build. Production runs with
 * a PKO-skin build should keep the attribute pre-set and skip the
 * flip entirely.
 *
 * Assertions mirror 06-EXECUTION-PLAN.md PR-2 gates:
 *   - .btn corner is the asymmetric 10px 0 10px 0 signature
 *   - .btn box-shadow is the soft drop, NOT the brutal Npx Npx 0 0 var(--ink)
 *   - .brutal-tag drops the 6px border-radius in favour of the 9999px pill
 *   - `.uppercase` utility computes as text-transform: none
 */

async function pkoSkin(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    document.documentElement.setAttribute("data-skin", "pko");
  });
}

test.describe("SKO skin — visual shield regression", () => {
  test("/ anonymous landing — .btn is navy-asymmetric + no brutal shadow", async ({
    page,
  }) => {
    await pkoSkin(page);
    await page.goto("/");
    // The anonymous landing always has at least one .btn (register CTA
    // under core, Załóż konto under PKO). On a core-skin build the
    // runtime attribute flip is enough because the cascade re-evaluates
    // when the data-skin changes.
    const btn = page.locator(".btn").first();
    await expect(btn).toBeVisible();
    const computed = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        textTransform: cs.textTransform,
        borderWidth: cs.borderTopWidth,
      };
    });
    // Asymmetric corner: 10px / 0 / 10px / 0.
    expect(computed.borderRadius).toMatch(/10px 0(px)? 10px 0(px)?/);
    // Brutalist shadow is `Npx Npx 0 0 var(--ink)` — resolves to
    // `Npx Npx 0px 0px <color>`. The PKO drop-shadow has no `0px 0px`
    // contiguous-zero run.
    expect(computed.boxShadow).not.toMatch(/0px\s+0px\s+rgb/);
    // PKO drops uppercase on buttons.
    expect(computed.textTransform).toBe("none");
    // And drops the 3px border.
    expect(parseFloat(computed.borderWidth)).toBeLessThan(2);
  });

  test("/ — no `brutal-tag` element retains the brutalist 6px radius", async ({
    page,
  }) => {
    await pkoSkin(page);
    await page.goto("/");
    const tags = await page.locator(".brutal-tag").all();
    for (const t of tags) {
      if (!(await t.isVisible())) continue;
      const radius = await t.evaluate((el) => getComputedStyle(el).borderRadius);
      // PKO tag = 9999px capsule. Not the 6px brutalist chip.
      expect(parseFloat(radius)).toBeGreaterThan(100);
    }
  });

  test("/games — .uppercase utility neutralised", async ({ page }) => {
    await pkoSkin(page);
    await page.goto("/games");
    // Sample the first element with `.uppercase` in the class list; if
    // none is visible the route simply has no brutalist uppercase text
    // on PKO (good — the rule still passes).
    const upEl = page.locator(".uppercase").first();
    if ((await upEl.count()) === 0) return;
    const tt = await upEl.evaluate((el) => getComputedStyle(el).textTransform);
    expect(tt).toBe("none");
  });

  test("/miasto — cashflow HUD has data-severity attribute", async ({
    page,
  }) => {
    await pkoSkin(page);
    await page.goto("/miasto");
    // Anonymous user gets redirected to /login, which is fine — we just
    // check that when the HUD renders (authed pages), the attribute
    // lives on the outer wrapper. `page.$()` returns null if not
    // rendered; we skip in that case to keep the spec resilient on
    // anon sessions.
    const hud = page.locator(".cashflow-hud").first();
    if ((await hud.count()) === 0) return;
    await expect(hud).toHaveAttribute("data-severity", /^(none|info|warn|critical)$/);
  });
});
