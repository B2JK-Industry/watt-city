import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { awardXP } from "@/lib/leaderboard";
import { getGame } from "@/lib/games";

const BodySchema = z.object({
  gameId: z.string().min(1).max(64),
  xp: z.number().int().min(0).max(10_000),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Musíš byť prihlásený." },
      { status: 401 },
    );
  }

  let parsed;
  try {
    const json = await request.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json(
      { ok: false, error: "Neplatná požiadavka." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Chýbajú povinné polia." },
      { status: 400 },
    );
  }

  const game = getGame(parsed.data.gameId);
  if (!game) {
    return Response.json(
      { ok: false, error: "Neznáma hra." },
      { status: 404 },
    );
  }

  const xp = Math.min(parsed.data.xp, game.xpCap);
  const result = await awardXP(session.username, game.id, xp);

  return Response.json({
    ok: true,
    awarded: xp,
    ...result,
  });
}
