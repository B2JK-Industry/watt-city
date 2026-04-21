import { NextRequest } from "next/server";
import { zTopN } from "@/lib/redis";
import { flagForDeletion, deletionStatus } from "@/lib/soft-delete";
import {
  INACTIVE_KID_AUTO_DELETE_MS,
  readAgeBucket,
} from "@/lib/gdpr-k";
import { getPlayerState } from "@/lib/player";
import { isCronAuthorised, cronAuthFailure } from "@/lib/cron-auth";

export const maxDuration = 60;

/* 6.3.4 Inactive-kid auto-delete cron.
 *
 * Walks users with an age-bucket flag (<16) whose last activity is
 * older than 12 months and flags each for soft-delete (re-using the
 * Phase 6.2.4 path). The regular `/api/cron/sweep-deletions` will
 * hard-erase after the 30-day grace.
 *
 * Auth: `lib/cron-auth.ts#isCronAuthorised` — CRON_SECRET bearer or
 * Vercel's cron header. Dev bypass is NODE_ENV-gated.
 */

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  if (!isCronAuthorised(request)) return cronAuthFailure();

  const rows = await zTopN("xp:leaderboard:global", 10_000);
  const usernames = rows.map((r) => r.username);
  const now = Date.now();

  const flagged: string[] = [];
  const skipped: string[] = [];
  for (const u of usernames) {
    const bucket = await readAgeBucket(u);
    if (!bucket || bucket === "16-plus") {
      skipped.push(u);
      continue;
    }
    const state = await getPlayerState(u);
    const lastActive = state.lastTickAt ?? state.createdAt ?? 0;
    const inactiveMs = now - lastActive;
    if (inactiveMs < INACTIVE_KID_AUTO_DELETE_MS) {
      continue;
    }
    const alreadyFlagged = await deletionStatus(u);
    if (alreadyFlagged.flagged) continue;
    await flagForDeletion(u);
    flagged.push(u);
  }
  return Response.json({
    ok: true,
    now,
    threshold: INACTIVE_KID_AUTO_DELETE_MS,
    flagged,
    skippedNonKids: skipped.length,
  });
}
