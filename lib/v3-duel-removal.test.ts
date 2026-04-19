import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

describe("V3.6 duel removal invariants", () => {
  it("app/duel/ directory is gone", () => {
    expect(existsSync(join(ROOT, "app", "duel"))).toBe(false);
  });

  it("app/api/duel/ directory is gone", () => {
    expect(existsSync(join(ROOT, "app", "api", "duel"))).toBe(false);
  });

  it("components/duel/ directory is gone", () => {
    expect(existsSync(join(ROOT, "components", "duel"))).toBe(false);
  });

  it("lib/duel.ts is gone (renamed to lib/duel.legacy.ts)", () => {
    expect(existsSync(join(ROOT, "lib", "duel.ts"))).toBe(false);
    expect(existsSync(join(ROOT, "lib", "duel.legacy.ts"))).toBe(true);
  });

  it("ADR for removal exists", () => {
    const decisions = readdirSync(join(ROOT, "docs", "decisions"));
    const hit = decisions.find(
      (name) => name.includes("duel-removal") || name.includes("duel-future"),
    );
    expect(hit).toBeTruthy();
  });
});
