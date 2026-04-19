import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* Cleanup issue 2 — CITY_TIERS residue purge.
 *
 * The V1 tier-name vocabulary ("Drewniana chata", "Altus Tower", etc.)
 * was supposed to disappear post-V3.1 but survived in app/layout.tsx
 * TierUpToast titleByTier. That table rendered on every level-up to
 * every logged-in user. This test guards against its return.
 *
 * We do a file-level read so the test catches a regression even if the
 * runtime mounts the component correctly — e.g. a copy-paste into a new
 * component. Scoped to the Slovak-ambiguous tier nouns; the "Varso
 * Tower" reference in /o-platforme LEVEL_UNLOCKS ladder is explicitly
 * preserved per audit scope.
 */

const ROOT = join(__dirname, "..");
const LAYOUT_TSX = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");

const FORBIDDEN_IN_LAYOUT = [
  "Drewniana chata",
  "Drevená",
  "Rodzinny dom",
  "Dom robotniczy",
  "Kamienica",
  "Solarna kamienica",
  "Biurowiec",
  "Mrakodrap",
  "Altus Tower",
  "Spodek",
];

describe("issue 2 — layout.tsx no longer passes tier names to TierUpToast", () => {
  for (const phrase of FORBIDDEN_IN_LAYOUT) {
    it(`does not contain "${phrase}"`, () => {
      expect(LAYOUT_TSX.includes(phrase), `found "${phrase}" in app/layout.tsx`).toBe(
        false,
      );
    });
  }

  it("still mounts TierUpToast (regression: don't accidentally rip the whole toast)", () => {
    expect(LAYOUT_TSX.includes("<TierUpToast")).toBe(true);
  });

  it("passes `levelWord` for localization (new contract)", () => {
    expect(LAYOUT_TSX.includes("levelWord={")).toBe(true);
  });
});
