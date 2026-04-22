import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

/** Constant-time string compare. `timingSafeEqual` requires equal-length
 *  Buffers; mismatched lengths short-circuit to `false` without leaking
 *  the secret's length through an early-return timing channel. */
function safeTokenEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/* Shared cron authorisation — Phase 2 deep audit.
 *
 * Every `/api/cron/*` route had its own copy-pasted `authorised()`
 * function. They diverged over time: `daily-game` only accepted
 * `CRON_SECRET`, `rotate-if-due` also accepted `ADMIN_SECRET`, and
 * `sweep-deletions` / `sweep-inactive-kids` allowed an anonymous
 * caller whenever `CRON_SECRET` was unset (which is the default in
 * dev, CI and preview — an unintentionally permissive state where
 * anyone could trigger account purges). Consolidating here so the
 * matrix is enforced exactly once.
 *
 * Rules:
 *
 * - `Authorization: Bearer ${CRON_SECRET}` grants access (when set).
 * - `Authorization: Bearer ${ADMIN_SECRET}` also grants access when
 *   the route opted in via `allowAdminBearer: true` (dev-manual
 *   triggers of rotation etc.).
 * - Vercel Cron sets `x-vercel-cron: 1` and is trusted when set.
 * - Dev bypass: only when NODE_ENV === "development" AND no secret
 *   is configured. Any other environment (preview, CI, production)
 *   requires an explicit secret — no silent pass.
 */
export type CronAuthOpts = {
  /** Accept ADMIN_SECRET as an alternative bearer (for manual ops
   *  triggers like `/api/cron/rotate-if-due`). */
  allowAdminBearer?: boolean;
};

function readBearer(request: NextRequest): string {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export function isCronAuthorised(
  request: NextRequest,
  opts: CronAuthOpts = {},
): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;
  const token = readBearer(request);
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (isVercelCron) return true;
  if (cronSecret && safeTokenEqual(token, cronSecret)) return true;
  if (opts.allowAdminBearer && adminSecret && safeTokenEqual(token, adminSecret))
    return true;

  // Dev-only open bypass: ONLY in `next dev` with no secret configured.
  // `NODE_ENV` is "development" under `next dev`, "production" under
  // `next build` / Vercel, and "test" under vitest. Preview deployments
  // run as "production" so they get the production gate automatically.
  const hasAnySecret =
    Boolean(cronSecret) || (opts.allowAdminBearer && Boolean(adminSecret));
  if (process.env.NODE_ENV === "development" && !hasAnySecret) return true;

  return false;
}

export function cronAuthFailure(): Response {
  return Response.json(
    { ok: false, error: "unauthorized" },
    { status: 401 },
  );
}
