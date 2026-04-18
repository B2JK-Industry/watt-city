import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import {
  catalogForPlayer,
  slotSnapshot,
  computePlayerTier,
  lifetimeEarned,
  yieldAtLevel,
} from "@/lib/buildings";

// Dashboard-data endpoint: returns slot map + catalog + live state in one
// round trip so the city page can render without chaining calls.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const state = await getPlayerState(session.username);
  const [catalog, earned] = await Promise.all([
    catalogForPlayer(state),
    lifetimeEarned(state),
  ]);
  const snapshot = slotSnapshot(state).map(({ slot, building, catalog: c }) => ({
    slot,
    building: building
      ? {
          ...building,
          currentYield: c ? yieldAtLevel(c.baseYieldPerHour, building.level) : {},
          labels: c?.labels ?? null,
          glyph: c?.glyph ?? null,
          roofColor: c?.roofColor ?? null,
          bodyColor: c?.bodyColor ?? null,
        }
      : null,
  }));
  return Response.json({
    ok: true,
    resources: state.resources,
    tier: computePlayerTier(state.buildings),
    creditScore: state.creditScore,
    lifetimeEarned: earned,
    catalog,
    slots: snapshot,
  });
}
