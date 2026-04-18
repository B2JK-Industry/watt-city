import { NextRequest } from "next/server";
import { z } from "zod";
import { awardXP, gameLeaderboard } from "@/lib/leaderboard";
import { zRem } from "@/lib/redis";
import { recordRound } from "@/lib/user-stats";
import { getGame } from "@/lib/games";
import { getAiGame } from "@/lib/ai-pipeline/publish";
import { xpCapForAnyLang } from "@/lib/ai-pipeline/types";

// Admin-only leaderboard tool: award a score to a user on a game, or remove
// a user from a game's leaderboard. Useful for manual corrections, cleanup
// of test accounts, or seeding a demo.
//
// Auth: requires matching Bearer token against ADMIN_SECRET when set; open
// otherwise (dev / small-team hackathon ergonomics, same policy as
// /api/admin/rotate-ai).

const GLOBAL_KEY = "xp:leaderboard:global";
function gameKey(gameId: string): string {
  return `xp:leaderboard:game:${gameId}`;
}

const AwardBody = z.object({
  action: z.literal("award"),
  gameId: z.string().min(1),
  username: z.string().min(1).max(64),
  xp: z.number().int().min(0).max(10_000),
});

const RemoveBody = z.object({
  action: z.literal("remove"),
  gameId: z.string().min(1),
  username: z.string().min(1).max(64),
  alsoGlobal: z.boolean().optional(),
});

const BodySchema = z.discriminatedUnion("action", [AwardBody, RemoveBody]);

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

  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  if (body.action === "remove") {
    await zRem(gameKey(body.gameId), body.username);
    if (body.alsoGlobal) await zRem(GLOBAL_KEY, body.username);
    const top = await gameLeaderboard(body.gameId, 5);
    return Response.json({
      ok: true,
      removed: { gameId: body.gameId, username: body.username },
      alsoGlobal: Boolean(body.alsoGlobal),
      top,
    });
  }

  // award path
  const gameId = body.gameId;
  let resolvedCap: number;
  if (gameId.startsWith("ai-")) {
    const ai = await getAiGame(gameId);
    if (!ai) {
      return Response.json(
        { ok: false, error: "unknown ai game" },
        { status: 404 },
      );
    }
    resolvedCap = xpCapForAnyLang(ai.spec);
  } else {
    const g = getGame(gameId);
    if (!g) {
      return Response.json(
        { ok: false, error: "unknown game" },
        { status: 404 },
      );
    }
    resolvedCap = g.xpCap;
  }

  const xp = Math.min(body.xp, resolvedCap);
  const [xpResult, recorded] = await Promise.all([
    awardXP(body.username, gameId, xp),
    recordRound(body.username, gameId, xp),
  ]);
  const top = await gameLeaderboard(gameId, 5);

  return Response.json({
    ok: true,
    awarded: xp,
    cap: resolvedCap,
    xpResult,
    plays: recorded.gameStats.plays,
    top,
  });
}

export async function GET() {
  return Response.json(
    { ok: false, error: "use POST" },
    { status: 405 },
  );
}
