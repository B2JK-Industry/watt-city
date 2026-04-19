# R1 — Resource & progression collapse (phase-boundary report)

**Branch**: `watt-city-refactor` off `watt-city` tip `9a513b0`
**Commits**: `37a49a2` (R1.1) · `b5c4848` (R1.2) · `dfd1878` (R1.3) · `9cf4b28` (R1.4)
**Status**: ✅ complete, all tests green, zero V1-surface regressions
**Review anchors resolved**: BLOCKER-3, HIGH-9

---

## What R1 did

One-paragraph: the game used to surface 7 resources (watts/coins/bricks/cashZl + glass/steel/code), 3 parallel progression numbers (XP-level, sqrt-tier, credit-score), and one "xp" leaderboard. V2 R1 collapses the surface to 4 resources + 2 progression numbers (city-level + credit), adds a parallel city-value leaderboard, and preserves every V1 byte so the R9.1 migration is the only thing that mutates stored data.

## R1.1 — Resource set 7 → 4 (commit `37a49a2`)

- `ResourceKey` union still contains all 7 keys (runtime compat with any V1 player state Upstash has already deserialised).
- New exports: `ACTIVE_RESOURCE_KEYS = ["watts","coins","bricks","cashZl"]`, `DEPRECATED_RESOURCE_KEYS = ["glass","steel","code"]`, `ResourceDef.deprecated?: boolean`.
- `RESOURCE_DEFS.glass/steel/code` are `{mvpActive:false, deprecated:true}` — they still resolve for balance display, but every yield table routes away from them.
- `AI_KIND_YIELDS` rewritten so no AI-game kind produces a deprecated key. `price-guess`/`order`/`chart-read`/`timeline-build`/`what-if` → `coins` primary + `bricks` secondary. `negotiate`/`tax-fill`/`dialog` → `coins`. `portfolio-pick` → `coins` + `cashZl`.
- `components/resource-bar.tsx` renders only the 4 active chips + a single dashed "📦 V1" legacy chip when `Σ(glass+steel+code) > 0`, with a 4-lang tooltip so players can see their V1 wealth hasn't vanished pre-migration.
- Test file `lib/resources-v2.test.ts` locks 5 invariants (partition covers every key, no overlap, deprecated flags match keys, no AI kind produces deprecated, every kind has a yield rule).
- Updated two existing tests whose expectations were V1-inverted: `economy.test.ts` "glass active" assertions flipped to assert `deprecated === true`, `player.test.ts` negotiate→code changed to negotiate→coins.

## R1.2 — Progression 3 → 2 numbers (commit `b5c4848`)

- New `lib/city-level.ts` with `cityLevelFromBuildings(buildings)` → `{level, progressToNext, totalPoints, currentUnlocks, nextUnlocks}`. Formula: `totalPoints = Σ building.level` (with `Number.isFinite` guard), `level = floor(sqrt(totalPoints/3))` clamped to `[1,10]`.
- `LEVEL_UNLOCKS[1..10]` maps every level to the PL building/feature names earned at that level — pedagogical moment for the R3.4 level-up toast.
- `crossedLevelUp(before, after)` helper for toast trigger; defensive against NaN/Infinity.
- `lib/city-level.test.ts` covers 13 cases incl. edge NaN/Infinity handling + explicit `LEVEL_UNLOCKS` completeness for every level 1..MAX.
- V1 `titleForLevel` / `tierForLevel` in `lib/level.ts` untouched — Phase 1-10 dashboard keeps rendering; R3.2 will switch the dashboard over.

## R1.3 — Parallel city-value leaderboard (commit `dfd1878`, **BLOCKER-3**)

