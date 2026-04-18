/* Double-submit CSRF protection — Phase 6.1.4.
 *
 * Pattern: server sets a `wc_csrf` cookie with a random token. Every
 * state-changing request must echo the same token in an `X-CSRF-Token`
 * header (or `csrf` form field for non-JS fallbacks). Server compares —
 * if they match, the request is same-origin; if not, reject.
 *
 * Cookie is NOT HttpOnly on purpose (JS has to read it to echo). The
 * threat model: attacker's script on another origin can forge a POST to
 * our API, but Same-Origin Policy prevents them from READING our cookie
 * to put in the header.
 *
 * Exemption list: endpoints called by external crons / pingers carry
 * their own Bearer auth and don't use session cookies, so CSRF doesn't
 * apply. We whitelist by prefix.
 */

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export const CSRF_COOKIE = "wc_csrf";
export const CSRF_HEADER = "x-csrf-token";

const EXEMPT_PATH_PREFIXES = [
  "/api/cron/",
  "/api/admin/", // admin uses bearer token
  "/api/auth/login", // login sets the cookie after success
  "/api/auth/register",
  "/api/lang",
];

export function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function ensureCsrfCookie(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = randomBytes(24).toString("base64url");
  store.set(CSRF_COOKIE, token, {
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // one week
  });
  return token;
}

export async function csrfTokenFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? null;
}

export async function verifyCsrf(request: Request): Promise<boolean> {
  const pathname = new URL(request.url).pathname;
  if (isExemptPath(pathname)) return true;
  // GET / HEAD / OPTIONS never mutate; skip check.
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;

  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieToken = await csrfTokenFromCookie();
  if (!headerToken || !cookieToken) return false;
  return headerToken === cookieToken;
}
