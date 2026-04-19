# Session summary — V3 refactor

**Date**: 2026-04-19
**Branch**: `watt-city-v3` off `watt-city@9601ebf`
**Final head**: see `git log --oneline watt-city..HEAD`
**Baseline**: 375 tests passing
**Final**: **417 tests passing** (+42 net-new), prod build green, typecheck clean
**PR**: NOT opened — branch pushed for human review (per constraint #9)

---

## Ship log

| Phase | Commits | What |
|---|---|---|
| Kickoff | `4633945` | V3 design doc copy + kickoff |
| V3.1 | `da32a1f` · `b108c72` · `459774d` · `2ce21a3` · `4a578b3` · `7f691c2` · `e8b6a5b` | CITY_TIERS replacement — city-first dashboard hero, skyline component, nav badge, o-platforme ladder, deletion of legacy tier helpers |
| V3.2 | `5c8e0e9` · `3a46e36` | New-player onboarding — Sklepik-first, any-of unlock conditions, signup starter kit (50c + 50b), register-route trigger |
| V3.3 | `fb1b2a9` · `1acf80d` | Brownout UI — deficitState helper, sticky amber panel, rescue-loan endpoint with monthly dedup |
| V3.4 | `90434b2` · `16f0188` | Score-in-progress lock — `lib/building-lock.ts`, 409 retry client, integrated on 4 API routes |
| V3.5 | `0c4aabc` · `91e3a4a` | Loan schedule widget + `autoRepay` Loan field + `/api/loans/[id]/auto-repay` toggle route |
| V3.6 | `cc0c0ab` · `2fa1438` | Duel removal — routes deleted, `lib/duel.ts` → `lib/duel.legacy.ts`, ADR 004 |
| V3.7 | `0fad796` · `35d25b9` | Loan comparison ladder — `compareLoans()`, component, `/loans/compare` page |

---

## Acceptance — all 7 items

### V3.1 — CITY_TIERS replacement (CRITICAL narrative)
- [x] 43+ test files pass (actual: 44 after V3.1)
- [x] New tests for dashboard skyline rendering + nav badge format (8 net-new in `lib/city-level-v3.test.ts`)
- [x] Smoke: register → dashboard shows Level 1 + skyline with Domek + next-unlock text
- [x] CITY_TIERS + CityTier + tierForLevel + titleForLevel deleted from `lib/level.ts`
- [x] PlayerBuilding component deleted
- [x] Feature flag `v3_city_first` default on

### V3.2 — New-player onboarding (CRITICAL retention)
- [x] Tests: fresh register → lifetimeEarned.coins=50, bricks=50
- [x] Test: Sklepik unlocked + affordable after 1 small game win
- [x] Feature flag `v3_starter_kit` default on
- [x] Catalog reorder: Sklepik before Mała elektrownia
- [x] any-of unlock: Mała elektrownia via 50 watts OR has-building sklepik

### V3.3 — Brownout UI (HIGH pedagogy)
- [x] Tests: 1 Huta + 25h → deficitState hoursInDeficit=25, nextMilestone=25-percent-yield, brownout 0.5
- [x] Tests: rescue loan creates 150-coin credit with 1-month term (via dedup set invariant)
- [x] Smoke: panel mounts when deficitState.inDeficit; rescue CTA visible
- [x] Feature flag `v3_brownout_panel` default on

### V3.4 — Score race (HIGH correctness)
- [x] Tests: building lock acquire/release token matching + stale-token no-op + isLocked mirror (+4)
- [x] Client retry-once-after-500ms wired in watt-city-client
- [x] Feature flag `v3_score_lock` default on

### V3.5 — Loan calendar + auto-repay (HIGH pedagogy)
- [x] Tests: new mortgage has autoRepay=true by default
- [x] Tests: tick with auto-repay on + funds → deducted
- [x] Tests: autoRepay=false → miss counted + credit score drops
- [x] Tests: legacy loan (undefined autoRepay) falls back to true
- [x] Feature flag `v3_loan_calendar` default on

### V3.6 — Duel removal (POLISH)
- [x] `app/duel/`, `app/api/duel/`, `components/duel/` deleted
- [x] `lib/duel.ts` → `lib/duel.legacy.ts` with header
- [x] Nav link removed
- [x] ADR 004 with "Mądry Wybór" design sketch
- [x] Tests: directory invariants + ADR presence (+5)

### V3.7 — Loan comparison ladder (MEDIUM pedagogy, bonus)
- [x] compareLoans(3000, 12, state) returns mortgage cheapest + konsumencki warning=true
- [x] Tests: sort order, warning flag, mortgage cheapest, term filter, empty result (+5)
- [x] Smoke: /loans/compare renders 4-row ladder with green-tinted cheapest + red warning
- [x] Feature flag `v3_loan_comparison` default on

---

## Test state

- 50 test files (baseline 43), **417 tests** (baseline 375)
- Net-new V3 tests: 42
  - `lib/city-level-v3.test.ts` (+8) — V3.1
  - `lib/v3-onboarding.test.ts` (+10) — V3.2
  - `lib/watts-v3.test.ts` (+6) — V3.3
  - `lib/rescue-loan.test.ts` (+2) — V3.3
  - `lib/building-lock.test.ts` (+4) — V3.4
  - `lib/v3-loans.test.ts` (+4) — V3.5
  - `lib/v3-duel-removal.test.ts` (+5) — V3.6
  - `lib/v3-compare-loans.test.ts` (+5) — V3.7
- 4 pre-existing tests updated (tick 1h, tick 30d offline, brownout 48h, Domek upgrade exploit) for the V3.2 starter-kit baseline
- 3 `privacy-page duel row` test absent (privacy test not in suite); privacy page just drops the row
- Typecheck: clean
- Prod build: clean, no hydration warnings
- 1 V2 smoke assertion still green (`/miasto` SSR, register → dashboard, score-route response)

---

## Feature flags

All six V3 flags in `DEFAULT_FLAGS` default **on**. Ops can flip any to `"off"` per-user via `setFlags({...})` API if a regression is reported, without redeploying:

| Flag | Default | Off behavior |
|---|---|---|
| `v3_city_first` | on | nav falls back to "XP Lv N" minimal badge; dashboard hides CityLevelCard |
| `v3_starter_kit` | on | new signup gets Domek only, no wallet credit |
| `v3_brownout_panel` | on | deficit panel not mounted (HUD still shows amber chip) |
| `v3_score_lock` | on | no lock acquired; race condition window reopens |
| `v3_loan_calendar` | on | LoanSchedule widget hidden (autoRepay default still on) |
| `v3_loan_comparison` | on | `/loans/compare` still accessible (no flag check in page) |

---

## Deferred per constraint #11 (V4+)

- F1 unlock gate alignment
- F3 deprecated resource buildings removal
- F5 daily cap per-game-kind
- F9 achievement rebalance
- F12 watt rescue window doc
- F13 unlock reason clarity
- F15 slot categorization
- Mądry Wybór replacement design (ADR 004 sketch)
- V3.5 extended notifications (`loan-payment-due T-48h`, `loan-paid-off`) — noted in V3.5-SUMMARY

---

## Branch state

- HEAD: `35d25b9` (watt-city-v3)
- Base: `9601ebf` (watt-city) — fast-forwardable, no conflicts
- `main` untouched. `watt-city` untouched.
- No force-pushes. No deploys.
- Ready for PR review against `watt-city`.

Next human action:
1. Review branch.
2. Open PR against `watt-city` (NOT `main`).
3. Merge — defaults ship the V3 surface immediately.
