/* Building-engine — server-side rules for place/upgrade/demolish.
 * Read-side is pure; mutation writes through player.ts (ledger + balance).
 */

import {
  BUILDING_CATALOG,
  SLOT_MAP,
  DOMEK_SLOT_ID,
  getCatalogEntry,
  getSlot,
  isCategoryCompatible,
  isUnlocked,
  costAtLevel,
  yieldAtLevel,
  type BuildingCatalogEntry,
  type SlotDef,
} from "@/lib/building-catalog";
import type { BuildingInstance, PlayerState } from "@/lib/player";
import {
  creditResources,
  savePlayerState,
} from "@/lib/player";
import { recentLedger } from "@/lib/player";
import {
  RESOURCE_KEYS,
  ZERO_RESOURCES,
  type Resources,
  type ResourceKey,
} from "@/lib/resources";
import { refreshCityValue } from "@/lib/city-value";
import { refreshWattDeficit } from "@/lib/watts";

// ---------------------------------------------------------------------------
// Cost/affordability checks
// ---------------------------------------------------------------------------

export function canAfford(
  resources: Resources,
  cost: Partial<Resources>,
): boolean {
  for (const [k, v] of Object.entries(cost) as [ResourceKey, number][]) {
    if ((resources[k] ?? 0) < v) return false;
  }
  return true;
}

