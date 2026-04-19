# V3 — Mechanics & UX polish (phase summary)

**Status**: ✅ V3.1 → V3.7 complete on `watt-city-v3v4`
**Commits**: `da32a1f..254c42c` (19 commits covering V3.1-V3.7 + per-phase summaries)
**Tests**: baseline 375 → **417 passing** (+42 net-new)
**Build**: clean

---

## Ship log

| Phase | What | New files |
|---|---|---|
| V3.1 | CITY_TIERS replacement. Dashboard hero → CitySkylineHero + CityLevelCard + progress ring. Nav badge = `Level N · ⚡±Y/h`. Landing = top-3 city-value. /o-platforme = LEVEL_UNLOCK_LADDER with eduMoments. `CITY_TIERS`/`tierForLevel`/`titleForLevel`/PlayerBuilding deleted. | `components/city-skyline-hero.tsx`, extended `lib/city-level.ts`, `components/city-level-card.tsx` (progress ring) |
| V3.2 | Sklepik before Mała elektrownia; any-of unlock (50 watts OR has Sklepik); 50 coins + 50 bricks starter kit idempotent via ledger SADD; register route fires ensureSignupGift synchronously | `lib/v3-onboarding.test.ts`; extended `ensureSignupGift` + `hasReceivedStarterKit` |
| V3.3 | `deficitState()` snapshot helper; sticky amber panel with milestone countdown + rescue CTAs; `POST /api/loans/rescue` (0% APR, 150 coins, monthly SADD dedup) | `components/watt-deficit-panel.tsx`, `app/api/loans/rescue/route.ts`, `lib/watts-v3.test.ts`, `lib/rescue-loan.test.ts` |
| V3.4 | `lib/building-lock.ts` — `kvSetNX` single-flight; /api/score acquires + release-in-finally; place/upgrade/demolish 409 on held; client retry once after 500ms | `lib/building-lock.ts`, `lib/building-lock.test.ts` |
| V3.5 | `Loan.autoRepay?: boolean` (default true for new loans, legacy = true); `processLoanPayments` respects flag; `PATCH /api/loans/[id]/auto-repay`; LoanSchedule widget | `components/loan-schedule.tsx`, `app/api/loans/[id]/auto-repay/route.ts`, `lib/v3-loans.test.ts` |
| V3.6 | `/duel`, `/api/duel`, `components/duel/` deleted; `lib/duel.ts` → `lib/duel.legacy.ts` with header comment + ADR 004; nav link removed; privacy page duel retention row dropped | `docs/decisions/004-v3-duel-removal-and-future.md`, `lib/v3-duel-removal.test.ts` |
| V3.7 | `compareLoans(principal, term, state)` → sorted ladder with `warning`/`cheapest` flags; `/loans/compare` page with 4-lang table; kredyt_konsumencki flagged red + tooltip | `components/loan-comparison.tsx`, `app/loans/compare/page.tsx`, `lib/v3-compare-loans.test.ts` |

## Feature flags

All six V3 flags set to `on` in `DEFAULT_FLAGS`:
- `v3_city_first` · `v3_starter_kit` · `v3_brownout_panel` · `v3_score_lock` · `v3_loan_calendar` · `v3_loan_comparison`

## Test state

- 50 test files, 417 tests passing (baseline 375 + 42 V3 net-new)
- Typecheck clean, prod build green
- No regressions on V2 surface (Phase 1-10 tick/loan/city-value tests intact)

## Hand-off to V4

V4.1 teacher hero up next. Reads:
- `lib/theme.ts` for SKIN=pko flag behaviour
- `app/klasa/[id]/page.tsx` existing classroom skeleton (Phase 3.3)
- `lib/curriculum.ts` — does NOT exist yet; V4.5 will build it
