# R3 — UX city-first (phase-boundary report)

**Commits**: `3107a3c` (R3.4) · `8b6da0f` (R3.1/R3.2/R3.3)
**Status**: ✅ complete, 306 tests passing, typecheck + prod build green
**Review anchors resolved**: HIGH-4

---

## R3.4 — Post-game multiplier breakdown (commit `3107a3c`, **HIGH-4**)

- `SCORE_MULT_CAP` tightened from `5` → `3` per HIGH-4.
- New `scoreMultiplierBreakdown(buildings, kind)` returns the ladder: `factors[]` with per-building labels, source ids, factor values, plus `rawMultiplier`, `capped`, `finalMultiplier`.
- New `ladderSummary(baseValue, breakdown)` returns an inline `"50 × 1.2 × 1.05 = 60"` string for compact surfaces.
- New `resolveFactorLabel(factor, lang, dict)` — looks up `factor.labelKey`, falls back to `factor.labelFallback` when dict lacks entry so new buildings render without same-PR dict bumps.
- `scoreMultiplier()` now **delegates** to `scoreMultiplierBreakdown`, guaranteeing the HIGH-4 regression invariant ("displayed breakdown sums to credited amount") by construction.
- `components/post-game-breakdown.tsx` client modal: ladder table (base → factors → final), cap note on clamp, resource chips, Escape-closeable.
- `/api/score` returns `multBreakdown` in response body for client consumption.

## R3.2 — Dashboard city-first (commit `8b6da0f`, additive)

- New `components/city-level-card.tsx` (server component). Renders V2 progression number from `cityLevelFromBuildings`, progress bar to next level, next-unlock name from `LEVEL_UNLOCKS`, building count, grid-balance chip `⚡+/−N` with produced/consumed watts.
- `Dashboard` props extended with `player?: Pick<PlayerState, "buildings" | "wattDeficitSince">`. Card mounts above the V1 hero so the city is the first thing the player sees.
- V1 XP-level ring stays during rollout window (per VOCAB-AUDIT §2.1 — deletion scheduled post-R3.2 once the R9.3.1 feature flag ships and R9.3.4 sunset criteria met).

## R3.3 — Navigation cleanup (commit `8b6da0f`)

- Dropped "Sala sławy" from SiteNav and mobile scroll-nav — the hall is being folded into `/leaderboard` per the vocab-audit redirect path.
- Duel + ranking + about stay.

## R3.1 — Landing leaderboard swap (commit `8b6da0f`)

- Anonymous landing reads `topCities(3)` from the V2 `xp:leaderboard:city-value` ZSET (BLOCKER-3 parallel key), shows a "Trzy największe miasta" card.
- Fallback: if the V2 board is empty during early rollout, the landing shows de-duplicated V1 `globalLeaderboard` entries (any usernames already on V2 are filtered out) so first-time visitors still see social proof.

## Test / build state at end of R3

- 37 test files, **306 tests** passing.
- Net-new tests in R3: 12 (breakdown semantics, HIGH-4 invariant across five scenarios, ladderSummary chain/cap behavior).
- Typecheck clean; prod build green (no hydration warnings from the added client modal / city card).

## Hand-off to R7

R7 (loans + bankruptcy restructuring per HIGH-8) reads R2.1's `isInWattRescueGrace(state, now)` contract before firing any seizure:
- **R7.3 restructuring must NOT trigger while `isInWattRescueGrace(state)` is true.** That function returns true for the first 72h of a deficit (BLOCKER-1 rescue window).
- HIGH-8 reframing: keep T1-T3 buildings (not just Domek), seize only T4+. One-time "mentor help" 0% emergency loan = 1 missed payment, available after 2nd miss, once per 30 days. Teacher-mode flag: classroom deployments disable bankruptcy altogether, replaced by red-alert banner.

## Known follow-ups from R3

- Dashboard V1 ring (`titleForLevel` + `tierForLevel`) still renders — deletion is gated on R9.3.1 feature flag + R9.3.4 sunset criteria (per VOCAB-AUDIT §2.1 contract).
- Post-game breakdown modal exists but is not yet triggered by individual game clients — wiring is per-game and can land as a small PR per game after MUST-SHIP. API already returns the payload.
- "Sala sławy" route still exists at `/sin-slavy`; the page stays online and redirects can happen in R9.3 alongside V1 sunset.

---

**Next**: R7.1 loan catalog + eligibility, R7.2 KNF disclaimers, R7.3 bankruptcy kid-friendly (HIGH-8 restructuring framing, T1-T3 keep, mentor-help loan, classroom flag, **must read isInWattRescueGrace before firing**). Then R9.1 migration (BLOCKER-2), R9.2 regression suite, R9.3.1 percentile feature flag (MEDIUM-18).
