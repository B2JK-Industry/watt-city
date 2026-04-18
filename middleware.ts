import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, isExemptPath } from "@/lib/csrf-shared";

/* Edge middleware — Phase 6.1.3 + 6.1.4.
 *
 * Responsibilities:
 *  1. Issue a `wc_csrf` cookie on every HTML response so the client can
 *     read + echo it in the X-CSRF-Token header.
 *  2. Reject state-changing requests (POST/PATCH/PUT/DELETE) that lack a
 *     matching cookie/header pair, unless the path is in the
 *     EXEMPT_PATH_PREFIXES list (admin bearer / cron / auth / lang).
 *
 * We deliberately do NOT do heavy rate-limit logic here — edge runtime
 * can't talk to Upstash in a performant way for every request; per-route
 * rate limits continue to use the existing lib/rate-limit.ts pattern.
 */

const PROTECTED_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function randomToken(len = 24): string {
  // Edge-compatible: Web Crypto.
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;

  // CSRF check first — fails produce 403 before any other work.
  if (
    PROTECTED_METHODS.has(request.method) &&
    !isExemptPath(pathname)
  ) {
    const headerToken = request.headers.get(CSRF_HEADER);
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: "csrf-failed" }),
        { status: 403, headers: { "content-type": "application/json" } },
      );
    }
  }

  const res = NextResponse.next();

  // Seed the cookie if missing so the client can echo it on the NEXT
  // request (first mutating POST after a fresh session will still work
  // because register/login paths are exempt).
  if (!cookieToken) {
    res.cookies.set(CSRF_COOKIE, randomToken(), {
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}

// Limit middleware to app routes + API; skip Next internals + static.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|service-worker.js).*)"],
};
