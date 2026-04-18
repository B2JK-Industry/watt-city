import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
  adminSetCommentHidden,
  adminBan,
  adminUnban,
  listComments,
} from "@/lib/community";
import { kvGet } from "@/lib/redis";

// Fetches comments across any game + reported count overlay. The "reported"
// queue view filters server-side to entries with reportCount > 0.
export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");
  if (!gameId)
    return Response.json({ ok: false, error: "missing-gameId" }, { status: 400 });
  const all = await listComments(gameId, { includeHidden: true });
  const reported = all.filter((c) => (c.reportCount ?? 0) > 0);
  return Response.json({ ok: true, all, reported });
}

const ActionSchema = z.object({
  action: z.enum(["hide", "show", "ban", "unban"]),
  commentId: z.string().optional(),
  username: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  let body;
  try {
    body = ActionSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  if ((body.action === "hide" || body.action === "show") && body.commentId) {
    await adminSetCommentHidden(body.commentId, body.action === "hide");
    return Response.json({ ok: true });
  }
  if (body.action === "ban" && body.username) {
    await adminBan(body.username);
    return Response.json({ ok: true });
  }
  if (body.action === "unban" && body.username) {
    await adminUnban(body.username);
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "bad-args" }, { status: 400 });
}
