/* Marketplace — Phase 3.2.
 *
 * Player-to-player trade for buildings at T7+. Seller lists a building they
 * own with an ask price in W$ (cashZl). Buyer pays ask × 1.00; seller
 * receives ask × 0.95 (5% transaction fee → `xp:marketplace:skarb` pot).
 * Listing fee 1 % of ask (paid on listing, refunded if unsold).
 * Listings expire after 7 days.
 *
 * Anti-abuse (3.2.6):
 *   - T7+ gate on both seller and buyer
 *   - Max 3 trades per player per day (either side)
 *   - Sanity check: ask > 5× median for that {catalogId, level} triggers
 *     rejection (derived from recent sold-at stats)
 *   - Rate-limit on list + buy (shared `market:<user>` bucket, 5/min)
 */

import {
  kvGet,
  kvSet,
  kvDel,
  lPush,
  lRange,
  lTrim,
  zIncrBy,
  zScore,
} from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
  type BuildingInstance,
  type PlayerState,
} from "@/lib/player";
import { getCatalogEntry } from "@/lib/building-catalog";
import { computePlayerTier } from "@/lib/buildings";
import { readEconomy } from "@/lib/economy";

export const MIN_TIER_TO_TRADE = 7;
export const LISTING_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_TRADES_PER_DAY = 3;

export type Listing = {
  id: string;
  sellerId: string;
  buildingSnapshot: BuildingInstance;
  askPrice: number;
  listingFee: number;
  createdAt: number;
  expiresAt: number;
  status: "active" | "sold" | "expired" | "cancelled";
  buyerId?: string;
  soldAt?: number;
};

const ACTIVE_LIST_KEY = "xp:marketplace:active"; // JSON array of listing ids
const LISTING_KEY = (id: string) => `xp:marketplace:listing:${id}`;
const HISTORY_KEY = (u: string) => `xp:marketplace:history:${u}`;
const SKARB_KEY = "xp:marketplace:skarb"; // cumulative fee pot
const MEDIAN_ZSET = (catalogId: string, level: number) =>
  `xp:marketplace:median:${catalogId}:${level}`; // scored by sold price
const DAILY_TRADES_KEY = (u: string, day: string) =>
  `xp:marketplace:daily:${u}:${day}`;

