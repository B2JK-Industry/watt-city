import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  generateChildLinkCode,
  linkParent,
  listChildren,
  listParents,
  readChildParentPrivacy,
  writeChildParentPrivacy,
  getRole,
} from "@/lib/roles";
import { rateLimit } from "@/lib/rate-limit";

const ActionSchema = z.object({
  action: z.enum(["generate-code", "link", "set-privacy"]),
  code: z.string().min(4).max(16).optional(),
  privacy: z
    .object({
      hideLedger: z.boolean().optional(),
      hideDuelHistory: z.boolean().optional(),
      hideBuildings: z.boolean().optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const role = await getRole(session.username);
  const [children, parents, privacy] = await Promise.all([
    listChildren(session.username),
    listParents(session.username),
    readChildParentPrivacy(session.username),
  ]);
  return Response.json({ ok: true, role, children, parents, privacy });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const rl = await rateLimit(`parent:${session.username}`, 10, 60_000);
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
  switch (body.action) {
    case "generate-code": {
      const code = await generateChildLinkCode(session.username);
      return Response.json({ ok: true, code });
    }
    case "link": {
      if (!body.code)
        return Response.json({ ok: false, error: "missing-code" }, { status: 400 });
      const r = await linkParent(session.username, body.code);
      if (!r.ok) return Response.json(r, { status: 400 });
      return Response.json(r);
    }
    case "set-privacy": {
      const next = await writeChildParentPrivacy(session.username, body.privacy ?? {});
      return Response.json({ ok: true, privacy: next });
    }
  }
}
