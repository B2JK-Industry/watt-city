import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { resolveTheme, CORE_THEME, PKO_THEME } from "./theme";

/* D8 — SKIN=pko verification + polish.
 *
 * Pre-D8 state: only the <span> brand chip in the nav used the PKO
 * colours directly; every other consumer read `var(--accent)` from
 * `:root` which hardcoded the Watt City yellow. Switching SKIN=pko
 * changed the brand label but the page still looked yellow.
 *
 * D8 polish — `app/layout.tsx` now spreads `theme.colors.*` as inline
 * CSS variables on `<html>` when `SKIN=pko`, so every existing
 * var(--*) consumer picks up the skin without rewrite. data-skin="pko"
 * attribute lets tests + ops key off the skin.
 */

const ROOT = join(__dirname, "..");
const LAYOUT = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");

describe("D8 — SKIN=pko skin propagation", () => {
  it("resolveTheme('core') returns the default skin", () => {
    expect(resolveTheme("core")).toBe(CORE_THEME);
  });

  it("resolveTheme('pko') returns the PKO skin", () => {
    expect(resolveTheme("pko")).toBe(PKO_THEME);
    // Verified tokens from 04-DESIGN-TOKENS.json (pkobp.pl/junior scan):
    // navy-700 #003574 is the DOMINANT brand colour (97× occurrences),
    // navy-900 #001E4B is the hero / darkest background.
    expect(PKO_THEME.colors.accent).toBe("#003574");
    expect(PKO_THEME.colors.background).toBe("#001E4B");
    expect(PKO_THEME.colors.surface).toBe("#003574");
    expect(PKO_THEME.colors.ink).toBe("#ffffff");
  });

  it("layout.tsx injects theme palette as CSS vars when pko", () => {
    // We expect the code path that builds `skinVars` from `theme.colors.*`.
    expect(LAYOUT.includes('theme.id === "pko"')).toBe(true);
    expect(LAYOUT.includes('"--accent": theme.colors.accent')).toBe(true);
    expect(LAYOUT.includes('"--background": theme.colors.background')).toBe(true);
    expect(LAYOUT.includes('"--surface": theme.colors.surface')).toBe(true);
    expect(LAYOUT.includes('"--ink": theme.colors.ink')).toBe(true);
  });

  it("<html> gets data-skin + style attributes", () => {
    expect(LAYOUT.includes('data-skin={theme.id}')).toBe(true);
    expect(LAYOUT.includes('style={skinVars}')).toBe(true);
  });
});

describe("D8 — PKO theme constants", () => {
  it("PKO_THEME mascot is Żyrafa with inline SVG", () => {
    expect(PKO_THEME.mascot).not.toBeNull();
    expect(PKO_THEME.mascot?.id).toBe("zyrafa");
    expect(PKO_THEME.mascot?.svg.includes("<svg")).toBe(true);
  });

  it("PKO_THEME disclaimer references PKO BP + forbids PLN swap", () => {
    expect(PKO_THEME.disclaimer.includes("PKO BP")).toBe(true);
    expect(PKO_THEME.disclaimer.includes("PLN")).toBe(true);
  });

  it("CORE_THEME is colour-distinct from PKO_THEME (no accidental aliasing)", () => {
    expect(CORE_THEME.colors.accent).not.toBe(PKO_THEME.colors.accent);
    expect(CORE_THEME.colors.background).not.toBe(PKO_THEME.colors.background);
    expect(CORE_THEME.brand).not.toBe(PKO_THEME.brand);
  });
});
