import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  listFriends,
  listInbox,
  listOutgoing,
  readPrivacy,
  writePrivacy,
} from "@/lib/friends";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [friends, inbox, outgoing, privacy] = await Promise.all([
    listFriends(session.username),
    listInbox(session.username),
    listOutgoing(session.username),
    readPrivacy(session.username),
  ]);
  return Response.json({ ok: true, friends, inbox, outgoing, privacy });
}

const ActionSchema = z.object({
  action: z.enum(["request", "accept", "reject", "remove", "set-privacy"]),
  other: z.string().min(1).max(64).optional(),
  privacy: z
    .object({
      profileVisibility: z.enum(["public", "friends", "private"]).optional(),
      cashflowVisible: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // Friend graph mutations are cheap but spammable — 20/min per account.
  const rl = await rateLimit(`friends:${session.username}`, 20, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );

  let body;
  try {
    body = ActionSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  if (body.action === "set-privacy") {
    const next = await writePrivacy(session.username, body.privacy ?? {});
    return Response.json({ ok: true, privacy: next });
  }

  if (!body.other) {
    return Response.json({ ok: false, error: "missing-other" }, { status: 400 });
  }

  let result;
  switch (body.action) {
    case "request":
      result = await sendFriendRequest(session.username, body.other);
      break;
    case "accept":
      result = await acceptFriendRequest(session.username, body.other);
      break;
    case "reject":
      result = await rejectFriendRequest(session.username, body.other);
      break;
    case "remove":
      result = await removeFriend(session.username, body.other);
      break;
  }
  if (!result.ok)
    return Response.json(result, { status: 400 });
  return Response.json(result);
}
