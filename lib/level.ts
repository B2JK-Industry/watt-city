/* V3.1 — XP-level math only.
 *
 * The V1/V2 `CITY_TIERS` narrative gallery (wooden shed → Varso Tower,
 * 9 hardcoded tier stories) was removed — it collided with the V2
 * city-builder (20 slots, 15 buildings) by creating a second progression
 * story. Progression is now read from `lib/city-level.ts` which derives
 * level purely from the player's actual buildings.
 *
 * What stays here: the XP ↔ level math (`levelFromXP`) used by the
 * leaderboard + the secondary XP ring on the dashboard hero, and the
 * `formatWatts` display helper used by the leaderboard rows.
 */

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  progress: number; // 0..1
};

// Level L starts at K * (L-1)^2 watts. K = 120 pre rozumný grind.
const K = 120;

export function levelFromXP(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safe / K)) + 1;
  const levelStart = K * (level - 1) ** 2;
  const levelEnd = K * level ** 2;
  const span = levelEnd - levelStart;
  const xpIntoLevel = safe - levelStart;
  const xpToNext = Math.max(0, levelEnd - safe);
  const progress = span > 0 ? Math.min(1, xpIntoLevel / span) : 0;
  return { level, xpIntoLevel, xpForLevel: span, xpToNext, progress };
}

export function formatWatts(n: number): string {
  return `${Math.round(n).toLocaleString("pl-PL")} W`;
}
