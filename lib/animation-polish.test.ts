import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* D6 — animation polish.
 *
 * Scope:
 *   - Confetti respects prefers-reduced-motion (returns null)
 *   - CountUp exists + respects reduced-motion (set final immediately)
 *   - TierUpToast entrance animation is motion-safe
 *   - HUD delta flash keyframe + consumer component (ResourceFlashChip)
 */

const ROOT = join(__dirname, "..");
const CONFETTI = readFileSync(
  join(ROOT, "components", "confetti.tsx"),
  "utf8",
);
const COUNTUP = readFileSync(
  join(ROOT, "components", "count-up.tsx"),
  "utf8",
);
const TOAST = readFileSync(
  join(ROOT, "components", "tier-up-toast.tsx"),
  "utf8",
);
const FLASH = readFileSync(
  join(ROOT, "components", "resource-flash-chip.tsx"),
  "utf8",
);
const ROUND = readFileSync(
  join(ROOT, "components", "games", "round-result.tsx"),
  "utf8",
);
const CSS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

describe("D6 — animation polish", () => {
  describe("Confetti", () => {
    it("short-circuits when prefers-reduced-motion is set", () => {
      expect(CONFETTI.includes("prefers-reduced-motion: reduce")).toBe(true);
      expect(CONFETTI.includes("if (reduced) return null")).toBe(true);
    });

    it("hooks matchMedia change events to stay in sync", () => {
      expect(CONFETTI.includes("addEventListener")).toBe(true);
      expect(CONFETTI.includes("removeEventListener")).toBe(true);
    });
  });

  describe("CountUp", () => {
    it('exports a "use client" CountUp component', () => {
      expect(COUNTUP.startsWith('"use client"')).toBe(true);
      expect(COUNTUP.includes("export function CountUp")).toBe(true);
    });

    it("accepts value + durationMs props", () => {
      expect(COUNTUP.includes("value: number")).toBe(true);
      expect(COUNTUP.includes("durationMs?")).toBe(true);
    });

    it("sets final value immediately under reduced-motion", () => {
      expect(COUNTUP.includes("prefers-reduced-motion: reduce")).toBe(true);
      expect(COUNTUP.includes("if (reduce)")).toBe(true);
    });

    it("uses requestAnimationFrame with cubic ease-out", () => {
      expect(COUNTUP.includes("requestAnimationFrame")).toBe(true);
      expect(COUNTUP.includes("cancelAnimationFrame")).toBe(true);
    });
  });

  describe("RoundResult reveals awarded via CountUp", () => {
    it("imports + mounts CountUp on the awarded score", () => {
      expect(ROUND.includes('from "@/components/count-up"')).toBe(true);
      expect(ROUND.includes("<CountUp value={awarded}")).toBe(true);
    });
  });

  describe("TierUpToast has motion-safe entrance", () => {
    it("applies tier-up-enter animation with motion-safe gate", () => {
      expect(TOAST.includes("motion-safe:animate-[tier-up-enter")).toBe(true);
    });

    it("globals.css declares the tier-up-enter keyframe", () => {
      expect(CSS.includes("@keyframes tier-up-enter")).toBe(true);
    });
  });

  describe("HUD delta flash", () => {
    it("globals.css declares the hud-delta-flash keyframe", () => {
      expect(CSS.includes("@keyframes hud-delta-flash")).toBe(true);
      // CSS-variable-driven colour so consumers can switch up/down.
      expect(CSS.includes("--delta-flash")).toBe(true);
    });

    it("ResourceFlashChip watches value + picks lime/pink direction", () => {
      expect(FLASH.startsWith('"use client"')).toBe(true);
      expect(FLASH.includes("var(--neo-lime)")).toBe(true);
      expect(FLASH.includes("var(--neo-pink)")).toBe(true);
      expect(FLASH.includes("motion-safe:animate-[hud-delta-flash")).toBe(true);
    });

    it("ResourceFlashChip skips the flash under reduced-motion", () => {
      expect(FLASH.includes("prefers-reduced-motion: reduce")).toBe(true);
    });
  });
});
