/* In-app notification center — Phase 2.7.
 *
 * Every notable server-side event (new AI game, tier-up, mortgage payment
 * due/missed, friend request, marketplace sold) can pushNotification()
 * onto the player's feed. The client bell shows the unread count and lets
 * the user mark entries as seen.
 *
 * Storage: `xp:notifications:<username>` is a Redis LIST, newest-first,
 * capped at 200 entries (LTRIM). `xp:notifications:<username>:seen-at`
 * tracks the ms timestamp of the last "seen" ack — every entry with
 * `ts > seenAt` counts as unread.
 *
 * Quiet hours (2.7.8): between 21:00 and 08:00 local time we still APPEND
 * the entry but mark it `silent: true` so push channels (Phase 2.7.1-.4)
 * know to hold delivery until morning. The in-app center always shows
 * silent entries — quiet-hours only mutes push/ringer.
 */

import { lPush, lRange, lTrim, kvGet, kvSet } from "@/lib/redis";

export type NotificationKind =
  | "new-ai-game"
  | "tier-up"
  | "mortgage-due"
  | "mortgage-missed"
  | "friend-request"
  | "friend-accepted"
  | "marketplace-sold"
  | "marketplace-bought"
  | "achievement"
  | "admin-grant"
  | "system";

export type NotificationEntry = {
  id: string;
  ts: number;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
  silent: boolean;
};

const FEED_KEY = (u: string) => `xp:notifications:${u}`;
const SEEN_KEY = (u: string) => `xp:notifications:${u}:seen-at`;
const FEED_CAP = 200;

// Quiet hours (2.7.8): 21:00–08:00 LOCAL (server clock). We don't know the
// player's timezone on the server; for Polish-majority users Europe/Warsaw
// aligns well enough with UTC+1/+2 that the effect is roughly "nights".
// Players can override in settings (per-channel + quiet-hours toggle) —
// see NotificationSettings below.
export function inQuietHours(
  now = new Date(),
  config: { start: number; end: number } = { start: 21, end: 8 },
): boolean {
  const h = now.getHours();
  if (config.start >= config.end) {
    // wraps midnight: e.g. 21 → 08 next day
    return h >= config.start || h < config.end;
  }
  return h >= config.start && h < config.end;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function pushNotification(
  username: string,
  entry: Omit<NotificationEntry, "id" | "ts" | "silent">,
  now = new Date(),
): Promise<NotificationEntry> {
  const silent = inQuietHours(now);
  const full: NotificationEntry = {
    id: randomId(),
    ts: now.getTime(),
    silent,
    ...entry,
  };
  await lPush(FEED_KEY(username), full);
  // Best-effort trim — doesn't block
  await lTrim(FEED_KEY(username), 0, FEED_CAP - 1);
  return full;
}

export async function listNotifications(
  username: string,
  n = 50,
): Promise<{ entries: NotificationEntry[]; unread: number; seenAt: number }> {
  const [entries, seenAt] = await Promise.all([
    lRange<NotificationEntry>(FEED_KEY(username), n),
    kvGet<number>(SEEN_KEY(username)),
  ]);
  const lastSeen = seenAt ?? 0;
  const unread = entries.filter((e) => e.ts > lastSeen).length;
  return { entries, unread, seenAt: lastSeen };
}

export async function markAllSeen(
  username: string,
  now = Date.now(),
): Promise<void> {
  await kvSet(SEEN_KEY(username), now);
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export type NotificationChannel = "in-app" | "push" | "email";

export type NotificationSettings = {
  enabled: Record<NotificationChannel, boolean>;
  quietHours: { enabled: boolean; start: number; end: number };
};

const PREFS_KEY = (u: string) => `xp:notifications:${u}:prefs`;

export const DEFAULT_PREFS: NotificationSettings = {
  enabled: { "in-app": true, push: false, email: false },
  quietHours: { enabled: true, start: 21, end: 8 },
};

export async function readPrefs(
  username: string,
): Promise<NotificationSettings> {
  const existing = await kvGet<Partial<NotificationSettings>>(PREFS_KEY(username));
  if (!existing) return DEFAULT_PREFS;
  return {
    ...DEFAULT_PREFS,
    ...existing,
    enabled: { ...DEFAULT_PREFS.enabled, ...(existing.enabled ?? {}) },
    quietHours: {
      ...DEFAULT_PREFS.quietHours,
      ...(existing.quietHours ?? {}),
    },
  };
}

export async function writePrefs(
  username: string,
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const next = { ...(await readPrefs(username)), ...patch };
  await kvSet(PREFS_KEY(username), next);
  return next;
}
