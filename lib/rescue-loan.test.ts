import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, sAdd, sHas } from "@/lib/redis";

const RESCUE_DEDUP_KEY = (u: string, bucket: string) =>
  `xp:loan:rescue:${u}:${bucket}`;

async function reset(u: string, bucket: string) {
  await kvDel(RESCUE_DEDUP_KEY(u, bucket));
}

describe("V3.3 rescue-loan monthly dedup", () => {
  const u = "v3-rescue-user";
  const bucket = "2026-04";
  beforeEach(() => reset(u, bucket));

  it("SADD returns true first time, false second time — dedup blocks re-take", async () => {
    const first = await sAdd(RESCUE_DEDUP_KEY(u, bucket), "taken");
    const second = await sAdd(RESCUE_DEDUP_KEY(u, bucket), "taken");
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(await sHas(RESCUE_DEDUP_KEY(u, bucket), "taken")).toBe(true);
  });

  it("different month buckets are independent", async () => {
    const first = await sAdd(RESCUE_DEDUP_KEY(u, "2026-04"), "taken");
    const second = await sAdd(RESCUE_DEDUP_KEY(u, "2026-05"), "taken");
    expect(first).toBe(true);
    expect(second).toBe(true);
    await kvDel(RESCUE_DEDUP_KEY(u, "2026-05"));
  });
});
