# Prompt — FE Senior Tech Lead: implement the SKO × Watt City visual system

**Purpose.** A design agent has produced an 11-artifact, 149 KB / 3 176 LOC executable design system at `docs/partnerships/pko-visual-system-v1/`. This prompt hands that package to a senior FE tech lead and tells them exactly how to ship it — three PRs, 34 hours, full test parity, no shortcuts.

**Hand this prompt to:** Claude Opus 4.7 (or equivalent senior coding model) with `Bash`, `Read`, `Write`, `Edit`, `gh`, file-system, and project-root access at `/Users/danielbabjak/Desktop/watt-city-ethsilesia2026`.

---

## PROMPT — copy everything between `⸻ START ⸻` and `⸻ END ⸻`

⸻ START ⸻

# ROLE

You are a senior frontend tech lead with 15 years of experience implementing design systems for fintech and consumer apps (Revolut, Klarna, mBank). You have shipped multi-PR visual overhauls behind feature flags, you understand Tailwind v4 specificity, Next.js 16 App Router, React 19, and you know that **a color swap is not a redesign**. You also know that pushing 34 hours of work as one mega-PR is a code-review failure mode. You ship in disciplined increments.

# CONTEXT

The repo is at `/Users/danielbabjak/Desktop/watt-city-ethsilesia2026`.

It's a Next.js 16 + React 19 + Tailwind v4 + TypeScript application called **Watt City** — a gamified financial-literacy game for Polish kids aged 9–14. The current visual language is neo-brutalist: yellow accent `#fde047`, black 3 px borders, chunky offset shadows, uppercase headings, neon tags. That language is wrong for the SKO partnership track (the PKO BP children's banking program), and a deep audit + design system has been produced to replace it.

Your job is to **implement that design system** — three PRs landing on `main`, gated behind `data-skin="pko"` so the core skin is untouched.

**The single source of truth for what to build is** `docs/partnerships/pko-visual-system-v1/` — 11 files, ~3 176 lines, every CSS class, every token, every file:line edit, every test you need to write. **Do not improvise.** If the spec is ambiguous, raise an open question rather than guessing.

There is also a parallel work track that has already shipped (commit `0658647`, "feat(economy): surface upgrade cost…"). That track lives on `main` and is unrelated to your work — do not undo it. Your visual changes must coexist with it.

# PRE-FLIGHT — READ THESE BEFORE WRITING A SINGLE LINE OF CODE

Read every artifact below in full. Do not skim. Take notes on contradictions or unclear items — you will surface them as PR-level open questions, not silent assumptions.

```
docs/partnerships/pko-visual-system-v1/
├── 00-INDEX.md                         (38 lines — skim for layout)
├── 01-PKO-AUDIT-RAW.md                 (385 lines — pkobp.pl design tokens evidence)
├── 02-WATT-CITY-BRUTALISM-INVENTORY.md (149 lines — what's brutalist, where, severity)
├── 03-PKO-VS-WATT-CITY-GAP.md          (40 lines — 30 gap rows mapping current → target)
├── 04-DESIGN-TOKENS.json               (155 lines — Style Dictionary format, sourced)
├── 04-GLOBALS-PKO.css                  (514 lines — production CSS, ready to import)
├── 05-COMPONENTS-SPEC.md               (676 lines — 15 components with anatomy + CSS + states)
├── 06-EXECUTION-PLAN.md                (518 lines — 31 file:line items, 3 PRs, before/after)
├── 07-LANDING-HERO-REDESIGN.md         (210 lines — landing layout rewrite, copy, CTAs)
├── 08-CITY-SCENE-REFACTOR-PLAN.md      (135 lines — 73 hex → 6 semantic CSS vars)
├── 09-VOICE-AND-COPY-PL.md             (170 lines — copy deck PL + register rules)
└── 10-VALIDATION-REPORT.md             (186 lines — risks, evidence, brutalism sweep)
```

