import { describe, it, expect } from "vitest";

/* R-04 token guard for the leaderboard podium tiles.
 *
 * The 1st-place tile has `bg-[var(--sales)]` (= #db912c) with text
 * inside the tile (username + W$). The PR-pass-6 audit caught that
 * white text on the orange fill rendered at ~3.6:1 — fail for body
 * text under WCAG AA. The fix swaps to navy text for rank 1 (navy on
 * orange = AA-safe). This test pins the relationship so a future
 * palette swap can't quietly regress it.
 *
 * The other two tiles use `--ink-subtle` (silver) and `--surface-2`
 * (off-white) backgrounds — `--ink` text on both is well over AA.
 */

function hexToRgb(hex: string): [number, number, number] {
  const stripped = hex.replace(/^#/, "");
  const expanded =
    stripped.length === 3
      ? stripped
          .split("")
          .map((c) => c + c)
          .join("")
      : stripped;
  const intVal = parseInt(expanded, 16);
  return [(intVal >> 16) & 0xff, (intVal >> 8) & 0xff, intVal & 0xff];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [la, lb] = [
    relativeLuminance(hexToRgb(a)),
    relativeLuminance(hexToRgb(b)),
  ];
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

// Authoritative pko tokens (lib/theme.ts PKO_THEME.colors).
const SALES_ORANGE = "#db912c";
const ACCENT_NAVY = "#003574";
const INK = "#000000";
const INK_SUBTLE = "#b7b7b7";
const SURFACE_2 = "#f9f9f9";
const WHITE = "#ffffff";

const WCAG_AA_BODY = 4.5;

describe("podium tile contrast (R-04)", () => {
  it("rank 1: navy text on sales-orange tile is AA-safe", () => {
    const ratio = contrastRatio(ACCENT_NAVY, SALES_ORANGE);
    expect(
      ratio,
      `accent navy on sales orange = ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it("rank 1: white text on sales-orange would FAIL — guards the chosen mapping", () => {
    // Documents WHY we don't use white. Keeps the regression evidence.
    const ratio = contrastRatio(WHITE, SALES_ORANGE);
    expect(ratio).toBeLessThan(WCAG_AA_BODY);
  });

  it("rank 2: ink text on ink-subtle silver is AA-safe", () => {
    const ratio = contrastRatio(INK, INK_SUBTLE);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it("rank 3: ink text on surface-2 off-white is AA-safe", () => {
    const ratio = contrastRatio(INK, SURFACE_2);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });
});
