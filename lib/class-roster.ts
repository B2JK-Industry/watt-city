/* V4.2 — class roster helpers. Reads every student's player state and
 * computes the weighted `cityLevel × cityValue` ranking used by the
 * class dashboard leaderboard + the PDF report.
 */

import type { SchoolClass } from "@/lib/class";
import { getPlayerState } from "@/lib/player";
import { cityLevelFromBuildings } from "@/lib/city-level";
import { computeBuildingValue } from "@/lib/city-value";

export type ClassRosterEntry = {
  username: string;
  cityLevel: number;
  cityValue: number;
  weightedScore: number;
  totalPlayed: number;
  lastActiveAt: number;
};

export async function classRoster(
  cls: SchoolClass,
): Promise<ClassRosterEntry[]> {
  const entries = await Promise.all(
    cls.studentUsernames.map(async (u): Promise<ClassRosterEntry> => {
      const state = await getPlayerState(u);
      const city = cityLevelFromBuildings(state.buildings);
      const cityValue = computeBuildingValue(state.buildings);
      const lastActiveAt = Math.max(
        state.lastTickAt ?? 0,
        ...state.buildings.map((b) => b.lastTickAt ?? 0),
      );
      // Weighted: level acts as multiplier, cityValue as base. A L5 city
      // worth 200 scores higher than a L3 city worth 500.
      const weightedScore = city.level * Math.max(1, cityValue);
      return {
        username: u,
        cityLevel: city.level,
        cityValue,
        weightedScore,
        totalPlayed: 0, // TODO: wire getUserStats for completeness (V5)
        lastActiveAt,
      };
    }),
  );
  return entries;
}
