/* Per-player single-flight lock — wraps every mutating endpoint that
 * read-modifies-writes the PlayerState JSON blob (xp:player:<u>).
 *
 * Why this exists: `getPlayerState(u) → mutate → savePlayerState(u)` is
 * not atomic. Two concurrent requests (two tabs, a double-click, a race
 * between /api/buildings/place and /api/loans/pay) both read the same
 * state, each applies its own mutation, the second `savePlayerState`
 * overwrites the first. Losses seen in practice:
 *   - building placed + resources debited, then replaced by a sibling
 *     mutation → player loses resources for no gain.
 *   - marketplace buyListing double-fires → buyer charged twice, one
 *     building created, seller credited once.
 *   - onboarding flag flipped back to default by a concurrent PATCH.
 *
 * `withAwardLock` in lib/leaderboard.ts solved the same class of bug
 * for the XP zset; this file generalises it to any state mutation.
 *
 * Usage:
 *   return withPlayerLock(username, async () => {
 *     const state = await getPlayerState(username);
 *     …mutate…
 *     await savePlayerState(state);
 *     return Response.json(...);
 *   });
 *
 * Contract:
 *  - Callers MUST do ALL reads + writes inside the body. Leaking the
 *    state object out of the lock and writing it later defeats the
 *    purpose.
 *  - The lock is per-username, not per-endpoint; two mutators for the
 *    same user serialise with each other regardless of route.
 *  - TTL 5 s: a crashed holder doesn't block forever. A body that
 *    genuinely takes >5 s is a separate bug — split it or raise the
 *    TTL explicitly.
 *  - 5× exp-backoff (~350 ms worst case) then best-effort execute —
 *    consistent with withAwardLock.
 */
import { kvSetNX, kvDel } from "@/lib/redis";

function playerLockKey(username: string): string {
  return `xp:player-lock:${username}`;
}

export async function withPlayerLock<T>(
  username: string,
  body: () => Promise<T>,
): Promise<T> {
  const key = playerLockKey(username);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (await kvSetNX(key, token, { ex: 5 })) {
      try {
        return await body();
      } finally {
        await kvDel(key);
      }
    }
    const backoff = Math.min(400, 30 * 2 ** attempt) + Math.random() * 20;
    await new Promise((r) => setTimeout(r, backoff));
  }
  // Stale lock fallback: better over-count once than hang the user.
  return body();
}

/** Marketplace listing lock — independent from player lock because a
 *  listing is a cross-player resource. Buyer + seller + cancel all
 *  contend on the same key. TTL 10 s because a buy path touches TWO
 *  player states (buyer + seller) plus the listing store. */
function listingLockKey(listingId: string): string {
  return `xp:market:listing-lock:${listingId}`;
}

export async function withListingLock<T>(
  listingId: string,
  body: () => Promise<T>,
): Promise<T> {
  const key = listingLockKey(listingId);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (await kvSetNX(key, token, { ex: 10 })) {
      try {
        return await body();
      } finally {
        await kvDel(key);
      }
    }
    const backoff = Math.min(400, 30 * 2 ** attempt) + Math.random() * 20;
    await new Promise((r) => setTimeout(r, backoff));
  }
  return body();
}

/** Ordered-pair lock for two-party operations (friend request/accept,
 *  future direct trades). Both `sendFriendRequest(A, B)` and its
 *  mirror `sendFriendRequest(B, A)` race for the same key, so two
 *  users clicking "add friend" at the exact same moment can't both
 *  land in each other's inbox instead of auto-accepting. Lexicographic
 *  sort makes the lock key symmetric regardless of caller order. */
export async function withPairLock<T>(
  a: string,
  b: string,
  body: () => Promise<T>,
): Promise<T> {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const key = `xp:pair-lock:${lo}:${hi}`;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (await kvSetNX(key, token, { ex: 5 })) {
      try {
        return await body();
      } finally {
        await kvDel(key);
      }
    }
    const backoff = Math.min(400, 30 * 2 ** attempt) + Math.random() * 20;
    await new Promise((r) => setTimeout(r, backoff));
  }
  return body();
}
