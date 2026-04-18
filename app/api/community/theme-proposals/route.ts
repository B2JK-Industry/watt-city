import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { listProposals, submitProposal, votePro } from "@/lib/theme-proposals";
import { isEffectivelyBanned } from "@/lib/community";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const proposals = await listProposals(50);
  return Response.json({ ok: true, proposals });
}

const ActionSchema = z.object({
  action: z.enum(["submit", "vote"]),
  text: z.string().min(8).max(100).optional(),
  proposalId: z.string().min(1).max(64).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (await isEffectivelyBanned(session.username))
    return Response.json({ ok: false, error: "banned" }, { status: 403 });
  const rl = await rateLimit(`theme-proposal:${session.username}`, 10, 60_000);
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
  if (body.action === "submit") {
    if (!body.text)
      return Response.json({ ok: false, error: "missing-text" }, { status: 400 });
    const r = await submitProposal(session.username, body.text);
    if (!r.ok) return Response.json(r, { status: 400 });
    return Response.json(r);
  }
  if (body.action === "vote") {
    if (!body.proposalId)
      return Response.json(
        { ok: false, error: "missing-proposalId" },
        { status: 400 },
      );
    const r = await votePro(session.username, body.proposalId);
    if (!r.ok) return Response.json(r, { status: 400 });
    return Response.json(r);
  }
}