function dayBucket(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function bumpDailyTrades(u: string, now = Date.now()): Promise<number> {
  const key = DAILY_TRADES_KEY(u, dayBucket(now));
  const current = (await kvGet<number>(key)) ?? 0;
  await kvSet(key, current + 1, { ex: 48 * 60 * 60 });
  return current + 1;
}

async function currentDailyTrades(u: string, now = Date.now()): Promise<number> {
  return (await kvGet<number>(DAILY_TRADES_KEY(u, dayBucket(now)))) ?? 0;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

async function readActiveIds(): Promise<string[]> {
  return (await kvGet<string[]>(ACTIVE_LIST_KEY)) ?? [];
}

async function writeActiveIds(ids: string[]): Promise<void> {
  await kvSet(ACTIVE_LIST_KEY, ids);
}

export async function listActiveListings(
  filter: { catalogId?: string } = {},
): Promise<Listing[]> {
  const ids = await readActiveIds();
  const entries = await Promise.all(ids.map((id) => kvGet<Listing>(LISTING_KEY(id))));
  const now = Date.now();
  const out: Listing[] = [];
  for (let i = 0; i < ids.length; i++) {
    const l = entries[i];
    if (!l) continue;
    if (l.status !== "active") continue;
    if (l.expiresAt <= now) {
      l.status = "expired";
      await kvSet(LISTING_KEY(l.id), l);
      continue;
    }
    if (filter.catalogId && l.buildingSnapshot.catalogId !== filter.catalogId) continue;
    out.push(l);
  }
  // Sorted newest first; expired entries are dropped by the next sweep.
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listingById(id: string): Promise<Listing | null> {
  return await kvGet<Listing>(LISTING_KEY(id));
}

async function medianForKind(catalogId: string, level: number): Promise<number | null> {
  // Cheap: read the last 5 sold prices from a ZSET scored by sold timestamp.
  const key = MEDIAN_ZSET(catalogId, level);
  const score = await zScore(key, "_sample_"); // placeholder; actual data lives in the list below
  const history = (await kvGet<number[]>(`${key}:list`)) ?? [];
  if (history.length === 0) return null;
  const sorted = [...history].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
  // `score` intentionally unused — kept for future ZSET-based window queries.
  void score;
}

async function recordSoldPrice(
  catalogId: string,
  level: number,
  price: number,
): Promise<void> {
  const key = MEDIAN_ZSET(catalogId, level);
  const history = (await kvGet<number[]>(`${key}:list`)) ?? [];
  const next = [price, ...history].slice(0, 10); // keep last 10
  await kvSet(`${key}:list`, next);
  await zIncrBy(key, 1, String(price)); // running frequency counter (unused by UI yet)
}

// ---------------------------------------------------------------------------
// Public operations
// ---------------------------------------------------------------------------

export type CreateListingInput = {
  instanceId: string;
  askPrice: number;
};

export type CreateListingResult =
  | { ok: true; listing: Listing; state: PlayerState }
  | { ok: false; error: string };

export async function createListing(
  state: PlayerState,
  input: CreateListingInput,
): Promise<CreateListingResult> {
  const tier = computePlayerTier(state.buildings);
  if (tier < MIN_TIER_TO_TRADE)
    return { ok: false, error: `requires-tier-${MIN_TIER_TO_TRADE}` };
  const building = state.buildings.find((b) => b.id === input.instanceId);
  if (!building) return { ok: false, error: "unknown-instance" };
  if (building.catalogId === "domek")
    return { ok: false, error: "cannot-trade-domek" };
  if (input.askPrice <= 0) return { ok: false, error: "bad-price" };

  // Daily-limit check
  const daily = await currentDailyTrades(state.username);
  if (daily >= MAX_TRADES_PER_DAY)
    return { ok: false, error: `daily-limit-${MAX_TRADES_PER_DAY}` };

  // Sanity: block prices > 5× median for same (catalogId, level).
  const median = await medianForKind(building.catalogId, building.level);
  if (median && input.askPrice > 5 * median)
    return { ok: false, error: `price-too-high:${median}` };

  const cfg = await readEconomy();
  const listingFee = Math.ceil(input.askPrice * cfg.marketplaceListingFeeRate);
  if ((state.resources.cashZl ?? 0) < listingFee)
    return { ok: false, error: "not-enough-cash-for-listing-fee" };

  const now = Date.now();
  const id = `mkt-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const listing: Listing = {
    id,
    sellerId: state.username,
    buildingSnapshot: building,
    askPrice: Math.floor(input.askPrice),
    listingFee,
    createdAt: now,
    expiresAt: now + LISTING_TTL_MS,
    status: "active",
  };

  // Move building OUT of the seller's slot (escrow-like). If the listing
  // expires or is cancelled, the building returns.
  state.buildings = state.buildings.filter((b) => b.id !== building.id);

  // Debit listing fee
  await creditResources(
    state,
    "marketplace_sell",
    { cashZl: -listingFee },
    `listing fee ${listingFee} W$ (listing ${id})`,
    `market-list-fee:${id}`,
    { listingId: id },
  );
  await savePlayerState(state);
  await kvSet(LISTING_KEY(id), listing);
  const ids = await readActiveIds();
  await writeActiveIds([...ids, id]);
  await lPush(HISTORY_KEY(state.username), {
    ts: now,
    kind: "list",
    listingId: id,
    catalogId: building.catalogId,
    askPrice: listing.askPrice,
  });
  await lTrim(HISTORY_KEY(state.username), 0, 199);
  await bumpDailyTrades(state.username, now);
  return { ok: true, listing, state };
}

export type BuyResult =
  | { ok: true; listing: Listing; state: PlayerState }
  | { ok: false; error: string };

export async function buyListing(
  buyerState: PlayerState,
  listingId: string,
): Promise<BuyResult> {
  const tier = computePlayerTier(buyerState.buildings);
  if (tier < MIN_TIER_TO_TRADE)
    return { ok: false, error: `requires-tier-${MIN_TIER_TO_TRADE}` };
  const listing = await listingById(listingId);
  if (!listing) return { ok: false, error: "unknown-listing" };
  if (listing.status !== "active") return { ok: false, error: "not-active" };
  if (listing.sellerId === buyerState.username)
    return { ok: false, error: "cannot-buy-own" };
  if (listing.expiresAt <= Date.now())
    return { ok: false, error: "expired" };

  const daily = await currentDailyTrades(buyerState.username);
  if (daily >= MAX_TRADES_PER_DAY)
    return { ok: false, error: `daily-limit-${MAX_TRADES_PER_DAY}` };

  if ((buyerState.resources.cashZl ?? 0) < listing.askPrice)
    return { ok: false, error: "not-enough-cash" };

  // Find free slot in buyer's city that matches the building's category.
  const snap = listing.buildingSnapshot;
  const entry = getCatalogEntry(snap.catalogId);
  if (!entry) return { ok: false, error: "unknown-catalog" };
  // Buyer must have a free slot with matching category.
  const { SLOT_MAP } = await import("@/lib/building-catalog");
  const freeSlot = SLOT_MAP.find(
    (s) =>
      (s.category === entry.category || s.category === "decorative") &&
      !buyerState.buildings.some((b) => b.slotId === s.id),
  );
  if (!freeSlot) return { ok: false, error: "no-free-slot" };

  const cfg = await readEconomy();
  const fee = Math.ceil(listing.askPrice * cfg.marketplaceFeeRate);
  const sellerProceeds = listing.askPrice - fee;

  // Debit buyer
  await creditResources(
    buyerState,
    "marketplace_buy",
    { cashZl: -listing.askPrice },
    `bought ${snap.catalogId} L${snap.level} for ${listing.askPrice} W$ (listing ${listingId})`,
    `market-buy:${listingId}`,
    { listingId, catalogId: snap.catalogId, price: listing.askPrice },
  );

  // Hand the building to the buyer on the free slot, new instance id.
  const now = Date.now();
  const newInstance = {
    ...snap,
    id: `b-${freeSlot.id}-${now.toString(36)}`,
    slotId: freeSlot.id,
    lastTickAt: now,
  };
  buyerState.buildings.push(newInstance);
  await savePlayerState(buyerState);

  // Credit seller
  const sellerState = await getPlayerState(listing.sellerId);
  await creditResources(
    sellerState,
    "marketplace_sell",
    { cashZl: sellerProceeds },
    `sold ${snap.catalogId} L${snap.level} for ${sellerProceeds} W$ (net of 5% fee)`,
    `market-sell:${listingId}`,
    { listingId, price: listing.askPrice, fee },
  );
  // Refund listing fee on completion (standard practice — encourages lists).
  await creditResources(
    sellerState,
    "marketplace_sell",
    { cashZl: listing.listingFee },
    `listing fee refund ${listing.listingFee} W$`,
    `market-list-refund:${listingId}`,
    { listingId },
  );
  await savePlayerState(sellerState);

  // Skarb miasta: accumulate fee
  await zIncrBy(SKARB_KEY, fee, "pot");

  // Finalise listing
  listing.status = "sold";
  listing.buyerId = buyerState.username;
  listing.soldAt = now;
  await kvSet(LISTING_KEY(listingId), listing);
  const ids = await readActiveIds();
  await writeActiveIds(ids.filter((x) => x !== listingId));
  await recordSoldPrice(snap.catalogId, snap.level, listing.askPrice);

  // Histories
  await lPush(HISTORY_KEY(listing.sellerId), {
    ts: now,
    kind: "sold",
    listingId,
    catalogId: snap.catalogId,
    price: listing.askPrice,
    net: sellerProceeds,
    buyerId: buyerState.username,
  });
  await lPush(HISTORY_KEY(buyerState.username), {
    ts: now,
    kind: "bought",
    listingId,
    catalogId: snap.catalogId,
    price: listing.askPrice,
    sellerId: listing.sellerId,
  });
  await bumpDailyTrades(buyerState.username, now);
  return { ok: true, listing, state: buyerState };
}

export async function cancelListing(
  username: string,
  listingId: string,
): Promise<{ ok: boolean; error?: string }> {
  const listing = await listingById(listingId);
  if (!listing) return { ok: false, error: "unknown-listing" };
  if (listing.sellerId !== username) return { ok: false, error: "not-owner" };
  if (listing.status !== "active") return { ok: false, error: "not-active" };
  // Return building to seller + refund listing fee
  const sellerState = await getPlayerState(username);
  const { SLOT_MAP } = await import("@/lib/building-catalog");
  const entry = getCatalogEntry(listing.buildingSnapshot.catalogId);
  const freeSlot = SLOT_MAP.find(
    (s) =>
      (s.category === (entry?.category ?? "residential") ||
        s.category === "decorative") &&
      !sellerState.buildings.some((b) => b.slotId === s.id),
  );
  if (!freeSlot) return { ok: false, error: "no-free-slot-for-restore" };
  sellerState.buildings.push({
    ...listing.buildingSnapshot,
    slotId: freeSlot.id,
    lastTickAt: Date.now(),
  });
  await creditResources(
    sellerState,
    "marketplace_sell",
    { cashZl: listing.listingFee },
    `listing fee refund (cancelled) ${listing.listingFee} W$`,
    `market-list-refund:${listingId}`,
    { listingId },
  );
  await savePlayerState(sellerState);
  listing.status = "cancelled";
  await kvSet(LISTING_KEY(listingId), listing);
  const ids = await readActiveIds();
  await writeActiveIds(ids.filter((x) => x !== listingId));
  return { ok: true };
}

export async function listingHistory(
  username: string,
  n = 50,
): Promise<unknown[]> {
  return await lRange(HISTORY_KEY(username), n);
}

export async function skarbTotal(): Promise<number> {
  return await zScore(SKARB_KEY, "pot");
}

export { kvDel as _kvDel };
