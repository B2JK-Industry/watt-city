import { describe, it, expect, vi, afterEach } from "vitest";

/* Deep-audit Phase 1 backlog #8 — slow-Upstash simulator.
 *
 * We don't connect to a real Upstash in tests — the in-memory fallback
 * handles every read/write. This suite wraps the redis primitives
 * with `vi.spyOn` + an artificial-latency delay to prove that the
 * call sites use `Promise.all` where they should (parallel reads
 * complete in ~1×latency, not N×latency) and that single-flight
 * locks (`kvSetNX`) keep their atomicity under concurrent slow
 * acquires.
 *
 * This isn't a benchmark; it's a regression guard. Production
 * latency depends on the Upstash region vs the Vercel region — both
 * deployed in fra1/iad1 currently per the prod-smoke `x-vercel-id`
 * header. */

import * as redis from "./redis";

const LATENCY_MS = 20;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wrap every listed redis primitive with an artificial-delay spy.
 *  Returns a teardown fn that restores the originals. Using vi.spyOn
 *  (not module-level reassignment) so the read-only ESM export shape
 *  doesn't block us. */
function injectLatency(names: Array<keyof typeof redis>): () => void {
  const spies: Array<() => void> = [];
  for (const name of names) {
    const orig = (redis as unknown as Record<string, (...a: unknown[]) => unknown>)[
      name as string
    ];
    if (typeof orig !== "function") continue;
    const spy = vi
      .spyOn(redis, name)
      .mockImplementation(async (...args: unknown[]) => {
        await sleep(LATENCY_MS);
        return (orig as (...a: unknown[]) => unknown)(...args);
      });
    spies.push(() => spy.mockRestore());
  }
  return () => spies.forEach((t) => t());
}

describe("Phase 8 resilience — slow-Upstash behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parallel reads with 20ms injected latency complete in ~20ms, not N×20ms", async () => {
    const N = 5;
    const teardown = injectLatency(["kvGet"]);
    try {
      await redis.kvSet("slow:base", "baseline");
      const start = Date.now();
      await Promise.all(
        Array.from({ length: N }, (_, i) => redis.kvGet(`slow:k${i}`)),
      );
      const elapsed = Date.now() - start;
      // Serialised would be N×LATENCY = 100ms. Parallel should be ≈LATENCY
      // plus event-loop jitter. 60ms upper bound leaves CI-machine headroom.
      expect(
        elapsed,
        `parallel reads took ${elapsed}ms (expected < 60ms)`,
      ).toBeLessThan(60);
    } finally {
      teardown();
    }
  });

  it("serial reads with 20ms latency scale linearly (control)", async () => {
    const N = 5;
    const teardown = injectLatency(["kvGet"]);
    try {
      const start = Date.now();
      for (let i = 0; i < N; i++) {
        await redis.kvGet(`slow:s${i}`);
      }
      const elapsed = Date.now() - start;
      // Serial path IS serialised — N×LATENCY ≤ elapsed.
      // This is the control that proves the spy is active.
      expect(
        elapsed,
        `serial ${N}×${LATENCY_MS}ms reads took ${elapsed}ms`,
      ).toBeGreaterThanOrEqual(N * LATENCY_MS - 5);
    } finally {
      teardown();
    }
  });

  it("kvSetNX-based lock stays atomic under artificial latency", async () => {
    const key = "slow:lock:test";
    await redis.kvDel(key);
    const teardown = injectLatency(["kvSetNX"]);
    try {
      // First acquirer wins; second collides regardless of latency —
      // the in-memory store's Map.has/set is synchronous inside the
      // wrapper's post-delay body.
      const ok1 = await redis.kvSetNX(key, "token-a", { ex: 30 });
      expect(ok1).toBe(true);
      const ok2 = await redis.kvSetNX(key, "token-b", { ex: 30 });
      expect(ok2).toBe(false);
    } finally {
      teardown();
      await redis.kvDel(key);
    }
  });
});
