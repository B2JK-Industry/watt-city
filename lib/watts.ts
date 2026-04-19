/* V2 refactor R2.1 — watt upkeep + brownout (BLOCKER-1 compliant).
 *
 * City model: every building has a signed `wattUpkeepPerHour`.
 *  - positive = consumes watts from the grid
 *  - negative = supplies watts to the grid (energy buildings)
 *  - zero    = irrelevant for grid balance (decorative, Domek)
 *
 * `Σ wattUpkeepPerHour` over every building gives the net grid draw per
 * hour. When that is > 0 the city is in deficit — non-energy yields get
 * brownout-scaled per the BLOCKER-1 ladder:
 *
 *   < 24h deficit → 100% (grace — one-day rescue window)
 *   24-48h        → 50%  (first brownout tier)
 *   ≥ 48h         → 25%  (sustained brownout — NEVER 0 per BLOCKER-1,
 *                          because 0% creates a permanent coin-lock:
 *                          player can't earn to build the elektrownia)
 *
 * Energy buildings (baseYieldPerHour.watts) are never brownout-scaled —
 * they keep producing so the player can dig themselves out. The single-
 * building rescue (Mała elektrownia, 50 bricks + 80 coins) is the
 * intended one-tap fix surfaced by the amber banner (R2.3).
 *
 * Bankruptcy gate: R7.3 (restructuring) must not trigger while the
 * deficit is fresh — `isInWattRescueGrace(state, now)` returns true for
 * the first 72h of a deficit, long enough for the amber banner's rescue
 * loan (mentor-help, HIGH-8) to resolve it. Callers in R7.3 read this
 * helper; wired here so the contract is localized to this module.
 */

import { getCatalogEntry } from "@/lib/building-catalog";
import type { BuildingInstance, PlayerState } from "@/lib/player";

export const DEFICIT_GRACE_HOURS = 24;
export const DEFICIT_TIER2_HOURS = 48;
export const RESCUE_GRACE_HOURS = 72;

const HOUR_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Brownout ladder
// ---------------------------------------------------------------------------

/** Yield multiplier applied to non-watts production during a deficit.
 *  Never returns 0 — BLOCKER-1 explicitly forbids a permanent coin-lock. */
export function brownoutFactor(deficitHours: number): number {
  if (!Number.isFinite(deficitHours) || deficitHours < DEFICIT_GRACE_HOURS) {
    return 1;
  }
  if (deficitHours < DEFICIT_TIER2_HOURS) return 0.5;
  return 0.25;
}

// ---------------------------------------------------------------------------
// City-wide watt balance
// ---------------------------------------------------------------------------

export type WattBalance = {
  /** Sum of positive upkeep across buildings (grid draw). */
  consumed: number;
  /** Sum of |negative upkeep| (grid supply from energy buildings). */
  produced: number;
  /** produced - consumed; positive = surplus, negative = deficit. */
  net: number;
  inDeficit: boolean;
};

/** Per-building upkeep scales with level on the same 1.4× curve as yield. */
export function upkeepAtLevel(base: number, level: number): number {
  if (base === 0 || level < 1) return 0;
  const mult = 1.4 ** (level - 1);
  // Ceil magnitude then restore sign so producers round up too.
  const sign = base < 0 ? -1 : 1;
  return sign * Math.ceil(Math.abs(base) * mult);
}

export function cityWattBalance(
  buildings: Array<Pick<BuildingInstance, "catalogId" | "level">>,
): WattBalance {
  let consumed = 0;
  let produced = 0;
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry) continue;
    const raw = upkeepAtLevel(entry.wattUpkeepPerHour ?? 0, b.level);
    if (raw > 0) consumed += raw;
    else if (raw < 0) produced += -raw;
  }
  const net = produced - consumed;
  return { consumed, produced, net, inDeficit: consumed > produced };
}

// ---------------------------------------------------------------------------
// Deficit-since bookkeeping
// ---------------------------------------------------------------------------

/** Sync `state.wattDeficitSince` against the current building set. Called
 *  from every build/upgrade/demolish and at tick entry. Returns true if
 *  the state changed (caller persists). */
export function refreshWattDeficit(
  state: PlayerState,
  now = Date.now(),
): boolean {
  const { inDeficit } = cityWattBalance(state.buildings);
  if (inDeficit) {
    if (state.wattDeficitSince == null) {
      state.wattDeficitSince = now;
      return true;
    }
    return false;
  }
  if (state.wattDeficitSince != null) {
    state.wattDeficitSince = null;
    return true;
  }
  return false;
}

/** Hours the city has been in deficit, or 0 if not. */
export function deficitHoursAt(
  state: Pick<PlayerState, "wattDeficitSince">,
  at = Date.now(),
): number {
  if (state.wattDeficitSince == null) return 0;
  const ms = at - state.wattDeficitSince;
  return Math.max(0, ms / HOUR_MS);
}

/** BLOCKER-1 rescue window. R7.3 must not trigger while this is true. */
export function isInWattRescueGrace(
  state: Pick<PlayerState, "wattDeficitSince">,
  at = Date.now(),
): boolean {
  const h = deficitHoursAt(state, at);
  return h > 0 && h < RESCUE_GRACE_HOURS;
}
