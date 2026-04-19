/* Cashflow tick engine — Phase 1.4 of the Watt City backlog.
 *
 * Semantics (ECONOMY.md §4):
 *  - Each building yields `baseYield × 1.4^(level-1)` per real-time hour.
 *  - `tick(state)` catches up the elapsed hours since `lastTickAt`, capped at
 *    30 days of offline accumulation.
 *  - Idempotency: each (building, hour-bucket) tick only applies once; the
 *    ledger dedupe set holds `tick:${instanceId}:${hourBucket}` keys.
 *  - Single-flight: a `xp:tick-lock:<username>` Redis key (SET NX EX 30)
 *    prevents two concurrent renders from double-crediting.
 *
 * Call sites (backlog 1.4.3):
 *  - server-side on authenticated page renders (via layout.tsx)
 *  - `POST /api/buildings/tick` (manual force, useful for debugging)
 *  - `/api/cron/rotate-if-due` can poke multiple players in a future sweep
 *    endpoint — out of scope for MVP; lazy-on-render covers MVP traffic.
 */

import {
  getPlayerState,
  creditResources,
  savePlayerState,
  type PlayerState,
  type BuildingInstance,
} from "@/lib/player";
import { getCatalogEntry, yieldAtLevel } from "@/lib/building-catalog";
import { processLoanPayments } from "@/lib/loans";
import { kvSetNX, kvGet, kvDel } from "@/lib/redis";
import type { Resources } from "@/lib/resources";
import { brownoutFactor, refreshWattDeficit } from "@/lib/watts";

const TICK_LOCK = (u: string) => `xp:tick-lock:${u}`;
const HOUR_MS = 60 * 60 * 1000;
const OFFLINE_CAP_HOURS = 30 * 24; // ECONOMY.md §4 offline catchup cap

// ---------------------------------------------------------------------------
// Compute citywide multipliers (Spodek: +5% all, Varso: +10% all). ECONOMY.md §3.
// ---------------------------------------------------------------------------

function citywideMultiplier(buildings: BuildingInstance[]): number {
  let mult = 1;
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry?.multiplier) continue;
    if (entry.multiplier.target === "citywide-all") {
      mult *= 1 + entry.multiplier.percent / 100;
    }
  }
  return mult;
}

