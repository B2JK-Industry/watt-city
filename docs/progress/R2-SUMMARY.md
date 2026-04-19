# R2 — Cashflow mechanic (phase-boundary report)

**Commits**: `3000370` (R2.1) · `7176b65` (R2.2) · `cf50ce3` (R2.3)
**Status**: ✅ complete, 296 tests passing, prod build green
**Review anchors resolved**: BLOCKER-1, HIGH-12

---

## What R2 did

Made the energy economy the pedagogical core of the game. Every building now has a signed watt upkeep; the grid is a real constraint that shows up in the HUD, scales production (never to zero), and feeds the amber-banner rescue CTA. Loan payments gained a cashZl→coins fallback so the first missed month isn't a cliff. HUD is live on every authenticated page.

## R2.1 — Watt upkeep + brownout (commit `3000370`, **BLOCKER-1**)

- `BuildingCatalogEntry.wattUpkeepPerHour` signed (positive=draws, negative=supplies, 0=off-grid) added to every catalog row.
  - Off-grid / decorative: Domek 0, Park 0, Kościół 1, Fontanna 1
  - Light-draw civics: Bank 2, Biblioteka 2, Gimnazjum 4, Centrum nauki 6, Spodek 8
  - Heavy industry: Sklepik 3, Software house 10, Huta 12, Walcownia 15
  - Producers: Mała elektrownia -8, Fotowoltaika -12
- `lib/watts.ts` new module with the ladder per **BLOCKER-1**:
  - `<24h → 100%` (grace)
  - `24-48h → 50%` (tier-2 brownout)
  - `≥48h → 25%` (sustained floor — **never 0**, so the player can always earn enough coins/bricks to fund Mała elektrownia, 50 bricks + 80 coins)
  - energy production (`baseYieldPerHour.watts`) is **never brownout-scaled** — rescue is always feasible.
- `PlayerState.wattDeficitSince?: number | null` — stamped on first deficit, cleared on rescue. Called at every build/upgrade/demolish and at tick entry.
- `lib/tick.ts` re-ordered into a per-hour-bucket outer loop so brownout can re-evaluate each hour; non-watts yields scaled by factor, ceil-then-max(1) so brownout never rounds a positive yield to zero.
- `isInWattRescueGrace(state, now)` — the 72h contract R7.3 (bankruptcy/restructuring) must consume before firing any seizure. BLOCKER-1 explicitly forbids bankruptcy while a watt deficit is still young.

## R2.2 — Loan payment fallback (commit `7176b65`)

- `processLoanPayments`: drains `cashZl` first, falls back to `coins` at 1:1 for any remainder; miss only fires when combined cash+coins < payment. Ledger entry carries `{fromCash, fromCoins}` for UI breakdown.
- `Loan.latePayments?: number[]` — month indices that missed; survives a later on-time month (`missedConsecutive` resets to 0, `latePayments` retains). Profile page payment-history UI reads from this.
- New helpers used by the R2.3 HUD amber banner:
  - `projectedCashflow(state, days)` — monthly cashflow × (days/30)
  - `activeLoanRisk(state, now, horizonDays=7)` → `LoanRiskAlert[]` (loanId, shortfall, paymentDue, monthsUntilDue)
- Regression test updated: default-trigger now zeroes both cashZl and coins (old test relied on cashZl-alone forcing a miss).

## R2.3 — Cashflow HUD (commit `cf50ce3`, **HIGH-12**)

- `lib/hud-data.ts` — server-computed `HudBundle` (brownout, loan risk, alert level, msSinceTick, watt balance snapshot). Builds once inside `app/layout.tsx`.
- `components/cashflow-hud.tsx` — client component, purely presentational + interactive.
- Viewport matrix (HIGH-12 fix):
  - `<640px` (mobile portrait & landscape): fixed bottom strip above BottomTabs, `env(safe-area-inset-bottom)` for iOS notch
  - `≥640px` (tablet + desktop): top-right dock under SiteNav, `w-72`
  - `/miasto` route: dock shifts to **left** so the city canvas stays visible (`usePathname`-aware)
  - `z-35`: under modals (z-50) so dialogs occlude; above SiteNav (z-20)
- Content rendered:
  - Headline: `Saldo {cashZl+coins} · +{projectedHourly}/h · ⚡{net} chip`
  - Deficit banner with severity color + one-tap rescue `<Link href="/miasto?build=mala-elektrownia">` (**BLOCKER-1 rescue CTA**)
  - Rescue-window countdown (`72 - Math.floor(deficitHours)h`) during grace
  - Loan-risk amber when `activeLoanRisk().length > 0` (and no higher-severity deficit)
  - Stale pill + refresh button when `msSinceTick > 5min`
- Dismissible when non-critical; re-opens on severity escalation.
- 4-lang copy inline (pl/uk/cs/en).

## Test / build state at end of R2

- 37 test files, **296 tests** passing.
- Net-new tests: 31 watts unit + 2 brownout integration + 7 loan fallback + 6 HUD bundle = 46 across R2.
- `pnpm exec tsc --noEmit` clean.
- `pnpm build` clean — HUD server-renders on every authenticated route without hydration warnings.

## Hand-off to R3

R3 (UX city-first) consumes:
- **R3.2 Dashboard**: pulls the same `HudBundle` + `cityLevelFromBuildings` so the hero card matches the HUD's live numbers. Must hide SiteNav's legacy "Waty łącznie / Pozycja" stats per R3.2.2.
- **R3.4 Post-game modal**: breakdown ladder (HIGH-4 ×3 cap) shares multiplier vocabulary with the HUD's per-hour projection.
- **R6.1 Core 15 buildings**: already priced with `wattUpkeepPerHour`; any new row added in R6.1 must declare a value too (type field is required in TS, `?` optional but catalog convention now says every row sets it).

## Known follow-ups from R2

- HUD uses `window.location.reload()` on refresh — fine for MVP, eventually swap to a router-level revalidation.
- Loan-risk amber currently shows only first loan's copy; once there's a second mortgage product live (R7.1), surface a count.
- Brownout math could accept a more expressive curve per building type (e.g. decorative → 0 penalty) — not on the MUST-SHIP path.
- R7.3 restructuring must read `isInWattRescueGrace(state, now)` before firing — wiring point is the `bankructwoReset` entrypoint.

---

**Next**: R3.1 landing redesign, R3.2 dashboard city-first (hides legacy stats, swaps in `cityLevelFromBuildings`), R3.3 nav cleanup, R3.4 post-game modal with HIGH-4 breakdown ladder.
