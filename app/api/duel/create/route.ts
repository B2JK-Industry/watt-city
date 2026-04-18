import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { createDuel, type DuelGameId } from "@/lib/duel";

const VALID: DuelGameId[] = ["currency-rush-duel", "math-sprint-duel"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Musíš byť prihlásený." },
      { status: 401 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    gameId?: string;
  };
  const gameId = VALID.includes(body.gameId as DuelGameId)
    ? (body.gameId as DuelGameId)
    : "currency-rush-duel";
  const duel = await createDuel(session.username, { gameId });
  return Response.json({ ok: true, code: duel.code, gameId: duel.gameId });
}