// Compute per-building yield at its current level, with citywide multiplier
// and BLOCKER-1 brownout scaling. Watts production by energy buildings is
// NEVER brownout-scaled — they keep supplying the grid so the player can
// dig out of the deficit.
function yieldWithMult(
  b: BuildingInstance,
  citymult: number,
  brownout: number,
): Partial<Resources> {
  const entry = getCatalogEntry(b.catalogId);
  if (!entry) return {};
  const base = yieldAtLevel(entry.baseYieldPerHour, b.level);
  const out: Partial<Resources> = {};
  for (const [k, v] of Object.entries(base) as [keyof Resources, number][]) {
    // Energy production bypasses brownout so rescue is always possible.
    const factor = k === "watts" ? 1 : brownout;
    const scaled = v * citymult * factor;
    // During brownout non-watts yields can round to 0 at low base yields.
    // That's OK — the base-5 Domek still yields ≥1 because of Math.ceil.
    out[k] = scaled > 0 ? Math.max(1, Math.ceil(scaled)) : 0;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tick a player
// ---------------------------------------------------------------------------

export type TickResult = {
  ticked: boolean;
  hoursApplied: number;
  resources: Resources;
  entriesWritten: number;
  reason?: string;
};

// Run idempotent cashflow for one player. Safe to call multiple times per
// hour — only the first within the hour bucket credits; the rest are no-ops.
export async function tickPlayer(
  username: string,
  now = Date.now(),
): Promise<TickResult> {
  // Acquire single-flight lock to prevent two concurrent calls from both
  // writing ledger entries before the dedupe set reflects the first.
  const lockValue = `${now}-${Math.random().toString(36).slice(2, 6)}`;
  const gotLock = await kvSetNX(TICK_LOCK(username), lockValue, { ex: 30 });
  if (!gotLock) {
    const state = await getPlayerState(username);
    return {
      ticked: false,
      hoursApplied: 0,
      resources: state.resources,
      entriesWritten: 0,
      reason: "lock-held",
    };
  }
  try {
    const state = await getPlayerState(username);
    if (state.buildings.length === 0) {
      state.lastTickAt = now;
      await savePlayerState(state);
      return {
        ticked: false,
        hoursApplied: 0,
        resources: state.resources,
        entriesWritten: 0,
        reason: "no-buildings",
      };
    }

    const elapsedMs = Math.max(0, now - state.lastTickAt);
    const elapsedHours = Math.floor(elapsedMs / HOUR_MS);
    if (elapsedHours === 0) {
      return {
        ticked: false,
        hoursApplied: 0,
        resources: state.resources,
        entriesWritten: 0,
        reason: "within-hour",
      };
    }

    const cappedHours = Math.min(elapsedHours, OFFLINE_CAP_HOURS);
    const baseHourBucket = Math.floor(state.lastTickAt / HOUR_MS);
    const citymult = citywideMultiplier(state.buildings);

    // R2.1: reconcile deficit-since against the current building set BEFORE
    // simulating catch-up hours. refreshWattDeficit is a no-op if already
    // consistent; otherwise it stamps (fresh deficit) or clears (rescued).
    refreshWattDeficit(state, state.lastTickAt);

    let entriesWritten = 0;
    // Outer loop over hours so brownout can re-evaluate each hour bucket.
    // Buildings don't change shape during catchup, so deficit state is
    // constant except for elapsed-hours accumulation.
    for (let h = 0; h < cappedHours; h++) {
      const hourBucket = baseHourBucket + h + 1;
      const hourTs = hourBucket * HOUR_MS;
      const deficitHours =
        state.wattDeficitSince != null
          ? Math.max(0, (hourTs - state.wattDeficitSince) / HOUR_MS)
          : 0;
      const brownout = brownoutFactor(deficitHours);

      for (const building of state.buildings) {
        const perHour = yieldWithMult(building, citymult, brownout);
        if (Object.keys(perHour).length === 0) continue;
        const sourceId = `${building.id}:${hourBucket}`;
        const credit = await creditResources(
          state,
          "tick",
          perHour,
          `cashflow ${building.catalogId} L${building.level} (hour ${hourBucket})`,
          sourceId,
          {
            instanceId: building.id,
            hourBucket,
            level: building.level,
            brownout,
          },
        );
        if (credit.applied) {
          entriesWritten += 1;
          building.lastTickAt = (hourBucket + 1) * HOUR_MS;
        }
      }
    }
    state.lastTickAt = now;

    // Loan payments due in this window. Runs AFTER cashflow credit so the
    // player's fresh coins/cash can cover the payment rather than triggering
    // a false "missed".
    await processLoanPayments(state, now);

    await savePlayerState(state);

    return {
      ticked: entriesWritten > 0,
      hoursApplied: cappedHours,
      resources: state.resources,
      entriesWritten,
      reason: cappedHours < elapsedHours ? "offline-cap-hit" : undefined,
    };
  } finally {
    const current = await kvGet<string>(TICK_LOCK(username));
    if (current === lockValue) {
      await kvDel(TICK_LOCK(username));
    }
  }
}

// Sugar for layout.tsx — returns an updated PlayerState rather than the full
// TickResult summary. Used by the authenticated render path.
export async function tickIfDue(username: string): Promise<PlayerState> {
  await tickPlayer(username);
  return await getPlayerState(username);
}

// Used by the UI to display "next tick in X min" without hitting /tick.
export function msUntilNextTick(lastTickAt: number, now = Date.now()): number {
  const nextAt = Math.ceil((lastTickAt + 1) / HOUR_MS) * HOUR_MS;
  return Math.max(0, nextAt - now);
}
