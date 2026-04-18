import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { repayExtra } from "@/lib/loans";
import { rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  loanId: z.string().min(1).max(64),
  amount: z.number().int().min(1).max(1_000_000),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const rl = await rateLimit(`loan-repay:${session.username}`, 5, 60_000);
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  }
  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  const state = await getPlayerState(session.username);
  const result = await repayExtra(state, body.loanId, body.amount);
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return Response.json({
    ok: true,
    newOutstanding: result.newOutstanding,
    loan: result.loan,
    resources: result.state.resources,
  });
}
