import { kvGet, kvSet } from "@/lib/redis";

// Fixed-window rate limit in Redis. For per-username/per-action throttling
// (ECONOMY.md mentions 5 builds/min). `limit` requests allowed inside a
// `windowMs` window; once exhausted the caller gets { ok:false } until the
// window rolls. Fixed-window is coarser than sliding-log but ~zero code +
// one KV op per check, which is the right trade for anti-griefing bounds.
export async function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const key = `xp:ratelimit:${bucket}:${windowStart}`;
  const current = (await kvGet<number>(key)) ?? 0;
  if (current >= limit) {
    return { ok: false, remaining: 0, resetAt: windowStart + windowMs };
  }
  await kvSet(key, current + 1, { ex: Math.ceil(windowMs / 1000) + 5 });
  return {
    ok: true,
    remaining: limit - (current + 1),
    resetAt: windowStart + windowMs,
  };
}
