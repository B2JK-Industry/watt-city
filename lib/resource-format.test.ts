import { describe, it, expect } from "vitest";
import {
  computeMissing,
  hasMissing,
  formatResourceBundle,
  formatResourceCost,
  formatResourceDelta,
  formatResourceYield,
  formatResourceMissing,
  RESOURCE_BUNDLE_SEPARATOR,
} from "./resource-format";
import { ZERO_RESOURCES } from "./resources";

/* Tests the pure formatting + affordability helpers that back the
 * economy-transparency fix. We cover:
 *   1. `computeMissing` — exact subtraction, edge cases, deprecated keys,
 *      non-positive entries.
 *   2. `hasMissing` — truthiness on every shape of bundle.
 *   3. `formatResourceBundle` — canonical icon rendering, stable ordering,
 *      signed vs unsigned, label modes, empty placeholder override.
 *   4. Convenience wrappers (`formatResourceCost`, etc.) — delegate
 *      correctly and carry the right defaults.
 */

describe("computeMissing", () => {
  it("returns empty when the player can afford everything", () => {
    const have = { ...ZERO_RESOURCES, coins: 100, bricks: 80 };
    expect(computeMissing(have, { coins: 50, bricks: 80 })).toEqual({});
  });

  it("reports exact shortfall per resource", () => {
    const have = { ...ZERO_RESOURCES, coins: 20, bricks: 40 };
    expect(computeMissing(have, { coins: 50, bricks: 80 })).toEqual({
      coins: 30,
      bricks: 40,
    });
  });

  it("omits resources the player has enough of (no zero-entries)", () => {
    const have = { ...ZERO_RESOURCES, coins: 100, bricks: 10 };
    expect(computeMissing(have, { coins: 80, bricks: 40 })).toEqual({
      bricks: 30,
    });
  });

  it("ignores need entries that are zero or undefined", () => {
    const have = { ...ZERO_RESOURCES };
    expect(computeMissing(have, { coins: 0, bricks: undefined as unknown as number })).toEqual({});
  });

  it("ignores negative need entries (defensive: cost is always positive)", () => {
    const have = { ...ZERO_RESOURCES };
    expect(computeMissing(have, { coins: -5 })).toEqual({});
  });

  it("handles deprecated keys (glass, steel, code) exactly like active ones", () => {
    const have = { ...ZERO_RESOURCES, glass: 5 };
    expect(computeMissing(have, { glass: 20 })).toEqual({ glass: 15 });
  });

  it("is pure — does not mutate inputs", () => {
    const have = { ...ZERO_RESOURCES, coins: 10 };
    const need = { coins: 50 };
    computeMissing(have, need);
    expect(have.coins).toBe(10);
    expect(need.coins).toBe(50);
  });
});

describe("hasMissing", () => {
  it("returns false on empty object", () => {
    expect(hasMissing({})).toBe(false);
  });

  it("returns false when every entry is zero or undefined", () => {
    expect(hasMissing({ coins: 0 })).toBe(false);
  });

  it("returns true on any positive entry", () => {
    expect(hasMissing({ coins: 1 })).toBe(true);
    expect(hasMissing({ bricks: 100, coins: 0 })).toBe(true);
  });

  it("treats negative entries as no-missing (shortfall is always positive)", () => {
    // `computeMissing` never produces negatives, but be defensive.
    expect(hasMissing({ coins: -5 })).toBe(false);
  });
});

describe("formatResourceBundle", () => {
  it("renders unsigned icon bundle by default", () => {
    const out = formatResourceBundle({ coins: 50, bricks: 80 }, "pl");
    // Order follows RESOURCE_KEYS — watts, coins, bricks, glass, steel, code, cashZl.
    // So coins comes before bricks.
    expect(out).toBe(`50 🪙${RESOURCE_BUNDLE_SEPARATOR}80 🧱`);
  });

  it("renders signed bundle when `signed: true`", () => {
    const out = formatResourceBundle(
      { watts: 12, coins: -4 },
      "pl",
      { signed: true },
    );
    expect(out).toBe(`+12 ⚡${RESOURCE_BUNDLE_SEPARATOR}-4 🪙`);
  });

  it("omits zero, undefined, and missing entries", () => {
    const out = formatResourceBundle({ coins: 50, bricks: 0, watts: undefined }, "pl");
    expect(out).toBe("50 🪙");
  });

  it("returns the placeholder when the bundle is empty", () => {
    expect(formatResourceBundle({}, "pl")).toBe("—");
  });

  it("respects custom empty placeholder", () => {
    expect(formatResourceBundle({}, "pl", { emptyPlaceholder: "(none)" })).toBe("(none)");
    expect(formatResourceBundle({}, "pl", { emptyPlaceholder: "" })).toBe("");
  });

  it("label mode uses localized label", () => {
    const out = formatResourceBundle({ bricks: 80 }, "pl", { mode: "label" });
    expect(out).toBe("80 Cegły");
    const en = formatResourceBundle({ bricks: 80 }, "en", { mode: "label" });
    expect(en).toBe("80 Bricks");
  });

  it("icon-label mode combines both", () => {
    const out = formatResourceBundle({ bricks: 80 }, "pl", { mode: "icon-label" });
    expect(out).toBe("80 🧱 Cegły");
  });

  it("ordering is deterministic and follows RESOURCE_KEYS", () => {
    // Feed keys in a chaotic order — output order must still be stable.
    const bundle: Record<string, number> = {
      cashZl: 5,
      bricks: 4,
      coins: 3,
      watts: 2,
    };
    const out = formatResourceBundle(bundle, "pl");
    // Expected: watts → coins → bricks → cashZl.
    const parts = out.split(RESOURCE_BUNDLE_SEPARATOR);
    expect(parts[0]).toMatch(/⚡/);
    expect(parts[1]).toMatch(/🪙/);
    expect(parts[2]).toMatch(/🧱/);
    expect(parts[3]).toMatch(/💵/);
  });

  it("deprecated keys render like any other if present", () => {
    expect(formatResourceBundle({ glass: 20 }, "pl")).toBe("20 🪟");
  });
});

describe("convenience wrappers", () => {
  it("formatResourceCost is unsigned + icon default", () => {
    expect(formatResourceCost({ coins: 50 }, "pl")).toBe("50 🪙");
  });

  it("formatResourceYield is unsigned + icon default (caller appends /h)", () => {
    expect(formatResourceYield({ watts: 8 }, "pl")).toBe("8 ⚡");
  });

  it("formatResourceDelta signs positive entries with +", () => {
    expect(formatResourceDelta({ coins: 12 }, "pl")).toBe("+12 🪙");
  });

  it("formatResourceMissing returns empty string (not —) when nothing missing", () => {
    // Different from the generic bundle — empty missing should not render a
    // placeholder in the UI; the chip is simply hidden.
    expect(formatResourceMissing({}, "pl")).toBe("");
  });

  it("formatResourceMissing still renders shortfalls normally", () => {
    expect(formatResourceMissing({ bricks: 48, coins: 30 }, "pl")).toBe(
      `30 🪙${RESOURCE_BUNDLE_SEPARATOR}48 🧱`,
    );
  });
});
