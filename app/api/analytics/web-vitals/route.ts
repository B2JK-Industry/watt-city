import { NextRequest } from "next/server";
import { z } from "zod";
import { kvSet, zIncrBy } from "@/lib/redis";
import { dayBucket } from "@/lib/economy";

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
 *   xp:perf:<day>:<route>:<metric>:hi   → max observed
 *
 * For p95 we'd want a digest (t-digest / HDR) but that's overkill for
 * MVP; admins read the `max` + rolling average and judge.
 */

const BodySchema = z.object({
  name: z.enum(["LCP", "FID", "CLS", "INP", "TTFB", "FCP"]),
  value: z.number().min(0).max(60_000),
  route: z.string().max(120),
  nav: z.string().max(40).optional(),
});

export async function POST(request: NextRequest) {
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
  const base = `xp:perf:${day}:${body.route}:${body.name}`;
  try {
    await Promise.all([
      kvSet(base, body.value),
      zIncrBy(`${base}:counter`, 1, "count"),
      zIncrBy(`${base}:counter`, body.value, "sum"),
      zIncrBy(`${base}:counter`, Math.max(body.value, 0), `hi:${Math.floor(body.value)}`),
    ]);
  } catch {
    // Best-effort — never propagate
  }
  return new Response(null, { status: 204 });
}
