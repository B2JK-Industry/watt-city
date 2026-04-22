import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { buyListing, listingById } from "@/lib/marketplace";
import { rateLimit } from "@/lib/rate-limit";
import { withPlayerLock, withListingLock } from "@/lib/player-lock";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const rl = await rateLimit(`market:${session.username}`, 5, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  return withListingLock(id, async () => {
    // Double-checked locking — re-verify listing is still active after
    // acquiring the listing lock (a concurrent buy/cancel may have just
    // completed while we were queued).
    const fresh = await listingById(id);
    if (!fresh) return Response.json({ ok: false, error: "unknown-listing" }, { status: 400 });
    if (fresh.status !== "active")
      return Response.json({ ok: false, error: "not-active" }, { status: 400 });
    return withPlayerLock(session.username, async () => {
      const state = await getPlayerState(session.username);
      const result = await buyListing(state, id);
      if (!result.ok) return Response.json(result, { status: 400 });
      return Response.json(result);
    });
  });
}