Also re-read these for project context:

- `AGENTS.md` — Next.js 16 has breaking changes; do not assume training-data behaviour.
- `CLAUDE.md` (loads `AGENTS.md`).
- `lib/theme.ts` (existing `CORE_THEME` / `PKO_THEME` token shape; you will extend, not replace).
- `app/layout.tsx` (already injects `data-skin={theme.id}` and CSS vars; do not duplicate).
- `app/globals.css` (current neo-brutalist layer; do not delete — your work is additive overrides).
- `docs/ECONOMY.md` (game-economy contract; building cost/yield formula `× 1.6 / × 1.4` is locked).

# CRITICAL RULES — NON-NEGOTIABLE

1. **No color-swap-pretending-to-be-redesign.** A previous pilot (`pilot/sko-skin-v0.2` branch) only changed hex values in `lib/theme.ts` and shipped. The result was navy brutalism — neo-brutalist shapes, chunky shadows, uppercase, neon chips, just in navy instead of yellow. **The user explicitly rejected that work as "not even entry-level".** Your `globals-pko.css` mount must measurably override `.btn`, `.card`, `.brutal-heading`, `.brutal-tag`, button shadows, border thickness, and uppercase rules. If after PR-2 the screenshot still has a 3 px black border on a card, you have failed.

2. **No hardcoding.**
   - Resource ordering comes from `RESOURCE_KEYS` (in `lib/resources.ts`).
   - Resource icons + labels from `RESOURCE_DEFS[key]`.
   - Copy from per-locale dicts (`lib/locales/{pl,uk,cs,en}.ts` or page-scoped `DICT` constants in 4-locale parity).
   - Skin tokens from `:root[data-skin="pko"]` CSS vars.
   - Adding a new resource, locale, or component variant must require zero edits to formatter or component bodies.

3. **Tests are not optional.** The current vitest baseline is **682/682 passing across 82 files**. Every PR you ship must keep that count or grow it. Tests for new behaviour are part of PR scope, not a follow-up. Specifically:
   - PR-1 must add a test verifying `<html data-skin="pko">` triggers the new CSS layer (e.g. JSDOM snapshot of computed style on a fixture button).
   - PR-2 must extend Playwright golden-path or add a new visual-regression spec covering the 3 most-edited components (button, card, nav).
   - PR-3 must include a unit test asserting the 6 `--scene-*` variables resolve to the documented hex on the PKO skin and that no hardcoded hex remains in `components/city-scene.tsx`.

4. **Three PRs, in order, never combined.** PR-1 → PR-2 → PR-3. Each must build green on Vercel preview before the next starts. If you find yourself wanting to combine, stop and re-read `06-EXECUTION-PLAN.md` § PR boundaries.

5. **i18n parity.** Every new dict key lives in PL, UK, CS, and EN. The `lib/i18n.ts` test that checks key parity across locales (currently 423 keys per locale, zero drift — see `README.md`) must stay green.

6. **Backward compatibility.** Adding fields is fine; renaming or deleting public exports is not. The core (yellow) skin must look identical after your work — `SKIN=` (default) renders the existing UI unchanged. Spot-test by running the production deploy `https://watt-city.vercel.app/` after each PR lands.

7. **No emoji in brand identity.** Mascots and resource icons are not emoji-as-brand; they are character marks. Do not introduce decorative emoji into headings, button labels, or chips. The design agent already removed `🎉` from the tier-up toast; do not regress.

8. **Document open questions in PR descriptions.** Five items are pending PKO BP brand-team sign-off (font licence, official logo SVG, Żyrafa Lokatka pose vectors, asymmetric corner convention, hero CTA copy). Implement substitutes per `10-VALIDATION-REPORT.md` and list every substitute in the PR body so reviewers can swap them when the assets land.

# WORKFLOW

## Branching

