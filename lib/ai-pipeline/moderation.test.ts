import { describe, it, expect } from "vitest";
import {
  moderateSpec,
  contentHash,
  canonicalise,
} from "./moderation";
import type { LocalizedSpec } from "./types";

function quizSpec(prompt: string): LocalizedSpec {
  const items = Array.from({ length: 5 }, () => ({
    prompt,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    explanation: "explanation-long-enough",
  }));
  const quiz = { kind: "quiz" as const, xpPerCorrect: 10, items };
  return { pl: quiz, uk: quiz, cs: quiz, en: quiz };
}

describe("moderateSpec", () => {
  it("clean spec: no findings", () => {
    const s = quizSpec("Czym jest RRSO?");
    expect(moderateSpec(s).length).toBe(0);
  });
  it("real-person flagged", () => {
    const s = quizSpec("Czy Elon Musk kupuje twoje akcje?");
    const f = moderateSpec(s);
    expect(f.some((x) => x.category === "real-person")).toBe(true);
  });
  it("brand-negative flagged", () => {
    const s = quizSpec("PKO to oszustwo? Prawda czy fałsz.");
    const f = moderateSpec(s);
    expect(f.some((x) => x.category === "brand-negative")).toBe(true);
  });
  it("violence flagged", () => {
    const s = quizSpec("Kto zabił NBP rate?");
    const f = moderateSpec(s);
    expect(f.some((x) => x.category === "violence")).toBe(true);
  });
  it("slur flagged", () => {
    const s = quizSpec("kurwa jakie ceny");
    const f = moderateSpec(s);
    expect(f.some((x) => x.category === "slur")).toBe(true);
  });
});

describe("canonicalise + contentHash", () => {
  it("produces same string for key-reordered objects", () => {
    expect(canonicalise({ a: 1, b: 2 })).toBe(canonicalise({ b: 2, a: 1 }));
  });
  it("arrays keep order", () => {
    expect(canonicalise([1, 2])).not.toBe(canonicalise([2, 1]));
  });
  it("hash is deterministic and 64-char hex", () => {
    const s = quizSpec("prompt");
    const h = contentHash(s);
    expect(h.length).toBe(64);
    expect(contentHash(s)).toBe(h);
  });
});
