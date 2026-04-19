import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import {
  getPlayerState,
  creditResources,
  savePlayerState,
  type Loan,
} from "@/lib/player";
import { sAdd } from "@/lib/redis";
import { deficitState } from "@/lib/watts";
import { recordEvent } from "@/lib/analytics";
import { MONTH_MS } from "@/lib/loans";

/* V3.3 — watt-deficit rescue loan.
 *
 * 150 coins principal, 0% APR, one-month single payment. Available
 * only while the city is in a watt deficit AND the player has not
 * taken a rescue loan this calendar-month (SADD dedup on
 * xp:loan:rescue:<user>:<YYYY-MM>). This is the "one tap get out
 * of the brownout" lifeline shown in the deficit panel, distinct
 * from HIGH-8 mentor-help (2+ missed payments triggered).
 */

const RESCUE_PRINCIPAL = 150;
const RESCUE_DEDUP_KEY = (u: string, bucket: string) =>
  `xp:loan:rescue:${u}:${bucket}`;

function monthBucket(now: number): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(_request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  const now = Date.now();
  const state = await getPlayerState(session.username);
  const ds = deficitState(state, now);
  if (!ds.inDeficit) {
    return Response.json(
      { ok: false, error: "no-deficit" },
      { status: 409 },
    );
  }
  const bucket = monthBucket(now);
  const fresh = await sAdd(RESCUE_DEDUP_KEY(session.username, bucket), "taken");
  if (!fresh) {
    return Response.json(
      { ok: false, error: "already-used-this-month" },
      { status: 409 },
    );
  }

  const id = `RESCUE-${Math.random().toString(36).slice(2, 8)}-${now.toString(36)}`;
  const loan: Loan = {
    id,
    type: "kredyt_obrotowy", // closest existing kind — UI labels it "Rescue"
    principal: RESCUE_PRINCIPAL,
    outstanding: RESCUE_PRINCIPAL,
    monthlyPayment: RESCUE_PRINCIPAL, // single-payment balloon
    rrso: 0,
    apr: 0,
    termMonths: 1,
    takenAt: now,
    nextPaymentDueAt: now + MONTH_MS,
    monthsPaid: 0,
    missedConsecutive: 0,
    status: "active",
  };
  state.loans.push(loan);
  await creditResources(
    state,
    "loan_disburse",
    { coins: RESCUE_PRINCIPAL },
    `Rescue loan (0% APR, 1 mo) — ${RESCUE_PRINCIPAL} coins to fix the grid deficit`,
    `rescue:${id}`,
    { loanId: id, rescue: true, rescueBucket: bucket },
  );
  await savePlayerState(state);
  await recordEvent({
    kind: "mortgage_taken", // reuse closest existing kind
    user: session.username,
    meta: {
      loanId: id,
      apr: 0,
      principal: RESCUE_PRINCIPAL,
      termMonths: 1,
      rescue: true,
    },
  });

  return Response.json({
    ok: true,
    loan: { id: loan.id, principal: loan.principal, apr: 0, termMonths: 1 },
    message: "Rescue loan issued. Use the 150 coins to build Mała elektrownia.",
  });
}