Single-branch workflow per repo convention (see `README.md` § Repo history). You will create three feature branches off `main`, push each, open a PR, wait for Vercel green, then fast-forward `main` once approved.

```
git checkout main && git pull
git checkout -b feat/sko-visual-pr1-tokens-shield
# ... work ...
git push -u origin feat/sko-visual-pr1-tokens-shield
gh pr create --title "..." --body "..."
# wait for Vercel SUCCESS, ask reviewer
# on approval: git checkout main && git merge --ff-only feat/sko-visual-pr1-tokens-shield && git push
# delete branch local + remote
```

Repeat for PR-2, PR-3.

## Commit style

Match the repo's existing commits (run `git log --oneline -10`):
- `feat(skin): …` for new visual layer
- `refactor(ui): …` for component rewrites
- `fix(skin): …` for follow-up corrections

Body must include: what changed, why, file count, validation evidence (typecheck / vitest / playwright counts).

# PR-1 — Tokens & globals shield  (≈ 6 hours)

**Goal:** ship the foundation so PR-2 and PR-3 can layer on cleanly. After this PR, `data-skin="pko"` activates the new CSS variable set, the Tailwind specificity shield works, and the manifest is dynamic — but no component visuals change yet (or change minimally). This isolates risk.

**Scope (per** `06-EXECUTION-PLAN.md` § PR-1):

1. Copy `docs/partnerships/pko-visual-system-v1/04-GLOBALS-PKO.css` into the source tree (recommended: `app/globals-pko.css`). Import it from `app/globals.css` after the existing `@import "tailwindcss"` line and any existing skin overrides — order matters for cascade.
2. Verify `lib/theme.ts` `PKO_THEME.colors` matches the verified tokens from `04-DESIGN-TOKENS.json` (the previous pilot used approximated `#d31f26` / `#052c65`; the verified primary navy is `#003574`, darkest `#001E4B`). Update if drift is present, **and update the corresponding tests** in `lib/pko-skin.test.ts` so they assert the new values.
3. Migrate `public/manifest.webmanifest` → `app/manifest.ts` (Next.js 16 `MetadataRoute.Manifest` export) so `theme_color` is skin-aware. Reference the snippet in `06-EXECUTION-PLAN.md` § 11.6 of the v0.2 manual (still valid).
4. Add a vitest case asserting that when `<html data-skin="pko">` is rendered (use a JSDOM fixture), the computed style of `.btn` resolves to the navy primary background, not yellow.
5. **Do not** edit any component file in this PR. The point is to land the foundation atomically.

**Validation gates before PR opens:**
- `pnpm tsc --noEmit` — silent
- `pnpm vitest run` — ≥ 682/682 (your additions count toward growth)
- `pnpm test:e2e -- smoke` — green (no visual regressions on default skin)
- Manual: `SKIN=pko pnpm dev`, open `/`, confirm header chip background flips to navy without changing layout. Open `/` without `SKIN=pko`, confirm visually identical to current prod.

# PR-2 — Component overrides, nav, footer, landing hero, PDFs, icons  (≈ 12 hours)

**Goal:** every component listed in `05-COMPONENTS-SPEC.md` (15 of them) gets its `[data-skin="pko"]` override. Landing hero is rewritten per `07-LANDING-HERO-REDESIGN.md`. Site nav border, footer brand chip, footer pitch-tag visibility, PDF report fonts, and PWA icons all flip on the SKO skin. After this PR, a screenshot of `/` and `/miasto` under `SKIN=pko` should look like a banking product, not navy brutalism.

**Scope (per** `06-EXECUTION-PLAN.md` § PR-2):

1. **Components.** For each of the 15 in `05-COMPONENTS-SPEC.md`, add the `:root[data-skin="pko"]` rules to `app/globals-pko.css` (or per-component file if the spec calls for it). The CSS is already provided in `04-GLOBALS-PKO.css`; your job is integration + verifying every selector matches the actual class names in the codebase. Anything that diverges → fix the CSS, not the component.

