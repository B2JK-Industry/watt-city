import { NextRequest } from "next/server";
import { zTopN } from "@/lib/redis";
import { deletionStatus, hardErase, SOFT_DELETE_GRACE_MS } from "@/lib/soft-delete";

export const maxDuration = 60;

/* Daily sweeper for Phase 6.2.4 soft-delete grace expiry.
 *
 * Authorisation: CRON_SECRET bearer OR Vercel Cron header. Same pattern
 * as /api/cron/rotate-if-due — safe to expose publicly because the
 * logic is idempotent and gated behind the secret.
 *
 * We enumerate users via the global leaderboard (zTopN, same trick the
 * backup endpoint uses — we don't maintain a separate user index). For
 * each user, read their deletion flag; if it's past grace, run
 * hardErase(). Returns a summary of what was cleaned.
 */
function authorised(request: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!cron) return true; // dev
  if (isVercelCron) return true;
  return token === cron;
}

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  if (!authorised(request))
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Known users come from the leaderboard ZSET — bounded scan.
  const rows = await zTopN("xp:leaderboard:global", 10_000);
  const usernames = rows.map((r) => r.username);

  const purged: string[] = [];
  const stillFlagged: string[] = [];
  for (const u of usernames) {
    const status = await deletionStatus(u);
    if (!status.flagged) continue;
    if (status.remainingMs <= 0) {
      await hardErase(u);
      purged.push(u);
    } else {
      stillFlagged.push(u);
    }
  }

  // Also catch users whose deletion flag is set but who are NOT in the
  // leaderboard (e.g. they deleted before scoring anything). We don't
  // have a username index; a KEYS command is forbidden on Upstash. For
  // MVP: accept we'll catch these users on their next login attempt
  // (which fails because xp:user:<u> is still present); their flag
  // carries a creation-ts so we can still hard-erase via admin tooling.

  return Response.json({
    ok: true,
    now: Date.now(),
    graceMs: SOFT_DELETE_GRACE_MS,
    purged,
    stillFlagged,
  });
}
