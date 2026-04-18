import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import {
  ensureAccount,
  getBalance,
  topup,
  mirrorToJunior,
  auditLog,
} from "@/lib/pko-junior-mock";
import { rateLimit } from "@/lib/rate-limit";

const ActionSchema = z.object({
  action: z.enum(["ensure-account", "topup", "mirror"]),
  childName: z.string().min(1).max(80).optional(),
  amount: z.number().int().min(1).max(500).optional(),
  reason: z.string().max(120).optional(),
  pct: z.number().min(0.01).max(1).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [balance, audit] = await Promise.all([
    getBalance(session.username),
    auditLog(session.username, 50),
  ]);
  return Response.json({ ok: true, balance, audit });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // Real-money-adjacent triggers are throttled aggressively: 5/min.
  const rl = await rateLimit(`pko:${session.username}`, 5, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  let body;
  try {
    body = ActionSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  if (body.action === "ensure-account") {
    const acc = await ensureAccount(
      session.username,
      body.childName ?? session.username,
    );
    return Response.json({ ok: true, account: acc });
  }
  if (body.action === "topup") {
    if (!body.amount) return Response.json({ ok: false, error: "missing-amount" }, { status: 400 });
    const r = await topup(session.username, body.amount, body.reason);
    return Response.json(r);
  }
  if (body.action === "mirror") {
    const state = await getPlayerState(session.username);
    const r = await mirrorToJunior(
      session.username,
      state.resources.cashZl ?? 0,
      body.pct ?? 0.1,
    );
    return Response.json(r);
  }
}
