/* First-party analytics — Phase 5.3.
 *
 * Constraint (5.3.2): every event stays inside our Upstash Redis. No GA,
 * no Meta Pixel, nothing that beacons to a third party.
 *
 * Event schema:
 *   xp:ev:<YYYY-MM-DD>               = ZSET, member = JSON.stringify({ts,kind,user,meta}), score = ts
 *   xp:ev:user:<u>:first-seen        = ts (ms since epoch) set once on first event
 *   xp:ev:user:<u>:days              = ZSET, member = "YYYY-MM-DD", score = ts of first event that day
 *   xp:ev:kind-counts:<YYYY-MM-DD>   = ZSET, member = kindName, score = count
 *   xp:ev:funnel:mortgage:<YYYY-MM-DD> = ZSET, member = step ("eligible","taken","defaulted","paid_off"), score = count
 *
 * `recordEvent` is intentionally fire-and-forget-ish — a single kvSet/
 * zIncrBy per call. Dashboards run ad-hoc queries; we don't precompute
 * anything heavy.
 */

import { kvGet, kvSet, zIncrBy, zTopN, lPush, lRange } from "@/lib/redis";
import { dayBucket } from "@/lib/economy";

export type AnalyticsKind =
  | "game_started"
  | "game_completed"
  | "score_submitted"
  | "building_built"
  | "building_upgraded"
  | "building_demolished"
  | "mortgage_eligible"
  | "mortgage_taken"
  | "mortgage_paid_off"
  | "mortgage_defaulted"
  | "marketplace_listed"
  | "marketplace_sold"
  | "friend_request_sent"
  | "friend_request_accepted"
  | "class_joined"
  | "parent_linked"
  | "rotation_fired"
  | "moderation_rejected";

export type AnalyticsEvent = {
  ts: number;
  kind: AnalyticsKind;
  user?: string;
  meta?: Record<string, unknown>;
};

const USER_FIRST_SEEN = (u: string) => `xp:ev:user:${u}:first-seen`;
const USER_DAYS = (u: string) => `xp:ev:user:${u}:days`;
const DAY_EVENTS = (day: string) => `xp:ev:day:${day}`;
const KIND_COUNTS = (day: string) => `xp:ev:kind-counts:${day}`;
const MORTGAGE_FUNNEL = (day: string) => `xp:ev:funnel:mortgage:${day}`;

export async function recordEvent(
  ev: Omit<AnalyticsEvent, "ts"> & { ts?: number },
): Promise<void> {
  const ts = ev.ts ?? Date.now();
  const day = dayBucket(ts);
  const full: AnalyticsEvent = { ...ev, ts };

  // Per-day event list (for ad-hoc queries).
  await lPush(DAY_EVENTS(day), full);

  // Per-kind daily counter.
  await zIncrBy(KIND_COUNTS(day), 1, ev.kind);

  // Mortgage funnel sub-bucket.
  if (
    ev.kind === "mortgage_eligible" ||
    ev.kind === "mortgage_taken" ||
    ev.kind === "mortgage_paid_off" ||
    ev.kind === "mortgage_defaulted"
  ) {
    await zIncrBy(MORTGAGE_FUNNEL(day), 1, ev.kind);
  }

  if (ev.user) {
    // First-seen timestamp (set once).
    const existing = await kvGet<number>(USER_FIRST_SEEN(ev.user));
    if (!existing) await kvSet(USER_FIRST_SEEN(ev.user), ts);
    // Per-user day membership: ZSET scored by ts. Cheap upsert via zIncrBy 0.
    await zIncrBy(USER_DAYS(ev.user), 0, day);
    // Ensure the member's score is the day timestamp for sorted iteration.
    await zIncrBy(USER_DAYS(ev.user), ts, day);
  }
}

// ---------------------------------------------------------------------------
// Retention (5.3.3)
// ---------------------------------------------------------------------------

/** For each cohort day (users whose first-seen falls on that day), count how
 *  many came back on day+1, day+7, day+30. We walk the USER_DAYS ZSET per
 *  user so this is O(users × cohort-day events); MVP-appropriate for
 *  hundreds of users. Scale-up path: precompute in a nightly job. */
export async function retentionSummary(
  sampleUsers: string[],
  now = Date.now(),
): Promise<{ cohortDays: string[]; d1: number; d7: number; d30: number }> {
  const stats = { d1: 0, d7: 0, d30: 0 };
  const cohorts = new Set<string>();
  for (const u of sampleUsers) {
    const first = await kvGet<number>(USER_FIRST_SEEN(u));
    if (!first) continue;
    const cohort = dayBucket(first);
    cohorts.add(cohort);
    const days = new Set<string>();
    // Use zTopN with large N as a stand-in for "read all members" — our
    // helper returns { username, xp, rank } but member is stored as the
    // username field here (we repurpose the ZSET for day strings).
    const rows = await zTopN(USER_DAYS(u), 400);
    for (const r of rows) days.add(r.username);
    if (days.has(dayBucket(first + 24 * 60 * 60 * 1000))) stats.d1 += 1;
    if (days.has(dayBucket(first + 7 * 24 * 60 * 60 * 1000))) stats.d7 += 1;
    if (days.has(dayBucket(first + 30 * 24 * 60 * 60 * 1000))) stats.d30 += 1;
  }
  return {
    cohortDays: Array.from(cohorts).sort(),
    ...stats,
  };
}

// ---------------------------------------------------------------------------
// Kind popularity (5.3.4)
// ---------------------------------------------------------------------------

export async function kindPopularity(
  day: string = dayBucket(),
): Promise<{ kind: string; count: number }[]> {
  const rows = await zTopN(KIND_COUNTS(day), 50);
  return rows.map((r) => ({ kind: r.username, count: r.xp }));
}

// ---------------------------------------------------------------------------
// Mortgage funnel (5.3.5)
// ---------------------------------------------------------------------------

export async function mortgageFunnel(
  day: string = dayBucket(),
): Promise<Record<string, number>> {
  const rows = await zTopN(MORTGAGE_FUNNEL(day), 10);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.username] = r.xp;
  return out;
}

// ---------------------------------------------------------------------------
// Event stream read (ad-hoc)
// ---------------------------------------------------------------------------

export async function readDayStream(
  day: string = dayBucket(),
  n = 200,
): Promise<AnalyticsEvent[]> {
  return await lRange<AnalyticsEvent>(DAY_EVENTS(day), n);
}
