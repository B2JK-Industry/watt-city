import type { NextRequest } from "next/server";

/* Extract a client IP from a NextRequest in a way that survives both
 * Vercel and bare-metal deployments.
 *
 * Priority:
 *   1. `x-forwarded-for` first entry (Vercel / most reverse proxies)
 *   2. `x-real-ip` (nginx pattern)
 *   3. `"unknown"` — never return an empty string so downstream
 *      `rateLimit(\`register:${ip}\`, …)` keys are always well-formed.
 *
 * Deliberately does NOT use NextRequest.ip (deprecated in Next 16;
 * the request.ip property returns undefined in proxy runtimes).
 *
 * Security note: `x-forwarded-for` is client-controlled outside the
 * Vercel edge. On bare-metal you must configure your reverse proxy to
 * strip/overwrite the header; if you expose Next.js directly a client
 * can spoof an IP and bypass per-IP rate limits. On Vercel the header
 * is always set by the platform — trusted.
 */
export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
