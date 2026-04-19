import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  acquireBuildingLock,
  releaseBuildingLock,
  isBuildingLocked,
} from "./building-lock";

const LOCK_KEY = (u: string) => `xp:building-lock:${u}`;

async function reset(u: string) {
  await kvDel(LOCK_KEY(u));
}

describe("V3.4 building lock", () => {
  const u = "lock-user";
  beforeEach(() => reset(u));

  it("acquire returns token first time, null second time", async () => {
    const t1 = await acquireBuildingLock(u);
    const t2 = await acquireBuildingLock(u);
    expect(t1).not.toBeNull();
    expect(t2).toBeNull();
  });

  it("isBuildingLocked reflects current state", async () => {
    expect(await isBuildingLocked(u)).toBe(false);
    const t = await acquireBuildingLock(u);
    expect(t).not.toBeNull();
    expect(await isBuildingLocked(u)).toBe(true);
  });

  it("release frees the lock for next acquirer", async () => {
    const t = await acquireBuildingLock(u);
    expect(t).not.toBeNull();
    await releaseBuildingLock(u, t!);
    expect(await isBuildingLocked(u)).toBe(false);
    const t2 = await acquireBuildingLock(u);
    expect(t2).not.toBeNull();
  });

  it("release with stale/wrong token is a no-op", async () => {
    const t = await acquireBuildingLock(u);
    expect(t).not.toBeNull();
    await releaseBuildingLock(u, "wrong-token");
    // Still locked
    expect(await isBuildingLocked(u)).toBe(true);
  });
});
