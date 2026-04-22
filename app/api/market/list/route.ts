import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { createListing } from "@/lib/marketplace";
import { rateLimit } from "@/lib/rate-limit";
import { withPlayerLock } from "@/lib/player-lock";

const BodySchema = z.object({
  instanceId: z.string().min(1).max(64),
  askPrice: z.number().int().min(1).max(1_000_000),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const rl = await rateLimit(`market:${session.username}`, 5, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  return withPlayerLock(session.username, async () => {
    const state = await getPlayerState(session.username);
    const result = await createListing(state, body);
    if (!result.ok)
      return Response.json(result, { status: 400 });
    return Response.json(result);
  });
}
