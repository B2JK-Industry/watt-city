import { describe, it, expect, beforeEach } from "vitest";
import {
  pushNotification,
  listNotifications,
  markAllSeen,
  inQuietHours,
  readPrefs,
  writePrefs,
  DEFAULT_PREFS,
} from "./notifications";
import { kvDel } from "@/lib/redis";

async function reset(u: string) {
  await kvDel(`xp:notifications:${u}`);
  await kvDel(`xp:notifications:${u}:seen-at`);
  await kvDel(`xp:notifications:${u}:prefs`);
}

describe("inQuietHours — default window 21–08", () => {
  it("returns true at 22:00", () => {
    const d = new Date();
    d.setHours(22, 0, 0, 0);
    expect(inQuietHours(d)).toBe(true);
  });
  it("returns true at 05:00 (wraps past midnight)", () => {
    const d = new Date();
    d.setHours(5, 0, 0, 0);
    expect(inQuietHours(d)).toBe(true);
  });
  it("returns false at 14:00", () => {
    const d = new Date();
    d.setHours(14, 0, 0, 0);
    expect(inQuietHours(d)).toBe(false);
  });
  it("honors custom non-wrap window", () => {
    const d = new Date();
    d.setHours(3, 0, 0, 0);
    expect(inQuietHours(d, { start: 1, end: 6 })).toBe(true);
    expect(inQuietHours(d, { start: 9, end: 17 })).toBe(false);
  });
});

describe("notification feed", () => {
  const u = "notif-user";
  beforeEach(() => reset(u));

  it("pushes + lists newest first", async () => {
    const now = new Date();
    now.setHours(12); // daytime → silent:false
    await pushNotification(
      u,
      { kind: "tier-up", title: "T2", body: "from T1" },
      now,
    );
    await pushNotification(
      u,
      { kind: "tier-up", title: "T3", body: "from T2" },
      new Date(now.getTime() + 1000),
    );
    const feed = await listNotifications(u, 10);
    expect(feed.entries.length).toBe(2);
    expect(feed.entries[0].title).toBe("T3"); // newest first
  });

  it("unread = count of entries after seenAt", async () => {
    const day = new Date();
    day.setHours(12);
    await pushNotification(u, { kind: "system", title: "a", body: "a" }, day);
    await pushNotification(u, { kind: "system", title: "b", body: "b" }, new Date(day.getTime() + 1000));
    const { unread } = await listNotifications(u, 10);
    expect(unread).toBe(2);
    await markAllSeen(u, day.getTime() + 2000);
    const after = await listNotifications(u, 10);
    expect(after.unread).toBe(0);
  });

  it("silent=true when pushed inside quiet hours", async () => {
    const night = new Date();
    night.setHours(23, 30, 0, 0);
    const entry = await pushNotification(
      u,
      { kind: "system", title: "night", body: "shh" },
      night,
    );
    expect(entry.silent).toBe(true);
  });
});

describe("notification prefs", () => {
  const u = "notif-prefs-user";
  beforeEach(() => reset(u));

  it("returns defaults when unset", async () => {
    const p = await readPrefs(u);
    expect(p).toEqual(DEFAULT_PREFS);
  });

  it("merges partial overrides", async () => {
    await writePrefs(u, {
      enabled: { "in-app": true, push: true, email: false },
    });
    const p = await readPrefs(u);
    expect(p.enabled.push).toBe(true);
    expect(p.quietHours.start).toBe(21); // untouched
  });
});
