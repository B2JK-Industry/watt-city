import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* D1 — `/dla-szkol` marketing content.
 *
 * The landing is the PKO-pitch front door. A non-engineer should be
 * able to skim the page in 60s and know what product does. We lock
 * the required structure via file-level greps so future refactors
 * don't silently strip required sections.
 *
 * Required sections per demo-polish spec D1:
 *   - Hero (title + subtitle)
 *   - Compliance badges row (MEN V-VIII, PKO SKO, GDPR-K)
 *   - Triple CTA (demo + teacher signup + brochure)
 *   - 3-audience value prop (kids/teachers/parents)
 *   - 4-step "Jak to działa" diagram
 *   - Screenshot placeholders
 *   - Compliance section (5 items)
 *   - Podstawa programowa preview
 *   - Download aside (PL + EN PDF + HTML)
 *   - Bottom CTA repeat
 *
 * Copy keys must exist in all 4 langs (pl/uk/cs/en).
 */

const ROOT = join(__dirname, "..", "..");
const PAGE = readFileSync(join(ROOT, "app", "dla-szkol", "page.tsx"), "utf8");

describe("D1 — /dla-szkol marketing content", () => {
  it("has hero title + subtitle copy keys", () => {
    expect(PAGE.includes("heroTitle")).toBe(true);
    expect(PAGE.includes("heroSubtitle")).toBe(true);
    expect(PAGE.includes("Watt City dla szkół")).toBe(true);
  });

  it("has triple CTA (demo + teacher signup + brochure)", () => {
    expect(PAGE.includes("/dla-szkol/demo")).toBe(true);
    expect(PAGE.includes("/nauczyciel/signup")).toBe(true);
    expect(PAGE.includes("/api/dla-szkol/pitch")).toBe(true);
    expect(PAGE.includes("ctaDemo")).toBe(true);
    expect(PAGE.includes("ctaSignup")).toBe(true);
    expect(PAGE.includes("ctaBrochure")).toBe(true);
  });

  it("has compliance badges row (MEN/PKO/GDPR)", () => {
    expect(PAGE.includes("MEN V–VIII")).toBe(true);
    expect(PAGE.includes("PKO SKO")).toBe(true);
    expect(PAGE.includes("GDPR-K")).toBe(true);
  });

  it("has 3-audience value prop (kids + teachers + parents)", () => {
    expect(PAGE.includes("audKidsTitle")).toBe(true);
    expect(PAGE.includes("audTeachersTitle")).toBe(true);
    expect(PAGE.includes("audParentsTitle")).toBe(true);
  });

  it("has 4-step diagram", () => {
    expect(PAGE.includes("howStep1")).toBe(true);
    expect(PAGE.includes("howStep2")).toBe(true);
    expect(PAGE.includes("howStep3")).toBe(true);
    expect(PAGE.includes("howStep4")).toBe(true);
  });

  it("has compliance section", () => {
    expect(PAGE.includes("complianceItems")).toBe(true);
    expect(PAGE.includes("UODO")).toBe(true);
    expect(PAGE.includes("KNF")).toBe(true);
  });

  it("has screenshot placeholders", () => {
    expect(PAGE.includes("screen1")).toBe(true);
    expect(PAGE.includes("screen2")).toBe(true);
    expect(PAGE.includes("screen3")).toBe(true);
  });

  it("pulls curriculum preview from lib/curriculum", () => {
    expect(PAGE.includes('from "@/lib/curriculum"')).toBe(true);
    expect(PAGE.includes("PODSTAWA_PROGRAMOWA")).toBe(true);
    expect(PAGE.includes("curriculumByArea")).toBe(true);
  });

  it("has download aside with PL + EN PDF", () => {
    expect(PAGE.includes("locale=pl")).toBe(true);
    expect(PAGE.includes("locale=en")).toBe(true);
    expect(PAGE.includes("/dla-szkol/materialy")).toBe(true);
  });

  it("has 4-lang Copy record (pl/uk/cs/en)", () => {
    const copyBlock = PAGE.match(/const COPY:[^=]+=\s*\{([\s\S]+?)\n\};/);
    expect(copyBlock).not.toBeNull();
    const body = copyBlock?.[1] ?? "";
    expect(body.includes("pl: {")).toBe(true);
    expect(body.includes("uk: {")).toBe(true);
    expect(body.includes("cs: {")).toBe(true);
    expect(body.includes("en: {")).toBe(true);
  });

  it("uses Polish as canonical (no Slovak leakage)", () => {
    // Cleanup issue 1 regression guard — no Slovak keywords in landing.
    const forbidden = ["Spustiť", "Zaregistrovať", "Prevziať", "pre školy"];
    for (const word of forbidden) {
      expect(PAGE.includes(word), `forbidden Slovak '${word}'`).toBe(false);
    }
  });
});
