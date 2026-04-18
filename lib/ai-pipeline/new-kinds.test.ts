import { describe, it, expect } from "vitest";
import {
  MemorySpecSchema,
  FillBlankSpecSchema,
  CalcSpecSchema,
  BudgetSpecSchema,
  WhatIfSpecSchema,
  ChartReadSpecSchema,
  xpCapForSpec,
} from "./types";

describe("Phase 2.1 new AI kinds — zod schemas", () => {
  it("memory accepts a valid 6-pair spec", () => {
    const s = MemorySpecSchema.safeParse({
      kind: "memory",
      pairs: Array.from({ length: 6 }, (_, i) => ({
        concept: `concept${i}`,
        match: `definition for concept ${i}`,
      })),
      xpPerMatch: 10,
      hint: "card-matching hint for the theme",
    });
    expect(s.success).toBe(true);
  });

  it("memory rejects fewer than 6 pairs", () => {
    const s = MemorySpecSchema.safeParse({
      kind: "memory",
      pairs: [{ concept: "a", match: "b" }],
      xpPerMatch: 10,
      hint: "hint",
    });
    expect(s.success).toBe(false);
  });

  it("fill-in-blank accepts a 5-item spec", () => {
    const s = FillBlankSpecSchema.safeParse({
      kind: "fill-in-blank",
      items: Array.from({ length: 5 }, () => ({
        sentence: "Inflacja wynosi ___ procent rocznie.",
        answer: "pięć",
        hint: "numeric percentage",
      })),
      xpPerCorrect: 10,
    });
    expect(s.success).toBe(true);
  });

  it("calc-sprint coerces durationSec default", () => {
    const s = CalcSpecSchema.safeParse({
      kind: "calc-sprint",
      items: Array.from({ length: 8 }, () => ({
        expression: "2 + 2",
        answer: 4,
      })),
      xpPerCorrect: 5,
    });
    expect(s.success).toBe(true);
    if (s.success) {
      expect(s.data.durationSec).toBe(60);
    }
  });

  it("budget-allocate enforces 3–5 categories", () => {
    const s = BudgetSpecSchema.safeParse({
      kind: "budget-allocate",
      scenario: "Test scenario — enough characters here",
      incomeLabel: "4500 zł",
      categories: [
        { label: "Housing", targetPct: 50, tolerancePct: 5, explanation: "rent + utilities baseline" },
        { label: "Wants", targetPct: 30, tolerancePct: 5, explanation: "entertainment and non-essentials" },
        { label: "Savings", targetPct: 20, tolerancePct: 5, explanation: "emergency fund and investments" },
      ],
      xpPerOnTarget: 20,
    });
    expect(s.success).toBe(true);
  });

  it("what-if requires steps with exactly 3 options", () => {
    const s = WhatIfSpecSchema.safeParse({
      kind: "what-if",
      scenario: "Twoje pierwsze mieszkanie — decydujesz, co z depozytem.",
      steps: Array.from({ length: 3 }, () => ({
        prompt: "Co wybierasz?",
        options: ["A", "B", "C"],
        correctIndex: 1,
        explanation: "Wyjaśnienie dlaczego B jest optymalne tutaj",
      })),
      xpPerCorrect: 20,
    });
    expect(s.success).toBe(true);
  });

  it("chart-read enforces exactly 4 options", () => {
    const s = ChartReadSpecSchema.safeParse({
      kind: "chart-read",
      chartType: "line",
      chartTitle: "Test chart",
      xLabel: "rok",
      yLabel: "wartość",
      points: [
        { x: 2020, y: 1 },
        { x: 2021, y: 2 },
        { x: 2022, y: 3 },
        { x: 2023, y: 4 },
      ],
      question: "Jaki trend widać?",
      options: ["rosnący", "malejący", "stały", "cykliczny"],
      correctIndex: 0,
      explanation: "Wartości rosną z każdym rokiem — trend rosnący.",
      xpPerCorrect: 20,
    });
    expect(s.success).toBe(true);
  });
});

describe("xpCapForSpec — new kinds", () => {
  it("memory: pairs × xpPerMatch", () => {
    expect(
      xpCapForSpec({
        kind: "memory",
        pairs: Array.from({ length: 6 }, () => ({ concept: "a", match: "b" })),
        xpPerMatch: 10,
        hint: "h",
      } as never),
    ).toBe(60);
  });
  it("budget-allocate: categories × xpPerOnTarget", () => {
    expect(
      xpCapForSpec({
        kind: "budget-allocate",
        scenario: "x",
        incomeLabel: "x",
        categories: [
          { label: "a", targetPct: 50, tolerancePct: 5, explanation: "..." },
          { label: "b", targetPct: 50, tolerancePct: 5, explanation: "..." },
        ],
        xpPerOnTarget: 20,
      } as never),
    ).toBe(40);
  });
  it("chart-read: single xpPerCorrect", () => {
    expect(
      xpCapForSpec({
        kind: "chart-read",
        chartType: "bar",
        chartTitle: "t",
        xLabel: "x",
        yLabel: "y",
        points: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }],
        question: "q",
        options: ["a", "b", "c", "d"],
        correctIndex: 0,
        explanation: "...",
        xpPerCorrect: 30,
      } as never),
    ).toBe(30);
  });
});
