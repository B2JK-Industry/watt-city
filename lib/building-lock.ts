/* V3.4 — building-mutation lock during /api/score.
 *
 * Fix for F10: score multBreakdown was computed from the player's
 * `state.buildings` at read time; if the player demolished a multiplier
 * building on another tab between `getPlayerState` and the subsequent
 * `creditResources`, the credited amount used stale buildings while
 * the UI breakdown used the new set → displayed ≠ credited.
 *
 * Fix: a tiny single-flight lock around any mutation of state.buildings
 * while /api/score is in flight. The lock expires fast (2s) so the
 * client can always retry; callers that collide return 409 and the
 * fetch wrapper retries once after 500ms.
 */

import { kvSetNX, kvGet, kvDel } from "@/lib/redis";

const LOCK_KEY = (u: string) => `xp:building-lock:${u}`;
const LOCK_TTL_SECONDS = 2;

/** Try to acquire the lock. Returns the token on success (caller must
 *  pass it to release), null if held by someone else. */
export async function acquireBuildingLock(
  username: string,
): Promise<string | null> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ok = await kvSetNX(LOCK_KEY(username), token, { ex: LOCK_TTL_SECONDS });
  return ok ? token : null;
}

/** Release the lock if-and-only-if the stored token matches — avoids
 *  releasing a lock that already expired and was re-acquired by
 *  someone else. */
export async function releaseBuildingLock(
  username: string,
  token: string,
): Promise<void> {
  const current = await kvGet<string>(LOCK_KEY(username));
  if (current === token) {
    await kvDel(LOCK_KEY(username));
  }
}

/** True if the lock is currently held (used by building mutation routes
 *  to early-return 409 without attempting the mutation). */
export async function isBuildingLocked(username: string): Promise<boolean> {
  const current = await kvGet<string>(LOCK_KEY(username));
  return !!current;
}
