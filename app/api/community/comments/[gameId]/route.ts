import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  listComments,
  postComment,
  isEffectivelyBanned,
} from "@/lib/community";
import { rateLimit } from "@/lib/rate-limit";

const PostSchema = z.object({
  text: z.string().min(2).max(400),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const comments = await listComments(gameId);
  return Response.json({ ok: true, comments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (await isEffectivelyBanned(session.username))
    return Response.json({ ok: false, error: "banned" }, { status: 403 });
  const rl = await rateLimit(`comment:${session.username}`, 10, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  let body;
  try {
    body = PostSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  const { gameId } = await params;
  const r = await postComment(session.username, gameId, body.text);
  if (!r.ok) return Response.json(r, { status: 400 });
  return Response.json(r);
}
