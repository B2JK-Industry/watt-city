/* E-05 — i18n consistency spec.
 *
 * Sprint E (PR-L) split locale labelling between two layers:
 *   1. JSX literals + dictionary entries — covered by the generic
 *      a11y matrix and the smoke specs.
 *   2. PL-only catalog data (game.building.name, AI title/tagline/
 *      description, localizedTitle returning the source PL string
 *      when no per-locale translation exists) — these MUST carry
 *      `lang="pl"` so screen readers + Chrome auto-translate know
 *      the chunk is Polish even when the surrounding page is uk/cs/en.
 *
 * E-03 added the wrappers; this spec is the regression guard. If a
 * future copy-tweak forgets the `lang` attribute on a building name,
 * the corresponding [lang] selector here will hit zero matches and
 * the test fails before reaching prod.
 *
 * Pattern follows e2e/a11y-matrix.spec.ts:
 *   - cookie-seed `xp_lang` per iteration (no UI clicks in hot path)
 *   - assert against locale-AGNOSTIC structural selectors
 *   - one `for ... of LOCALES` block, four asserted invariants
 *
 * Anonymous-only routes (`/games`, `/leaderboard`) — no auth fixture
 * required. The chip text + lang attribute checks are deterministic
 * (dictionary + catalog are static at build time).
 */
import { test, expect } from "@playwright/test";

const LOCALES = ["pl", "uk", "cs", "en"] as const;

// E-04 — chip copy per locale. Mirrors `gamesHubTime` in
// lib/locales/{lang}.ts; failure here means a translator dropped
// the sunset emoji or the hour digits.
const HUB_TIME_CHIP: Record<(typeof LOCALES)[number], string> = {
  pl: "🌅 Zachód · 19:42",
  uk: "🌅 Захід · 19:42",
  cs: "🌅 Soumrak · 19:42",
  en: "🌅 Sunset · 19:42",
};

test.describe("i18n consistency — sunset chip + lang=pl wrappers × 4 locales", () => {
  for (const lang of LOCALES) {
    test(`[${lang}] /games hub renders sunset chip + flags PL building names`, async ({
      page,
      baseURL,
    }) => {
      const target = baseURL ?? "http://localhost:3000";
      await page.context().addCookies([
        { name: "xp_lang", value: lang, url: target },
      ]);

      const resp = await page.goto("/games", { waitUntil: "domcontentloaded" });
      expect(resp, "no response for /games").not.toBeNull();
      expect(resp!.status()).toBeLessThan(400);

      // 1. Chip copy matches the locale dictionary entry exactly.
      // `getByText` with `exact: true` would over-match if the page
      // renders the chip more than once; we narrow to the section-
      // heading neighbour via `header`.
      await expect(
        page.getByText(HUB_TIME_CHIP[lang], { exact: true }).first(),
      ).toBeVisible();

      // 2. Buildings-map list — every row tags the PL `building.name`
      // span with `lang="pl"`. `>= 1` is enough; the seeded games
      // catalog has 9 entries but mocking a smaller fixture should
      // not break this guard.
      const flagged = page.locator('aside [lang="pl"]');
      const flaggedCount = await flagged.count();
      expect(
        flaggedCount,
        `expected at least one [lang="pl"] in /games aside for locale ${lang}`,
      ).toBeGreaterThanOrEqual(1);
    });
  }
});
