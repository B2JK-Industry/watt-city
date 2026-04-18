import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { cheer, isEffectivelyBanned } from "@/lib/community";
import { rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  target: z.string().min(1).max(64),
  emoji: z.string().max(8).optional(),
  gameId: z.string().max(64).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (await isEffectivelyBanned(session.username))
    return Response.json({ ok: false, error: "banned" }, { status: 403 });
  const rl = await rateLimit(`cheer:${session.username}`, 30, 60_000);
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
  const r = await cheer(session.username, body.target, body.emoji ?? "🎉", body.gameId);
  if (!r.ok) return Response.json(r, { status: 400 });
  return Response.json(r);
}
