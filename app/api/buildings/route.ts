import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import {
  catalogForPlayer,
  slotSnapshot,
  computePlayerTier,
  lifetimeEarned,
  lifetimeStatsFor,
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
  const snapshot = await Promise.all(
    slotSnapshot(state).map(async ({ slot, building, catalog: c, upgrade }) => ({
      slot,
      // R-12 — `upgrade` MUST be passed through. The client UI reads
      // `slot.upgrade.nextLevelAffordable` to compute `canUpgrade`,
      // so dropping the field meant `undefined.nextLevelAffordable`
      // threw on every refresh after a successful /api/buildings/upgrade
      // POST — caught by the new app/miasto/error.tsx boundary,
      // looking like a page crash to the user. The bootstrap fetched
      // server-side at `app/miasto/page.tsx` includes upgrade; the
      // refresh path now matches.
      upgrade,
      building: building
        ? {
            ...building,
            currentYield: c ? yieldAtLevel(c.baseYieldPerHour, building.level) : {},
            labels: c?.labels ?? null,
            glyph: c?.glyph ?? null,
            roofColor: c?.roofColor ?? null,
            bodyColor: c?.bodyColor ?? null,
            stats: await lifetimeStatsFor(state, building.id),
          }
        : null,
    })),
  );
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
