import { describe, it, expect, beforeEach } from "vitest";
import {
  emptyPlayerState,
  getPlayerState,
  creditResources,
  recentLedger,
} from "./player";
import { kvDel } from "@/lib/redis";
import {
  resourceDeltaFromYield,
  yieldForGame,
  addResources,
  ZERO_RESOURCES,
} from "@/lib/resources";

async function resetPlayer(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
}

describe("resources — yield computation", () => {
  it("maps game ids to primary resources per ECONOMY §2", () => {
    expect(yieldForGame("finance-quiz")?.primary).toBe("coins");
    expect(yieldForGame("word-scramble")?.primary).toBe("bricks");
    expect(yieldForGame("math-sprint")?.primary).toBe("watts");
    expect(yieldForGame("unknown-game-id")).toBeNull();
  });

  it("maps AI kinds via aiKind arg", () => {
    expect(yieldForGame("ai-abc123", "quiz")?.primary).toBe("coins");
    expect(yieldForGame("ai-abc123", "scramble")?.primary).toBe("bricks");
    // V2 refactor: negotiate used to yield 'code' (deprecated); it now
    // routes to coins via AI_KIND_YIELDS rewrite.
    expect(yieldForGame("ai-abc123", "negotiate")?.primary).toBe("coins");
  });

  it("scales primary resource 1:1 with xp delta", () => {
    const y = yieldForGame("finance-quiz")!;
    const delta = resourceDeltaFromYield(100, y);
    expect(delta.coins).toBe(100);
  });

  it("scales secondary resource at 0.5 of primary", () => {
    const y = yieldForGame("power-flip")!;
    const delta = resourceDeltaFromYield(80, y);
    expect(delta.watts).toBe(80);
    expect(delta.coins).toBe(40);
  });

  it("addResources clamps at 1_000_000 max", () => {
    const next = addResources(
      { ...ZERO_RESOURCES, coins: 999_900 },
      { coins: 500 },
    );
    expect(next.coins).toBe(1_000_000);
  });
});

describe("player ledger — idempotent credit", () => {
  const username = "test-user-ledger";
  beforeEach(() => resetPlayer(username));

  it("first submission credits, second (same sourceId) is a no-op", async () => {
    let state = await getPlayerState(username);
    const first = await creditResources(
      state,
      "score",
      { coins: 100 },
      "test",
      "score:finance-quiz:0->100",
    );
    expect(first.applied).toBe(true);
    expect(first.resources.coins).toBe(100);

    state = await getPlayerState(username);
    const second = await creditResources(
      state,
      "score",
      { coins: 100 },
      "test",
      "score:finance-quiz:0->100",
    );
    expect(second.applied).toBe(false);
    expect(second.resources.coins).toBe(100); // unchanged
  });

  it("different sourceId credits again — anti-grind uses best-score transitions", async () => {
    let state = await getPlayerState(username);
    await creditResources(
      state,
      "score",
      { coins: 100 },
      "first best",
      "score:finance-quiz:0->100",
    );
    state = await getPlayerState(username);
    const second = await creditResources(
      state,
      "score",
      { coins: 50 },
      "new best",
      "score:finance-quiz:100->150",
    );
    expect(second.applied).toBe(true);
    expect(second.resources.coins).toBe(150);
  });

  it("ledger entries appear newest-first", async () => {
    let state = await getPlayerState(username);
    await creditResources(state, "score", { coins: 10 }, "a", "a1");
    state = await getPlayerState(username);
    await creditResources(state, "score", { coins: 20 }, "b", "b1");
    state = await getPlayerState(username);
    await creditResources(state, "score", { coins: 30 }, "c", "c1");
    const log = await recentLedger(username, 10);
    expect(log.map((l) => l.reason)).toEqual(["c", "b", "a"]);
  });

  it("emptyPlayerState has zero balance + credit score 50", () => {
    const s = emptyPlayerState("anyone");
    expect(s.resources.coins).toBe(0);
    expect(s.creditScore).toBe(50);
  });
});
