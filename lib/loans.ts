/* Watt City loan engine — Phase 1.5.
 *
 * This file owns the math behind mortgages and future loan products. All
 * numbers echo `docs/ECONOMY.md §5` — when the balance designer changes
 * rates / caps / penalties, this is the single surface to edit.
 *
 * Invariants
 *  - All money flows through the ledger (creditResources) so every payment
 *    is auditable + idempotent.
 *  - We never let `resources.cashZl` go negative. A missed payment is
 *    represented by a "loan_payment" ledger delta of `0` + a
 *    `missedConsecutive` increment on the Loan record.
 *  - Each `loan.id` is unique per player and is used as the sourceId prefix
 *    for dedupe (e.g. `loan_payment:${loan.id}:${monthsPaid}`).
 */

import {
  getPlayerState,
  savePlayerState,
  creditResources,
  type Loan,
  type PlayerState,
} from "@/lib/player";
import { getCatalogEntry, yieldAtLevel } from "@/lib/building-catalog";
import type { Resources } from "@/lib/resources";
import { pushNotification } from "@/lib/notifications";

export const MORTGAGE_STANDARD_APR = 0.08;
export const MORTGAGE_PREFERRED_APR = 0.05; // requires Bank lokalny (Phase 2)
export const ALLOWED_TERMS_MONTHS = [12, 24, 36] as const;
export const MAX_PRINCIPAL_CAP = 50_000; // hard ceiling regardless of cashflow
export const DAYS_PER_MONTH = 30;
export const MONTH_MS = DAYS_PER_MONTH * 24 * 60 * 60 * 1000;

/* Phase 2.6 — extra loan products. All numbers match ECONOMY.md §5 and the
 * cautionary-tale design in SKO-VISION §loans.
 *
 * Term semantics:
 *   mortgage         — 12/24/36 months, amortized, max 12× monthly cashflow
 *   kredyt-obrotowy  — 1 month "lump-sum + one payment", max 3× monthly cashflow
 *                      (designed to feel like a short-term line against pending scores)
 *   kredyt-konsumencki — 6/12/24 months, amortized, RRSO 20% (educational warning)
 *   leasing          — monthly rent for 6 months (no principal repayment), then
 *                      option to buy out; modeled as a loan with final balloon.
 */

// Loan types supported as products; kredyt_inwestycyjny is declared on the
// Loan union but not yet buildable (Phase 3 P2P dep).
export type ProductLoanType = "mortgage" | "kredyt_obrotowy" | "kredyt_konsumencki" | "leasing";

export type LoanConfig = {
  apr: number;
  allowedTermsMonths: readonly number[];
  principalCap: number;
  /** cashflow multiplier for maxPrincipal: maxPrincipal = monthlyCashflow × cashflowMult (capped at principalCap). */
  cashflowMult: number;
  /** UI caution flag — shows KNF disclaimer + red accent on the loan card. */
  caution: boolean;
};

export const LOAN_CONFIGS: Record<ProductLoanType, LoanConfig> = {
  mortgage: {
    apr: MORTGAGE_STANDARD_APR,
    allowedTermsMonths: ALLOWED_TERMS_MONTHS,
    principalCap: MAX_PRINCIPAL_CAP,
    cashflowMult: 12,
    caution: false,
  },
  kredyt_obrotowy: {
    apr: 0.12,
    allowedTermsMonths: [1] as const,
    principalCap: 10_000,
    cashflowMult: 3,
    caution: false,
  },
  kredyt_konsumencki: {
    apr: 0.2, // 20% RRSO — the "cautionary tale"
    allowedTermsMonths: [6, 12, 24] as const,
    principalCap: 15_000,
    cashflowMult: 6,
    caution: true,
  },
  leasing: {
    apr: 0.1,
    allowedTermsMonths: [6] as const,
    principalCap: 30_000,
    cashflowMult: 8,
    caution: false,
  },
};

