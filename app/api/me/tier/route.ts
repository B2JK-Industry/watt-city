import { getSession } from "@/lib/session";
import { getPlayerState, savePlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";

// GET: returns current tier + whether a celebration is pending. If a tier-up
// happened since the last acknowledgement, `justLeveledTo > previousTier`.
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const state = await getPlayerState(session.username);
  const tier = computePlayerTier(state.buildings);
  const ack = state.acknowledgedTier ?? 1;
  return Response.json({
    ok: true,
    tier,
    acknowledgedTier: ack,
    pendingCelebration: tier > ack,
  });
}

// POST: called by client after showing the tier-up toast, bumps the
// acknowledged tier so the celebration doesn't replay.
export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const state = await getPlayerState(session.username);
  const tier = computePlayerTier(state.buildings);
  state.acknowledgedTier = tier;
  await savePlayerState(state);
  return Response.json({ ok: true, tier });
}
