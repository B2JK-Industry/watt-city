# R9 — Migration / rollout (phase-boundary report)

**Commits**: `71ad1d6` (R9.3.1) · `4d9eda6` (R9.1) · `5ae60c1` (R9.2)
**Status**: ✅ MUST-SHIP complete, 368 tests passing, prod build green
**Review anchors resolved**: BLOCKER-2, MEDIUM-18

---

## R9.3.1 — Percentile feature flags (commit `71ad1d6`, **MEDIUM-18**)

Replaces the rejected per-user-key design (100k users × N flags = Upstash death). V2 stores one global config per flag at `xp:feature-flags`:

```ts
{ [flagName]: { mode: "off"|"on"|"percentage",
                value: 0..100,
                allowlist: string[],
                denylist: string[] } }
```

Resolution order: denylist wins, allowlist wins, `sha1(userId) % 100 < value`, else off. `userPercentile` is deterministic + stable; new users auto-resolve with no write at signup.

- `getFlags()` with 30s in-memory cache; `setFlags()` invalidates.
- `isFlagEnabled(flag, userId)` is the hot-path wrapper.
- `DEFAULT_FLAGS` ships: `v2_city_level_card` (on), `v2_cashflow_hud` (on), `v2_post_game_modal` (off), `v2_restructuring` (percentage 0), `v2_migration_eligible` (off).
- 16 tests — bucketing uniformity (1000-sample sweep), allowlist/denylist precedence, percentage edges + clamp, persistence, cache invalidation.

## R9.1 — Value-based migration (commit `4d9eda6`, **BLOCKER-2**)

- **Not 1:1.** `rawCoinDelta(resources, rates) = Σ (deprecatedBalance × rate)` — default `0.5×` per deprecated key.
- **±2× cap on priorCoins**; zero-coin users get a 100-coin absolute floor.
- **Snapshot to `xp:migration:v2:snapshot:<u>`** with 30-day TTL before the mutation — enables reversal.
- Ledger entry via `backfill` kind with full metadata (rawDelta, appliedDelta, capped, ratesUsed) so every coin is auditable.
- Post-migration `refreshCityValue` so ranking reflects new state without a separate pass.
- **Sentinel at `xp:migration:v2:done:<u>`** blocks re-run; `migrateUser` is idempotent.
- `revertMigration(username)` reads snapshot, restores resources + wattDeficitSince, clears sentinel, returns a typed failure when not-migrated or snapshot-expired.
- `migrateBatch(usernames[])` for admin UI.
- **Admin endpoint**: `POST /api/admin/migrate-v2` with Bearer `$ADMIN_SECRET`. Ops: `migrate` (single or batch≤500), `revert`, `status`. Returns the full `MigrationReport` so the operator dashboard can audit.
- `getConversionRates` / `setConversionRates` admin hooks for ledger-derived rate tuning (offline computation out of hot path).
- 19 tests — per-key math, cap + floor, snapshot + sentinel + idempotency, revert round-trip, rates persistence.

## R9.2 — Regression suite (commit `5ae60c1`)

Single-file `lib/v2-invariants.test.ts` tagging every review anchor:

| Anchor | Assertion |
|---|---|
| BLOCKER-1 | `brownoutFactor` never returns 0; `isInWattRescueGrace` boundary at exactly 72h; full build-Huta→deficit→build-Elektrownia rescue round-trip |
| BLOCKER-2 | `rawCoinDelta` explicitly non-1:1; `±2×` cap; migrate→revert restores pre-state EXACTLY |
| BLOCKER-3 | `refreshCityValue` writes to `xp:leaderboard:city-value`, V1 `xp:leaderboard:global` remains untouched |
| HIGH-4 | `scoreMultiplier == breakdown.finalMultiplier` across 5 scenarios; cap exactly `×3` |
| R1.1 | `AI_KIND_YIELDS` + `EVERGREEN_YIELDS` never reference glass/steel/code |
| R2.3 | HUD alert ladder matches deficit state; end-to-end tick yields > 0 coins per BLOCKER-1 |
| MEDIUM-18 | Feature-flag resolver purity (stable output for same inputs) |

Full suite at end of R9: **368 passing**.

## Deferred from R9 (per session prompt)

- **R9.3.4 V1 sunset** — explicitly DEFER. Criteria-based sunset requires (a) 8 weeks elapsed, (b) zero V1 users 14 consecutive days, (c) V2 error rate <0.1% 14 days, (d) one full monthly duel reset observed, (e) PKO partnership checkpoint. None feasible in one session.
- **R9.4 GDPR-K legal review** — explicitly DEFER. Requires human legal sign-off + consent flow UX + ToS/Privacy edits. See `docs/progress/FOLLOW-UP-NEEDED.md`.
- **Analytics schema doc (R9.2.4)** + **side-by-side V1/V2 dashboard (R9.3.5)** — MEDIUM-15. Tracked in follow-ups; DEFAULT_FLAGS is the measurement hook once metrics land.

## Hand-off (post-R9)

The MUST-SHIP scope is complete. What remains are:
- DEFERRED items listed in `docs/progress/FOLLOW-UP-NEEDED.md`.
- Per-game client wiring for the `PostGameBreakdown` modal (each game client reads `multBreakdown` from `/api/score` response and renders it — mechanical PR per game).
- Dict-key completion for post-game factor labels (`dashboard.multFactors.*`) — falls back gracefully today.
