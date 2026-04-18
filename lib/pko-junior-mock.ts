/* PKO Junior mock API — Phase 4.2.
 *
 * This is a self-contained, in-process mock of the contract we'd expect
 * from a real PKO Junior integration. It never hits a network. When the
 * real API lands (Phase 4.2.4 — BLOCKED-ON-PARTNERSHIP), swap the
 * implementation; the types stay stable.
 *
 * Contract (4.2.1):
 *   GET  /junior/balance            → { currency: "PLN", balance: number, childName: string }
 *   POST /junior/topup              → { ok, txId, balanceAfter }
 *   POST /junior/transfer           → { ok, txId, from, to, amount }
 * All traffic is authenticated via a short-lived OAuth token in the real
 * version. Here we accept the kid's Watt City session as proxy.
 *
 * Audit log (4.2.6): every call writes to `xp:pko-audit:<username>` as a
 * LIST entry capped at 200. Real-money mirrors HAVE to be auditable; even
 * the mock enforces this habit so the instrumentation stays in place.
 */

import { kvGet, kvSet, lPush, lRange, lTrim } from "@/lib/redis";

const MOCK_ACCOUNT_KEY = (u: string) => `xp:pko-mock:${u}`;
const AUDIT_KEY = (u: string) => `xp:pko-audit:${u}`;

export type JuniorAccount = {
  username: string;
  childName: string;
  balancePln: number;
  linkedAt: number;
};

export type JuniorTx = {
  txId: string;
  ts: number;
  kind: "topup" | "transfer" | "mirror";
  amount: number;
  reason?: string;
  wattCityBalance?: number;
};

async function audit(
  username: string,
  entry: Omit<JuniorTx, "txId" | "ts">,
): Promise<JuniorTx> {
  const full: JuniorTx = {
    txId: `pko-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    ...entry,
  };
  await lPush(AUDIT_KEY(username), full);
  await lTrim(AUDIT_KEY(username), 0, 199);
  return full;
}

// ---------------------------------------------------------------------------
// Mock surface
// ---------------------------------------------------------------------------

export async function getAccount(username: string): Promise<JuniorAccount | null> {
  return await kvGet<JuniorAccount>(MOCK_ACCOUNT_KEY(username));
}

export async function ensureAccount(
  username: string,
  childName: string,
): Promise<JuniorAccount> {
  const existing = await getAccount(username);
  if (existing) return existing;
  const acc: JuniorAccount = {
    username,
    childName,
    balancePln: 0,
    linkedAt: Date.now(),
  };
  await kvSet(MOCK_ACCOUNT_KEY(username), acc);
  return acc;
}

export async function getBalance(
  username: string,
): Promise<{ ok: true; balance: number; currency: "PLN"; childName: string } | { ok: false; error: string }> {
  const acc = await getAccount(username);
  if (!acc) return { ok: false, error: "no-account" };
  return { ok: true, balance: acc.balancePln, currency: "PLN", childName: acc.childName };
}

export async function topup(
  username: string,
  amountPln: number,
  reason?: string,
): Promise<{ ok: true; tx: JuniorTx; balanceAfter: number } | { ok: false; error: string }> {
  if (amountPln <= 0 || amountPln > 500)
    return { ok: false, error: "amount-out-of-range" };
  const acc = await getAccount(username);
  if (!acc) return { ok: false, error: "no-account" };
  acc.balancePln += Math.floor(amountPln);
  await kvSet(MOCK_ACCOUNT_KEY(username), acc);
  const tx = await audit(username, { kind: "topup", amount: amountPln, reason });
  return { ok: true, tx, balanceAfter: acc.balancePln };
}

export async function transfer(
  from: string,
  to: string,
  amountPln: number,
  reason?: string,
): Promise<{ ok: true; tx: JuniorTx } | { ok: false; error: string }> {
  if (amountPln <= 0) return { ok: false, error: "bad-amount" };
  const sender = await getAccount(from);
  if (!sender) return { ok: false, error: "no-sender-account" };
  if (sender.balancePln < amountPln) return { ok: false, error: "insufficient-funds" };
  const receiver = await getAccount(to);
  if (!receiver) return { ok: false, error: "no-receiver-account" };
  sender.balancePln -= Math.floor(amountPln);
  receiver.balancePln += Math.floor(amountPln);
  await kvSet(MOCK_ACCOUNT_KEY(from), sender);
  await kvSet(MOCK_ACCOUNT_KEY(to), receiver);
  const tx = await audit(from, {
    kind: "transfer",
    amount: amountPln,
    reason: `to ${to}: ${reason ?? ""}`,
  });
  return { ok: true, tx };
}

/** "Mirror to Junior" — takes the in-game Watt City balance snapshot and
 *  uses it to top up the mock PKO Junior account. Does NOT deduct in-game
 *  cash (the mirror is a representation, not a conversion). Rate-limited
 *  by the caller. Writes a richer audit entry so downstream ops know the
 *  mirror relationship. */
export async function mirrorToJunior(
  username: string,
  wattCityCashZl: number,
  pctToMirror = 0.1,
): Promise<{ ok: true; tx: JuniorTx; balanceAfter: number } | { ok: false; error: string }> {
  const amount = Math.floor(wattCityCashZl * pctToMirror);
  if (amount <= 0) return { ok: false, error: "mirror-amount-too-small" };
  const acc = await getAccount(username);
  if (!acc) return { ok: false, error: "no-account" };
  acc.balancePln += amount;
  await kvSet(MOCK_ACCOUNT_KEY(username), acc);
  const tx = await audit(username, {
    kind: "mirror",
    amount,
    reason: `Watt City cashflow snapshot × ${(pctToMirror * 100).toFixed(0)}%`,
    wattCityBalance: wattCityCashZl,
  });
  return { ok: true, tx, balanceAfter: acc.balancePln };
}

export async function auditLog(username: string, n = 50): Promise<JuniorTx[]> {
  return await lRange<JuniorTx>(AUDIT_KEY(username), n);
}
