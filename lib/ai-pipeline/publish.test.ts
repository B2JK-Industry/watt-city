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
  runPipeline,
} from "./publish";

// Relies on the in-memory redis fallback (no UPSTASH_* env set in test runs).
// Also relies on the mock-v1 generator (no ANTHROPIC_API_KEY), so tests are
// fast (<100ms) and deterministic.

async function resetState() {
  await kvDel("xp:ai-games:index");
  await kvDel("xp:ai-games:archive-index");
  await kvDel("xp:rotation-lock");
  await kvDel("xp:ai-games:last-rotation-bucket");
}

describe("rotateIfDue — hourly rotation flow", () => {
  beforeEach(async () => {
    await resetState();
  });

  it("publishes a new game on first call and records the hour bucket", async () => {
    const now = 1_700_000_000_000;
    const result = await rotateIfDue(now);
    if (!result.ok) throw new Error(`rotateIfDue failed: ${result.error}`);
    expect(result.published).toMatch(/^ai-/);
    expect(result.skipped).toBe(false);
    const live = await listActiveAiGames();
    expect(live.length).toBe(1);
  });

  it("is idempotent within the same hour bucket — second call skips publish", async () => {
    const now = 1_700_000_000_000;
    const first = await rotateIfDue(now);
    expect(first.ok && first.published).toBeTruthy();

    const second = await rotateIfDue(now + 5 * 60 * 1000); // +5 min, same hour
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.published).toBeNull();
    expect(second.skipped).toBe(true);
    const live = await listActiveAiGames();
    expect(live.length).toBe(1); // still just the one
  });

  it("archives expired games and publishes a new one in the next hour bucket", async () => {
    const hour = 60 * 60 * 1000;
    const t0 = 1_700_000_000_000;
    const first = await rotateIfDue(t0);
    expect(first.ok).toBe(true);

    // Advance past the expiry (validUntil = t0 + 1h)
    const t1 = t0 + hour + 60_000;
    const second = await rotateIfDue(t1);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.rotated.length).toBe(1); // previous game archived
    expect(second.published).toMatch(/^ai-/);
    expect(second.skipped).toBe(false);
  });

  it("lock-contended returns contended error when lock is held", async () => {
    const now = 1_700_000_000_000;
    // Seed the lock manually
    const { kvSetNX } = await import("@/lib/redis");
    await kvSetNX("xp:rotation-lock", "held-by-other", { ex: 60 });
    const result = await rotateIfDue(now);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.contended).toBe(true);
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
