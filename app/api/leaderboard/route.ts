import { NextRequest } from "next/server";
import { gameLeaderboard, globalLeaderboard } from "@/lib/leaderboard";
import { getGame } from "@/lib/games";

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get("game");
  const nRaw = request.nextUrl.searchParams.get("n");
  const n = Math.min(Math.max(parseInt(nRaw ?? "20", 10) || 20, 1), 100);

  if (game) {
    if (!getGame(game)) {
      return Response.json({ ok: false, error: "Gra nie istnieje." }, { status: 404 });
    }
    const entries = await gameLeaderboard(game, n);
    return Response.json({ ok: true, scope: "game", game, entries });
  }
  const entries = await globalLeaderboard(n);
  return Response.json({ ok: true, scope: "global", entries });
}