// Credit-score constants (ECONOMY.md §5).
export const CREDIT_SCORE_START = 50;
export const CREDIT_SCORE_MAX = 100;
export const CREDIT_SCORE_MIN = 0;
export const SCORE_DELTA_ON_TIME = 1;
export const SCORE_DELTA_MISSED = -5;
export const SCORE_DELTA_DEFAULT = -20;
export const SCORE_DELTA_PAID_OFF_BONUS = 10;
export const SCORE_DELTA_EARLY_REPAYMENT = 3;

// ---------------------------------------------------------------------------
// Amortization math
// ---------------------------------------------------------------------------

/** Monthly payment for a standard amortizing loan.
 *  M = P × r / (1 − (1+r)^−n). For r=0 returns P/n. Rounded to cents (2dp). */
export function monthlyPayment(
  principal: number,
  apr: number,
  termMonths: number,
): number {
  if (termMonths <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return round2(principal / termMonths);
  const numerator = principal * r;
  const denom = 1 - Math.pow(1 + r, -termMonths);
  return round2(numerator / denom);
}

/** Total interest paid over the life of a loan. */
export function totalInterest(
  principal: number,
  apr: number,
  termMonths: number,
): number {
  const m = monthlyPayment(principal, apr, termMonths);
  return round2(m * termMonths - principal);
}

/** Crude RRSO approximation — for MVP we return APR itself (simplified).
 *  Real RRSO would incorporate fees; no fees in Watt City MVP, so RRSO = APR.
 *  Kept as a separate function so we can evolve the formula later without
 *  touching call sites. */
export function rrso(apr: number /* , fees: number = 0 */): number {
  // TODO Phase 2: incorporate fees once we introduce origination/processing.
  return apr;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

// Monthly cashflow estimate: sum of per-building hourly cashZl yield × 730
// (~hours per month). Matches ECONOMY.md §5 eligibility formula.
export function monthlyCashflow(state: PlayerState): number {
  let sum = 0;
  for (const b of state.buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry) continue;
    const hourly = yieldAtLevel(entry.baseYieldPerHour, b.level);
    // Cash-like resources count: cashZl directly, and coins at a 1:1 sink
    // rate (kids understand "monety = mała gotówka"). This is a balance
    // knob — revisit when the mortgage funnel matures.
    sum += (hourly.cashZl ?? 0) + (hourly.coins ?? 0);
  }
  return sum * 730;
}

export function hasBankLokalny(state: PlayerState): boolean {
  return state.buildings.some((b) => b.catalogId === "bank-lokalny");
}

export type QuoteInput = {
  principal: number;
  termMonths: number;
};

export type Quote = {
  ok: boolean;
  apr: number;
  principal: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  rrso: number;
  maxPrincipal: number;
  preferred: boolean;
  eligibility: {
    ok: boolean;
    missing: string[];
  };
};

export function quoteMortgage(state: PlayerState, input: QuoteInput): Quote {
  const preferred = hasBankLokalny(state);
  const apr = preferred ? MORTGAGE_PREFERRED_APR : MORTGAGE_STANDARD_APR;
  const cf = monthlyCashflow(state);
  const maxPrincipal = Math.min(Math.floor(cf * 12), MAX_PRINCIPAL_CAP);

  const missing: string[] = [];
  if (!ALLOWED_TERMS_MONTHS.includes(input.termMonths as 12 | 24 | 36)) {
    missing.push("invalid-term");
  }
  if (input.principal <= 0) {
    missing.push("zero-principal");
  }
  if (input.principal > maxPrincipal) {
    missing.push(`principal-exceeds-cap:${maxPrincipal}`);
  }
  const payment = monthlyPayment(input.principal, apr, input.termMonths);
  const interest = totalInterest(input.principal, apr, input.termMonths);

  return {
    ok: missing.length === 0,
    apr,
    principal: input.principal,
    termMonths: input.termMonths,
    monthlyPayment: payment,
    totalInterest: interest,
    rrso: rrso(apr),
    maxPrincipal,
    preferred,
    eligibility: { ok: missing.length === 0, missing },
  };
}

// ---------------------------------------------------------------------------
// Take / repay / tick
// ---------------------------------------------------------------------------

function randomLoanId(): string {
  return `L-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export type TakeResult =
  | { ok: true; state: PlayerState; loan: Loan }
  | { ok: false; error: string };

export async function takeMortgage(
  state: PlayerState,
  input: QuoteInput,
): Promise<TakeResult> {
  const quote = quoteMortgage(state, input);
  if (!quote.ok) {
    return { ok: false, error: quote.eligibility.missing.join(",") };
  }
  const id = randomLoanId();
  const now = Date.now();
  const loan: Loan = {
    id,
    type: "mortgage",
    principal: input.principal,
    outstanding: input.principal,
    monthlyPayment: quote.monthlyPayment,
    rrso: quote.rrso,
    apr: quote.apr,
    termMonths: input.termMonths,
    takenAt: now,
    nextPaymentDueAt: now + MONTH_MS,
    monthsPaid: 0,
    missedConsecutive: 0,
    status: "active",
  };
  state.loans.push(loan);
  // Credit the principal as cash.
  await creditResources(
    state,
    "loan_disburse",
    { cashZl: Math.floor(input.principal) },
    `mortgage disbursed: ${input.principal} W$ @ ${(quote.apr * 100).toFixed(1)}%`,
    `loan_disburse:${id}`,
    { loanId: id, apr: quote.apr, termMonths: input.termMonths },
  );
  await savePlayerState(state);
  return { ok: true, state, loan };
}

export type RepayExtraResult =
  | { ok: true; state: PlayerState; loan: Loan; newOutstanding: number }
  | { ok: false; error: string };

// Lump-sum principal reduction. Keeps monthlyPayment (simpler for kids);
// term implicitly shortens because outstanding amortizes faster.
export async function repayExtra(
  state: PlayerState,
  loanId: string,
  amount: number,
): Promise<RepayExtraResult> {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) return { ok: false, error: "unknown-loan" };
  if (loan.status !== "active") return { ok: false, error: "loan-not-active" };
  if (amount <= 0) return { ok: false, error: "bad-amount" };
  if ((state.resources.cashZl ?? 0) < amount) {
    return { ok: false, error: "not-enough-cash" };
  }
  const applied = Math.min(Math.floor(amount), loan.outstanding);
  await creditResources(
    state,
    "loan_payment",
    { cashZl: -applied },
    `early repayment: ${applied} W$ on loan ${loan.id}`,
    `repay_extra:${loan.id}:${Date.now()}`,
    { loanId: loan.id, applied },
  );
  loan.outstanding = Math.max(0, loan.outstanding - applied);
  state.creditScore = clampScore(state.creditScore + SCORE_DELTA_EARLY_REPAYMENT);
  if (loan.outstanding === 0) {
    loan.status = "paid_off";
    state.creditScore = clampScore(state.creditScore + SCORE_DELTA_PAID_OFF_BONUS);
  }
  await savePlayerState(state);
  return {
    ok: true,
    state,
    loan,
    newOutstanding: loan.outstanding,
  };
}

// Called from tick.ts (Phase 2: wire up). Walks every active loan, pays
// whatever's due, marks misses, triggers default on 3 consecutive miss.
export async function processLoanPayments(
  state: PlayerState,
  now = Date.now(),
): Promise<{ processed: number; defaulted: string[] }> {
  let processed = 0;
  const defaulted: string[] = [];
  for (const loan of state.loans) {
    if (loan.status !== "active") continue;
    while (loan.nextPaymentDueAt <= now && loan.status === "active") {
      const dueMonth = loan.monthsPaid + 1;
      const sourceId = `loan_payment:${loan.id}:${dueMonth}`;
      const payment = Math.min(loan.monthlyPayment, loan.outstanding);
      if ((state.resources.cashZl ?? 0) >= payment) {
        await creditResources(
          state,
          "loan_payment",
          { cashZl: -Math.ceil(payment) },
          `mortgage payment ${dueMonth}/${loan.termMonths} on ${loan.id}`,
          sourceId,
          { loanId: loan.id, month: dueMonth },
        );
        loan.outstanding = Math.max(0, loan.outstanding - payment);
        loan.monthsPaid += 1;
        loan.missedConsecutive = 0;
        loan.nextPaymentDueAt += MONTH_MS;
        state.creditScore = clampScore(state.creditScore + SCORE_DELTA_ON_TIME);
        if (loan.outstanding === 0) {
          loan.status = "paid_off";
          state.creditScore = clampScore(
            state.creditScore + SCORE_DELTA_PAID_OFF_BONUS,
          );
          break;
        }
      } else {
        // Missed payment — advance clock but don't credit/debit anything.
        loan.missedConsecutive += 1;
        loan.nextPaymentDueAt += MONTH_MS;
        state.creditScore = clampScore(state.creditScore + SCORE_DELTA_MISSED);
        await creditResources(
          state,
          "loan_payment",
          {},
          `MISSED payment ${dueMonth}/${loan.termMonths} on ${loan.id}`,
          sourceId,
          { loanId: loan.id, month: dueMonth, missed: true },
        );
        await pushNotification(state.username, {
          kind: "mortgage-missed",
          title: `Nieopłacona rata kredytu ${loan.id.slice(0, 8)}`,
          body: `Masz ${loan.missedConsecutive}/3 nieopłaconych rat. Scoring spadł o 5.`,
          href: "/miasto",
          meta: { loanId: loan.id, missed: loan.missedConsecutive },
        });
        if (loan.missedConsecutive >= 3) {
          loan.status = "defaulted";
          state.creditScore = clampScore(
            state.creditScore + SCORE_DELTA_DEFAULT,
          );
          defaulted.push(loan.id);
          break;
        }
      }
      processed += 1;
    }
  }
  if (processed > 0 || defaulted.length > 0) {
    await savePlayerState(state);
  }
  return { processed, defaulted };
}

function clampScore(n: number): number {
  return Math.max(CREDIT_SCORE_MIN, Math.min(CREDIT_SCORE_MAX, Math.round(n)));
}

export async function listLoans(state: PlayerState): Promise<Loan[]> {
  return state.loans;
}

// Convenience for the API — reload state first so we don't mutate stale
// snapshots. Returns fresh state + the loan record.
export async function takeMortgageForUser(
  username: string,
  input: QuoteInput,
): Promise<TakeResult> {
  const state = await getPlayerState(username);
  return await takeMortgage(state, input);
}

// ---------------------------------------------------------------------------
// Phase 2.6 — generic loan product + bankructwo reset
// ---------------------------------------------------------------------------

export type GenericLoanInput = {
  type: ProductLoanType;
  principal: number;
  termMonths: number;
};

export function quoteLoan(
  state: PlayerState,
  input: GenericLoanInput,
): Quote {
  const cfg = LOAN_CONFIGS[input.type];
  // mortgage keeps its separate quoteMortgage path for Preferred flag.
  if (input.type === "mortgage") {
    return quoteMortgage(state, { principal: input.principal, termMonths: input.termMonths });
  }
  const cf = monthlyCashflow(state);
  const maxPrincipal = Math.min(Math.floor(cf * cfg.cashflowMult), cfg.principalCap);
  const missing: string[] = [];
  if (!cfg.allowedTermsMonths.includes(input.termMonths)) {
    missing.push(`invalid-term:${input.termMonths}`);
  }
  if (input.principal <= 0) missing.push("zero-principal");
  if (input.principal > maxPrincipal)
    missing.push(`principal-exceeds-cap:${maxPrincipal}`);
  const payment = monthlyPayment(input.principal, cfg.apr, input.termMonths);
  const interest = totalInterest(input.principal, cfg.apr, input.termMonths);
  return {
    ok: missing.length === 0,
    apr: cfg.apr,
    principal: input.principal,
    termMonths: input.termMonths,
    monthlyPayment: payment,
    totalInterest: interest,
    rrso: rrso(cfg.apr),
    maxPrincipal,
    preferred: false,
    eligibility: { ok: missing.length === 0, missing },
  };
}

export async function takeLoan(
  state: PlayerState,
  input: GenericLoanInput,
): Promise<TakeResult> {
  if (input.type === "mortgage") {
    return takeMortgage(state, { principal: input.principal, termMonths: input.termMonths });
  }
  const q = quoteLoan(state, input);
  if (!q.ok) return { ok: false, error: q.eligibility.missing.join(",") };
  const cfg = LOAN_CONFIGS[input.type];
  const id = `${input.type.slice(0, 3).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${Date.now().toString(36)}`;
  const now = Date.now();
  const loan: Loan = {
    id,
    type: input.type,
    principal: input.principal,
    outstanding: input.principal,
    monthlyPayment: q.monthlyPayment,
    rrso: q.rrso,
    apr: cfg.apr,
    termMonths: input.termMonths,
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
    { cashZl: Math.floor(input.principal) },
    `${input.type} disbursed: ${input.principal} W$ @ ${(cfg.apr * 100).toFixed(1)}%`,
    `loan_disburse:${id}`,
    { loanId: id, type: input.type, apr: cfg.apr, termMonths: input.termMonths },
  );
  await savePlayerState(state);
  return { ok: true, state, loan };
}

/** Bankructwo (ECONOMY.md §5 default-handling final branch).
 *
 *  Triggered manually when every loan is defaulted AND no non-Domek building
 *  remains to seize. Effect:
 *   - All non-Domek buildings are removed from the slot map
 *   - All loans marked "paid_off_via_seizure"
 *   - Credit score drops to the floor
 *   - A single "bankructwo" ledger entry records the event
 *  The player keeps Domek (slot 10) per D4 — the "kid keeps home" rule.
 */
export async function bankructwoReset(
  state: PlayerState,
): Promise<{ state: PlayerState; demolished: number }> {
  const toKeep = state.buildings.filter((b) => b.catalogId === "domek");
  const removedCount = state.buildings.length - toKeep.length;
  state.buildings = toKeep;
  for (const loan of state.loans) {
    if (loan.status === "active" || loan.status === "defaulted") {
      loan.outstanding = 0;
      loan.status = "paid_off_via_seizure";
    }
  }
  state.creditScore = 0; // wipe trust; must rebuild
  await creditResources(
    state,
    "loan_default",
    {},
    `BANKRUCTWO — wszystkie budynki (poza Domkiem) zajęte, wszystkie kredyty zamknięte`,
    `bankructwo:${state.username}:${Date.now()}`,
    { demolished: removedCount },
  );
  await savePlayerState(state);
  return { state, demolished: removedCount };
}

/** Returns true when the player is eligible for voluntary bankructwo.
 *
 *  Triggers when ≥1 loan already defaulted OR when all active loans have a
 *  combined monthly demand that the current cashflow can't meet — either
 *  signal means the player is in a death spiral and deserves the reset
 *  button. UI still walls this behind a modal confirmation so a casual
 *  click can't wipe the city. */
export function eligibleForBankructwo(state: PlayerState): boolean {
  const defaulted = state.loans.some((l) => l.status === "defaulted");
  if (defaulted) return true;
  const activeMonthly = state.loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + l.monthlyPayment, 0);
  if (activeMonthly === 0) return false;
  const cf = monthlyCashflow(state);
  return cf < activeMonthly;
}
