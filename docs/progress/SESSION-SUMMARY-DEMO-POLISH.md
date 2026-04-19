# Session summary — demo polish

**Date**: 2026-04-19
**Branch**: `watt-city-demo-polish` off `watt-city@a932911` (+ 5 cleanup cherry-picks)
**Baseline**: 502 tests · Final: **569 tests** (+67 net-new) · Prod build green
**PR**: not opened — branch pushed for human review

---

## Scope — 8 items for PKO demo readiness

### ✅ D1 — `/dla-szkol` marketing content rewrite (commit `9f5ebb2`)

Full rewrite of the schools landing. Structure top-to-bottom:
compliance badges (MEN V–VIII · PKO SKO · GDPR-K) → hero title/subtitle →
triple CTA (demo · signup · brochure PDF) → 3-audience value prop
(kids/teachers/parents) → 4-step "Jak to działa" with arrows →
screenshot placeholders → compliance 5-bullet aside → podstawa
programowa preview (10 codes from curriculumByArea, 2 per area) →
download aside (PL + EN + HTML) → bottom CTA repeat. 4-lang Copy with
Polish canonical.

Tests +11 (app/dla-szkol/landing-content.test.ts): required-section
guards, copy keys in all 4 langs, Slovak-canary.

### ✅ D2 — V4.3 weekly PDF export polish (commit `cd5d1a7`)

Smoke-rendered PDFs visually and found three embarrassing bugs:

1. **Polish diacritics broken**. Helvetica base14 uses WinAnsiEncoding;
   "Uczeń" rendered as "UczeD", "Szkoła" as "SzkoBa", "Wartość" as
   "WartoO". Registered Roboto (regular + bold + italic) from
   `public/fonts`, changed `fontFamily` to "Roboto" in both
   `pdf-report.tsx` (weekly report) and `pitch-pdf.tsx` (brochure).
2. **Curriculum chart split mid-bar across page breaks**. Wrapped in
   `<View wrap={false}>`.
3. **Multi-page reports lost the brand header on page 2+**. Added
   `fixed` prop to headerRow so "Watt City · SKO 2.0 · {school} ·
   {class}" repeats like the footer already does. Now also surfaces
   `cls.subject` in the header.

Also `paddingBottom: 60` on the page so the last row never slides
under the fixed footer.

Tests +4 (lib/pdf-report.test.ts): Roboto registration guard,
Helvetica-leakage regression, pagination (30 students → 2+ pages),
wrap={false} + fixed header guards.

### ✅ D3 — V4.5 curriculum UI surfacing (commit `afee7e1`)

V4.5 shipped the curriculum lib + chart + PDF coverage. Gap: teacher
couldn't actually *set* a curriculum-aligned theme from the UI —
POST /api/klasa/[id]/weekly-theme existed but nothing called it. And
the chart only showed in the PDF, not the dashboard.

- NEW `components/weekly-theme-picker.tsx` (client): grade-filtered
  `<select>` grouped by CurriculumArea (Ekonomia/Matematyka/WOS/EDB/
  Informatyka), rich code preview (description + theme + game tags),
  save/clear buttons, useTransition pending state,
  `motion-safe:animate-pulse` confirmation.
- `components/class-dashboard.tsx`: mounts `<CurriculumChart>` (all
  viewers) + `<WeeklyThemePicker>` (teacher only). observedThemes /
  observedGames computed from per-student `recentLedger(100)` filtered
  to the current week — same logic the PDF route uses.

Tests +9 (lib/curriculum-ui.test.ts).

### ✅ D4 — 1-click demo seed button (commit `7eaca0e`)

Lights up the `/dla-szkol → /dla-szkol/demo` path D1 promised.

- `POST /api/dla-szkol/demo/start`: flag-gated via `v4_demo_seed`,
  idempotent seed (via sentinel), `createSession(demo-teacher-pl)`,
  returns `redirectTo: "/nauczyciel"`.
- `/dla-szkol/demo` landing: describes the demo account, warns data is
  shared, offers /nauczyciel/signup as the serious path.
- `<DemoStartButton>` (client): useTransition pending state, fetch
  + `window.location.href` redirect. CSRF auto-attached via existing
  CsrfBootstrap global fetch patch.

Smoke-verified: handshake (visit → CSRF cookie → POST → xp_sess cookie
→ GET /nauczyciel) returns the seeded class "V.B — Matematyka
finansowa" · 30 uczniów · join-code 4KSH6A.

Tests +12 (lib/demo-start-route.test.ts): file-level guards only —
the end-to-end POST call needs Next.js request scope for `cookies()`
which vitest doesn't provide.

### ✅ D5 — kid onboarding tour ends on loans (commit `39253ca`)

Pre-D5 the 4th step was "first game"; D5 switches it to the **no-risk
credit simulator** so the PKO demo audience sees the distinctive
mechanic first-run. 4-lang copy (pl/uk/cs/en). Deep-links to
/loans/compare.

Also a11y + motion polish: `role="dialog"` + `aria-modal` +
`aria-labelledby`, backdrop `motion-safe:animate-[fade-in]`, card
`motion-safe:animate-[pop-in]` with slight overshoot. New keyframes
in globals.css.

Tests +7 (lib/onboarding-tour.test.ts).

### ✅ D6 — animation polish (commit `8ea1a32`)

