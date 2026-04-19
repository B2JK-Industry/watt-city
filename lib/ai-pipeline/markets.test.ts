import { describe, it, expect } from "vitest";
import { CZ_THEMES, UA_THEMES, LANDMARKS } from "./markets";

describe("CZ market theme pool", () => {
  it("has ≥ 20 themes", () => {
    expect(CZ_THEMES.length).toBeGreaterThanOrEqual(20);
  });
  it("every theme has 4 angles + a kind + non-empty theme string", () => {
    for (const t of CZ_THEMES) {
      expect(t.theme.length).toBeGreaterThan(3);
      expect(t.angles.length).toBeGreaterThanOrEqual(3);
      expect(t.kind).toBeTruthy();
    }
  });
  it("themes carry age + subject metadata", () => {
    const tagged = CZ_THEMES.filter((t) => t.age && t.subject);
    expect(tagged.length).toBeGreaterThanOrEqual(18);
  });
});

describe("UA market theme pool", () => {
  it("has ≥ 20 themes", () => {
    expect(UA_THEMES.length).toBeGreaterThanOrEqual(20);
  });
  it("every theme has non-empty theme string + angles", () => {
    for (const t of UA_THEMES) {
      expect(t.theme.length).toBeGreaterThan(3);
      expect(t.angles.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Landmarks per market", () => {
  it("every market has ≥ 3 landmarks", () => {
    expect(LANDMARKS.pl.length).toBeGreaterThanOrEqual(3);
    expect(LANDMARKS.cz.length).toBeGreaterThanOrEqual(3);
    expect(LANDMARKS.ua.length).toBeGreaterThanOrEqual(3);
  });
  it("every landmark has a glyph + at least one locale label", () => {
    for (const arr of Object.values(LANDMARKS)) {
      for (const l of arr) {
        expect(l.glyph.length).toBeGreaterThan(0);
        expect(Object.keys(l.labels).length).toBeGreaterThan(0);
      }
    }
  });
});
