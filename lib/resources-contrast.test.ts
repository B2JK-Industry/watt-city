import { describe, it, expect } from "vitest";
import { RESOURCE_DEFS, RESOURCE_KEYS } from "./resources";

/* Token guard for the F-NEW-01 fix.
 *
 * `RESOURCE_DEFS[*].lightColor` renders as foreground text inside a
 * `bg-[var(--surface)]` (= `#ffffff`) chip in `components/resource-bar.tsx`.
 * Axe-core's color-contrast rule requires ≥ 4.5:1 for body text. If
 * anyone re-introduces a neon-on-white value here the walkthrough
 * spec will surface 18 serious findings on the next run — this unit
 * test fails fast in vitest before that can happen.
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
  // WCAG 2.x — sRGB to relative luminance.
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(hexToRgb(a)), relativeLuminance(hexToRgb(b))];
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

const SURFACE_WHITE = "#ffffff";
const WCAG_AA_BODY = 4.5;

describe("RESOURCE_DEFS lightColor contrast", () => {
  it("declares a lightColor for every resource key", () => {
    for (const k of RESOURCE_KEYS) {
      expect(RESOURCE_DEFS[k].lightColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it.each(RESOURCE_KEYS)(
    "%s.lightColor passes WCAG AA on white (≥ 4.5:1)",
    (k) => {
      const ratio = contrastRatio(RESOURCE_DEFS[k].lightColor, SURFACE_WHITE);
      expect(
        ratio,
        `${k} lightColor=${RESOURCE_DEFS[k].lightColor} contrast=${ratio.toFixed(
          2,
        )}:1 fails AA`,
      ).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    },
  );

  it("contrastRatio helper is sane on known fixtures", () => {
    // Documented WCAG examples — within rounding tolerance.
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#ffffff")).toBeGreaterThan(4.4);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.7);
  });
});