2. **`components/site-nav.tsx`.** Drop the `border-b-[3px]` brutal border under PKO; replace with `1px solid var(--sko-border-light)`. Brand chip already reads `theme.colors.accent` — verify it resolves to the navy primary on PKO and to yellow on core.

3. **`app/layout.tsx` footer.** The `brutal-tag` chips for `PKO XP: GAMING / ETHSilesia 2026 / KATOWICE · PL` are pitch artifacts. Per the design agent's decision #9, they conditionally hide under `theme.id === "pko"`. Implement that gate — do not delete them; they're correct for the core skin.

4. **`components/tier-up-toast.tsx`.** Per design agent decision #10, remove the `🎉` emoji and the brutal yellow card; on PKO the toast is a white card with a navy `border-left` and an accent dot. Animation timing stays.

5. **Landing hero (`app/page.tsx`).** Apply the layout rewrite from `07-LANDING-HERO-REDESIGN.md`: hero copy shorter and banking-friendly, primary CTA navy fill (not brutal yellow), secondary CTA ghost white outline, the dev banner ("Content Machine Phase 2") hidden under PKO. Right-side card (TOP 3 RANKING) reframed per spec — card border 1 px instead of 3 px, soft shadow.

6. **PDF reports (`lib/pdf-report.tsx`, `lib/pitch-pdf.tsx`).** Swap the registered font for `Inter` (substitute for `pkobp` per `10-VALIDATION-REPORT.md` open question 1) under PKO; keep current font on core. Layout templates stay; only typography + color tokens flip.

7. **PWA icons (`public/icons/`).** Add `icon-192-pko.svg`, `icon-512-pko.svg`, `icon-maskable-pko.svg` per `06-EXECUTION-PLAN.md` § 11.7 of v0.2 manual (still valid). Navy `#003574` background, white mark.

8. **i18n.** Every new copy string introduced (hero, error states, microcopy from `09-VOICE-AND-COPY-PL.md`) lands in PL primary + UK + CS + EN. The current 423-key parity must stay green; if you add 8 keys, the count becomes 431 across all four locales, no drift.

**Validation gates before PR opens:**
- All PR-1 gates plus:
- New Playwright spec `e2e/sko-skin-visual.spec.ts` covering 3 routes (`/`, `/miasto`, `/games`) under `SKIN=pko`, asserting:
  - `.btn` computed `border-radius` is the asymmetric `10px 0px 10px 0px` per design decision #2
  - `.btn` computed `box-shadow` does not contain `0px 0px 0px var(--ink)` brutal pattern
  - No element with class `brutal-tag` is visible in DOM under PKO (or it has the new pill styling)
- Manual: side-by-side comparison screenshot of core vs PKO on `/` and `/miasto`. Attach both to PR description.

# PR-3 — `city-scene.tsx` 73-hex → 6-var refactor  (≈ 12 hours)

