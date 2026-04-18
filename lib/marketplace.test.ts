import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, kvSet } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
} from "@/lib/player";
import {
  createListing,
  buyListing,
  cancelListing,
  listActiveListings,
  MIN_TIER_TO_TRADE,
} from "./marketplace";

async function primePlayer(u: string, tier7 = true) {
  await kvSet(`xp:user:${u}`, { username: u });
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
  await kvDel(`xp:marketplace:active`);
  await kvDel(`xp:marketplace:history:${u}`);
  const state = await getPlayerState(u);
  if (tier7) {
    // Load up buildings so tier computes to 7 (need sum(levels) ≥ 49).
    for (let i = 0; i < 10; i++) {
      state.buildings.push({
        id: `b-${u}-${i}`,
        slotId: i,
        catalogId: i === 0 ? "huta-szkla" : "sklepik",
        level: 5,
        builtAt: Date.now(),
        lastTickAt: Date.now(),
        cumulativeCost: {},
      });
    }
  }
  await savePlayerState(state);
}

describe("marketplace — tier gate + list + buy", () => {
  beforeEach(async () => {
    await primePlayer("seller");
    await primePlayer("buyer");
    await primePlayer("noobie", false);
  });

  it("T<7 player cannot list", async () => {
    let state = await getPlayerState("noobie");
    state.buildings.push({
      id: "b-noob-1",
      slotId: 0,
      catalogId: "sklepik",
      level: 1,
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    });
    await savePlayerState(state);
    state = await getPlayerState("noobie");
    const r = await createListing(state, { instanceId: "b-noob-1", askPrice: 100 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe(`requires-tier-${MIN_TIER_TO_TRADE}`);
  });

  it("seller lists + buyer buys → both ledgers reflect transfer", async () => {
    let seller = await getPlayerState("seller");
    // seller needs cashZl for listing fee
    await creditResources(
      seller,
      "admin_grant",
      { cashZl: 1000 },
      "grant",
      "grant:seller:1",
    );
    seller = await getPlayerState("seller");
    const list = await createListing(seller, {
      instanceId: "b-seller-1",
      askPrice: 500,
    });
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    const all = await listActiveListings();
    expect(all.some((l) => l.id === list.listing.id)).toBe(true);

    let buyer = await getPlayerState("buyer");
    await creditResources(buyer, "admin_grant", { cashZl: 1000 }, "grant", "grant:buyer:1");
    buyer = await getPlayerState("buyer");
    const buy = await buyListing(buyer, list.listing.id);
    expect(buy.ok).toBe(true);
    if (!buy.ok) return;
    // Buyer's cashZl drops by 500; seller's rises by 475 (500 - 5% fee) + 5 refund = 480
    expect(buy.state.resources.cashZl).toBe(500); // 1000 - 500
    const sellerAfter = await getPlayerState("seller");
    // Initial 1000 - 5 listing fee + 475 net + 5 refund = 1475
    expect(sellerAfter.resources.cashZl).toBe(1475);
    // Building moved from seller to buyer
    expect(sellerAfter.buildings.find((b) => b.id === "b-seller-1")).toBeUndefined();
    expect(buy.state.buildings.some((b) => b.catalogId === "sklepik" && b.level === 5))
      .toBe(true);
  });

  it("cancel restores the building to the seller + refunds listing fee", async () => {
    let seller = await getPlayerState("seller");
    await creditResources(seller, "admin_grant", { cashZl: 1000 }, "grant", "grant:seller:2");
    seller = await getPlayerState("seller");
    const list = await createListing(seller, {
      instanceId: "b-seller-2",
      askPrice: 300,
    });
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    const cancel = await cancelListing("seller", list.listing.id);
    expect(cancel.ok).toBe(true);
    const after = await getPlayerState("seller");
    // Refund received = listing fee (3 zł on 300 ask) → net cashZl 1000
    expect(after.resources.cashZl).toBe(1000);
    expect(after.buildings.some((b) => b.catalogId === "sklepik")).toBe(true);
  });
});
