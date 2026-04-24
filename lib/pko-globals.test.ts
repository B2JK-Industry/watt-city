import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* PR-1 shield: verifies the PKO design layer is wired from
 * app/globals.css → app/globals-pko.css, and that its `[data-skin="pko"]`
 * rules replace the brutalist primitives (thick borders, offset shadows,
 * uppercase headings, neon chips) with the banking-clean set verified
 * against pkobp.pl/junior 2026-04-24.
 *
 * We assert on the CSS source rather than a computed-style snapshot
 * because JSDOM does not resolve custom-property chains reliably and
 * the Tailwind v4 pipeline runs at build time, not test time. Parsing
 * the CSS file directly is a stable, high-signal check. */

const ROOT = join(__dirname, "..");
const GLOBALS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
const PKO_CSS = readFileSync(join(ROOT, "app", "globals-pko.css"), "utf8");

describe("PKO globals shield — mount + cascade", () => {
  it("app/globals.css imports globals-pko.css so the PKO layer loads", () => {
    expect(GLOBALS).toMatch(/@import\s+["']\.\/globals-pko\.css["'];?/);
  });

  it("PKO layer scopes every rule under :root[data-skin=\"pko\"]", () => {
    // Every rule block in the shield must be skin-scoped so the core
    // (yellow) skin is untouched. A stray unscoped .btn would leak.
    const ruleHeaders = PKO_CSS
      .split(/[{}]/)
      .filter((chunk) => chunk.includes(".btn") || chunk.includes(".card") || chunk.includes(".brutal-"));
    for (const header of ruleHeaders) {
      const hasSelector = /\S/.test(header);
      if (!hasSelector) continue;
      expect(header).toMatch(/data-skin="pko"/);
    }
  });
});

describe("PKO globals shield — verified navy tokens", () => {
  it("declares the four verified navy ramps from 04-DESIGN-TOKENS.json", () => {
    // Source: pkobp.pl/junior 2026-04-24. Counts in comments are the
    // occurrences observed on the live pages.
    expect(PKO_CSS).toContain("--sko-navy-900: #001E4B"); // 2×  darkest
    expect(PKO_CSS).toContain("--sko-navy-700: #003574"); // 97× PRIMARY
    expect(PKO_CSS).toContain("--sko-navy-500: #004C9A"); // 8×  hover
    expect(PKO_CSS).toContain("--sko-navy-300: #3074D5"); // 10× link/info
  });

  it("declares the verified border-light #E5E5E5 (25× on pkobp)", () => {
    expect(PKO_CSS).toContain("--sko-border-light: #E5E5E5");
  });

  it("remaps the core --accent to navy-700 under the PKO skin", () => {
    expect(PKO_CSS).toMatch(/--accent:\s*var\(--sko-navy-700\)/);
  });
});

describe("PKO globals shield — brutalism overrides", () => {
  it(".btn loses the 3px ink border and the hard-offset shadow", () => {
    // Extract the PKO .btn block and verify shape primitives flip.
    const match = PKO_CSS.match(/data-skin="pko"\]\s+\.btn\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toContain("border: none");
    // Asymmetric 10px 0 10px 0 corner is PKO signature (pkobp-button--primary).
    expect(block).toContain("--sko-radius-md-asym");
    // Soft drop shadow, not the brutalist 5px 5px 0 0 var(--ink).
    expect(block).toContain("--sko-shadow-card");
    expect(block).not.toMatch(/box-shadow:\s*\d+px\s+\d+px\s+0\s+0/);
  });

  it(".btn:hover drops the translate(-2px,-2px) brutalist push", () => {
    const match = PKO_CSS.match(/data-skin="pko"\]\s+\.btn:hover\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("transform: none");
  });

  it(".brutal-heading strips uppercase + letter-spacing + ::before decorator", () => {
    expect(PKO_CSS).toMatch(/\.brutal-heading\s*\{[^}]*text-transform:\s*none/);
    expect(PKO_CSS).toMatch(/\.brutal-heading::before\s*\{[^}]*content:\s*none/);
  });

  it(".brutal-tag becomes a capsule pill (9999px, no border, no offset shadow)", () => {
    const match = PKO_CSS.match(/data-skin="pko"\]\s+\.brutal-tag\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toContain("border: none");
    expect(block).toContain("--sko-radius-full");
    expect(block).toContain("box-shadow: none");
  });

  it("Tailwind arbitrary-value shield neutralises border-[3px] + brutal shadows + uppercase", () => {
    // These are 47 + 28 + 124 sites that only !important can beat.
    expect(PKO_CSS).toMatch(/border-\\?\[3px\\?\]/);
    expect(PKO_CSS).toMatch(/border-width:\s*1px\s*!important/);
    expect(PKO_CSS).toMatch(/\.uppercase\s*\{[^}]*text-transform:\s*none\s*!important/);
  });
});
