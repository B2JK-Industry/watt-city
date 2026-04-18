import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { assignPlayer, getDuel, saveDuel, summarize } from "@/lib/duel";

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
    return Response.json({ ok: true, duel: summarize(duel) });
  }

  return Response.json({ ok: false, error: "Neznáma akcia." }, { status: 400 });
}
