import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import { recordEvent, kindPopularity, mortgageFunnel } from "./analytics";
import { dayBucket } from "@/lib/economy";

async function wipeDay(day: string) {
  await kvDel(`xp:ev:day:${day}`);
  await kvDel(`xp:ev:kind-counts:${day}`);
  await kvDel(`xp:ev:funnel:mortgage:${day}`);
}

describe("analytics event capture", () => {
  const now = Date.now();
  const day = dayBucket(now);
  beforeEach(async () => {
    await wipeDay(day);
  });

  it("recordEvent increments kind counter", async () => {
    await recordEvent({ kind: "score_submitted", user: "alice", ts: now });
    await recordEvent({ kind: "score_submitted", user: "bob", ts: now });
    await recordEvent({ kind: "mortgage_taken", user: "alice", ts: now });
    const pop = await kindPopularity(day);
    const score = pop.find((p) => p.kind === "score_submitted");
    const mort = pop.find((p) => p.kind === "mortgage_taken");
    expect(score?.count).toBe(2);
    expect(mort?.count).toBe(1);
  });

  it("mortgage funnel aggregates each step separately", async () => {
    await recordEvent({ kind: "mortgage_taken", user: "u1", ts: now });
    await recordEvent({ kind: "mortgage_taken", user: "u2", ts: now });
    await recordEvent({ kind: "mortgage_paid_off", user: "u1", ts: now });
    await recordEvent({ kind: "mortgage_defaulted", user: "u3", ts: now });
    const funnel = await mortgageFunnel(day);
    expect(funnel["mortgage_taken"]).toBe(2);
    expect(funnel["mortgage_paid_off"]).toBe(1);
    expect(funnel["mortgage_defaulted"]).toBe(1);
  });
});
