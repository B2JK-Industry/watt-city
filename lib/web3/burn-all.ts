/* W6 — burn every minted medal for a user.
 *
 * Called from three places:
 *   1. Kid flips their own web3OptIn off on /profile.
 *   2. Linked parent flips their approval off on /rodzic/[kid].
 *   3. GDPR Art. 17 erasure via lib/soft-delete.ts hardErase().
 *
 * Design notes:
 *   - Idempotent. An already-burned entry (entry.burnedAt set) is
 *     skipped, so concurrent calls don't double-burn.
 *   - Individual failure doesn't block the rest. A failing burn
 *     appears in the return's `errors` list; the log entry stays
 *     unburnedFlag so a retry picks it up.
 *   - Rebuilds the log in-place because lib/redis.ts doesn't expose
 *     an lSet. The rebuild preserves chronological order.
 *   - Safe to call even when NEXT_PUBLIC_WEB3_ENABLED is off — the
 *     mint log will be empty and the function is a cheap no-op.
 */
import "server-only";

import { kvDel, lPush, lRange } from "@/lib/redis";
import {
  burnMedal,
  MINT_LOG_KEY,
  tokenIdFromString,
  type MintLogEntry,
} from "@/lib/web3/mint";

export type BurnAllResult = {
  attempted: number;
  burned: string[] /* tokenIds */;
  skipped: string[] /* already-burned tokenIds */;
  errors: Array<{ tokenId: string; reason: string }>;
};

export async function burnAllForUser(username: string): Promise<BurnAllResult> {
  const key = MINT_LOG_KEY(username);
  const log = await lRange<MintLogEntry>(key, 999);
  const result: BurnAllResult = {
    attempted: 0,
    burned: [],
    skipped: [],
    errors: [],
  };
  if (log.length === 0) return result;

  const next: MintLogEntry[] = [];
  for (const entry of log) {
    if (entry.burnedAt) {
      next.push(entry);
      result.skipped.push(entry.tokenId);
      continue;
    }
    result.attempted += 1;
    let outcome;
    try {
      outcome = await burnMedal(tokenIdFromString(entry.tokenId));
    } catch (err) {
      result.errors.push({
        tokenId: entry.tokenId,
        reason: err instanceof Error ? err.message : String(err),
      });
      next.push(entry);
      continue;
    }
    if (outcome.kind === "burned") {
      next.push({
        ...entry,
        burnedAt: Date.now(),
        burnTxHash: outcome.txHash,
      });
      result.burned.push(entry.tokenId);
    } else if (outcome.kind === "notMinted") {
      // Token was already gone on-chain (maybe burned via another
      // path). Treat as success — mark the log entry burned.
      next.push({ ...entry, burnedAt: Date.now() });
      result.burned.push(entry.tokenId);
    } else if (outcome.kind === "relayerEmpty") {
      result.errors.push({
        tokenId: entry.tokenId,
        reason: `relayer-empty:${outcome.balanceWei.toString()}`,
      });
      next.push(entry);
    } else {
      result.errors.push({
        tokenId: entry.tokenId,
        reason: outcome.message,
      });
      next.push(entry);
    }
  }

  // Rebuild the list. lPush prepends, so push in reverse to preserve
  // newest-first order (matches how the mint route writes).
  await kvDel(key);
  for (let i = next.length - 1; i >= 0; i--) {
    await lPush(key, next[i]);
  }
  return result;
}
