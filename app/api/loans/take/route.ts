import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { takeMortgage, ALLOWED_TERMS_MONTHS } from "@/lib/loans";
import { rateLimit } from "@/lib/rate-limit";
import { withPlayerLock } from "@/lib/player-lock";

const BodySchema = z.object({
  principal: z.number().int().min(1).max(1_000_000),
  termMonths: z
    .number()
    .int()
    .refine((v) => (ALLOWED_TERMS_MONTHS as readonly number[]).includes(v)),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  // Tight limit: 1 loan per minute per user — takeMortgage is expensive
  // (writes to ledger + state) and we don't want a runaway client.
  const rl = await rateLimit(`loan-take:${session.username}`, 1, 60_000);
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
  return withPlayerLock(session.username, async () => {
    const state = await getPlayerState(session.username);
    const result = await takeMortgage(state, body);
    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.error },
        { status: 400 },
      );
    }
    return Response.json({
      ok: true,
      loan: result.loan,
      resources: result.state.resources,
    });
  });
}
