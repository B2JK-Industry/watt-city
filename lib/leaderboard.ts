import { zIncrBy, zRank, zScore, zTopN, LeaderboardEntry } from "@/lib/redis";

const GLOBAL_KEY = "xp:leaderboard:global";

function gameKey(gameId: string): string {
  return `xp:leaderboard:game:${gameId}`;
}

export async function awardXP(
  username: string,
  gameId: string,
  xp: number,
): Promise<{ globalXP: number; gameXP: number; globalRank: number | null }> {
  const safeXp = Math.max(0, Math.floor(xp));
  if (safeXp === 0) {
    const [globalXP, gameXP, globalRank] = await Promise.all([
      zScore(GLOBAL_KEY, username),
      zScore(gameKey(gameId), username),
      zRank(GLOBAL_KEY, username),
    ]);
    return { globalXP, gameXP, globalRank };
  }
  const [globalXP, gameXP] = await Promise.all([
    zIncrBy(GLOBAL_KEY, safeXp, username),
    zIncrBy(gameKey(gameId), safeXp, username),
  ]);
  const globalRank = await zRank(GLOBAL_KEY, username);
  return { globalXP, gameXP, globalRank };
}

export async function globalLeaderboard(
  n = 20,
): Promise<LeaderboardEntry[]> {
  return await zTopN(GLOBAL_KEY, n);
}

export async function gameLeaderboard(
  gameId: string,
  n = 20,
): Promise<LeaderboardEntry[]> {
  return await zTopN(gameKey(gameId), n);
}

export async function userStats(username: string): Promise<{
  globalXP: number;
  globalRank: number | null;
}> {
  const [globalXP, globalRank] = await Promise.all([
    zScore(GLOBAL_KEY, username),
    zRank(GLOBAL_KEY, username),
  ]);
  return { globalXP, globalRank };
}
