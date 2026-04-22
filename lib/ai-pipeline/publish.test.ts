import { describe, it, expect, beforeEach, vi } from "vitest";
import type { LocalizedSpec } from "./types";

// Stub the Claude generator so rotateIfDue tests don't depend on mock-theme
// keys or live Anthropic credentials. The stub produces a minimal-but-valid
// LocalizedSpec that passes LocalizedSpecSchema.
vi.mock("./generate", () => {
  const quizSpec = {
    kind: "quiz" as const,
    xpPerCorrect: 10,
    items: Array.from({ length: 5 }, (_, i) => ({
      prompt: `Test question ${i + 1}? (padding to meet min length)`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 0,
      explanation: "Test explanation with enough length to pass validation.",
    })),
  };
  const spec: LocalizedSpec = {
    pl: quizSpec,
    uk: quizSpec,
    cs: quizSpec,
    en: quizSpec,
  };
  return {
    generateGameSpec: async () => ({ spec, model: "test-stub" }),
  };
});

import { kvDel } from "@/lib/redis";
import {
  rotateIfDue,
  archiveOnExpire,
  listActiveAiGames,
  liveGameForSlot,
  runPipeline,
} from "./publish";
import { ALL_SLOTS, resolveSlot } from "./types";

// Relies on the in-memory redis fallback (no UPSTASH_* env set in test runs).
// Also relies on the mock-v1 generator (no ANTHROPIC_API_KEY), so tests are
// fast (<100ms) and deterministic.

async function resetState() {
  await kvDel("xp:ai-games:index");
  await kvDel("xp:ai-games:archive-index");
  // Per-slot locks + bucket sentinels. "fast" uses the legacy key names for
  // backward compat, medium/slow are namespaced.
  await kvDel("xp:rotation-lock");
  await kvDel("xp:rotation-lock:medium");
  await kvDel("xp:rotation-lock:slow");
  await kvDel("xp:ai-games:last-rotation-bucket");
  await kvDel("xp:ai-games:last-rotation-bucket:medium");
  await kvDel("xp:ai-games:last-rotation-bucket:slow");
}

