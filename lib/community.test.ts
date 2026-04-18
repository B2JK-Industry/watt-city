import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  cheer,
  listCheers,
  postComment,
  listComments,
  reportComment,
  adminSetCommentHidden,
  adminBan,
  adminUnban,
  isEffectivelyBanned,
  containsSlur,
  AUTO_HIDE_REPORT_THRESHOLD,
} from "./community";

async function reset(u: string) {
  await kvDel(`xp:cheers:${u}`);
  await kvDel(`xp:notifications:${u}`);
}

async function resetGame(g: string) {
  await kvDel(`xp:comments:${g}`);
}

describe("containsSlur", () => {
  it("detects direct slur", () => {
    expect(containsSlur("to jest totalna kurwa")).toBe(true);
  });
  it("passes a clean sentence", () => {
    expect(containsSlur("super gra, nauczyłem się RRSO")).toBe(false);
  });
});

describe("cheer", () => {
  beforeEach(async () => {
    await reset("alice");
    await reset("bob");
  });

  it("records a cheer + notifies target", async () => {
    const r = await cheer("alice", "bob");
    expect(r.ok).toBe(true);
    const list = await listCheers("bob");
    expect(list[0].from).toBe("alice");
  });

  it("same-day duplicate rejected", async () => {
    await cheer("alice", "bob");
    const r = await cheer("alice", "bob");
    expect(r.ok).toBe(false);
  });

  it("cannot cheer yourself", async () => {
    const r = await cheer("alice", "alice");
    expect(r.ok).toBe(false);
  });
});

describe("comments + moderation", () => {
  const g = "ai-test-123";
  beforeEach(async () => {
    await resetGame(g);
  });

  it("accepts clean comment", async () => {
    const r = await postComment("alice", g, "świetna gra, nauczyłem się o RRSO");
    expect(r.ok).toBe(true);
    const list = await listComments(g);
    expect(list.length).toBe(1);
  });

  it("rejects slur", async () => {
    const r = await postComment("alice", g, "jakaś kurwa");
    expect(r.ok).toBe(false);
  });

  it(`auto-hides comment after ${AUTO_HIDE_REPORT_THRESHOLD} reports`, async () => {
    const posted = await postComment("alice", g, "legit comment text");
    expect(posted.ok).toBe(true);
    if (!posted.ok) return;
    const id = posted.comment!.id;
    await reportComment("bob", id);
    await reportComment("carol", id);
    const third = await reportComment("dave", id);
    expect(third.ok).toBe(true);
    if (!third.ok) return;
    expect(third.hiddenNow).toBe(true);
    const visible = await listComments(g);
    expect(visible.some((c) => c.id === id)).toBe(false);
    const all = await listComments(g, { includeHidden: true });
    expect(all.some((c) => c.id === id && c.hidden)).toBe(true);
  });

  it("admin can hide + unhide", async () => {
    const posted = await postComment("alice", g, "another comment");
    expect(posted.ok).toBe(true);
    if (!posted.ok) return;
    await adminSetCommentHidden(posted.comment!.id, true);
    expect((await listComments(g)).length).toBe(0);
    await adminSetCommentHidden(posted.comment!.id, false);
    expect((await listComments(g)).length).toBe(1);
  });

  it("banned user can't comment", async () => {
    await adminBan("troll");
    expect(await isEffectivelyBanned("troll")).toBe(true);
    const r = await postComment("troll", g, "some text here");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("banned");
    await adminUnban("troll");
    expect(await isEffectivelyBanned("troll")).toBe(false);
    const r2 = await postComment("troll", g, "reformed comment");
    expect(r2.ok).toBe(true);
  });
});
