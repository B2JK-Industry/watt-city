import { NextRequest } from "next/server";
import { kvGet, kvSet, kvDel, zTopN } from "@/lib/redis";

// Purge zombie AI archive entries: records that have no medalists AND are
// not in the current live index. These accumulate when admin/cron rotates
// the same theme multiple times in one session.
//
// Auth: ADMIN_SECRET Bearer (same policy as the other /api/admin/* routes).
const INDEX_KEY = "xp:ai-games:index";
const ARCHIVE_INDEX_KEY = "xp:ai-games:archive-index";
const ENVELOPE_KEY = (id: string) => `xp:ai-games:${id}`;
const ARCHIVE_KEY = (id: string) => `xp:ai-games:archive:${id}`;
const LB_KEY = (id: string) => `xp:leaderboard:game:${id}`;

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  if (expected) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token !== expected) {
      return Response.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }

  const liveIds = new Set((await kvGet<string[]>(INDEX_KEY)) ?? []);
  const archiveIds = (await kvGet<string[]>(ARCHIVE_INDEX_KEY)) ?? [];

  const purged: string[] = [];
  const kept: string[] = [];

  for (const id of archiveIds) {
    if (liveIds.has(id)) {
      kept.push(id);
      continue;
    }
    const top = await zTopN(LB_KEY(id), 1);
    if (top.length > 0) {
      kept.push(id); // has at least one medal — keep it
      continue;
    }
    // Zombie: no medals, not live → delete envelope + archive record
    await kvDel(ENVELOPE_KEY(id));
    await kvDel(ARCHIVE_KEY(id));
    purged.push(id);
  }

  // Rewrite archive index without purged ids
  if (purged.length > 0) {
    const purgedSet = new Set(purged);
    const next = archiveIds.filter((id) => !purgedSet.has(id));
    await kvSet(ARCHIVE_INDEX_KEY, next);
  }

  return Response.json({
    ok: true,
    purgedCount: purged.length,
    keptCount: kept.length,
    purged,
    kept,
  });
}

export async function GET() {
  return Response.json(
    { ok: false, error: "use POST" },
    { status: 405 },
  );
}
