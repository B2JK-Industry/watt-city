/* V2 refactor R1.2 — city level derived from buildings.
 *
 * V1 had three parallel progression numbers (XP-based level, tier via
 * sqrt(sum of building levels), credit score). V2 keeps only two:
 * city level (derived purely from buildings — see below) and credit
 * score (behaviour signal on PlayerState, unchanged).
 *
 * Level formula: sumPoints = Σ (building.level per building). Points
 * are divided by 3 (the "3 buildings on this level earn you a new
 * level" heuristic), square-rooted, floored — same curvature as V1
 * tier but anchored to something the player can see and act on
 * (building upgrades), not opaque XP. Capped at 10.
 *
 * No breaking change to stored data. V1 `titleForLevel` / `tierForLevel`
 * still export from `lib/level.ts` so Phase 1-10 UI keeps rendering;
 * V2 dashboard (R3.2) will switch to `cityLevelFromBuildings` under a
 * feature flag.
 */

import type { BuildingInstance } from "@/lib/player";

export const CITY_MAX_LEVEL = 10;

export type CityLevel = {
  level: number;
  /** 0..1 fraction toward next level (1.0 at max). */
  progressToNext: number;
  /** Human-facing list of what becomes available on the NEXT level. */
  nextUnlocks: string[];
  /** Unlocks already earned at the current level. */
  currentUnlocks: string[];
  /** Sum of every building.level across the city. */
  totalPoints: number;
};

// Per-level unlock list — pedagogical moment for tier-up toast (R3.4).
// Keyed by level reached; value = human-readable PL strings (other langs
// resolve in the UI layer via dict).
export const LEVEL_UNLOCKS: Record<number, string[]> = {
  1: ["Domek (start)"],
  2: ["Mała elektrownia", "Sklepik osiedlowy"],
  3: ["Huta szkła", "Biblioteka", "Bank lokalny"],
  4: ["Walcownia stali", "Centrum nauki", "Gimnazjum sportowe"],
  5: ["Fotowoltaika z magazynem", "Panele słoneczne (duże)"],
  6: ["Software house", "Farma wiatrowa"],
  7: ["Rafineria", "Wieżowiec", "Biurowiec"],
  8: ["Spodek (landmark)", "Ratusz"],
  9: ["Elektrownia gazowa", "Centrum eventowe"],
  10: ["Varso Residence", "Tauron Plant", "Katowice Industry Hub"],
};

export function cityLevelFromBuildings(
  buildings: Array<Pick<BuildingInstance, "level">>,
): CityLevel {
  const totalPoints = buildings.reduce((s, b) => {
    const v = Number.isFinite(b.level) ? Math.max(0, b.level) : 0;
    return s + v;
  }, 0);
  const raw = Math.floor(Math.sqrt(totalPoints / 3));
  const level = Math.max(1, Math.min(CITY_MAX_LEVEL, raw || 1));

  // Progress to next = where we are inside the current level's point span.
  // Points required to reach level L = 3·(L-1)² (inverse of floor(sqrt/3)).
  const pointsForCurrent = 3 * (level - 1) ** 2;
  const pointsForNext = 3 * level ** 2;
  const span = pointsForNext - pointsForCurrent || 1;
  const progressToNext =
    level >= CITY_MAX_LEVEL
      ? 1
      : Math.max(0, Math.min(1, (totalPoints - pointsForCurrent) / span));

  return {
    level,
    progressToNext,
    totalPoints,
    currentUnlocks: LEVEL_UNLOCKS[level] ?? [],
    nextUnlocks: level < CITY_MAX_LEVEL ? (LEVEL_UNLOCKS[level + 1] ?? []) : [],
  };
}

/** Has the city crossed a level threshold? `before` + `after` supplied
 *  by the caller; true when after > before and both are valid levels. */
export function crossedLevelUp(before: number, after: number): boolean {
  return Number.isFinite(before) && Number.isFinite(after) && after > before;
}
