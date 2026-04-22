/* V2 refactor R2.3 — cashflow HUD data bundle (server-computed).
 *
 * Runs inside the authenticated render path (layout.tsx). Everything here
 * is server-side and read-only — no mutations. The client HUD component
 * receives the bundle via props and handles interactivity (dismiss,
 * stale-state polling, modal-aware hiding).
 */

import type { PlayerState } from "@/lib/player";
import {
  brownoutFactor,
  cityWattBalance,
  deficitHoursAt,
  isInWattRescueGrace,
  deficitState,
  type DeficitMilestone,
} from "@/lib/watts";
import { activeLoanRisk, type LoanRiskAlert } from "@/lib/loans";
import { getCatalogEntry, yieldAtLevel } from "@/lib/building-catalog";
import type { ResourceKey } from "@/lib/resources";

export type HudBundle = {
  /** cashZl + coins combined — the "liquid money" the HUD headline shows. */
  cashBalance: number;
  cashZl: number;
  coins: number;
  /** Approximate hourly yield after current brownout (coin-equivalent; non-
   *  watts resources summed 1:1 as the rest of the V2 surface does). */
  projectedHourly: number;
  /** Watt balance snapshot. */
  watts: {
    produced: number;
    consumed: number;
    net: number;
    inDeficit: boolean;
    deficitHours: number;
    /** Current brownout (1 = full, 0.5 = tier2, 0.25 = sustained). */
    brownout: number;
    /** True if the 72h rescue grace window is still open. */
    inRescueGrace: boolean;
    /** Next deficit milestone (50%/25%/bankruptcy) or null at 72h+. */
    nextMilestone: DeficitMilestone | null;
    /** Hours (ceiling) until `nextMilestone` or null. Matches the exact
     *  value rendered by WattDeficitPanel so the two widgets speak one
     *  language — a user reading "23h to brownout 50%" in the banner
     *  shouldn't also see "71h rescue window" in the HUD. */
    hoursToNextMilestone: number | null;
  };
  /** Loans at risk of missing their next payment in the next 7 days. */
  loanRisk: LoanRiskAlert[];
  /** ms since last tick — drives the stale-state indicator. */
  msSinceTick: number;
  /** Non-zero if the city is in a state worth a persistent amber banner
   *  (deficit, loan risk, or stale >5min). Client uses to enable banner. */
  alertLevel: "none" | "info" | "warn" | "critical";
  alertReason: string | null;
  /** True when the dedicated WattDeficitPanel (sticky top banner under
   *  nav) is ALREADY rendering this user's deficit state. The HUD hides
   *  its own deficit sub-banner in that case so the user sees one
   *  source of truth. */
  brownoutBannerActive: boolean;
};

export type BuildHudOpts = {
  /** Passed from `app/layout.tsx` after resolving the `v3_brownout_panel`
   *  flag + deficit state. Drives HUD deficit-banner suppression. */
  brownoutBannerActive?: boolean;
};

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export function buildHudBundle(
  state: PlayerState,
  now = Date.now(),
  opts: BuildHudOpts = {},
): HudBundle {
  const watts = cityWattBalance(state.buildings);
  const dh = deficitHoursAt(state, now);
  const brownout = brownoutFactor(dh);
  const ds = deficitState(state, now);

  // Projected hourly yield: sum every building's non-watts production at
  // current level scaled by brownout. Watts production is grid-relevant
  // not player-facing income, so we collapse all non-watts resources at
  // 1:1 into a "hourly income" headline number.
  let projectedHourly = 0;
  for (const b of state.buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry) continue;
    const base = yieldAtLevel(entry.baseYieldPerHour, b.level);
    for (const [k, v] of Object.entries(base) as [ResourceKey, number][]) {
      if (k === "watts") continue;
      projectedHourly += Math.ceil(v * brownout);
    }
  }

  const loanRisk = activeLoanRisk(state, now, 7);
  const msSinceTick = Math.max(0, now - (state.lastTickAt ?? now));

  let alertLevel: HudBundle["alertLevel"] = "none";
  let alertReason: string | null = null;
  if (watts.inDeficit) {
    alertLevel = brownout < 0.5 ? "critical" : brownout < 1 ? "warn" : "info";
    alertReason = `watt-deficit-${Math.floor(dh)}h`;
  } else if (loanRisk.length > 0) {
    alertLevel = "warn";
    alertReason = `loan-risk:${loanRisk[0].loanId}`;
  } else if (msSinceTick > STALE_THRESHOLD_MS) {
    alertLevel = "info";
    alertReason = "stale-tick";
  }

  return {
    cashBalance:
      (state.resources.cashZl ?? 0) + (state.resources.coins ?? 0),
    cashZl: state.resources.cashZl ?? 0,
    coins: state.resources.coins ?? 0,
    projectedHourly,
    watts: {
      ...watts,
      deficitHours: dh,
      brownout,
      inRescueGrace: isInWattRescueGrace(state, now),
      nextMilestone: ds.nextMilestone,
      hoursToNextMilestone:
        ds.hoursToNextMilestone == null
          ? null
          : Math.max(1, Math.ceil(ds.hoursToNextMilestone)),
    },
    loanRisk,
    msSinceTick,
    alertLevel,
    alertReason,
    brownoutBannerActive: Boolean(opts.brownoutBannerActive),
  };
}