- **Confetti** now respects `prefers-reduced-motion` (returns null
  when reduced; it's pure decoration, no info to preserve). Hooks the
  matchMedia change event too.
- **NEW `CountUp`** — reusable animated number reveal. Cubic ease-out
  via requestAnimationFrame. Jumps to final value under reduce.
  Mounted on RoundResult's awarded score so the reward counts up.
- **TierUpToast** entrance animation `tier-up-enter` (slide-up +
  overshoot), motion-safe gated.
- **NEW `ResourceFlashChip`** — HUD delta flash primitive. Tracks
  value via useRef, briefly pulses box-shadow (lime for gain, pink
  for loss). Uses `hud-delta-flash` keyframe + `--delta-flash` CSS
  variable. Skips under reduce.

New keyframes in globals.css: `tier-up-enter`, `hud-delta-flash`
(plus `fade-in` + `pop-in` from D5). No new utility classes —
consumers use Tailwind's `motion-safe:animate-[...]` form.

Tests +12 (lib/animation-polish.test.ts).

### ✅ D7 — feature flag ramp to 100% (commit `ae2c8af`)

Flipped the two percentage-gated V2 flags:
- `v2_post_game_modal`: 50% → on
- `v2_restructuring`:   50% → on

A coin-flip between two audiences is worse than either outcome for a
demo pitch. Kept OFF deliberately: `v2_migration_eligible` (destructive
schema migration, not a feature gate), `v4_principal` (multi-class
pilot, allowlist-driven).

Tests +5 (lib/flag-ramp-d7.test.ts): resolved `true` for every user,
holdouts stay off, sweeping guard fails CI if any `v[234]_` flag is
still in percentage mode.

### ✅ D8 — SKIN=pko propagates through the whole app (commit `f5a8294`)

Pre-D8 SKIN=pko only swapped the brand label, the single nav brand
chip's inline colour, the footer disclaimer, and the mascot. Every
other surface read `var(--*)` from `:root` which hardcoded Watt City
yellow. App looked "mostly yellow with a red chip" under PKO — not
credible.

`app/layout.tsx` now builds a `React.CSSProperties` override from
`theme.colors.*` when `theme.id === "pko"` and spreads it onto
`<html style>` as inline CSS variables. Every existing `var(--accent)`
/ `var(--background)` / `var(--surface)` consumer picks up PKO palette
without a rewrite. `<html data-skin="pko">` lets tests + devtools key
off the active skin.

Tests +7 (lib/pko-skin.test.ts). Updated `docs/pko-demo-mode.md` with
the D8 propagation note.

---

## Test state

- 69 test files, **569 tests** passing (baseline 502 + 67 net-new)
- Typecheck clean
- Prod build green
- No regressions on V2/V3/V4/cleanup existing suites

## Commit log

```
f5a8294 feat(demo):D8 — SKIN=pko propagates through the whole app
ae2c8af feat(demo):D7 — ramp percentage-gated flags to 100% for PKO pitch
8ea1a32 feat(demo):D6 — animation polish + prefers-reduced-motion
39253ca feat(demo):D5 — kid tour ends on loans + accessibility polish
7eaca0e feat(demo):D4 — 1-click demo seed button
afee7e1 feat(demo):D3 — surface V4.5 curriculum UI in teacher dashboard
cd5d1a7 feat(demo):D2 — weekly PDF Polish diacritics + pagination polish
9f5ebb2 feat(demo):D1 — /dla-szkol marketing content + dict
2e8b113 docs(demo-polish): kickoff + rebase cleanup fixes
a411f6e fix(cleanup):issue-5 — role-aware nav links for V4 pages
e592c31 fix(cleanup):issue-4 — add ParentInviteCard to /profile
3e60e2f fix(cleanup):issue-3 — mount PostGameBreakdown in RoundResult
6d8d080 fix(cleanup):issue-2 — drop V1 tier-name table from TierUpToast
e9b0e4b fix(cleanup):issue-1 — translate GAMES catalog to Polish
```

## Branch state

- HEAD: `f5a8294`
- Base: `a932911` on `watt-city` (V3+V4 merged)
- `main` untouched. `watt-city` untouched — all work isolated on
  `watt-city-demo-polish`.
- No force-pushes. No deploys.

## Known follow-ups (out of demo-polish scope)

- `/dla-szkol/demo` page is teacher-demo only; a kid-demo variant
  would let PKO judges see the student surface in 1 click too.
- Font bundle adds 1.5 MB of Roboto TTFs in public/fonts. If build
  size matters for Vercel function bundles, subset the fonts to Latin-1
  + Latin-2 (Polish coverage) — would drop each to ~80 KB.
- `ResourceFlashChip` is a primitive; nothing in the app uses it yet.
  The actual nav ResourceBar would need a client wrapper to adopt the
  flash on value change — additive, not a blocker.
- Visual screenshot tests remain manual (rendered samples in /tmp).
  A puppeteer/playwright fixture would be the upgrade.
- `/pko` mock page still exists — Phase 4.2 placeholder; nav already
  elides it, but the route itself is dead code until a real partnership
  goes live.

Next human action: review the 9 commits (kickoff + 8 Ds), open PR
against `watt-city`, merge on approval. Vercel auto-deploys on push
to `watt-city`.
