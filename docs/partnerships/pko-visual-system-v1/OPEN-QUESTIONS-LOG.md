# SKO × Watt City — Open Questions Log

Running log of items that need PKO BP brand-team input before v1.1.
Each PR appends here when it ships a SUBSTITUTE for an unresolved asset
or copy decision, so a reviewer can swap in the approved version
without re-reading every diff. Entries are append-only; mark as
`RESOLVED (YYYY-MM-DD)` once the asset lands, never delete.

Source of truth for what is unresolved:
`docs/partnerships/pko-visual-system-v1/10-VALIDATION-REPORT.md §3 + §1 TODO`.

---

## Q1 — Proprietary `pkobp` font licence

- **Status:** pending PKO BP brand team
- **Substitute shipped:** `Inter, "Helvetica Neue", Helvetica, Arial, sans-serif` (Latin-Ext, polish glyph coverage, weights 400/600/700/900). Declared in `app/globals-pko.css` as `--sko-font-sans`.
- **Swap location:** single line in `app/globals-pko.css` §1 tokens. Replace the `Inter, …` fallback chain with `pkobp, Helvetica, Arial, sans-serif` once the licensed font is hosted.
- **First shipped in:** PR-1 (feat/sko-visual-pr1-tokens-shield)

## Q2 — Official PKO BP logo SVG

- **Status:** pending PKO BP brand team
- **Substitute shipped:** navy text chip (`{theme.brandShort} → "PKO"` on navy-700, white text, 6 px radius via shield §13) in site-nav brand; text-only wordmark in footer brand chip. No logomark image until the licensed SVG lands.
- **Swap location:** `components/site-nav.tsx` brand chip (inline `style.background = theme.colors.accent`) + `app/layout.tsx` footer brand chip. Swap the `{theme.brandShort}` span for a `<Image>` tag pointing at `/icons/pko-logo.svg` once the asset ships.
- **First shipped in:** PR-2 (`feat/sko-visual-pr2-components-landing-nav`).

## Q3 — Żyrafa Lokatka pose library

- **Status:** pending PKO BP brand team
- **Substitute shipped:** placeholder rectangle SVG in `lib/theme.ts:42` (`ZYRAFA_PLACEHOLDER_SVG`, 4 yellow rectangles, dev-art).
- **Swap location:** single inline SVG string in `lib/theme.ts`. Eventually move to `public/mascots/lokatka-*.svg` with a pose enum.
- **First shipped in:** pre-existing; retained through PR-1.

## Q4 — Asymmetric corner radius (web vs native convention)

- **Status:** DESIGN-CALL, low confidence
- **Substitute shipped:** `--sko-radius-md-asym: 10px 0 10px 0` on `.btn` per `pkobp-button--primary` observation. PKO Junior native iOS/Android apps may use symmetric `10px` — TBD.
- **Swap location:** `app/globals-pko.css` §4.1 `.btn { border-radius: var(--sko-radius-md-asym); }`. Flip to `var(--sko-radius-md)` for symmetric.
- **First shipped in:** PR-1 (active under `SKIN=pko`).

## Q5 — Hero CTA copy (`Otwórz konto SKO` vs `Naucz się oszczędzać`)

- **Status:** pending product + parent pilot
- **Substitute shipped:** `Naucz się oszczędzać.` + `Załóż konto` CTA (shorter, imperative, matches pkobp.pl/junior register). Secondary CTA is `Zobacz, jak działa`.
- **Swap location:** `lib/locales/pl.ts` `pkoHero.title` + `pkoHero.ctaPrimary`. UK/CS/EN peers translate at the same keys (`Навчися заощаджувати.` / `Nauč se spořit.` / `Learn to save.`).
- **First shipped in:** PR-2.

## Q6 — EN locale for `W-dolary`

- **Status:** DESIGN-CALL, pending PKO-approved term
- **Substitute shipped:** `W$` inline abbreviation in resource chips (PR-2 unchanged — no user-facing EN copy gained a translation here; the existing PL resource labels + W$ carry through).
- **Swap location:** `lib/locales/en.ts` resource labels; `lib/resources.ts` if a dedicated field is added.
- **First shipped in:** pending dedicated locale PR.

## Q7 — Icon set for the "Co dostajesz?" perks (PR-2)

- **Status:** DESIGN-CALL
- **Substitute shipped:** three inline 48×48 navy stroke icons (shield / game controller / line chart) inside `components/pko-hero.tsx`. No sprite sheet, no optimisation work until the brand-approved iconography lands.
- **Swap location:** `components/pko-hero.tsx` `PerkIcon` switch; replace the inline SVG fragments with `<img src="/icons/perk-*.svg">`.
- **First shipped in:** PR-2.

## Q8 — Hero skyline illustration (PR-2)

- **Status:** DESIGN-CALL, pending PR-3 city-scene refactor to expose the 6-var palette
- **Substitute shipped:** stylised 480×300 silhouette inside `components/pko-hero.tsx` `PkoSkylineIcon`. Uses CSS variables (`--sko-navy-500/700/900`, `--sko-accent-orange-light`) so once PR-3 ships the `--scene-*` palette, a single import-swap can swap to the full skyline.
- **Swap location:** `components/pko-hero.tsx` `PkoSkylineIcon` JSX.
- **First shipped in:** PR-2.

---

## How to resolve an entry

1. Drop the approved asset / copy into its swap location.
2. Change the `Status:` line to `RESOLVED (YYYY-MM-DD) — <one-liner of what landed>`.
3. Leave the entry in place; future PRs can read the history.
