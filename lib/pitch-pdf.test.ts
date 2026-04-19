import { describe, it, expect } from "vitest";
import { generatePitchBrochure } from "./pitch-pdf";

describe("V4.7 pitch brochure", () => {
  it("generates a valid PL PDF (starts with %PDF-)", async () => {
    const buf = await generatePitchBrochure("pl");
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  }, 20_000);

  it("generates a valid EN PDF", async () => {
    const buf = await generatePitchBrochure("en");
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  }, 20_000);
});
