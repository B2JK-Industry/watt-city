import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { zTopN } from "@/lib/redis";

/* Phase 9.3 multi-market migration (DRY-RUN ONLY).
 *
 * Hard constraint #3: the existing Upstash data shape (Phase 1-5) MUST
 * NOT be renamed. This endpoint therefore REPORTS what a rename would
 * touch but never actually writes. The agent charter treats active
 * renames of existing keys as out-of-scope; the operator performs the
 * rename (if ever) via a one-off ops script with a dry-run diff in
 * hand.
 *
 * A real migration is unnecessary as long as the PL market keeps its
 * bare-key convention (see `lib/market.ts#marketKey` — PL returns
 * `key`, not `market:pl:key`). Only CZ/UA will ever live under the
 * prefixed path.
 */
export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;

  const usernames = (await zTopN("xp:leaderboard:global", 500)).map(
    (r) => r.username,
  );

  const wouldRename = usernames.flatMap((u) => [
    { from: `xp:user:${u}`, to: `market:pl:xp:user:${u}` },
    { from: `xp:player:${u}`, to: `market:pl:xp:player:${u}` },
    { from: `xp:player:${u}:ledger`, to: `market:pl:xp:player:${u}:ledger` },
    { from: `xp:player:${u}:ledger-dedup`, to: `market:pl:xp:player:${u}:ledger-dedup` },
  ]);

  return Response.json({
    ok: true,
    dryRun: true,
    note: "Never destructive; this endpoint lists what a hypothetical prefix migration WOULD rename. Per agent-charter hard constraint #3, PL keys stay bare. CZ/UA markets use market:cz:... / market:ua:... from day one (no migration needed).",
    sampleUsers: usernames.length,
    wouldRenameSample: wouldRename.slice(0, 20),
  });
}
