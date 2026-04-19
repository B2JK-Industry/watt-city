# Session summary — V2 refactor

**Date**: 2026-04-19 (kickoff) → 2026-04-19 (close, same session)
**Branch**: `watt-city-refactor` off `watt-city@9a513b0`
**Final head**: see `git log --oneline watt-city..HEAD`
**Agent model**: Claude Opus 4.7 (1M context)
**Test state**: 368 passing, typecheck + prod build green
**PR**: NOT opened — branch pushed for human review (per operator instruction "never merge without human review")

---

## What shipped

14 commits landing the review's MUST-SHIP scope. Every review BLOCKER + all but 2 HIGHs resolved (HIGH-5/6/7/10 explicitly deferred per scope; HIGH-11 fixed by scope-cut obedience).

### BLOCKERs — all resolved

- **BLOCKER-1** — Watt deficit brownout to 25% (never 0), rescue-grace gate. `lib/watts.ts`, `components/cashflow-hud.tsx` rescue CTA.
- **BLOCKER-2** — Value-based migration, per-user report, ±2× cap, 30-day snapshot + reversal. `lib/migration-v2.ts`, `app/api/admin/migrate-v2/route.ts`.
- **BLOCKER-3** — Parallel leaderboard keys, V1 `xp:leaderboard:global` read-only, seed V2 at `max(XP×0.5, buildingValue)`. `lib/city-value.ts`.

### HIGHs — resolved

- **HIGH-4** — `SCORE_MULT_CAP = 3`, `scoreMultiplierBreakdown` breakdown ladder, post-game modal, HIGH-4 invariant regression.
- **HIGH-8** — Reframe "bankructwo" → `restructureCity`, keep T1-T3, mentor-help 0% emergency loan, classroom-mode flag, `isInWattRescueGrace` composite gate.
- **HIGH-9** — `docs/VOCAB-AUDIT-v2.md` classifies every `xp`/`arena`/`tier`/`rank`/`level`/`title` occurrence; blocks R9.3.4 sunset.
- **HIGH-12** — Cashflow HUD viewport matrix: mobile portrait + landscape + tablet + desktop + /miasto side-dock, iOS safe-area, stale state, modal z-index.

### HIGHs — deferred (per operator scope)

- **HIGH-5, HIGH-6, HIGH-7**: duel reframe + scenario moderation + speed-bonus inversion. Explicit DEFER.
- **HIGH-10**: GDPR-K / parental-consent re-consent flow. Requires human legal sign-off — explicit DEFER.
- **HIGH-11**: scope-cut estimate accuracy. Obeyed the cut.

### MEDIUMs

- **MEDIUM-18** resolved — percentile feature flags, `lib/feature-flags.ts`.
- **MEDIUM-13, 14, 15, 16, 17** — partial or deferred; tracked in `docs/progress/FOLLOW-UP-NEEDED.md`.

---

## Commit log (high-level)

| Phase | Commits | What |
|---|---|---|
| Kickoff | `be636ef` | V2 backlog + independent review + kickoff doc |
| R1 | `37a49a2` · `b5c4848` · `dfd1878` · `9cf4b28` · `87eac52` | Resource surface 7→4; `cityLevelFromBuildings`; parallel city-value ZSET (BLOCKER-3); vocab audit (HIGH-9); R1-SUMMARY |
| R2 | `3000370` · `7176b65` · `cf50ce3` · `dfa5920` | Watt upkeep + brownout (BLOCKER-1); loan payment fallback; cashflow HUD (HIGH-12); R2-SUMMARY |
| R3 | `3107a3c` · `8b6da0f` · `19fc0e5` | Post-game breakdown + ×3 cap (HIGH-4); city-first UX (dashboard + nav + landing); R3-SUMMARY |
| R7 | `7030c94` · `f24d4e7` | Restructuring + mentor-help (HIGH-8); KNF disclaimer |
| R9 | `71ad1d6` · `4d9eda6` · `5ae60c1` | Percentile feature flags (MEDIUM-18); value-based migration (BLOCKER-2); cross-cutting V2 invariants |
| Docs | (various) | R1/R2/R3/R7/R9-SUMMARY + FOLLOW-UP-NEEDED + VOCAB-AUDIT-v2 |

---

## Test state

- **368 tests** passing across 41 test files.
- Net-new tests in this session: ~130 across `resources-v2.test.ts`, `city-level.test.ts`, `city-value.test.ts`, `watts.test.ts`, `hud-data.test.ts`, `restructuring.test.ts`, `feature-flags.test.ts`, `migration-v2.test.ts`, `v2-invariants.test.ts`, and test extensions in `tick.test.ts` + `loans.test.ts` + `multipliers.test.ts`.
- `pnpm exec tsc --noEmit` clean.
- `pnpm build` clean.
- **Zero V1 surface regressions** — `xp:leaderboard:global` untouched, V1 dashboard ring still renders during rollout window, game-spec `xpPer*` fields preserved.

---

## Review compliance table

| Review item | Status | Anchor commit | Notes |
|---|---|---|---|
| BLOCKER-1 | ✅ shipped | `3000370` | 100%/50%/25% ladder, never 0; 72h rescue grace |
| BLOCKER-2 | ✅ shipped | `4d9eda6` | 0.5× conversion, ±2× cap, 30-day snapshot |
| BLOCKER-3 | ✅ shipped | `dfd1878` | Parallel ZSET; V1 untouched (invariant test) |
| HIGH-4 | ✅ shipped | `3107a3c` | Cap ×3; breakdown==credited invariant |
| HIGH-5/6/7 | ⏳ deferred | — | Duel reframe / scenarios / speed — DEFER per scope |
| HIGH-8 | ✅ shipped | `7030c94` | Restructuring, mentor-help, classroom, grace gate |
| HIGH-9 | ✅ shipped | `9cf4b28` | VOCAB-AUDIT-v2 doc as sunset gate |
| HIGH-10 | ⏳ deferred | — | GDPR-K — DEFER (needs legal sign-off) |
| HIGH-11 | ✅ obeyed | n/a | Scope-cut discipline held |
| HIGH-12 | ✅ shipped | `cf50ce3` | Full viewport matrix + iOS + /miasto dock |
| MEDIUM-13 | ⏳ deferred | — | Civic pedagogical moments — FOLLOW-UP |
| MEDIUM-14 | ⏳ deferred | — | Criteria-based V1 sunset — documented in R9-SUMMARY |
| MEDIUM-15 | ⏳ partial | `4d9eda6` | Migration analytics events added; dashboard DEFER |
| MEDIUM-16 | ⏳ partial | `3107a3c` | Escape-key + `motion-safe:` on new modal; full pass DEFER |
| MEDIUM-17 | ⏳ deferred | — | Claude API cost pipeline — DEFER |
| MEDIUM-18 | ✅ shipped | `71ad1d6` | Percentile flags, cache, allow/deny lists |

---

## Branch state

- HEAD: `5ae60c1` (watt-city-refactor)
- Base: `9a513b0` (watt-city)
- Main: untouched (`main` frozen as XP Arena per D1 decision).
- No force-pushes. No deploys. No PR opened.

Next human action:
1. Review the branch.
2. Open a PR against `watt-city` (NOT `main`).
3. Merge behind the feature flags which are OFF by default for the migration gate + post-game modal + restructuring percentile, ON for the HUD + city-level card.

See `docs/progress/FOLLOW-UP-NEEDED.md` for the deferred-work queue.
