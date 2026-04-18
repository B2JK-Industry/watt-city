import { kvGet, kvSet } from "@/lib/redis";

export type UserGameStats = {
  plays: number;
  bestScore: number;
  totalScore: number;
  lastPlayedAt: number;
};

export type UserStats = {
  username: string;
  games: Record<string, UserGameStats>;
  totalPlays: number;
};

const STATS_PREFIX = "xp:stats:";

export async function getUserStats(username: string): Promise<UserStats> {
  const existing = await kvGet<UserStats>(`${STATS_PREFIX}${username}`);
  if (existing) return existing;
  return { username, games: {}, totalPlays: 0 };
}

export type RecordRoundResult = {
  stats: UserStats;
  gameStats: UserGameStats;
  isNewBest: boolean;
  previousBest: number;
};

export async function recordRound(
  username: string,
  gameId: string,
  score: number,
): Promise<RecordRoundResult> {
  const stats = await getUserStats(username);
  const prev = stats.games[gameId];
  const previousBest = prev?.bestScore ?? 0;
  const isNewBest = prev ? score > previousBest : score > 0;
  const next: UserGameStats = {
    plays: (prev?.plays ?? 0) + 1,
    bestScore: Math.max(previousBest, score),
    totalScore: (prev?.totalScore ?? 0) + score,
    lastPlayedAt: Date.now(),
  };
  stats.games[gameId] = next;
  stats.totalPlays += 1;
  await kvSet(`${STATS_PREFIX}${username}`, stats);
  return { stats, gameStats: next, isNewBest, previousBest };
}
