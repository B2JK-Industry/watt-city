import { getSession } from "@/lib/session";
import { getPlayerState, recentLedger } from "@/lib/player";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const [state, ledger] = await Promise.all([
    getPlayerState(session.username),
    recentLedger(session.username, 20),
  ]);
  return Response.json({
    ok: true,
    username: session.username,
    resources: state.resources,
    creditScore: state.creditScore,
    lastTickAt: state.lastTickAt,
    ledger,
  });
}
