import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  type BuildingInstance,
} from "@/lib/player";
import { compareLoans } from "@/lib/loans";

async function reset(u: string) {
  await Promise.all([
    kvDel(`xp:player:${u}`),
    kvDel(`xp:player:${u}:ledger`),
    kvDel(`xp:player:${u}:ledger-dedup`),
  ]);
}

async function setupCashflow(u: string) {
  const state = await getPlayerState(u);
  state.buildings.push({
    id: "b-cmp",
    slotId: 7,
    catalogId: "sklepik",
    level: 5,
    builtAt: Date.now(),
    lastTickAt: Date.now(),
    cumulativeCost: {},
  } satisfies BuildingInstance);
  await savePlayerState(state);
  return state;
}

describe("V3.7 compareLoans", () => {
  const u = "v3-cmp-user";
  beforeEach(() => reset(u));

  it("sorts rows by totalInterest ascending", async () => {
    await setupCashflow(u);
    const state = await getPlayerState(u);
    const rows = compareLoans(3000, 12, state);
    expect(rows.length).toBeGreaterThan(1);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].totalInterest).toBeGreaterThanOrEqual(
        rows[i - 1].totalInterest,
      );
    }
  });

  it("flags kredyt_konsumencki with warning=true", async () => {
    await setupCashflow(u);
    const state = await getPlayerState(u);
    const rows = compareLoans(3000, 12, state);
    const konsumencki = rows.find((r) => r.type === "kredyt_konsumencki");
    expect(konsumencki).toBeTruthy();
    expect(konsumencki!.warning).toBe(true);
  });

  it("flags the mortgage (lowest APR) as cheapest for principal=3000 term=12", async () => {
    await setupCashflow(u);
    const state = await getPlayerState(u);
    const rows = compareLoans(3000, 12, state);
    const cheapest = rows.find((r) => r.cheapest);
    expect(cheapest).toBeTruthy();
    // Mortgage at 8% APR is the cheapest among the eligible products
    expect(cheapest!.type).toBe("mortgage");
    expect(cheapest!.warning).toBe(false);
  });

  it("filters out products with incompatible term lengths", async () => {
    await setupCashflow(u);
    const state = await getPlayerState(u);
    // term=1 is only valid for kredyt_obrotowy — others should be absent.
    const rows = compareLoans(500, 1, state);
    const types = rows.map((r) => r.type);
    expect(types).toContain("kredyt_obrotowy");
    expect(types).not.toContain("mortgage"); // 12/24/36 only
    expect(types).not.toContain("kredyt_konsumencki"); // 6/12/24
  });

  it("returns empty array if no product matches the term", async () => {
    await setupCashflow(u);
    const state = await getPlayerState(u);
    const rows = compareLoans(500, 99, state); // unsupported term
    expect(rows).toEqual([]);
  });
});