- `lib/city-value.ts` writes to **new** ZSET `xp:leaderboard:city-value` (key constant exported). V1 `xp:leaderboard:global` is never touched here — read-only per BLOCKER-3.
- `computeBuildingValue(buildings) = Σ (baseCost.resource × level)` across the city, resources rate-1 (all four current resources equally hard to earn in V2).
- `seedCityValue(currentXP, buildingValue) = max(floor(XP×0.5), floor(buildingValue))` — BLOCKER-3's compromise so 10 000-XP grinders seed at 5 000 value (mid-pack) rather than rank zero.
- `refreshCityValue(username, buildings, {seedFromXp?})` wired into `lib/buildings.ts` at every mutation site: after `placeBuilding`, `upgradeBuilding`, `demolishBuilding`, `ensureSignupGift`. ZSET stays in sync with state without a separate cron.
- `setCityValue` implemented via `zIncrBy(delta = new - current)` because the Redis helper exposes only `zIncrBy`, not `ZADD` — same end state.
- Tests in `lib/city-value.test.ts` assert value math, seed math, ZSET round-trip, top-N ordering, refresh-with-and-without-seed, **and explicitly assert V1 `xp:leaderboard:global` stays empty** after a V2 write (BLOCKER-3 regression guard).

## R1.4 — XP-Arena vocabulary audit (commit `9cf4b28`, **HIGH-9**)

- `docs/VOCAB-AUDIT-v2.md` classifies every `xp`/`arena`/`tier`/`rank`/`level`/`title`/`hero` symbol as **keep** (20 V1 Redis keys, game-spec `xpPer*` fields, `awardXP` internal), **redirect** (UI symbols like `titleForLevel`, `TierUpToast` → `LevelUpToast` after R3.2 dashboard swap), or **rename** (mostly done Phase 1.8; one remaining in `ai-pipeline/generate.ts` system prompt).
- Doc serves as the gate for R9.3.4 V1 sunset: every "redirect" row must be migrated or explicitly re-classified as "keep with rationale" before that ADR fires.
- Explicit "what we do NOT do" section: don't rename V1 Redis keys (BLOCKER-3), don't rename `xpPer*` fields (blast radius too big), don't rename repo (literal URL).

## Test/build state at end of R1

- Unit/integration: **250 tests passing** (5 new resource invariants + 13 city-level + 15 city-value = 33 net-new; zero existing regressions after the two expectation flips noted in R1.1).
- `pnpm typecheck` clean.
- `pnpm build` green.
- No V1 Redis key touched by new code paths.

## Hand-off to R2

R2 reuses R1's ground truth:
- **Resources** (R2.1 watt upkeep): `ResourceKey` `"watts"` is canonical, upkeep math lives on `BuildingCatalogEntry.wattUpkeepPerHour`.
- **Level gate** (R2.1 bankruptcy restructuring): `cityLevelFromBuildings` + `LEVEL_UNLOCKS` determine which buildings survive restructuring (HIGH-8 keeps T1-T3).
- **Ranking** (R2.3 cashflow HUD): HUD is informational; the canonical rank ZSET is `CITY_VALUE_KEY` from R1.3.
- **Naming** (R2.2 + R2.3 UI strings): must respect R1.4 audit — new user-facing text uses "Watt City" vocabulary; new Redis keys follow the `xp:*` convention (BLOCKER-3 rationale).

## Known follow-ups from R1

- `lib/ai-pipeline/generate.ts` system prompt still says "You are the content designer for XP Arena" — tracked in VOCAB-AUDIT §3. Low priority, not a correctness issue.
- V1 `titleForLevel` / `tierForLevel` stay live until R3.2 switches the dashboard, then get DELETEd per VOCAB-AUDIT §2.1.
- `TierUpToast` component → `LevelUpToast` rename scheduled for R3.4.
- V1 `xp:leaderboard:global` continues receiving writes from legacy `awardXP()` calls on the Phase 1-10 game paths (by design — BLOCKER-3 read-only-during-rollout means V2 reads from city-value and V1 stays the source of truth for V1 players until R9.1 migration flips them).

---

**Next**: R2.1 — `BuildingCatalogEntry.wattUpkeepPerHour`, tick-time brownout (24h full / 24-48h 50% / >48h 25% per BLOCKER-1 — NOT 0%), amber banner UI, bankruptcy gate while deficit persists < 72h.
