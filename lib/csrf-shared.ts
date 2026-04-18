/* Edge-safe CSRF constants. Keep this file free of node: APIs and
 * next/headers — the Edge middleware imports it. */

export const CSRF_COOKIE = "wc_csrf";
export const CSRF_HEADER = "x-csrf-token";

export const EXEMPT_PATH_PREFIXES = [
  "/api/cron/",
  "/api/admin/",
  "/api/auth/login",
  "/api/auth/register",
  "/api/lang",
];

export function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}