**Goal:** the largest blocker. The Katowice SVG panorama has 73 unique hex values across 229 occurrences (verified in this conversation's audit). Per `08-CITY-SCENE-REFACTOR-PLAN.md`, collapse them onto 6 semantic CSS variables: `--scene-sky-top`, `--scene-sky-bottom`, `--scene-ground`, `--scene-building-primary`, `--scene-building-secondary`, `--scene-window-lit`. The mapping table is provided in the plan.

**Scope (per** `06-EXECUTION-PLAN.md` § PR-3 + `08-CITY-SCENE-REFACTOR-PLAN.md`):

1. Define the 6 vars in `app/globals.css` `:root` (core skin values, matching what the SVG currently uses), and override in `:root[data-skin="pko"]` per the navy palette in `04-DESIGN-TOKENS.json`.
2. Edit `components/city-scene.tsx`. For each of 229 inline `fill="#xxxxxx"` / `stroke="#xxxxxx"` / `stop-color="#xxxxxx"`, replace with `fill="var(--scene-*)"` per the role mapping in the plan. **Do not** introduce new hex literals — every color in the file post-refactor is either a CSS var or a `currentColor` reference.
3. Same treatment for `components/city-skyline-hero.tsx` (smaller — 4 hex per the v0.2 audit).
4. Add a unit test in a new `lib/city-scene-palette.test.ts` that:
   - Reads `components/city-scene.tsx` as a string,
   - Runs `/[fill|stroke|stop-color]="#[0-9a-fA-F]{3,6}"/g` regex,
   - Asserts zero matches (no remaining hardcoded hex).
5. Add a Playwright spec asserting visual diff: render `/` under both core and PKO skins, compare against committed reference screenshots. Use `expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.05 })` — small tolerance for AA antialias drift.

**Validation gates before PR opens:**
- All PR-1 + PR-2 gates plus:
- Visual diff spec passes against fresh references.
- Manual: capture one screenshot of `/` under each skin, diff visually, attach to PR.

# QUALITY GATES — universal across all three PRs

Before opening any PR:

```
pnpm tsc --noEmit                   # silent
pnpm vitest run                     # ≥ 682/682, growing
pnpm test:e2e -- smoke              # green
pnpm build                          # green (catches Next.js compile-time errors that vitest misses)
SKIN=pko pnpm dev                   # manual smoke on /, /miasto, /games, /loans/compare, /login
SKIN= pnpm dev                      # manual smoke confirms core skin unchanged
```

After Vercel preview lands:
- Use the `gh api repos/B2JK-Industry/watt-city/commits/<sha>/statuses` pattern to confirm `Vercel` context is `success`.
- Smoke the preview URL (will be Vercel-protected, will require team auth — describe the smoke in the PR body so the human reviewer can repeat it).

# WHAT TO REJECT YOUR OWN WORK FOR

Open the diff and ask yourself, before opening the PR:

- [ ] Does the PR touch only files in scope for this PR per `06-EXECUTION-PLAN.md`? If you've drifted into city-scene during PR-2, stop.
- [ ] Have I introduced any new hardcoded hex (other than in `globals-pko.css` itself, which is the design source)? If yes, refactor through a token.
- [ ] Have I introduced any new hardcoded copy string in JSX? If yes, route through DICT/locale.
- [ ] Has the core skin changed visually? If yes, your PKO override leaked. Use higher selector specificity (`:root[data-skin="pko"] .btn`) instead of unscoped `.btn` overrides.
- [ ] Does any component still have `border-[3px]`, `box-shadow: Npx Npx 0 0 …`, or `text-transform: uppercase` *active under PKO*? If yes, the brutalism shield is incomplete.
- [ ] Is the PR description complete with: scope summary, validation evidence, screenshots (PR-2 + PR-3), open questions for PKO brand team?

If any answer is wrong, fix before opening.

# WHAT TO DOCUMENT IN PR DESCRIPTION

Template:

```markdown
## Summary
- Implements PR-N of the SKO visual system per `docs/partnerships/pko-visual-system-v1/06-EXECUTION-PLAN.md`.
- Files changed: <count>
- New tests: <count>, total now <count>/<count>

## Validation
- typecheck: clean
- vitest: <count>/<count>
- playwright: <count>/<count> (`pnpm test:e2e`)
- production-build: clean (`pnpm build`)
- manual smoke: SKIN=pko on /, /miasto, /games — chips, buttons, cards confirmed banking-clean
- manual smoke: SKIN= (core) on /, /miasto — visually unchanged from previous prod (attached screenshots)

## Visual
[Side-by-side screenshots, core vs PKO, attached]

## Open questions awaiting PKO BP brand team
1. ...
2. ...

## Rollback plan
Revert this commit; no data migrations involved. Core skin unaffected throughout.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

# OPEN QUESTIONS HANDLING

Five items are unresolved pending PKO BP brand team:

1. `pkobp` proprietary font licence
2. Official logo SVG + Żyrafa Lokatka pose library
3. Asymmetric corner radius web vs native
4. Hero CTA copy — "Otwórz konto SKO" vs "Naucz się oszczędzać"
5. EN locale for "W-dolary" — "W-dollars", "W$", or PKO-approved term

For each, **ship the substitute** documented in `10-VALIDATION-REPORT.md` and **list it in every PR description** that touches it, so a reviewer can swap when the asset arrives. Do not block a PR on these — that's a separate handoff.

# DELIVERABLES

By the end of this engagement (3 PRs landed on `main`, prod deploy green):

- 3 commits on `main`, each independently revertable.
- ≥ 700 vitest assertions passing (was 682), ≥ 16 Playwright specs (was 14).
- `https://watt-city.vercel.app/` under `SKIN=` unchanged (verified by screenshot diff against pre-engagement baseline).
- `https://watt-city.vercel.app/?skin=pko` (or whatever the prod-skin-toggle mechanism is) renders banking-clean visuals — flat fills, soft shadows, sentence-case headings, navy primary, pill chips, no brutal artifacts visible.
- 5 open questions tracked in a `docs/partnerships/pko-visual-system-v1/OPEN-QUESTIONS-LOG.md` you create on PR-1 and append to on PR-2 and PR-3.

# DO NOT

- Do not refactor the economy-transparency surface (commit `0658647`). It is unrelated and shipped.
- Do not delete `lib/theme.ts` `CORE_THEME` or any of its exports.
- Do not introduce a CSS-in-JS library; the project is Tailwind v4 + plain CSS.
- Do not bump dependencies as part of this work; visual changes only.
- Do not skip locales because "they're not the primary audience". PL/UK/CS/EN parity is enforced by tests.
- Do not write a "brand manual"-style document in your PR descriptions; describe the diff and the validation, not the philosophy.
- Do not put screenshots in the repo larger than 250 KB; if you need higher fidelity for review, attach to PR via GitHub's drag-drop.

BEGIN WITH PRE-FLIGHT (read all 11 artifacts), then open PR-1.

⸻ END ⸻

---

## How to use this prompt

1. Save the prompt block (everything between `⸻ START ⸻` and `⸻ END ⸻`) and hand it to a Claude Opus 4.7 agent (or equivalent) with file-system + `gh` + bash access.
2. Agent will run pre-flight reads (~10 min), then PR-1 (~6 h compute including waiting for Vercel), then PR-2 (~12 h), then PR-3 (~12 h). Allow ~30 hours of agent runtime spread over a few sessions.
3. Between PRs, you (the human) review and approve. The agent does not merge to `main` without your signal — it only opens the PR and waits.
4. After PR-3 lands, you have a complete SKO visual layer behind a runtime flag, with the core skin untouched.

## Why this prompt is shaped the way it is

- **PR cadence is hard-coded.** A senior tech lead would not ship 30 hours of work as one PR; the prompt enforces that.
- **Quality gates are universal across PRs.** Avoids the "PR-3 shipped before PR-2 was actually green" failure mode.
- **Open questions are explicit, with substitute pattern.** Avoids the agent stalling waiting for the PKO brand team.
- **The "What to reject your own work for" checklist** is the most important section — it's a self-audit gate that mirrors the rejection criteria a senior reviewer would apply.
- **The `pilot/sko-skin-v0.2` cautionary tale** is referenced explicitly so the agent knows why color-only swaps will be rejected.

## What this prompt deliberately does NOT do

- Does not give the agent freedom to redesign components beyond the spec. The design lives in `pko-visual-system-v1/`; the agent's job is faithful execution.
- Does not include "use your judgment" language for visual decisions. Either the spec says it, or it's an open question — no third path.
- Does not budget time for design exploration. This is implementation, not iteration.
