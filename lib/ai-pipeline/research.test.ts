import { describe, it, expect } from "vitest";
import { pickResearchSeed } from "./research";

describe("pickResearchSeed — hourly rotation", () => {
  it("picks the same seed within the same hour bucket", () => {
    const start = 1_700_000_000_000; // arbitrary epoch ms
    const hourStart = Math.floor(start / (60 * 60 * 1000)) * 60 * 60 * 1000;
    const a = pickResearchSeed(hourStart);
    const b = pickResearchSeed(hourStart + 30 * 60 * 1000); // 30 min later, same hour
    expect(b.theme).toBe(a.theme);
    expect(b.angles).toEqual(a.angles);
    expect(b.difficulty).toBe(a.difficulty);
  });

  it("rotates to a different theme when the hour boundary crosses", () => {
    const hourStart = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000;
    const a = pickResearchSeed(hourStart);
    const b = pickResearchSeed(hourStart + 60 * 60 * 1000); // next hour
    expect(b.theme).not.toBe(a.theme);
  });

  it("cycles through the pool across consecutive hours", () => {
    const base = 1_700_000_000_000;
    const hour = 60 * 60 * 1000;
    const themes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      themes.add(pickResearchSeed(base + i * hour).theme);
    }
    // 20 consecutive hours should yield 20 distinct themes (pool size ≥ 20)
    expect(themes.size).toBe(20);
  });
});