// Subtract `cost` from `resources`, clamping at 0. Returns a delta object
// (all negative numbers) for ledger writing.
export function subtractCost(cost: Partial<Resources>): Partial<Resources> {
  const out: Partial<Resources> = {};
  for (const [k, v] of Object.entries(cost) as [ResourceKey, number][]) {
    out[k] = -Math.abs(v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Player tier derivation (ECONOMY.md §6)
// ---------------------------------------------------------------------------

export function computePlayerTier(buildings: BuildingInstance[]): number {
  const sumLevels = buildings.reduce((s, b) => s + b.level, 0);
  if (sumLevels === 0) return 1;
  return Math.max(1, Math.min(9, Math.floor(Math.sqrt(sumLevels))));
}

// ---------------------------------------------------------------------------
// Lifetime-earned reconstruction from ledger (for unlock checks)
// ---------------------------------------------------------------------------

// Sum of POSITIVE deltas of kind `score` or `tick` — captures what the player
// has ever earned across their career. Used to gate earn-to-unlock entries.
export async function lifetimeEarned(
  state: PlayerState,
): Promise<Resources> {
  const log = await recentLedger(state.username, 500);
  const acc: Resources = { ...ZERO_RESOURCES };
  for (const entry of log) {
    if (entry.kind !== "score" && entry.kind !== "tick" && entry.kind !== "backfill") continue;
    for (const k of RESOURCE_KEYS) {
      const d = entry.delta[k] ?? 0;
      if (d > 0) acc[k] += d;
    }
  }
  // Ledger is capped at 500 so we UNDERESTIMATE lifetime for veterans. That's
  // fine for MVP — the unlock thresholds in catalog are small (50 of a
  // resource) and always beatable within 500 entries of play.
  return acc;
}

// ---------------------------------------------------------------------------
// Place a new building on a slot
// ---------------------------------------------------------------------------

export type PlaceError =
  | "unknown-catalog"
  | "unknown-slot"
  | "slot-occupied"
  | "category-mismatch"
  | "locked"
  | "not-affordable"
  | "catalog-not-mvp";

export type PlaceResult =
  | { ok: true; state: PlayerState; building: BuildingInstance }
  | { ok: false; error: PlaceError; detail?: string };

export async function placeBuilding(
  state: PlayerState,
  slotId: number,
  catalogId: string,
): Promise<PlaceResult> {
  const slot = getSlot(slotId);
  if (!slot) return { ok: false, error: "unknown-slot" };
  const entry = getCatalogEntry(catalogId);
  if (!entry) return { ok: false, error: "unknown-catalog" };
  if (!entry.mvpActive) return { ok: false, error: "catalog-not-mvp" };
  if (state.buildings.some((b) => b.slotId === slotId)) {
    return { ok: false, error: "slot-occupied" };
  }
  if (!isCategoryCompatible(entry, slot)) {
    return {
      ok: false,
      error: "category-mismatch",
      detail: `slot ${slotId} is ${slot.category}, building needs ${entry.category}`,
    };
  }
  const earned = await lifetimeEarned(state);
  const tier = computePlayerTier(state.buildings);
  if (!isUnlocked(entry, earned, tier)) {
    return { ok: false, error: "locked" };
  }
  if (!canAfford(state.resources, entry.baseCost)) {
    return { ok: false, error: "not-affordable" };
  }

  // Deduct cost (ledger entry) + append building instance.
  await creditResources(
    state,
    "build",
    subtractCost(entry.baseCost),
    `build ${catalogId} on slot ${slotId}`,
    `build:${state.username}:${slotId}:${Date.now()}`,
    { catalogId, slotId },
  );

  const instance: BuildingInstance = {
    id: `b-${slotId}-${Date.now().toString(36)}`,
    slotId,
    catalogId,
    level: 1,
    builtAt: Date.now(),
    lastTickAt: Date.now(),
    cumulativeCost: { ...entry.baseCost },
  };
  state.buildings.push(instance);
  // R2.1: update deficit-since BEFORE save so the row persists atomically.
  refreshWattDeficit(state);
  await savePlayerState(state);
  // R1.3: keep city-value leaderboard in sync on any mutation.
  await refreshCityValue(state.username, state.buildings);
  return { ok: true, state, building: instance };
}

// ---------------------------------------------------------------------------
// Upgrade / demolish
// ---------------------------------------------------------------------------

export type UpgradeResult =
  | { ok: true; state: PlayerState; building: BuildingInstance }
  | { ok: false; error: "unknown-instance" | "not-affordable" | "max-level" };

export async function upgradeBuilding(
  state: PlayerState,
  instanceId: string,
): Promise<UpgradeResult> {
  const b = state.buildings.find((x) => x.id === instanceId);
  if (!b) return { ok: false, error: "unknown-instance" };
  if (b.level >= 10) return { ok: false, error: "max-level" };
  const entry = getCatalogEntry(b.catalogId);
  if (!entry) return { ok: false, error: "unknown-instance" };

  const nextLevelCost = costAtLevel(entry.baseCost, b.level + 1);
  if (!canAfford(state.resources, nextLevelCost)) {
    return { ok: false, error: "not-affordable" };
  }

  await creditResources(
    state,
    "upgrade",
    subtractCost(nextLevelCost),
    `upgrade ${b.catalogId} L${b.level} → L${b.level + 1}`,
    `upgrade:${instanceId}:${b.level + 1}`,
    { instanceId, newLevel: b.level + 1 },
  );
  b.level += 1;
  // Accumulate cost — cumulativeCost = sum of baseCost + each upgrade cost
  for (const [k, v] of Object.entries(nextLevelCost) as [ResourceKey, number][]) {
    const existing = b.cumulativeCost[k] ?? 0;
    b.cumulativeCost[k] = existing + v;
  }
  refreshWattDeficit(state);
  await savePlayerState(state);
  await refreshCityValue(state.username, state.buildings);
  return { ok: true, state, building: b };
}

export type DemolishResult =
  | { ok: true; state: PlayerState; refund: Partial<Resources> }
  | { ok: false; error: "unknown-instance" | "domek-protected" };

// ECONOMY.md §5: last-resort Domek can't be seized in default flow. We also
// protect Domek from voluntary demolish to keep the signup gift honoured.
export async function demolishBuilding(
  state: PlayerState,
  instanceId: string,
): Promise<DemolishResult> {
  const b = state.buildings.find((x) => x.id === instanceId);
  if (!b) return { ok: false, error: "unknown-instance" };
  if (b.catalogId === "domek") {
    return { ok: false, error: "domek-protected" };
  }
  // 50% of cumulative cost refunded (ECONOMY.md §3 demolish rule).
  const refund: Partial<Resources> = {};
  for (const [k, v] of Object.entries(b.cumulativeCost) as [ResourceKey, number][]) {
    if (v > 0) refund[k] = Math.floor(v * 0.5);
  }
  await creditResources(
    state,
    "demolish",
    refund,
    `demolish ${b.catalogId} L${b.level} (50% refund)`,
    `demolish:${instanceId}`,
    { instanceId },
  );
  state.buildings = state.buildings.filter((x) => x.id !== instanceId);
  refreshWattDeficit(state);
  await savePlayerState(state);
  await refreshCityValue(state.username, state.buildings);
  return { ok: true, state, refund };
}

// ---------------------------------------------------------------------------
// Signup gift — grant Domek on slot 10 if player has no buildings
// ---------------------------------------------------------------------------

export async function ensureSignupGift(state: PlayerState): Promise<PlayerState> {
  if (state.buildings.length > 0) return state;
  const entry = getCatalogEntry("domek");
  if (!entry) return state;
  const instance: BuildingInstance = {
    id: `b-${DOMEK_SLOT_ID}-domek`,
    slotId: DOMEK_SLOT_ID,
    catalogId: "domek",
    level: 1,
    builtAt: Date.now(),
    lastTickAt: Date.now(),
    cumulativeCost: {}, // free
  };
  state.buildings.push(instance);
  refreshWattDeficit(state);
  await savePlayerState(state);
  await refreshCityValue(state.username, state.buildings);
  return state;
}

// ---------------------------------------------------------------------------
// Catalog snapshot for UI (joins current affordability + lock state)
// ---------------------------------------------------------------------------

export type CatalogListEntry = {
  entry: BuildingCatalogEntry;
  unlocked: boolean;
  affordable: boolean;
  reasonLocked: string | null;
};

export async function catalogForPlayer(
  state: PlayerState,
): Promise<CatalogListEntry[]> {
  const earned = await lifetimeEarned(state);
  const tier = computePlayerTier(state.buildings);
  return BUILDING_CATALOG.map((entry) => {
    const unlocked = isUnlocked(entry, earned, tier);
    const affordable = canAfford(state.resources, entry.baseCost);
    let reasonLocked: string | null = null;
    if (!entry.mvpActive) {
      reasonLocked = "coming-soon";
    } else if (!unlocked) {
      if (entry.unlock.kind === "lifetime-resource") {
        reasonLocked = `earn-${entry.unlock.resource}:${entry.unlock.amount}`;
      } else if (entry.unlock.kind === "tier") {
        reasonLocked = `tier:${entry.unlock.minTier}`;
      } else {
        reasonLocked = "locked";
      }
    } else if (!affordable) {
      reasonLocked = "not-affordable";
    }
    return { entry, unlocked, affordable, reasonLocked };
  });
}

// Build a SLOT_MAP snapshot with occupation status and level for the client.
export type SlotOccupant = {
  slot: SlotDef;
  building: BuildingInstance | null;
  catalog: BuildingCatalogEntry | null;
};

export function slotSnapshot(state: PlayerState): SlotOccupant[] {
  return SLOT_MAP.map((slot) => {
    const building = state.buildings.find((b) => b.slotId === slot.id) ?? null;
    const catalog = building ? getCatalogEntry(building.catalogId) : null;
    return { slot, building, catalog };
  });
}

export { yieldAtLevel, costAtLevel };

// ---------------------------------------------------------------------------
// Lifetime stats — derived from ledger (Phase 2.5.6)
// ---------------------------------------------------------------------------

export type LifetimeStats = {
  totalProduced: Resources;
  totalUpgrades: number;
  ageHours: number;
};

/** Aggregate produced resources for a single building from recent ledger
 *  entries. Scans meta.instanceId match on kind="tick" (cashflow) and counts
 *  kind="upgrade" events. Age is `now - builtAt`. Ledger cap (500) means
 *  totalProduced is a RECENT lifetime for veteran cities — good enough for
 *  the stats card without adding an extra counter per building. */
export async function lifetimeStatsFor(
  state: PlayerState,
  instanceId: string,
  now = Date.now(),
): Promise<LifetimeStats | null> {
  const b = state.buildings.find((x) => x.id === instanceId);
  if (!b) return null;
  const log = await recentLedger(state.username, 500);
  const totalProduced: Resources = { ...ZERO_RESOURCES };
  let totalUpgrades = 0;
  for (const entry of log) {
    if (entry.meta?.instanceId !== instanceId) continue;
    if (entry.kind === "tick") {
      for (const k of RESOURCE_KEYS) {
        const d = entry.delta[k] ?? 0;
        if (d > 0) totalProduced[k] += d;
      }
    }
    if (entry.kind === "upgrade") totalUpgrades += 1;
  }
  return {
    totalProduced,
    totalUpgrades,
    ageHours: Math.floor((now - b.builtAt) / (60 * 60 * 1000)),
  };
}
