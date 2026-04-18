/* Community primitives — Phase 3.5.
 *
 * 3.5.2 Cheers: 🎉 reactions from one user to another, stored per-target.
 * 3.5.3 Comments on archived AI games (one thread per gameId).
 * 3.5.4 Moderation: reports (SADD counter) + auto-hide at 3 reports;
 *       admin can hide/ban via flipping the `hidden` flag.
 *
 * All user-facing text goes through a simple denylist filter first so a
 * raw slur never even lands in the list.
 */

import { lPush, lRange, lTrim, kvGet, kvSet, sAdd, sHas } from "@/lib/redis";
import { pushNotification } from "@/lib/notifications";

const CHEERS_KEY = (target: string) => `xp:cheers:${target}`;
const COMMENTS_KEY = (gameId: string) => `xp:comments:${gameId}`;
const COMMENT_KEY = (id: string) => `xp:comment:${id}`;
const REPORT_KEY = (commentId: string) => `xp:reports:${commentId}`;
const BANNED_KEY = "xp:banned-users"; // SADD set of banned usernames

export const AUTO_HIDE_REPORT_THRESHOLD = 3;

// Minimal denylist — regex-matched against the lowered text. Content mod
// (Phase 5.2) will replace this with a richer filter + LLM check.
const SLUR_PATTERNS: RegExp[] = [
  /\bkurwa\b/i,
  /\bfuck\b/i,
  /\bshit\b/i,
  /\bidiot\b/i,
  /\bbastard\b/i,
  /\bpiz[dz]a\b/i,
];

export function containsSlur(text: string): boolean {
  return SLUR_PATTERNS.some((r) => r.test(text));
}

// ---------------------------------------------------------------------------
// Cheers
// ---------------------------------------------------------------------------

export type Cheer = {
  from: string;
  ts: number;
  emoji: string;
  gameId?: string;
};

export async function cheer(
  from: string,
  target: string,
  emoji = "🎉",
  gameId?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (from === target) return { ok: false, error: "cannot-cheer-self" };
  // Simple idempotency: only ONE cheer per (from, target, gameId) per UTC day.
  const day = new Date().toISOString().slice(0, 10);
  const dedupKey = `xp:cheer-dedup:${target}:${day}`;
  const dedup = `${from}:${gameId ?? "-"}`;
  const isNew = await sAdd(dedupKey, dedup);
  if (!isNew) return { ok: false, error: "already-cheered-today" };
  const entry: Cheer = { from, ts: Date.now(), emoji, gameId };
  await lPush(CHEERS_KEY(target), entry);
  await lTrim(CHEERS_KEY(target), 0, 199);
  await pushNotification(target, {
    kind: "achievement",
    title: `${emoji} od ${from}`,
    body: gameId ? `Ktoś cię docenił za grę ${gameId}.` : "Ktoś cię docenił.",
    meta: { cheerer: from, emoji },
  });
  return { ok: true };
}

export async function listCheers(target: string): Promise<Cheer[]> {
  return await lRange<Cheer>(CHEERS_KEY(target), 50);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export type Comment = {
  id: string;
  gameId: string;
  author: string;
  text: string;
  ts: number;
  hidden: boolean;
  reportCount: number;
};

export async function isBanned(username: string): Promise<boolean> {
  return await sHas(BANNED_KEY, username);
}

export async function postComment(
  author: string,
  gameId: string,
  text: string,
): Promise<{ ok: boolean; error?: string; comment?: Comment }> {
  if (await isEffectivelyBanned(author)) return { ok: false, error: "banned" };
  const trimmed = text.trim();
  if (trimmed.length < 2) return { ok: false, error: "too-short" };
  if (trimmed.length > 400) return { ok: false, error: "too-long" };
  if (containsSlur(trimmed)) return { ok: false, error: "contains-slur" };
  const id = `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const comment: Comment = {
    id,
    gameId,
    author,
    text: trimmed,
    ts: Date.now(),
    hidden: false,
    reportCount: 0,
  };
  await kvSet(COMMENT_KEY(id), comment);
  await lPush(COMMENTS_KEY(gameId), id);
  await lTrim(COMMENTS_KEY(gameId), 0, 199);
  return { ok: true, comment };
}

export async function listComments(
  gameId: string,
  opts: { includeHidden?: boolean } = {},
): Promise<Comment[]> {
  const ids = await lRange<string>(COMMENTS_KEY(gameId), 100);
  const out: Comment[] = [];
  for (const id of ids) {
    const c = await kvGet<Comment>(COMMENT_KEY(id));
    if (!c) continue;
    if (c.hidden && !opts.includeHidden) continue;
    out.push(c);
  }
  return out;
}

export async function reportComment(
  reporter: string,
  commentId: string,
): Promise<{ ok: boolean; hiddenNow: boolean; reportCount: number; error?: string }> {
  const isNew = await sAdd(REPORT_KEY(commentId), reporter);
  if (!isNew)
    return { ok: false, hiddenNow: false, reportCount: 0, error: "already-reported" };
  const c = await kvGet<Comment>(COMMENT_KEY(commentId));
  if (!c) return { ok: false, hiddenNow: false, reportCount: 0, error: "unknown-comment" };
  c.reportCount = (c.reportCount ?? 0) + 1;
  const hiddenNow = c.reportCount >= AUTO_HIDE_REPORT_THRESHOLD;
  if (hiddenNow) c.hidden = true;
  await kvSet(COMMENT_KEY(commentId), c);
  return { ok: true, hiddenNow, reportCount: c.reportCount };
}

// Admin-only — flip hidden flag.
export async function adminSetCommentHidden(
  commentId: string,
  hidden: boolean,
): Promise<boolean> {
  const c = await kvGet<Comment>(COMMENT_KEY(commentId));
  if (!c) return false;
  c.hidden = hidden;
  await kvSet(COMMENT_KEY(commentId), c);
  return true;
}

// Admin-only — ban a user from commenting/cheering.
export async function adminBan(username: string): Promise<void> {
  await sAdd(BANNED_KEY, username);
}

// Admin-only — lift a ban. We can't SREM via our helper; we use a parallel
// denylist-list and let isBanned consult BOTH sources.
const UNBAN_KEY = "xp:unbanned-users";
export async function adminUnban(username: string): Promise<void> {
  await sAdd(UNBAN_KEY, username);
}

export async function isEffectivelyBanned(username: string): Promise<boolean> {
  const [banned, unbanned] = await Promise.all([
    sHas(BANNED_KEY, username),
    sHas(UNBAN_KEY, username),
  ]);
  return banned && !unbanned;
}
