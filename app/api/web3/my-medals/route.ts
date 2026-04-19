/* GET /api/web3/my-medals — W4 companion read route.
 *
 * Returns the current user's minted medals. Two data sources stitched:
 *   1. Server-side mint log in Redis (xp:web3:mint-log:<user>) — the
 *      authoritative ledger of "we tried to mint this for you".
 *   2. On-chain ownerOf() per logged tokenId — lets the client surface
 *      burn events (owner becomes 0x0) without polling the explorer.
 *
 * No mutation. Session-gated but doesn't need CSRF (GET).
 */

import { getSession } from "@/lib/session";
import { checkWeb3Gate } from "@/lib/web3/consent";
import { lRange } from "@/lib/redis";
import {
  readOwnership,
  MINT_LOG_KEY,
  tokenIdFromString,
  explorerUrlForTx,
  type MintLogEntry,
} from "@/lib/web3/mint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const gate = await checkWeb3Gate(session.username);
  if (!gate.allowed) {
    const status = gate.reason === "web3-disabled" ? 404 : 403;
    return Response.json(
      { ok: false, error: gate.reason, medals: [] },
      { status },
    );
  }

  const log = await lRange<MintLogEntry>(MINT_LOG_KEY(session.username), 100);
  // Each tokenId is checked on-chain so a burned medal shows up as
  // `alive: false` in the gallery without needing a separate subgraph.
  const medals = await Promise.all(
    log.map(async (entry) => {
      const status = await readOwnership(tokenIdFromString(entry.tokenId));
      return {
        ...entry,
        explorerUrl: explorerUrlForTx(entry.txHash),
        alive: status.kind === "minted",
        currentOwner: status.kind === "minted" ? status.owner : null,
        tokenURI: status.kind === "minted" ? status.tokenURI : null,
      };
    }),
  );

  return Response.json({ ok: true, medals });
}
