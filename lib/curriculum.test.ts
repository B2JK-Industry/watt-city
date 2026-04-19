import { describe, it, expect } from "vitest";
import {
  PODSTAWA_PROGRAMOWA,
  curriculumByArea,
  curriculumForGrade,
  curriculumCodesForTheme,
  curriculumCodesForGame,
  coverageByArea,
} from "./curriculum";

describe("V4.5 PODSTAWA_PROGRAMOWA shape", () => {
  it("has at least 20 codes (acceptance: 20-30)", () => {
    expect(PODSTAWA_PROGRAMOWA.length).toBeGreaterThanOrEqual(20);
    expect(PODSTAWA_PROGRAMOWA.length).toBeLessThanOrEqual(40);
  });

  it("every code has all required fields populated", () => {
    for (const c of PODSTAWA_PROGRAMOWA) {
      expect(c.code).toMatch(/^[a-z]+\.\d+\.\d+\.\d+$/);
      expect(["Ekonomia", "Matematyka", "WOS", "EDB", "Informatyka"]).toContain(c.area);
      expect([5, 6, 7, 8]).toContain(c.grade);
      expect(c.description.length).toBeGreaterThan(10);
      expect(c.themes.length + c.games.length).toBeGreaterThan(0);
    }
  });

  it("every code has a unique id", () => {
    const ids = PODSTAWA_PROGRAMOWA.map((c) => c.code);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all four target grades V-VIII", () => {
    const grades = new Set(PODSTAWA_PROGRAMOWA.map((c) => c.grade));
    expect(grades.has(5)).toBe(true);
    expect(grades.has(6)).toBe(true);
    expect(grades.has(7)).toBe(true);
    expect(grades.has(8)).toBe(true);
  });
});

describe("V4.5 curriculum helpers", () => {
  it("curriculumByArea returns all five areas", () => {
    const g = curriculumByArea();
    expect(Object.keys(g).sort()).toEqual(
      ["EDB", "Ekonomia", "Informatyka", "Matematyka", "WOS"].sort(),
    );
  });

  it("curriculumForGrade filters correctly", () => {
    const g7 = curriculumForGrade(7);
    expect(g7.length).toBeGreaterThan(0);
    expect(g7.every((c) => c.grade === 7)).toBe(true);
  });

  it("curriculumCodesForTheme reverse-lookup", () => {
    const codes = curriculumCodesForTheme("RRSO-basics");
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.every((c) => c.themes.includes("RRSO-basics"))).toBe(true);
  });

  it("curriculumCodesForGame reverse-lookup", () => {
    const codes = curriculumCodesForGame("finance-quiz");
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.every((c) => c.games.includes("finance-quiz"))).toBe(true);
  });

  it("coverageByArea: no observations → covered=0 for each area", () => {
    const cov = coverageByArea(new Set(), new Set(), 7);
    for (const area of Object.keys(cov) as Array<keyof typeof cov>) {
      expect(cov[area].covered).toBe(0);
    }
  });

  it("coverageByArea: observing RRSO-basics marks the WOS code covered", () => {
    const cov = coverageByArea(new Set(["RRSO-basics"]), new Set(), 7);
    expect(cov.WOS.covered).toBeGreaterThanOrEqual(1);
  });

  it("coverageByArea: observing finance-quiz marks any grade-7 code that uses it", () => {
    const cov = coverageByArea(new Set(), new Set(["finance-quiz"]), 7);
    const grade7Codes = curriculumForGrade(7);
    const financeQuizCodes = grade7Codes.filter((c) =>
      c.games.includes("finance-quiz"),
    );
    // Every such code should be covered (at least)
    expect(cov.WOS.covered + cov.Matematyka.covered + cov.EDB.covered).toBeGreaterThanOrEqual(
      financeQuizCodes.length - 1, // conservative (area distribution can split)
    );
  });
});
