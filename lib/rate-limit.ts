import { kvIncrWithTTL } from "@/lib/redis";

// Fixed-window rate limit in Redis. `limit` requests allowed inside a
// `windowMs` window; once exhausted the caller gets { ok:false } until
// the window rolls.
//
// Atomicity: uses `INCR + EXPIRE` (Upstash MULTI/EXEC) so two concurrent
// callers can't both read `current=0`, both write `1`, and both pass
// the limit check. The old GET-then-SET pattern was racy — worst case
// allowed ~2× the configured cap under bursty traffic.
//
// Side note: we increment ON EVERY call, even when rejected. That's
// intentional for anti-griefing — a caller hammering the endpoint at
// 100 rps gets every request counted, not just the first N. The
// reported `remaining` clamps at 0 so the caller can still use the
// envelope sanely.
export async function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const key = `xp:ratelimit:${bucket}:${windowStart}`;
  const ttl = Math.ceil(windowMs / 1000) + 5;
  const count = await kvIncrWithTTL(key, ttl);
  const remaining = Math.max(0, limit - count);
  return {
    ok: count <= limit,
    remaining,
    resetAt: windowStart + windowMs,
  };
}
