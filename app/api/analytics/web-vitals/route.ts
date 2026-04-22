import { NextRequest } from "next/server";
import { z } from "zod";
import { kvSet, zIncrBy } from "@/lib/redis";
import { dayBucket } from "@/lib/economy";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

/* Web Vitals collector — Phase 6.5.1.
 *
 * Receives a single Vitals report from the client (navigation-type,
 * metric-name, value, route). We bucket per-day-per-route + also emit a
 * running p95 approximation via a reservoir-style sampler.
 *
 * Storage:
 *   xp:perf:<day>:<route>:<metric>      → latest value (string)
 *   xp:perf:<day>:<route>:<metric>:n    → count
 *   xp:perf:<day>:<route>:<metric>:sum  → sum (ZINCRBY score on sentinel)
 *   xp:perf:<day>:<route>:<metric>:hi:<bucket>   → count per 50-ms bucket
 *
 * Abuse posture (tightened 2026-04-22): endpoint is unauthenticated
 * and CSRF-exempt by necessity (sendBeacon can't set custom headers).
 * Three bounds protect Upstash keyspace:
 *  1) `route` is normalised to a known-route enum — unknown routes
 *     collapse to `"other"` so an attacker can't fan out to 10k
 *     unique path strings.
 *  2) `hi:` bucket keys are quantised to 50-ms buckets (max 1 201
 *     members per metric vs the pre-fix 60 001).
 *  3) Per-IP rate limit 120 req/min — a single page emits ≤ 6 beacons
 *     on load, so 120 covers a sustained 20 navigations/min with
 *     headroom. Spammer hits the limit long before filling keyspace.
 */

const BodySchema = z.object({
  name: z.enum(["LCP", "FID", "CLS", "INP", "TTFB", "FCP"]),
  value: z.number().min(0).max(60_000),
  route: z.string().max(120),
  nav: z.string().max(40).optional(),
});

/** Known top-level routes we want separate timing buckets for. Anything
 *  not on this list collapses to `"other"` so attacker-controlled
 *  `route` strings can't fan Redis keys out. When a real route is added
 *  to the app, remember to add it here if you want separate metrics;
 *  otherwise the metric still lands in `other` (no data loss, just
 *  coarser). */
const KNOWN_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/games",
  "/miasto",
  "/leaderboard",
  "/profile",
  "/o-platforme",
  "/ochrana-sukromia",
  "/dla-szkol",
  "/nauczyciel",
  "/rodzic",
  "/loans/compare",
  "/status",
  "/pko",
]);

function normaliseRoute(raw: string): string {
  // Exact match first
  if (KNOWN_ROUTES.has(raw)) return raw;
  // Parameterised routes — collapse to prefix with generic ":slug" tail
  // Keep only the first two segments so `/games/ai/XYZ` and
  // `/parent/bob` don't explode keyspace.
  const segments = raw.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const prefix = `/${segments[0]}/:slug`;
    if (
      segments[0] === "games" ||
      segments[0] === "parent" ||
      segments[0] === "profile" ||
      segments[0] === "loans"
    ) {
      return prefix;
    }
  }
  return "other";
}

export async function POST(request: NextRequest) {
  // Per-IP anti-abuse: 120 beacons per minute per IP. A normal page
  // load fires ≤ 6 (CLS, LCP, FID, INP, TTFB, FCP). 120 leaves room
  // for 20 navigations/min; anything beyond is abuse, not telemetry.
  const ip = clientIp(request);
  const rl = await rateLimit(`web-vitals:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return new Response(null, { status: 204 });
  }

  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    // Shallow-fail on bad vitals payload — never block the user for a
    // stray beacon. Must be a `204 No Content` with *empty* body — HTTP
    // forbids a body on 204, and Next 16's runtime rejects a JSON-laden
    // 204 as malformed, surfacing as a 500 to the client (caught by the
    // Phase 2 contract sweep 2026-04-21).
    return new Response(null, { status: 204 });
  }
  const day = dayBucket();
  const route = normaliseRoute(body.route);
  const base = `xp:perf:${day}:${route}:${body.name}`;
  // Quantise the `hi:` histogram to 50-ms buckets (0, 50, 100, …, 60000).
  // Pre-fix this was 1-ms granular, creating up to 60 k ZSET members
  // per (day, route, metric) tuple — a cheap Upstash keyspace-fill.
  const bucket = Math.floor(body.value / 50) * 50;
  try {
    await Promise.all([
      kvSet(base, body.value),
      zIncrBy(`${base}:counter`, 1, "count"),
      zIncrBy(`${base}:counter`, body.value, "sum"),
      zIncrBy(`${base}:counter`, 1, `hi:${bucket}`),
    ]);
  } catch {
    // Best-effort — never propagate
  }
  return new Response(null, { status: 204 });
}
