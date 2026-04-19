import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* D5 — kid onboarding tour (4 steps: welcome → resources → buildings
 * → loans). The pre-D5 tour ended on "first game"; D5 swaps the last
 * step to loans so the PKO audience sees the distinctive no-risk
 * credit simulator during the demo kickoff. */

const ROOT = join(__dirname, "..");
const TOUR = readFileSync(
  join(ROOT, "components", "onboarding-tour.tsx"),
  "utf8",
);
const CSS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

describe("D5 — kid onboarding tour", () => {
  it("ships 4 steps per locale (pl/uk/cs/en)", () => {
    // Each locale's array has 4 object literals: count `title:` keys
    // inside `pl: [...]` block. Cheap but reliable for this file.
    for (const lang of ["pl", "uk", "cs", "en"]) {
      const re = new RegExp(`${lang}:\\s*\\[([\\s\\S]+?)\\],`);
      const match = TOUR.match(re);
      expect(match, `missing ${lang} block`).not.toBeNull();
      const titles = (match?.[1].match(/title:/g) || []).length;
      expect(titles, `${lang} has ${titles} steps`).toBe(4);
    }
  });

  it("final step is loans (not the old 'first game')", () => {
    expect(TOUR.includes("Kredyt bez ryzyka")).toBe(true);
    expect(TOUR.includes("/loans/compare")).toBe(true);
    // Old copy must not leak back.
    expect(TOUR.includes("Pierwsza gra")).toBe(false);
    expect(TOUR.includes("/games/finance-quiz")).toBe(false);
  });

  it("step sequence: welcome → wallet → city → loans", () => {
    // Test the PL order — the others are translations.
    const plMatch = TOUR.match(/pl:\s*\[([\s\S]+?)\],/);
    const plBody = plMatch?.[1] ?? "";
    const welcomeIdx = plBody.indexOf("Witaj w Watt City");
    const walletIdx = plBody.indexOf("Twój portfel");
    const cityIdx = plBody.indexOf("Twoje miasto");
    const loanIdx = plBody.indexOf("Kredyt bez ryzyka");
    expect(welcomeIdx).toBeGreaterThan(-1);
    expect(walletIdx).toBeGreaterThan(welcomeIdx);
    expect(cityIdx).toBeGreaterThan(walletIdx);
    expect(loanIdx).toBeGreaterThan(cityIdx);
  });

  it("persists dismiss via PATCH /api/me/profile", () => {
    expect(TOUR.includes("/api/me/profile")).toBe(true);
    expect(TOUR.includes('method: "PATCH"')).toBe(true);
    expect(TOUR.includes("tourSeen: true")).toBe(true);
  });

  it("uses motion-safe animations only (prefers-reduced-motion)", () => {
    expect(TOUR.includes("motion-safe:animate-")).toBe(true);
    // No unqualified animate-[...] usages — they'd fire even with
    // reduced-motion enabled.
    const unsafeAnim = /(?<!motion-safe:)animate-\[/.test(TOUR);
    expect(unsafeAnim).toBe(false);
  });

  it("declares the pop-in + fade-in keyframes in globals.css", () => {
    expect(CSS.includes("@keyframes fade-in")).toBe(true);
    expect(CSS.includes("@keyframes pop-in")).toBe(true);
  });

  it("is accessible: role=dialog + aria-modal + labelled title", () => {
    expect(TOUR.includes('role="dialog"')).toBe(true);
    expect(TOUR.includes('aria-modal="true"')).toBe(true);
    expect(TOUR.includes('aria-labelledby="onboarding-step-title"')).toBe(true);
    expect(TOUR.includes('id="onboarding-step-title"')).toBe(true);
  });
});
