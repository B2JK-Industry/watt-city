import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* PR-3: asserts the 78-hex → 6-var refactor of the Katowice night
 * panorama is complete. Two checks:
 *
 *   1. components/city-scene.tsx and city-skyline-hero.tsx render every
 *      fill / stroke / stop-color / inline background through
 *      var(--scene-*) — no hardcoded hex survives in attribute
 *      position. (Pass-through hex from lib/building-catalog.ts via
 *      `{body}` / `{roof}` JSX expressions is permitted — those are JS
 *      strings, not inline CSS attribute literals, so they are out of
 *      scope for this refactor. Skin-aware catalog palette lands in a
 *      v1.1 follow-up per OPEN-QUESTIONS-LOG Q9.)
 *
 *   2. app/globals.css declares the six default roles, and
 *      app/globals-pko.css overrides them to the PKO navy palette per
 *      08-CITY-SCENE-REFACTOR-PLAN.md §2. */

const ROOT = join(__dirname, "..");
const SCENE = readFileSync(join(ROOT, "components", "city-scene.tsx"), "utf8");
const HERO = readFileSync(
  join(ROOT, "components", "city-skyline-hero.tsx"),
  "utf8",
);
const GLOBALS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
const PKO_CSS = readFileSync(join(ROOT, "app", "globals-pko.css"), "utf8");

const HEX_ATTR = /(fill|stroke|stopColor|stop-color|background)\s*[:=]\s*["']?#[0-9a-fA-F]{3,8}["']?/g;

describe("PR-3 — city-scene 78-hex → 6-var refactor", () => {
  it("components/city-scene.tsx contains zero hardcoded hex attributes", () => {
    const matches = SCENE.match(HEX_ATTR) ?? [];
    expect(matches, JSON.stringify(matches, null, 2)).toEqual([]);
  });

  it("components/city-skyline-hero.tsx contains zero hardcoded hex attributes", () => {
    // `fill={body}` / `fill={roof}` are expression bindings, not
    // attribute-literal hex, so the regex doesn't catch them and we
    // don't fail here. They resolve to building-catalog hex strings
    // at runtime; skin-aware catalog is a separate follow-up.
    const matches = HERO.match(HEX_ATTR) ?? [];
    expect(matches, JSON.stringify(matches, null, 2)).toEqual([]);
  });
});

describe("PR-3 — 6-role scene palette declarations", () => {
  it("app/globals.css :root declares the six scene roles (core defaults)", () => {
    expect(GLOBALS).toMatch(/--scene-sky-top:\s*#02021a/);
    expect(GLOBALS).toMatch(/--scene-sky-bottom:\s*#2a1458/);
    expect(GLOBALS).toMatch(/--scene-ground:\s*#0a0a0f/);
    expect(GLOBALS).toMatch(/--scene-building-primary:\s*#fde047/);
    expect(GLOBALS).toMatch(/--scene-building-secondary:\s*#22d3ee/);
    expect(GLOBALS).toMatch(/--scene-window-lit:\s*#facc15/);
  });

  it("app/globals-pko.css :root[data-skin=\"pko\"] overrides to navy palette", () => {
    // Each var resolves through the --sko-* ramp so the cascade stays
    // single-source-of-truth. Verify the indirection is in place.
    expect(PKO_CSS).toMatch(/--scene-sky-top:\s*var\(--sko-navy-700\)/);
    expect(PKO_CSS).toMatch(/--scene-sky-bottom:\s*var\(--sko-navy-900\)/);
    expect(PKO_CSS).toMatch(/--scene-ground:\s*var\(--sko-ink\)/);
    expect(PKO_CSS).toMatch(/--scene-building-primary:\s*var\(--sko-white\)/);
    expect(PKO_CSS).toMatch(
      /--scene-building-secondary:\s*var\(--sko-navy-300\)/,
    );
    expect(PKO_CSS).toMatch(
      /--scene-window-lit:\s*var\(--sko-accent-orange-light\)/,
    );
  });

  it("scene uses all six vars (none left unused — no dead tokens)", () => {
    for (const v of [
      "--scene-sky-top",
      "--scene-sky-bottom",
      "--scene-ground",
      "--scene-building-primary",
      "--scene-building-secondary",
      "--scene-window-lit",
    ]) {
      expect(SCENE, `${v} not referenced in city-scene.tsx`).toContain(v);
    }
  });
});
