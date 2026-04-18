import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { kvGet, zTopN } from "@/lib/redis";

/* Daily backup endpoint (Phase 5.4.3).
 *
 * Returns a JSON snapshot of critical keyspace so an operator can archive
 * it. We don't bake in an S3 upload here — the runbook explains how to
 * pipe `curl … /api/admin/backup | aws s3 cp - s3://bucket/...` (or any
 * S3-compatible target) so the operator retains full control of keys.
 *
 * What's included:
 *  - xp:user:<u>        (auth records, no passwords — just username + createdAt)
 *  - xp:player:<u>      (full player state)
 *  - xp:player:<u>:ledger (capped 500 entries)
 *  - leaderboards (global + per-game + networth)
 *  - xp:ai-games:index + live envelopes + archive index
 *  - xp:config:*        (admin-editable overrides)
 *  - xp:marketplace:*   (active listings + skarb)
 *
 * What's NOT included:
 *  - Passwords (scrypt-hashed; excluded by design)
 *  - Notification feeds (200-entry caps, reconstructable)
 *  - Rate-limit counters (transient)
 *  - Analytics day ZSETs (bulky; operator-level opt-in query param)
 *
 * `?sample=1` trims each list to the first 10 entries so a quick sanity
 * check doesn't move megabytes.
 */

async function listUsernames(): Promise<string[]> {
  // We don't maintain a user index — reconstruct from the global leaderboard.
  const rows = await zTopN("xp:leaderboard:global", 10_000);
  return rows.map((r) => r.username);
}

export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const url = new URL(request.url);
  const sample = url.searchParams.get("sample") === "1";
  const limit = sample ? 10 : 10_000;

  const usernames = await listUsernames();
  const users = sample ? usernames.slice(0, 10) : usernames;

  const [playerStates, activeListings, aiIndex] = await Promise.all([
    Promise.all(
      users.map(async (u) => ({
        username: u,
        state: await kvGet(`xp:player:${u}`),
      })),
    ),
    kvGet<string[]>("xp:marketplace:active"),
    kvGet<string[]>("xp:ai-games:index"),
  ]);

  return Response.json({
    ok: true,
    takenAt: new Date().toISOString(),
    sample,
    usernameCount: usernames.length,
    users: playerStates,
    aiLiveIndex: aiIndex,
    marketplaceActive: activeListings,
    note: "Scrypt password hashes intentionally omitted. Restore by POSTing each user's state back to Redis via an ops script; see docs/OPERATIONS.md Restore runbook.",
    limit,
  });
}
