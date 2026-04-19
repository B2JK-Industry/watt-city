/* Soft-delete — Phase 6.2.4.
 *
 * Flagging a user for deletion writes `xp:user:<u>:deleted-at` = ts. A
 * daily cron (future) finalises deletion after 30 days. Within the grace
 * window, a login resurrects the account by clearing the flag.
 *
 * Hard-delete itself still lives in app/api/me/route.ts DELETE (called
 * by the cron); the immediate user-facing flow becomes "mark for
 * deletion" and the session is destroyed so the user doesn't see their
 * city anymore.
 */

import { kvGet, kvSet, kvDel } from "@/lib/redis";
import { GAMES } from "@/lib/games";
import { removeUserFromAllBoards } from "@/lib/leaderboard";

const DELETED_AT = (u: string) => `xp:user:${u}:deleted-at`;

export const SOFT_DELETE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export async function flagForDeletion(username: string): Promise<void> {
  await kvSet(DELETED_AT(username), Date.now());
}

export async function clearDeletionFlag(username: string): Promise<void> {
  await kvDel(DELETED_AT(username));
}

export async function deletionStatus(username: string): Promise<
  | { flagged: false }
  | { flagged: true; flaggedAt: number; remainingMs: number; expiresAt: number }
> {
  const at = await kvGet<number>(DELETED_AT(username));
  if (!at) return { flagged: false };
  const expiresAt = at + SOFT_DELETE_GRACE_MS;
  return {
    flagged: true,
    flaggedAt: at,
    expiresAt,
    remainingMs: Math.max(0, expiresAt - Date.now()),
  };
}

/** Full erase — runs on cron at end-of-grace OR immediately if the user
 *  asks for "delete now, no grace". Returns the list of keys wiped. */
export async function hardErase(username: string): Promise<string[]> {
  // Phase 8 W6 — GDPR Art. 17 on-chain mirror. Burn every minted medal
  // before we wipe the mint log so a retry after a partial failure can
  // still reach the on-chain entries. Best-effort: errors here don't
  // block key cleanup; the burn log captures the failure for audit.
  try {
    const { burnAllForUser } = await import("@/lib/web3/burn-all");
    await burnAllForUser(username);
  } catch {
    // NEXT_PUBLIC_WEB3_ENABLED may be off or the relayer config empty;
    // either way, there's nothing to burn on-chain and we continue.
  }

  const keys = [
    `xp:user:${username}`,
    `xp:user:${username}:role`,
    `xp:user:${username}:suspended`,
    `xp:user:${username}:friends`,
    `xp:user:${username}:friends:list`,
    `xp:user:${username}:friend-requests`,
    `xp:user:${username}:friend-requests:list`,
    `xp:user:${username}:friend-inbox`,
    `xp:user:${username}:friend-inbox:list`,
    `xp:user:${username}:friend-privacy`,
    `xp:stats:${username}`,
    `xp:player:${username}`,
    `xp:player:${username}:ledger`,
    `xp:player:${username}:ledger-dedup`,
    `xp:player:${username}:achievements`,
    `xp:player:${username}:achievements-list`,
    `xp:notifications:${username}`,
    `xp:notifications:${username}:seen-at`,
    `xp:notifications:${username}:prefs`,
    `xp:parent:${username}:children`,
    `xp:child:${username}:parents`,
    `xp:child:${username}:parent-privacy`,
    `xp:pko-mock:${username}`,
    `xp:pko-audit:${username}`,
    `xp:marketplace:history:${username}`,
    // Phase 8 W6 — web3 state
    `xp:web3:mint-log:${username}`,
    `xp:web3:consent-revoked:${username}`,
    `xp:consent-granted:${username}`,
    `xp:parental-consent:${username}`,
    DELETED_AT(username),
  ];
  await Promise.all(keys.map((k) => kvDel(k)));
  await removeUserFromAllBoards(
    username,
    GAMES.map((g) => g.id),
  );
  return keys;
}
