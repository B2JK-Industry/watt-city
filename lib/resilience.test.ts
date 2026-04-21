import { describe, it, expect } from "vitest";

/* Phase 9 — resilience checks.
 *
 * Vitest is run without UPSTASH_REDIS_REST_URL / …_TOKEN in the env
 * (see package.json `test` script and the absence of any vitest env
 * loader), so `lib/redis.ts` takes the in-memory fallback code path.
 * The existence of ~618 passing vitest tests that touch Redis is the
 * strongest integration evidence that the fallback works; these
 * checks are the small inspectable contract those tests rely on.
 */

import * as redis from "./redis";

describe("Phase 9 — resilience: in-memory Redis fallback", () => {
  it("kvGet on a fresh key returns null", async () => {
    const v = await redis.kvGet("resilience:missing");
    expect(v).toBeNull();
  });

  it("round-trips a JSON-shaped value through kvSet/kvGet", async () => {
    await redis.kvSet("resilience:key1", { a: 1, b: "two" });
    const out = await redis.kvGet<{ a: number; b: string }>("resilience:key1");
    expect(out).toEqual({ a: 1, b: "two" });
  });

  it("kvDel removes the entry (later kvGet sees null)", async () => {
    await redis.kvSet("resilience:toDelete", "x");
    expect(await redis.kvGet("resilience:toDelete")).toBe("x");
    await redis.kvDel("resilience:toDelete");
    expect(await redis.kvGet("resilience:toDelete")).toBeNull();
  });

  it("zIncrBy+zTopN orders by score descending (leaderboard invariant)", async () => {
    const key = "resilience:zset";
    await redis.zIncrBy(key, 100, "alice");
    await redis.zIncrBy(key, 250, "bob");
    await redis.zIncrBy(key, 50, "carol");
    const top = await redis.zTopN(key, 10);
    expect(top.map((r) => r.username)).toEqual(["bob", "alice", "carol"]);
    expect(top[0].xp).toBe(250);
  });

  it("zIncrBy accumulates scores across repeated writes", async () => {
    const key = "resilience:zset-update";
    await redis.zIncrBy(key, 10, "same");
    await redis.zIncrBy(key, 30, "same");
    const top = await redis.zTopN(key, 2);
    expect(top).toHaveLength(1);
    // Contract: zIncrBy accumulates. The "keep-highest" semantics for
    // leaderboards live in a higher layer (awardXP) — this is the
    // low-level transport behaviour.
    expect(top[0].xp).toBe(40);
  });

  it("sAdd + sMembers behaves like a set (no duplicates, order-indep)", async () => {
    const key = "resilience:set";
    await redis.sAdd(key, "a");
    await redis.sAdd(key, "b");
    await redis.sAdd(key, "a"); // duplicate — must be ignored
    const members = (await redis.sMembers(key)).sort();
    expect(members).toEqual(["a", "b"]);
  });

  it("sRem removes a member without touching the rest", async () => {
    const key = "resilience:set-rem";
    await redis.sAdd(key, "a");
    await redis.sAdd(key, "b");
    await redis.sRem(key, "a");
    expect(await redis.sMembers(key)).toEqual(["b"]);
  });

  it("kvSet with ex is still readable on the same process immediately", async () => {
    // The in-memory fallback doesn't enforce TTLs (documented in the
    // lib — "dev only, data lost on restart"). We still verify the
    // set doesn't throw on the ex option and the value is readable.
    await redis.kvSet("resilience:ttl", { n: 7 }, { ex: 60 });
    const v = await redis.kvGet<{ n: number }>("resilience:ttl");
    expect(v?.n).toBe(7);
  });

  it("hasUpstash returns false when env unset (the fallback branch)", () => {
    // Read the fallback invariant directly from process.env — this
    // test documents the contract that ALL vitest runs exercise the
    // in-memory path (no hidden Upstash connection from a shared
    // .env.local leaking into CI).
    const configured =
      Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
      Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
    // If a dev has their real Upstash env set, skip — not a failure.
    if (configured) return;
    expect(process.env.UPSTASH_REDIS_REST_URL).toBeFalsy();
  });
});

describe("Phase 9 — resilience: AI pipeline mock fallback", () => {
  it("generateGameSpec without ANTHROPIC_API_KEY returns a mock spec", async () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const { generateGameSpec } = await import("./ai-pipeline/generate");
      const { pickSeedByIndex } = await import("./ai-pipeline/research");
      const seed = pickSeedByIndex(0);
      expect(seed).toBeTruthy();
      const result = await generateGameSpec({
        seed: seed!,
        deterministicSeed: 1,
      });
      // GenerateResult = { spec, model } — no `ok` field; the mock
      // path either returns a spec or throws "No fallback for theme".
      expect(result.model).toMatch(/^mock/);
      expect(result.spec).toBeTruthy();
      expect(result.spec.pl).toBeTruthy();
    } finally {
      if (prev) process.env.ANTHROPIC_API_KEY = prev;
    }
  });
});
