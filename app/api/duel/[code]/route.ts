import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { assignPlayer, getDuel, saveDuel, summarize } from "@/lib/duel";
import { awardXP } from "@/lib/leaderboard";
import { recordRound } from "@/lib/user-stats";

// PvP reward: winner gets 30 W per round won, tie 10 W, loss 0 W.
// The 2× multiplier comes from this being explicitly higher than the
// single-player Currency Rush max (180 W for 15 perfect answers ≈ 12/round).
const W_PER_WIN = 30;
const W_PER_TIE = 10;
const DUEL_GAME_ID = "currency-rush"; // credit Watts to this game's leaderboard

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const duel = await getDuel(code.toUpperCase());
  if (!duel) {
    return Response.json({ ok: false, error: "Duel neexistuje." }, { status: 404 });
  }
  const session = await getSession();
  const role = session ? assignPlayer(duel, session.username) : "spectator";
  return Response.json({
    ok: true,
    role,
    self: session?.username ?? null,
    duel: summarize(duel),
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
) {
  // action: join | submit
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Musíš byť prihlásený." },
      { status: 401 },
    );
  }
  const { code } = await ctx.params;
  const duel = await getDuel(code.toUpperCase());
  if (!duel) {
    return Response.json({ ok: false, error: "Duel neexistuje." }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    action?: "join" | "submit";
    answers?: { value: number; elapsedMs: number }[];
  };

  if (body.action === "join") {
    if (duel.playerA === session.username) {
      return Response.json({ ok: true, role: "A", duel: summarize(duel) });
    }
    if (duel.playerB === session.username) {
      return Response.json({ ok: true, role: "B", duel: summarize(duel) });
    }
    if (duel.playerB) {
      return Response.json(
        { ok: false, error: "Duel je už plný." },
        { status: 409 },
      );
    }
    duel.playerB = session.username;
    await saveDuel(duel);
    return Response.json({ ok: true, role: "B", duel: summarize(duel) });
  }

  if (body.action === "submit") {
    if (!Array.isArray(body.answers)) {
      return Response.json(
        { ok: false, error: "Chýbajú odpovede." },
        { status: 400 },
      );
    }
    const safe = body.answers.map((a) => ({
      value: Number.isFinite(a?.value) ? Number(a.value) : Number.NaN,
      elapsedMs: Math.max(0, Math.min(60_000, Number(a?.elapsedMs) || 0)),
    }));
    const wasBothDone = duel.finishedA && duel.finishedB;
    if (duel.playerA === session.username) {
      duel.answersA = safe;
      duel.finishedA = true;
    } else if (duel.playerB === session.username) {
      duel.answersB = safe;
      duel.finishedB = true;
    } else {
      return Response.json(
        { ok: false, error: "Nie si účastník duelu." },
        { status: 403 },
      );
    }
    await saveDuel(duel);
    const summary = summarize(duel);

    // Award PvP bonus Watts the first time both players are done.
    // Only payouts when the opponent actually played (real PvP) — solo
    // "duel against nobody" never gets here.
    const bothDoneNow = duel.finishedA && duel.finishedB;
    const shouldPayout = bothDoneNow && !wasBothDone && duel.playerB;
    if (shouldPayout) {
      const payoutsA =
        summary.winsA * W_PER_WIN +
        summary.roundWinners.filter((w) => w === "tie").length * W_PER_TIE;
      const payoutsB =
        summary.winsB * W_PER_WIN +
        summary.roundWinners.filter((w) => w === "tie").length * W_PER_TIE;
      await Promise.all([
        awardXP(duel.playerA, DUEL_GAME_ID, payoutsA),
        recordRound(duel.playerA, DUEL_GAME_ID, payoutsA),
        duel.playerB ? awardXP(duel.playerB, DUEL_GAME_ID, payoutsB) : null,
        duel.playerB ? recordRound(duel.playerB, DUEL_GAME_ID, payoutsB) : null,
      ]);
      return Response.json({
        ok: true,
        duel: summary,
        payout: {
          playerA: payoutsA,
          playerB: payoutsB,
          creditedTo: DUEL_GAME_ID,
        },
      });
    }

    return Response.json({ ok: true, duel: summary });
  }

  return Response.json({ ok: false, error: "Neznáma akcia." }, { status: 400 });
}
