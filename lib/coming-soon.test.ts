import { describe, it, expect } from "vitest";
import { COMING_SOON_TILES } from "@/components/coming-soon-banner";

describe("V4.8 coming-soon tiles", () => {
  it("has 4-5 tiles (design spec)", () => {
    expect(COMING_SOON_TILES.length).toBeGreaterThanOrEqual(4);
    expect(COMING_SOON_TILES.length).toBeLessThanOrEqual(8);
  });

  it("every tile has emoji + non-empty PL + EN teaser", () => {
    for (const tile of COMING_SOON_TILES) {
      expect(tile.kind.length).toBeGreaterThan(0);
      expect(tile.emoji.length).toBeGreaterThan(0);
      expect(tile.teaser.pl.length).toBeGreaterThan(5);
      expect(tile.teaser.en.length).toBeGreaterThan(5);
      expect(tile.teaser.uk.length).toBeGreaterThan(5);
      expect(tile.teaser.cs.length).toBeGreaterThan(5);
    }
  });

  it("every tile kind is unique", () => {
    const kinds = COMING_SOON_TILES.map((t) => t.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("includes the 5 examples from the design doc", () => {
    const kinds = COMING_SOON_TILES.map((t) => t.kind);
    expect(kinds).toContain("portfolio-pick");
    expect(kinds).toContain("tax-fill");
    expect(kinds).toContain("scenario-dialog");
  });
});
