import { NextRequest } from "next/server";
import { zTopN } from "@/lib/redis";
import { flagForDeletion, deletionStatus } from "@/lib/soft-delete";
import {
  INACTIVE_KID_AUTO_DELETE_MS,
  readAgeBucket,
} from "@/lib/gdpr-k";
import { getPlayerState } from "@/lib/player";

export const maxDuration = 60;

/* 6.3.4 Inactive-kid auto-delete cron.
 *
 * Walk users with an age-bucket flag (<16) whose last activity is older
 * than 12 months. Flag each for soft-delete (re-using the Phase 6.2.4
 * path). The regular `/api/cron/sweep-deletions` will hard-erase after
 * the 30-day grace.
 *
 * Auth: CRON_SECRET bearer or Vercel cron header.
 */
function authorised(request: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!cron) return true;
  if (isVercelCron) return true;
  return token === cron;
}

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  if (!authorised(request))
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

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
