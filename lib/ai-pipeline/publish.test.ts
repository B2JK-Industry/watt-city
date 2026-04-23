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

  it("publishing into a slot evicts ONLY that slot's prior entries — fresh other-slot games survive", async () => {
    // Regression test for the eviction bug reported 2026-04-23:
    // the old `while (index.length > MAX_ACTIVE_AI_GAMES) shift()` rule
    // evicted the oldest id in the union index, which under the new
    // 3-slot layout could drop a still-fresh medium/slow game the moment
    // a fast-slot publish bumped the index past 3 entries. Symptom
    // in prod: 2 live games instead of 3, oscillating over time.
    const t0 = 1_700_000_000_000;
    // First rotation publishes all three slots.
    const first = await rotateIfDue(t0);
    expect(first.ok).toBe(true);
    expect(Object.keys((first as { slots?: object }).slots ?? {}).sort()).toEqual(
      ["fast", "medium", "slow"],
    );
    expect((await listActiveAiGames()).length).toBe(3);
    const mediumId0 = (await liveGameForSlot("medium", t0))!.id;
    const slowId0 = (await liveGameForSlot("slow", t0))!.id;
    // Jump 1h 1s into the future: fast expires (1h TTL), medium/slow fresh.
    const t1 = t0 + 60 * 60 * 1000 + 1000;
    const second = await rotateIfDue(t1);
    expect(second.ok).toBe(true);
    const games = await listActiveAiGames();
    expect(games.length).toBe(3);
    // Medium + slow from t0 must still be present — they're fresh.
    const mediumStill = games.find((g) => g.id === mediumId0);
    const slowStill = games.find((g) => g.id === slowId0);
    expect(mediumStill).toBeDefined();
    expect(slowStill).toBeDefined();
    // And the fast slot holds a new envelope, not the t0 one.
    const fastNow = await liveGameForSlot("fast", t1);
    expect(fastNow).not.toBeNull();
    expect(fastNow!.generatedAt).toBe(t1);
  });

  it("dedupes duplicate fast entries left in the index by pre-3-slot data", async () => {
    // Pre-refactor snapshots could have up to 3 fast games in the live
    // index. On the new code, listActiveAiGames().slice(0, 3) should
    // surface 1 fast + 1 medium + 1 slow rather than 3 fast duplicates.
    const t0 = 1_700_000_000_000;
    // Manually seed three legacy fast envelopes into the index.
    const { kvSet } = await import("@/lib/redis");
    const legacyIds = ["ai-legacy-a", "ai-legacy-b", "ai-legacy-c"];
    const baseEnvelope = {
      title: "legacy",
      tagline: "legacy",
      description: "legacy",
      theme: "legacy-theme",
      source: "legacy-source",
      buildingName: "Legacy",
      buildingGlyph: "📦",
      buildingRoof: "#000",
      buildingBody: "#000",
      spec: { kind: "quiz" as const, xpPerCorrect: 10, items: [] },
      model: "test-stub",
      seed: 0,
      contentHash: "deadbeef",
      // Intentionally NO rotationSlot — mimics pre-3-slot envelopes.
    };
    for (const id of legacyIds) {
      await kvSet(`xp:ai-games:${id}`, {
        ...baseEnvelope,
        id,
        generatedAt: t0,
        validUntil: t0 + 60 * 60 * 1000, // 1h in the future
      });
    }
    await kvSet("xp:ai-games:index", legacyIds);
    // Force rotation. Fast slot sees 3 live fast envelopes → dedup keeps
    // newest, drops 2 older siblings off the live index.
    const result = await rotateIfDue(t0 + 1); // +1ms to avoid bucket skip
    expect(result.ok).toBe(true);
    const games = await listActiveAiGames();
    // Exactly one fast, one medium, one slow — no more fast duplicates.
    const bySlot = { fast: 0, medium: 0, slow: 0 } as Record<string, number>;
    for (const g of games) bySlot[resolveSlot(g.rotationSlot)]++;
    expect(bySlot.fast).toBe(1);
    expect(bySlot.medium).toBe(1);
    expect(bySlot.slow).toBe(1);
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
