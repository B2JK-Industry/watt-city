import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { assignPlayer, getDuel, saveDuel, summarize } from "@/lib/duel";
import { creditBonus } from "@/lib/leaderboard";

// PvP bonus — credited ONLY to global (never to a per-game best score),
// so duel wins never corrupt the "your best single run" meaning of the
// per-game leaderboard. Winner gets 30 W per round won; ties 10 W.
// Solo play ('duel against nobody') never reaches this branch.
const W_PER_WIN = 30;
const W_PER_TIE = 10;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const duel = await getDuel(code.toUpperCase());
  if (!duel) {
    return Response.json({ ok: false, error: "Pojedynek nie istnieje." }, { status: 404 });
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
      { ok: false, error: "Musisz być zalogowany." },
      { status: 401 },
    );
  }
  const { code } = await ctx.params;
  const duel = await getDuel(code.toUpperCase());
  if (!duel) {
    return Response.json({ ok: false, error: "Pojedynek nie istnieje." }, { status: 404 });
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
        { ok: false, error: "Pojedynek jest już pełny." },
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
        { ok: false, error: "Brakuje odpowiedzi." },
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
        { ok: false, error: "Nie jesteś uczestnikiem tego pojedynku." },
        { status: 403 },
      );
    }
    await saveDuel(duel);
    const summary = summarize(duel);

    // Award PvP bonus Watts the first time both players are done.
    const bothDoneNow = duel.finishedA && duel.finishedB;
    const shouldPayout = bothDoneNow && !wasBothDone && duel.playerB;
    if (shouldPayout) {
      const ties = summary.roundWinners.filter((w) => w === "tie").length;
      const payoutsA = summary.winsA * W_PER_WIN + ties * W_PER_TIE;
      const payoutsB = summary.winsB * W_PER_WIN + ties * W_PER_TIE;
      await Promise.all([
        creditBonus(duel.playerA, payoutsA),
        duel.playerB ? creditBonus(duel.playerB, payoutsB) : null,
      ]);
      return Response.json({
        ok: true,
        duel: summary,
        payout: {
          playerA: payoutsA,
          playerB: payoutsB,
          channel: "global-only (duel bonus)",
        },
      });
    }

    return Response.json({ ok: true, duel: summary });
  }

  return Response.json({ ok: false, error: "Nieznana akcja." }, { status: 400 });
}
