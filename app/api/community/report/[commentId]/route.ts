import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { reportComment, isEffectivelyBanned } from "@/lib/community";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (await isEffectivelyBanned(session.username))
    return Response.json({ ok: false, error: "banned" }, { status: 403 });
  const rl = await rateLimit(`report:${session.username}`, 10, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  const { commentId } = await params;
  const r = await reportComment(session.username, commentId);
  if (!r.ok) return Response.json(r, { status: 400 });
  return Response.json(r);
}
