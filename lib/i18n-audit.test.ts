import { describe, it, expect } from "vitest";
import pl from "@/lib/locales/pl";
import uk from "@/lib/locales/uk";
import cs from "@/lib/locales/cs";
import en from "@/lib/locales/en";
import { plural, formatCurrency, formatDate } from "./i18n-format";

// Phase 6.6.1 — audit script. The typed `typeof plDict` at the top of
// uk/cs/en already enforces completeness at compile time. This test
// adds a runtime check for subtle divergence (e.g. a key whose value
// is an empty string in one locale).

function walk(
  obj: unknown,
  path: string,
  out: string[],
): void {
  if (typeof obj === "string") {
    if (obj.trim() === "") out.push(path);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, `${path}[${i}]`, out));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      walk(v, path ? `${path}.${k}` : k, out);
    }
  }
}

describe("i18n — no empty strings in any locale", () => {
  it("pl", () => {
    const bad: string[] = [];
    walk(pl, "", bad);
    expect(bad).toEqual([]);
  });
  it("uk", () => {
    const bad: string[] = [];
    walk(uk, "", bad);
    expect(bad).toEqual([]);
  });
  it("cs", () => {
    const bad: string[] = [];
    walk(cs, "", bad);
    expect(bad).toEqual([]);
  });
  it("en", () => {
    const bad: string[] = [];
    walk(en, "", bad);
    expect(bad).toEqual([]);
  });
});

describe("Polish pluralization via Intl.PluralRules", () => {
  it("selects 'one' for 1 (watt)", () => {
    expect(
      plural("pl", 1, {
        one: "{n} wat",
        few: "{n} waty",
        many: "{n} watów",
        other: "{n} wata",
      }),
    ).toBe("1 wat");
  });
  it("selects 'few' for 2-4", () => {
    for (const n of [2, 3, 4]) {
      const out = plural("pl", n, {
        one: "{n} wat",
        few: "{n} waty",
        many: "{n} watów",
        other: "{n} wata",
      });
      expect(out).toBe(`${n} waty`);
    }
  });
  it("selects 'many' for 5+, 0, teens", () => {
    for (const n of [5, 11, 12, 25, 100]) {
      const out = plural("pl", n, {
        one: "{n} wat",
        few: "{n} waty",
        many: "{n} watów",
        other: "{n} wata",
      });
      expect(out).toBe(`${n} watów`);
    }
  });
});

describe("locale-aware formatters", () => {
  it("formatCurrency PL → `… zł`", () => {
    const s = formatCurrency("pl", 1234);
    expect(s).toMatch(/1\s*234.*zł/);
  });
  it("formatCurrency CZK → `… Kč`", () => {
    const s = formatCurrency("cs", 1234, "CZK");
    expect(s).toMatch(/1\s*234.*Kč/);
  });
  it("formatDate produces a localized string", () => {
    const s = formatDate("pl", new Date(Date.UTC(2026, 3, 19)));
    expect(s.length).toBeGreaterThan(5);
  });
});
