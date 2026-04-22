import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { takeLoan, LOAN_CONFIGS } from "@/lib/loans";
import { rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  type: z.enum(["mortgage", "kredyt_obrotowy", "kredyt_konsumencki", "leasing"]),
  principal: z.number().int().min(1).max(1_000_000),
  termMonths: z.number().int().min(1).max(120),
});

// One endpoint for every Phase-2 loan product. The existing /api/loans/take
// keeps the narrow mortgage-only API alive for backward-compat with Phase 1 UI.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
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
  const cfg = LOAN_CONFIGS[body.type];
  if (!cfg.allowedTermsMonths.includes(body.termMonths)) {
    return Response.json(
      {
        ok: false,
        error: `invalid-term for ${body.type} — allowed: ${cfg.allowedTermsMonths.join(",")}`,
      },
      { status: 400 },
    );
  }
  const state = await getPlayerState(session.username);
  const result = await takeLoan(state, body);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }
  return Response.json({
    ok: true,
    loan: result.loan,
    resources: result.state.resources,
    caution: cfg.caution,
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    configs: LOAN_CONFIGS,
  });
}
