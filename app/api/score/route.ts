import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { awardXP } from "@/lib/leaderboard";
import { getGame } from "@/lib/games";
import { getAiGame } from "@/lib/ai-pipeline/publish";
import { xpCapForAnyLang } from "@/lib/ai-pipeline/types";
import { recordRound } from "@/lib/user-stats";
import { levelFromXP } from "@/lib/level";

const BodySchema = z.object({
  gameId: z.string().min(1).max(64),
  xp: z.number().int().min(0).max(10_000),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Musisz być zalogowany." },
      { status: 401 },
    );
  }

  let parsed;
  try {
    const json = await request.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json(
      { ok: false, error: "Nieprawidłowe żądanie." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Nieprawidłowe dane wejściowe." },
      { status: 400 },
    );
  }

  const gameId = parsed.data.gameId;
  let resolvedCap: number;
  if (gameId.startsWith("ai-")) {
    const ai = await getAiGame(gameId);
    if (!ai) {
      return Response.json(
        { ok: false, error: "Nieznana gra." },
        { status: 404 },
      );
    }
    resolvedCap = xpCapForAnyLang(ai.spec);
  } else {
    const game = getGame(gameId);
    if (!game) {
      return Response.json(
        { ok: false, error: "Nieznana gra." },
        { status: 404 },
      );
    }
    resolvedCap = game.xpCap;
  }

  const xp = Math.min(parsed.data.xp, resolvedCap);
  const [xpResult, recorded] = await Promise.all([
    awardXP(session.username, gameId, xp),
    recordRound(session.username, gameId, xp),
  ]);

  const level = levelFromXP(xpResult.globalXP);

  // xpResult already carries the authoritative isNewBest / delta /
  // previousBest derived from the per-game leaderboard ZSET. user-stats
  // (recordRound) only tracks play count / total score; we don't let its
  // flags override the leaderboard's truth.
  return Response.json({
    ok: true,
    awarded: xp,
    ...xpResult,
    level,
    gameStats: recorded.gameStats,
  });
}
