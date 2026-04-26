import { describe, it, expect } from "vitest";
import type { PlayerState } from "./player";
import { slotSnapshot } from "./buildings";

/* R-12 contract guard for `slotSnapshot`.
 *
 * The /miasto page bootstrap and the /api/buildings refresh both
 * lean on `slot.upgrade` being present (or explicitly `null` at
 * L10). The client BuildingDetail does:
 *
 *   const canUpgrade = hasUpgrade && upgrade.nextLevelAffordable && !busy;
 *
 * If `upgrade` was silently dropped from the API response (the
 * pass-7 R-12 root cause — destructure-and-rebuild forgot the
 * field), the client crashed on next render. This test pins the
 * shape so a future GET-handler refactor can't silently drop
 * `upgrade` again.
 *
 * The test only exercises pure functions (no Redis); building entries
 * are constructed inline so we don't depend on `awardXP` or signup
 * gift seeding.
 */

const EMPTY_STATE: PlayerState = {
  username: "test",
  buildings: [],
  resources: {
    watts: 0,
    coins: 0,
    bricks: 0,
    glass: 0,
    steel: 0,
    code: 0,
    cashZl: 0,
  },
  loans: [],
  ledger: { entries: [] } as never,
  achievements: [],
  creditScore: 50,
  brownoutCounter: 0,
  totalDefaultsHistorical: 0,
} as unknown as PlayerState;

const STATE_WITH_DOMEK_L1: PlayerState = {
  ...EMPTY_STATE,
  buildings: [
    {
      id: "b1",
      slotId: 1,
      catalogId: "domek",
      level: 1,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    },
  ] as PlayerState["buildings"],
  resources: {
    ...EMPTY_STATE.resources,
    coins: 5000,
  },
};

describe("slotSnapshot — `upgrade` field contract", () => {
  it("includes `upgrade` on every slot, not just the keys the API destructures", () => {
    const snap = slotSnapshot(STATE_WITH_DOMEK_L1);
    for (const entry of snap) {
      expect(entry, "every snapshot entry must expose `upgrade`").toHaveProperty(
        "upgrade",
      );
    }
  });

  it("populates `upgrade` for occupied slots below L10", () => {
    const snap = slotSnapshot(STATE_WITH_DOMEK_L1);
    const occupied = snap.find((s) => s.building?.id === "b1");
    expect(occupied).toBeTruthy();
    expect(occupied!.upgrade).not.toBeNull();
    expect(occupied!.upgrade!.nextLevelCost).toBeTruthy();
    expect(typeof occupied!.upgrade!.nextLevelAffordable).toBe("boolean");
    expect(occupied!.upgrade!.missing).toBeDefined();
  });

  it("returns `upgrade: null` for empty slots (caller can short-circuit)", () => {
    const snap = slotSnapshot(EMPTY_STATE);
    for (const entry of snap) {
      expect(entry.building).toBeNull();
      expect(entry.upgrade).toBeNull();
    }
  });

  it("`upgrade.nextLevelAffordable` reflects the player resources", () => {
    const broke: PlayerState = {
      ...STATE_WITH_DOMEK_L1,
      resources: { ...STATE_WITH_DOMEK_L1.resources, coins: 0 },
    };
    const snap = slotSnapshot(broke);
    const occupied = snap.find((s) => s.building?.id === "b1");
    expect(occupied!.upgrade!.nextLevelAffordable).toBe(false);
    expect(Object.keys(occupied!.upgrade!.missing).length).toBeGreaterThan(0);
  });
});
