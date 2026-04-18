import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { buyListing } from "@/lib/marketplace";
import { rateLimit } from "@/lib/rate-limit";

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
  const state = await getPlayerState(session.username);
  const result = await buyListing(state, id);
  if (!result.ok) return Response.json(result, { status: 400 });
  return Response.json(result);
}
