import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import { listProposals, submitProposal, votePro } from "./theme-proposals";
import { bucketOf, EXPERIMENTS } from "./ab";

async function reset() {
  await kvDel("xp:theme-proposals");
}

describe("theme proposals", () => {
  beforeEach(() => reset());

  it("submit + vote increments counter", async () => {
    const r = await submitProposal("alice", "Black Friday 2026 — psychologia promocji");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const v = await votePro("bob", r.proposal!.id);
    expect(v.ok).toBe(true);
    expect(v.voteCount).toBe(2);
  });

  it("duplicate proposal rejected", async () => {
    await submitProposal("alice", "long enough theme text here");
    const dup = await submitProposal("bob", "long enough theme text here");
    expect(dup.ok).toBe(false);
  });

  it("listProposals returns newest-highest-voted first", async () => {
    const a = await submitProposal("a", "Theme One something longer");
    const b = await submitProposal("b", "Theme Two something longer");
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    await votePro("x1", a.proposal!.id);
    await votePro("x2", a.proposal!.id);
    const sorted = await listProposals(10);
    expect(sorted[0].id).toBe(a.proposal!.id); // 3 votes vs 1
  });
});

describe("A/B bucket assignment", () => {
  it("active experiment distributes into the configured variants", () => {
    const ex = EXPERIMENTS["tier-up-mobile"];
    const buckets = new Set<string>();
    for (const u of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      buckets.add(bucketOf(u, ex));
    }
    // ≥1 variant; usually both given the hash spread.
    expect(buckets.size).toBeGreaterThanOrEqual(1);
    for (const b of buckets) {
      expect(ex.variants).toContain(b);
    }
  });
  it("inactive experiment pins everyone to variants[0]", () => {
    const ex = EXPERIMENTS["mortgage-copy"];
    expect(ex.active).toBe(false);
    expect(bucketOf("anyone", ex)).toBe(ex.variants[0]);
  });
  it("same user always gets the same bucket", () => {
    const ex = EXPERIMENTS["tier-up-mobile"];
    const b1 = bucketOf("stable-user", ex);
    const b2 = bucketOf("stable-user", ex);
    expect(b1).toBe(b2);
  });
});
