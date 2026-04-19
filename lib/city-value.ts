/* V2 refactor R1.3 — city-value leaderboard (BLOCKER-3 compliant).
 *
 * Parallel ZSET — the V1 `xp:leaderboard:global` stays read-only while
 * V2 ranks live under `xp:leaderboard:city-value`. Dual-read via feature
 * flag (R9.3.1) during rollout; no destructive rename.
 *
 * City value = sum over buildings of `baseCost.coins × level` (coins is
 * the canonical value currency; other resources are converted at 1×
 * for value-math purposes). Landmarks and higher-tier buildings
 * naturally dominate the ZSET because their baseCost scales with tier.
 *
 * Seeding (per review BLOCKER-3): for existing V1 users the migration
 * writes `max(currentXP × 0.5, computedBuildingValue)` so 100h XP
 * grinders don't drop to rank zero day one. The 0.5 factor is a
 * conservative estimate — an active V1 player with 10 000 XP seeds at
 * 5 000 value, putting them mid-pack rather than last.
 */

import { zIncrBy, zRank, zScore, zTopN } from "@/lib/redis";
import type { BuildingInstance } from "@/lib/player";
import { getCatalogEntry } from "@/lib/building-catalog";
import type { ResourceKey } from "@/lib/resources";

export const CITY_VALUE_KEY = "xp:leaderboard:city-value";

// Rough "coin-equivalent" rates — non-coin resources are harder to earn,
// so they carry a 1× value for simplicity (the V2 player-facing surface
// already collapses to 4 resources). Deprecated keys are 1× too so
// pre-migration wealth still counts.
const VALUE_RATE: Record<ResourceKey, number> = {
  coins: 1,
  watts: 1,
  bricks: 1,
  cashZl: 1,
  glass: 1,
  steel: 1,
  code: 1,
};

export function computeBuildingValue(
  buildings: Array<BuildingInstance>,
): number {
  let total = 0;
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry) continue;
    const costSum = Object.entries(entry.baseCost).reduce((s, [k, v]) => {
      const rate = VALUE_RATE[k as ResourceKey] ?? 1;
      return s + rate * (v ?? 0);
    }, 0);
    total += costSum * Math.max(1, b.level);
  }
  return Math.floor(total);
}

export function seedCityValue(currentXP: number, buildingValue: number): number {
  return Math.max(Math.floor(currentXP * 0.5), Math.floor(buildingValue));
}

// ---------------------------------------------------------------------------
// ZSET ops
// ---------------------------------------------------------------------------

/** Overwrite the city-value score for a user. Implemented as (current
 *  score lookup + delta via ZINCRBY) because our redis helper exposes
 *  only zIncrBy, not ZADD. Returns the new score. */
export async function setCityValue(
  username: string,
  value: number,
): Promise<number> {
  const current = await zScore(CITY_VALUE_KEY, username);
  const delta = value - current;
  if (delta === 0) return current;
  return await zIncrBy(CITY_VALUE_KEY, delta, username);
}

export async function getCityValue(username: string): Promise<number> {
  return await zScore(CITY_VALUE_KEY, username);
}

export async function cityValueRank(
  username: string,
): Promise<number | null> {
  return await zRank(CITY_VALUE_KEY, username);
}

export async function topCities(n = 20) {
  return await zTopN(CITY_VALUE_KEY, n);
}

/** Refresh a user's city-value from their current building set. Safe to
 *  call on every build/upgrade/demolish — cheap (one zScore + one
 *  zIncrBy). Also suitable for the R9.1 migration which seeds from
 *  max(XP×0.5, buildingValue). */
export async function refreshCityValue(
  username: string,
  buildings: BuildingInstance[],
  opts: { seedFromXp?: number } = {},
): Promise<number> {
  const computed = computeBuildingValue(buildings);
  const value =
    opts.seedFromXp !== undefined
      ? seedCityValue(opts.seedFromXp, computed)
      : computed;
  return await setCityValue(username, value);
}
