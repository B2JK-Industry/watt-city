import { zIncrBy, zRank, zRem, zScore, zTopN, LeaderboardEntry } from "@/lib/redis";

const GLOBAL_KEY = "xp:leaderboard:global";

function gameKey(gameId: string): string {
  return `xp:leaderboard:game:${gameId}`;
}

export type AwardResult = {
  globalXP: number;
  gameXP: number;
  globalRank: number | null;
  isNewBest: boolean;
  delta: number;
  previousBest: number;
};

// Best-score semantics: a player's entry in the per-game leaderboard is
// their best single-run score. Global is the SUM of all per-game bests,
// plus duel bonuses credited through `creditBonus`. Playing the same
// game repeatedly only moves numbers when you actually beat your own
// best — no grinding low scores.
export async function awardXP(
  username: string,
  gameId: string,
  xp: number,
): Promise<AwardResult> {
  const safeXp = Math.max(0, Math.floor(xp));
  const prevGame = await zScore(gameKey(gameId), username);
  const delta = Math.max(0, safeXp - prevGame);

  if (delta > 0) {
    await Promise.all([
      zIncrBy(gameKey(gameId), delta, username),
      zIncrBy(GLOBAL_KEY, delta, username),
    ]);
  }

  const [globalXP, gameXP, globalRank] = await Promise.all([
    zScore(GLOBAL_KEY, username),
    zScore(gameKey(gameId), username),
    zRank(GLOBAL_KEY, username),
  ]);

  return {
    globalXP,
    gameXP,
    globalRank,
    isNewBest: delta > 0,
    delta,
    previousBest: prevGame,
  };
}

// Credit a bonus directly to the global leaderboard only (duel wins,
// achievements, special events). Does NOT touch any per-game best.
export async function creditBonus(
  username: string,
  amount: number,
): Promise<number> {
  const safe = Math.max(0, Math.floor(amount));
  if (safe === 0) return await zScore(GLOBAL_KEY, username);
  return await zIncrBy(GLOBAL_KEY, safe, username);
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

// Used by account-delete flow: strip the user from every leaderboard.
export async function removeUserFromAllBoards(
  username: string,
  gameIds: string[],
): Promise<void> {
  await Promise.all([
    zRem(GLOBAL_KEY, username),
    ...gameIds.map((gid) => zRem(gameKey(gid), username)),
  ]);
}
