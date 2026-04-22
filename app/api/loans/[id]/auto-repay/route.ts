import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState, savePlayerState } from "@/lib/player";
import { withPlayerLock } from "@/lib/player-lock";

/* V3.5 — toggle `loan.autoRepay`.
 *   PATCH /api/loans/{id}/auto-repay  { enabled: boolean }
 */

const BodySchema = z.object({ enabled: z.boolean() });

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  return withPlayerLock(session.username, async () => {
    const state = await getPlayerState(session.username);
    const loan = state.loans.find((l) => l.id === id);
    if (!loan) {
      return Response.json({ ok: false, error: "not-found" }, { status: 404 });
    }
    if (loan.status !== "active") {
      return Response.json(
        { ok: false, error: "loan-not-active" },
        { status: 409 },
      );
    }
    loan.autoRepay = body.enabled;
    await savePlayerState(state);
    return Response.json({ ok: true, loan: { id: loan.id, autoRepay: loan.autoRepay } });
  });
}
