/* Class-scoped leaderboard view. Not a new ZSET — we derive by filtering
 * the global XP ZSET to class members. Cheap enough for class sizes ≤ 30.
 */

import { zScore, zRank } from "@/lib/redis";
import type { ClassDef } from "./roles";

export type ClassRow = {
  username: string;
  xp: number;
  globalRank: number | null;
};

export async function classLeaderboard(cls: ClassDef): Promise<ClassRow[]> {
  const rows = await Promise.all(
    cls.members.map(async (u) => ({
      username: u,
      xp: await zScore("xp:leaderboard:global", u),
      globalRank: await zRank("xp:leaderboard:global", u),
    })),
  );
  return rows.sort((a, b) => b.xp - a.xp);
}
