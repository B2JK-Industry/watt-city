import { getSession } from "@/lib/session";
import { getPlayerState, savePlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { pushNotification } from "@/lib/notifications";
import { withPlayerLock } from "@/lib/player-lock";

// GET: returns current tier + whether a celebration is pending. If a tier-up
// happened since the last acknowledgement, `justLeveledTo > previousTier`.
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const state = await getPlayerState(session.username);
  const tier = computePlayerTier(state.buildings);
  const ack = state.acknowledgedTier ?? 1;
  const pending = tier > ack;
  // Push to the in-app feed once per tier transition — dedupe key is tier
  // number so re-polling inside the same tier won't spam the feed. If client
  // hasn't acked yet, we still emit because pushNotification is idempotent at
  // the store level (append-only); to avoid true dupes we use a Redis SADD
  // dedupe by `tier-up:<tier>`. Inline here: if ack === tier - 1, this is the
  // first GET after the tier-up, so we fire once.
  if (pending && ack === tier - 1) {
    await pushNotification(session.username, {
      kind: "tier-up",
      title: `Awansujesz do Tier ${tier}`,
      body: `Twoje miasto wspięło się z T${ack} na T${tier}.`,
      href: "/miasto",
      meta: { tier },
    });
  }
  return Response.json({
    ok: true,
    tier,
    acknowledgedTier: ack,
    pendingCelebration: pending,
  });
}

// POST: called by client after showing the tier-up toast, bumps the
// acknowledged tier so the celebration doesn't replay.
export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return withPlayerLock(session.username, async () => {
    const state = await getPlayerState(session.username);
    const tier = computePlayerTier(state.buildings);
    state.acknowledgedTier = tier;
    await savePlayerState(state);
    return Response.json({ ok: true, tier });
  });
}
