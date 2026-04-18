import { NextRequest } from "next/server";
import { kvGet, kvSet, kvDel } from "@/lib/redis";
import { runPipeline } from "@/lib/ai-pipeline/publish";

// Force-rotate the live AI game slot: wipe live envelopes + index, then run
// the pipeline once. Leaderboards (xp:leaderboard:game:ai-*) and archive
// (xp:ai-games:archive:*) are NOT touched — medals persist.
//
// Auth: if ADMIN_SECRET is set, requires matching Bearer token. Otherwise
// accepts any caller (dev / small-team hackathon ergonomics).
const INDEX_KEY = "xp:ai-games:index";

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

  const ids = (await kvGet<string[]>(INDEX_KEY)) ?? [];
  for (const id of ids) await kvDel(`xp:ai-games:${id}`);
  await kvSet(INDEX_KEY, []);

  const result = await runPipeline();
  if (!result.ok) {
    return Response.json(
      { ok: false, wiped: ids, error: result.error },
      { status: 500 },
    );
  }
  return Response.json({
    ok: true,
    wiped: ids,
    publishedId: result.game.id,
    theme: result.game.theme,
    model: result.game.model,
    validUntil: result.game.validUntil,
  });
}

export async function GET() {
  return Response.json(
    { ok: false, error: "use POST" },
    { status: 405 },
  );
}
