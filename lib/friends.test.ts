import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, kvSet } from "@/lib/redis";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  listFriends,
  listInbox,
  listOutgoing,
  isFriend,
  readPrivacy,
  writePrivacy,
  canViewProfile,
} from "./friends";

async function prime(u: string) {
  await kvSet(`xp:user:${u}`, { username: u });
  for (const k of ["friends", "friend-requests", "friend-inbox"]) {
    await kvDel(`xp:user:${u}:${k}`);
    await kvDel(`xp:user:${u}:${k}:list`);
  }
  await kvDel(`xp:user:${u}:friend-privacy`);
  await kvDel(`xp:notifications:${u}`);
}

describe("friends handshake", () => {
  beforeEach(async () => {
    await prime("alice");
    await prime("bob");
    await prime("carol");
  });

  it("request + accept mirrors into both sides' friends list", async () => {
    const r = await sendFriendRequest("alice", "bob");
    expect(r.ok).toBe(true);
    expect(await listOutgoing("alice")).toContain("bob");
    expect(await listInbox("bob")).toContain("alice");
    const a = await acceptFriendRequest("bob", "alice");
    expect(a.ok).toBe(true);
    expect(await listFriends("alice")).toContain("bob");
    expect(await listFriends("bob")).toContain("alice");
    expect(await isFriend("alice", "bob")).toBe(true);
    expect(await listInbox("bob")).not.toContain("alice");
  });

  it("reject removes from inbox + outgoing", async () => {
    await sendFriendRequest("alice", "bob");
    const r = await rejectFriendRequest("bob", "alice");
    expect(r.ok).toBe(true);
    expect(await listInbox("bob")).not.toContain("alice");
    expect(await listOutgoing("alice")).not.toContain("bob");
    expect(await isFriend("alice", "bob")).toBe(false);
  });

  it("remove drops both sides of friendship", async () => {
    await sendFriendRequest("alice", "bob");
    await acceptFriendRequest("bob", "alice");
    const r = await removeFriend("alice", "bob");
    expect(r.ok).toBe(true);
    expect(await isFriend("alice", "bob")).toBe(false);
    expect(await isFriend("bob", "alice")).toBe(false);
  });

  it("cannot friend yourself", async () => {
    const r = await sendFriendRequest("alice", "alice");
    expect(r.ok).toBe(false);
  });

  it("rejects unknown user", async () => {
    const r = await sendFriendRequest("alice", "nobody-here");
    expect(r.ok).toBe(false);
  });
});

describe("privacy defaults + canViewProfile", () => {
  beforeEach(async () => {
    await prime("alice");
    await prime("bob");
  });

  it("defaults to 'friends' visibility (opt-in GDPR-K)", async () => {
    const p = await readPrivacy("alice");
    expect(p.profileVisibility).toBe("friends");
    expect(p.cashflowVisible).toBe(false);
  });

  it("non-friend cannot view 'friends' profile", async () => {
    const can = await canViewProfile("alice", "bob");
    expect(can).toBe(false);
  });

  it("friend can view 'friends' profile", async () => {
    await sendFriendRequest("alice", "bob");
    await acceptFriendRequest("bob", "alice");
    expect(await canViewProfile("alice", "bob")).toBe(true);
  });

  it("public profile viewable by anyone (even anonymous)", async () => {
    await writePrivacy("alice", { profileVisibility: "public" });
    expect(await canViewProfile("alice", null)).toBe(true);
  });

  it("private profile: only the user themselves", async () => {
    await writePrivacy("alice", { profileVisibility: "private" });
    expect(await canViewProfile("alice", "bob")).toBe(false);
    expect(await canViewProfile("alice", "alice")).toBe(true);
  });
});
