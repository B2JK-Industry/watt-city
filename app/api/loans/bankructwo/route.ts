import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { bankructwoReset, eligibleForBankructwo } from "@/lib/loans";
import { rateLimit } from "@/lib/rate-limit";
import { withPlayerLock } from "@/lib/player-lock";

export async function POST() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // Extra-tight limit: at most one bankructwo per hour. This is a destructive
  // operation (wipes all non-Domek buildings) — we want a pause between tries.
  const rl = await rateLimit(`bankructwo:${session.username}`, 1, 60 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  }
  return withPlayerLock(session.username, async () => {
    const state = await getPlayerState(session.username);
    if (!eligibleForBankructwo(state)) {
      return Response.json(
        {
          ok: false,
          error: "not-eligible",
          hint: "need ≥1 defaulted loan AND monthlyCashflow < activeMonthlyPayments",
        },
        { status: 400 },
      );
    }
    const { demolished } = await bankructwoReset(state);
    return Response.json({
      ok: true,
      demolished,
      creditScore: state.creditScore,
      buildings: state.buildings,
      loans: state.loans,
    });
  });
}

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const state = await getPlayerState(session.username);
  return Response.json({
    ok: true,
    eligible: eligibleForBankructwo(state),
  });
}
