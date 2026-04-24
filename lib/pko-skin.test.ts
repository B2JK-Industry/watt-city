import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { resolveTheme, CORE_THEME, PKO_THEME, currentSkin } from "./theme";

/* PKO-redesign (2026-04) — pko is now the default skin, light-mode
 * navy primary with warm-orange sales accent. core skin kept as
 * legacy opt-in (SKIN=core). Theme object is broader — colors.*
 * includes accentHover / sales / inkMuted / line / success / danger. */

const ROOT = join(__dirname, "..");
const LAYOUT = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");

describe("skin — resolver + defaults", () => {
  it("resolveTheme('core') returns the legacy core skin", () => {
    expect(resolveTheme("core")).toBe(CORE_THEME);
  });

  it("resolveTheme('pko') returns the PKO skin", () => {
    expect(resolveTheme("pko")).toBe(PKO_THEME);
  });

  it("currentSkin() defaults to 'pko' when env is unset", () => {
    const prevSkin = process.env.SKIN;
    const prevPub = process.env.NEXT_PUBLIC_SKIN;
    delete process.env.SKIN;
    delete process.env.NEXT_PUBLIC_SKIN;
    try {
      expect(currentSkin()).toBe("pko");
    } finally {
      if (prevSkin !== undefined) process.env.SKIN = prevSkin;
      if (prevPub !== undefined) process.env.NEXT_PUBLIC_SKIN = prevPub;
    }
  });

  it("currentSkin() returns 'core' only on explicit opt-in", () => {
    const prev = process.env.SKIN;
    process.env.SKIN = "core";
    try {
      expect(currentSkin()).toBe("core");
    } finally {
      if (prev === undefined) delete process.env.SKIN;
      else process.env.SKIN = prev;
    }
  });
});

describe("PKO theme — palette", () => {
  it("uses navy as primary accent (not red)", () => {
    expect(PKO_THEME.colors.accent).toBe("#003574");
    expect(PKO_THEME.colors.accentHover).toBe("#004c9a");
  });

  it("uses warm orange for sales accent", () => {
    expect(PKO_THEME.colors.sales).toBe("#db912c");
    expect(PKO_THEME.colors.salesHover).toBe("#cc7a09");
  });

  it("background is white (light-mode posture)", () => {
    expect(PKO_THEME.colors.background).toBe("#ffffff");
    expect(PKO_THEME.colors.surface).toBe("#ffffff");
    expect(PKO_THEME.colors.surfaceAlt).toBe("#f9f9f9");
  });

  it("includes ink, line, and feedback semantic colors", () => {
    expect(PKO_THEME.colors.ink).toBe("#000000");
    expect(PKO_THEME.colors.inkMuted).toBe("#636363");
    expect(PKO_THEME.colors.inkSubtle).toBe("#b7b7b7");
    expect(PKO_THEME.colors.line).toBe("#e5e5e5");
    expect(PKO_THEME.colors.success).toBe("#2e7d49");
    expect(PKO_THEME.colors.danger).toBe("#c0342b");
  });

  it("mascot is null until real asset is delivered", () => {
    // Placeholder SVG reads as broken image — SKO-revert lesson 1-C.
    expect(PKO_THEME.mascot).toBeNull();
  });
});

describe("layout.tsx — skin injection", () => {
  it("injects full theme palette as CSS vars when pko", () => {
    expect(LAYOUT.includes('theme.id === "pko"')).toBe(true);
    expect(LAYOUT.includes('"--accent": theme.colors.accent')).toBe(true);
    expect(LAYOUT.includes('"--accent-hover": theme.colors.accentHover')).toBe(true);
    expect(LAYOUT.includes('"--sales": theme.colors.sales')).toBe(true);
    expect(LAYOUT.includes('"--background": theme.colors.background')).toBe(true);
    expect(LAYOUT.includes('"--surface": theme.colors.surface')).toBe(true);
    expect(LAYOUT.includes('"--surface-2": theme.colors.surfaceAlt')).toBe(true);
    expect(LAYOUT.includes('"--ink": theme.colors.ink')).toBe(true);
    expect(LAYOUT.includes('"--ink-muted": theme.colors.inkMuted')).toBe(true);
    expect(LAYOUT.includes('"--line": theme.colors.line')).toBe(true);
  });

  it("<html> gets data-skin + style attributes", () => {
    expect(LAYOUT.includes("data-skin={theme.id}")).toBe(true);
    expect(LAYOUT.includes("style={skinVars}")).toBe(true);
  });

  it("loads Inter font alongside Geist", () => {
    expect(LAYOUT.includes("Inter")).toBe(true);
    expect(LAYOUT.includes("--font-inter")).toBe(true);
  });
});

describe("CORE vs PKO — no accidental aliasing", () => {
  it("differ in accent and background", () => {
    expect(CORE_THEME.colors.accent).not.toBe(PKO_THEME.colors.accent);
    expect(CORE_THEME.colors.background).not.toBe(PKO_THEME.colors.background);
  });
});
