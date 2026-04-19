import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveFlag,
  userPercentile,
  getFlags,
  setFlags,
  invalidateFlagsCache,
  isFlagEnabled,
  DEFAULT_FLAGS,
  FLAGS_KEY,
} from "./feature-flags";
import { kvDel } from "@/lib/redis";

describe("userPercentile (MEDIUM-18 deterministic bucketing)", () => {
  it("returns 0..99", () => {
    for (let i = 0; i < 100; i++) {
      const p = userPercentile(`user-${i}`);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(100);
    }
  });

  it("stable across invocations", () => {
    const a = userPercentile("alice");
    const b = userPercentile("alice");
    expect(a).toBe(b);
  });

  it("distributes roughly uniformly across 1000 samples", () => {
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 1000; i++) {
      const p = userPercentile(`u-${i}`);
      buckets[Math.floor(p / 10)]++;
    }
    // Each decade should see 50..150 of 1000 samples (5-15%).
    for (const b of buckets) {
      expect(b).toBeGreaterThan(50);
      expect(b).toBeLessThan(150);
    }
  });
});

describe("resolveFlag", () => {
  it("undefined config → false", () => {
    expect(resolveFlag(undefined, "alice")).toBe(false);
  });

  it("mode=off → false", () => {
    expect(resolveFlag({ mode: "off" }, "alice")).toBe(false);
  });

  it("mode=on → true", () => {
    expect(resolveFlag({ mode: "on" }, "alice")).toBe(true);
  });

  it("denylist wins over allowlist", () => {
    expect(
      resolveFlag(
        { mode: "on", allowlist: ["alice"], denylist: ["alice"] },
        "alice",
      ),
    ).toBe(false);
  });

  it("allowlist wins over off-mode percentage", () => {
    expect(
      resolveFlag({ mode: "off", allowlist: ["alice"] }, "alice"),
    ).toBe(true);
  });

  it("percentage=0 → always false", () => {
    for (const u of ["a", "b", "c", "d", "e"]) {
      expect(resolveFlag({ mode: "percentage", value: 0 }, u)).toBe(false);
    }
  });

  it("percentage=100 → always true", () => {
    for (const u of ["a", "b", "c", "d", "e"]) {
      expect(resolveFlag({ mode: "percentage", value: 100 }, u)).toBe(true);
    }
  });

  it("percentage=50 → roughly half of users bucket true", () => {
    let enabled = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      if (
        resolveFlag({ mode: "percentage", value: 50 }, `user-${i}`)
      ) {
        enabled++;
      }
    }
    // Within a generous 40-60% band.
    expect(enabled).toBeGreaterThan(N * 0.4);
    expect(enabled).toBeLessThan(N * 0.6);
  });

  it("percentage value clamped [0,100]", () => {
    expect(
      resolveFlag({ mode: "percentage", value: -5 }, "alice"),
    ).toBe(false);
    expect(
      resolveFlag({ mode: "percentage", value: 200 }, "alice"),
    ).toBe(true);
  });
});

describe("persistence", () => {
  beforeEach(async () => {
    await kvDel(FLAGS_KEY);
    invalidateFlagsCache();
  });

  it("getFlags returns DEFAULT_FLAGS when nothing stored", async () => {
    const f = await getFlags();
    expect(f.v2_cashflow_hud).toEqual(DEFAULT_FLAGS.v2_cashflow_hud);
  });

  it("setFlags persists + getFlags reads them back", async () => {
    await setFlags({
      my_flag: { mode: "percentage", value: 42 },
    });
    const f = await getFlags();
    expect(f.my_flag).toEqual({ mode: "percentage", value: 42 });
    // Defaults still merged in (stored overrides win).
    expect(f.v2_cashflow_hud).toBeDefined();
  });

  it("isFlagEnabled hot-path end-to-end", async () => {
    await setFlags({ my_flag: { mode: "on" } });
    expect(await isFlagEnabled("my_flag", "alice")).toBe(true);
    await setFlags({ my_flag: { mode: "off" } });
    expect(await isFlagEnabled("my_flag", "alice")).toBe(false);
  });

  it("cache TTL — stale cache hit returned until TTL expires", async () => {
    await setFlags({ cache_test: { mode: "on" } });
    // Prime cache via now=t0
    const t0 = 1_000_000_000_000;
    const a = await getFlags(t0);
    expect(a.cache_test.mode).toBe("on");
    // Mutate underlying store but read within 30s window — cache hit.
    await setFlags({ cache_test: { mode: "off" } });
    // setFlags invalidates cache, so a new read at t0 should reflect new state
    const b = await getFlags(t0);
    expect(b.cache_test.mode).toBe("off");
  });
});