describe("rotateIfDue — 3-slot parallel rotation flow", () => {
  beforeEach(async () => {
    await resetState();
  });

  it("publishes across all 3 slots on first call", async () => {
    const now = 1_700_000_000_000;
    const result = await rotateIfDue(now);
    if (!result.ok) throw new Error(`rotateIfDue failed: ${result.error}`);
    // Aggregate: at least one slot published (the `published` field reflects
    // a publish; the fast slot is preferred when multiple slots publish).
    expect(result.published).toMatch(/^ai-/);
    expect(result.skipped).toBe(false);
    // All 3 slots should have a live game after a cold start.
    const live = await listActiveAiGames();
    expect(live.length).toBe(3);
    for (const slot of ALL_SLOTS) {
      const g = await liveGameForSlot(slot, now);
      expect(g, `slot ${slot} should have a live game`).not.toBeNull();
      expect(g!.rotationSlot).toBe(slot);
    }
  });

  it("is idempotent within the fast slot's 1h bucket — second call skips publish for fast", async () => {
    const now = 1_700_000_000_000;
    const first = await rotateIfDue(now, "fast");
    expect(first.ok && first.published).toBeTruthy();

    const second = await rotateIfDue(now + 5 * 60 * 1000, "fast"); // +5 min, same hour
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.published).toBeNull();
    expect(second.skipped).toBe(true);
    const live = await listActiveAiGames();
    expect(live.length).toBe(1); // still just the one
  });

  it("archives expired fast-slot games and publishes a new one in the next hour bucket", async () => {
    const hour = 60 * 60 * 1000;
    const t0 = 1_700_000_000_000;
    const first = await rotateIfDue(t0, "fast");
    expect(first.ok).toBe(true);

    // Advance past the expiry (validUntil = t0 + 1h)
    const t1 = t0 + hour + 60_000;
    const second = await rotateIfDue(t1, "fast");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.rotated.length).toBe(1); // previous game archived
    expect(second.published).toMatch(/^ai-/);
    expect(second.skipped).toBe(false);
  });

  it("lock-contended returns contended error when fast-slot lock is held", async () => {
    const now = 1_700_000_000_000;
    // Seed the lock manually
    const { kvSetNX } = await import("@/lib/redis");
    await kvSetNX("xp:rotation-lock", "held-by-other", { ex: 60 });
    const result = await rotateIfDue(now, "fast");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.contended).toBe(true);
  });

  it("rotateIfDue publishes to an empty medium slot even when fast is fresh", async () => {
    const now = 1_700_000_000_000;
    // First publish fast alone
    const firstFast = await rotateIfDue(now, "fast");
    expect(firstFast.ok).toBe(true);
    const fastGame = await liveGameForSlot("fast", now);
    expect(fastGame).not.toBeNull();

    // Medium is still empty. Ask for an all-slot rotation 10 min later —
    // the fast bucket hasn't advanced (skip), but medium has no live game so
    // it must publish.
    const later = now + 10 * 60 * 1000;
    const result = await rotateIfDue(later);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.slots.fast.ok).toBe(true);
    // Fast stays idempotent within its 1h bucket.
    if (result.slots.fast.ok) expect(result.slots.fast.published).toBeNull();
    // Medium should have published fresh.
    expect(result.slots.medium.ok).toBe(true);
    if (result.slots.medium.ok) {
      expect(result.slots.medium.published).toMatch(/^ai-/);
      expect(result.slots.medium.skipped).toBe(false);
    }
    const mediumGame = await liveGameForSlot("medium", later);
    expect(mediumGame).not.toBeNull();
    expect(mediumGame!.rotationSlot).toBe("medium");
  });

  it("medium slot doesn't re-rotate within its 6-h bucket", async () => {
    // Pin `now` to a 6h bucket start so the +3h probe below stays inside
    // the same bucket regardless of floor alignment.
    const hour = 60 * 60 * 1000;
    const sixHourBucket = 6 * hour;
    const now = Math.floor(1_700_000_000_000 / sixHourBucket) * sixHourBucket;
    const first = await rotateIfDue(now, "medium");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.published).toMatch(/^ai-/);

    // +3h — still inside the same 6h bucket for medium. A second call must skip.
    const t1 = now + 3 * hour;
    const second = await rotateIfDue(t1, "medium");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.published).toBeNull();
    expect(second.skipped).toBe(true);
    expect(second.slots.medium.ok).toBe(true);
    if (second.slots.medium.ok) {
      expect(second.slots.medium.reason).toBe("already-rotated-this-bucket");
    }
  });

  it("slow slot expires 12 hours after publish", async () => {
    const now = 1_700_000_000_000;
    const hour = 60 * 60 * 1000;
    const first = await rotateIfDue(now, "slow");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const slowGame = await liveGameForSlot("slow", now);
    expect(slowGame).not.toBeNull();
    // validUntil must equal now + 12h to the millisecond (deterministic).
    expect(slowGame!.validUntil).toBe(now + 12 * hour);
    // Still live at t+11h, expired at t+12h+1s.
    expect(slowGame!.validUntil > now + 11 * hour).toBe(true);
    expect(slowGame!.validUntil <= now + 12 * hour + 1000).toBe(true);
  });

  it("legacy envelopes without rotationSlot are treated as fast", async () => {
    const now = 1_700_000_000_000;
    // Publish directly via runPipeline as legacy (no slot) then strip the
    // rotationSlot field to simulate a pre-3-slot envelope.
    const publish = await runPipeline(now);
    expect(publish.ok).toBe(true);
    if (!publish.ok) return;
    // Simulate the legacy shape by rewriting without rotationSlot.
    const { kvSet, kvGet } = await import("@/lib/redis");
    const envelope = await kvGet<Record<string, unknown>>(
      `xp:ai-games:${publish.game.id}`,
    );
    if (envelope) {
      delete envelope.rotationSlot;
      await kvSet(`xp:ai-games:${publish.game.id}`, envelope);
    }
    // liveGameForSlot("fast") should now resolve this envelope as "fast".
    const fastGame = await liveGameForSlot("fast", now);
    expect(fastGame).not.toBeNull();
    expect(fastGame!.id).toBe(publish.game.id);
    expect(resolveSlot(fastGame!.rotationSlot)).toBe("fast");
    // And it must NOT appear under medium/slow.
    expect(await liveGameForSlot("medium", now)).toBeNull();
    expect(await liveGameForSlot("slow", now)).toBeNull();
  });
});

describe("archiveOnExpire", () => {
  beforeEach(async () => {
    await resetState();
  });

  it("removes id from live index and is idempotent", async () => {
    const now = 1_700_100_000_000;
    const publish = await runPipeline(now);
    expect(publish.ok).toBe(true);
    if (!publish.ok) return;
    const id = publish.game.id;

    const first = await archiveOnExpire(id);
    expect(first.removed).toBe(true);
    const second = await archiveOnExpire(id);
    expect(second.removed).toBe(false);
    const live = await listActiveAiGames();
    expect(live.find((g) => g.id === id)).toBeUndefined();
  });
});
