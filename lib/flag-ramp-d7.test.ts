import { describe, it, expect } from "vitest";
import { DEFAULT_FLAGS, resolveFlag } from "./feature-flags";

/* D7 — ramp demo-polish feature flags to 100% for the PKO pitch.
 *
 * These two flags were previously at 50% percentage ramp so we could
 * watch real traffic before full rollout. For the demo pitch we want
 * every visitor on the modern path — not a coin-flip.
 *   v2_post_game_modal → "on"
 *   v2_restructuring   → "on"
 *
 * Data-migration + pilot-only flags stay OFF deliberately:
 *   v2_migration_eligible — controls a destructive schema migration
 *   v4_principal          — cross-class pilot, enabled per-allowlist
 */

describe("D7 — feature flag ramp for demo polish", () => {
  it("v2_post_game_modal is on for every user", () => {
    expect(DEFAULT_FLAGS.v2_post_game_modal).toEqual({ mode: "on" });
    for (const u of ["alice", "bob", "demo-teacher-pl", "kid-42"]) {
      expect(resolveFlag(DEFAULT_FLAGS.v2_post_game_modal, u)).toBe(true);
    }
  });

  it("v2_restructuring is on for every user", () => {
    expect(DEFAULT_FLAGS.v2_restructuring).toEqual({ mode: "on" });
    for (const u of ["alice", "bob", "demo-teacher-pl", "kid-42"]) {
      expect(resolveFlag(DEFAULT_FLAGS.v2_restructuring, u)).toBe(true);
    }
  });

  it("v2_migration_eligible stays OFF (destructive migration gate)", () => {
    expect(DEFAULT_FLAGS.v2_migration_eligible).toEqual({ mode: "off" });
  });

  it("v4_principal stays OFF (multi-class pilot)", () => {
    expect(DEFAULT_FLAGS.v4_principal).toEqual({ mode: "off" });
  });

  it("no remaining V2/V3/V4 percentage-ramped flag", () => {
    // Any V2/V3/V4 flag still stuck on percentage mode is a demo-
    // polish oversight — the coin-flip leaks to a PKO reviewer.
    for (const [name, cfg] of Object.entries(DEFAULT_FLAGS)) {
      if (!/^v[234]_/.test(name)) continue;
      expect(
        cfg.mode,
        `${name} is in percentage mode — ramp to on/off`,
      ).not.toBe("percentage");
    }
  });
});
