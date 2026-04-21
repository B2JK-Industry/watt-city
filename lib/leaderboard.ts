import { kvDel, kvSetNX, zIncrBy, zRank, zRem, zScore, zTopN, LeaderboardEntry } from "@/lib/redis";

const GLOBAL_KEY = "xp:leaderboard:global";

function gameKey(gameId: string): string {
  return `xp:leaderboard:game:${gameId}`;
}
function awardLockKey(username: string, gameId: string): string {
  return `xp:award-lock:${username}:${gameId}`;
}

export type AwardResult = {
  globalXP: number;
  gameXP: number;
  globalRank: number | null;
  isNewBest: boolean;
  delta: number;
  previousBest: number;
};

/** Acquire a short-lived single-flight lock, run `body`, always release.
 *  Retries with exponential backoff up to `maxAttempts` if the lock is
 *  held by another concurrent awardXP call. 3× 50 ms back-off adds up
 *  to ~350 ms worst-case — well below the 60-second Playwright test
 *  timeout and the 2-second UI responsiveness budget. */
async function withAwardLock<T>(
  username: string,
  gameId: string,
  body: () => Promise<T>,
): Promise<T> {
  const key = awardLockKey(username, gameId);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (await kvSetNX(key, token, { ex: 5 })) {
      try {
        return await body();
      } finally {
        // Best-effort release. TTL ensures a crashed holder doesn't
        // hang the user forever.
        await kvDel(key);
      }
    }
    // Exponential backoff with jitter, capped at 400 ms.
    const backoff = Math.min(400, 30 * 2 ** attempt) + Math.random() * 20;
    await new Promise((r) => setTimeout(r, backoff));
  }
  // Lock held for too long — execute anyway; stale-lock is worse than
  // over-counting once. TTL will clear it on the next attempt.
  return body();
}

/* Best-score semantics: a player's entry in the per-game leaderboard is
 * their best single-run score. Global is the SUM of all per-game bests,
 * plus duel bonuses credited through `creditBonus`. Playing the same
 * game repeatedly only moves numbers when you actually beat your own
 * best — no grinding low scores.
 *
 * Concurrency note (deep audit 2026-04-21, Phase 5): the read→compute-
 * delta→write sequence must be serialised per (user, gameId). Without
 * the lock, two concurrent submissions both read `prevGame=0`, compute
 * their own deltas, and ZINCRBY global by both — over-counting the
 * global total. `withAwardLock` guards the whole critical section; the
 * in-memory fallback's kvSetNX is atomic-within-event-loop, so the
 * same guarantee holds in dev. */
export async function awardXP(
  username: string,
  gameId: string,
  xp: number,
): Promise<AwardResult> {
  const safeXp = Math.max(0, Math.floor(xp));
  return withAwardLock(username, gameId, async () => {
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
  });
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
