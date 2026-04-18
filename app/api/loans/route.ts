import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const state = await getPlayerState(session.username);
  return Response.json({
    ok: true,
    loans: state.loans,
    creditScore: state.creditScore,
    cashZl: state.resources.cashZl,
  });
}
