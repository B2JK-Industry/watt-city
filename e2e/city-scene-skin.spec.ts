import { test, expect } from "@playwright/test";

/* PR-3 visual-regression gate for the 6-role scene palette.
 *
 * Under the PKO skin the night-panorama `#<svg>` should resolve every
 * `var(--scene-*)` reference against the navy ramp declared in
 * `app/globals-pko.css`. This spec flips `data-skin="pko"` at runtime
 * (same technique as `sko-skin-visual.spec.ts`), then samples the
 * computed style of a sky-rect fill — under PKO, the gradient stops
 * resolve to `rgb(0, 53, 116)` (navy-700) / `rgb(0, 30, 75)` (navy-900),
 * not the default `#02021a` / `#2a1458` near-black+purple. */

async function pkoSkin(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    document.documentElement.setAttribute("data-skin", "pko");
  });
}

test.describe("city scene — 6-role palette under PKO skin", () => {
  test("/ anonymous landing — scene-sky-top resolves to navy, not near-black", async ({
    page,
  }) => {
    await pkoSkin(page);
    await page.goto("/");
    // `--scene-sky-top` is only declared at :root level. The anon
    // landing under PKO renders pko-hero, not the CityScene SVG — so
    // we sample the CSS variable directly on <html>.
    const resolved = await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--scene-sky-top")
        .trim();
      return v;
    });
    // Navy-700 = #003574 via the --sko-navy-700 indirection; lowercase
    // or rgb() form both acceptable.
    expect(resolved.toLowerCase()).toMatch(/^(#003574|rgb\(\s*0,\s*53,\s*116\s*\))/);
  });

  test("/ — scene-window-lit resolves to PKO orange-light, not yellow", async ({
    page,
  }) => {
    await pkoSkin(page);
    await page.goto("/");
    const resolved = await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--scene-window-lit")
        .trim();
      return v;
    });
    // #DB912C = orange-light; reject the core yellow #facc15.
    expect(resolved.toLowerCase()).not.toMatch(/#facc15|rgb\(\s*250,\s*204,\s*21\s*\)/);
    expect(resolved.toLowerCase()).toMatch(/#db912c|rgb\(\s*219,\s*145,\s*44\s*\)/);
  });

  test("core skin keeps the original --scene-sky-top near-black", async ({
    page,
  }) => {
    // No pkoSkin() call — default skin. Asserts we didn't accidentally
    // strip the core defaults in app/globals.css.
    await page.goto("/");
    const resolved = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--scene-sky-top")
        .trim();
    });
    expect(resolved.toLowerCase()).toMatch(/^(#02021a|rgb\(\s*2,\s*2,\s*26\s*\))/);
  });
});
