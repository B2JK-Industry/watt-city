import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  creditResources,
  savePlayerState,
} from "@/lib/player";
import {
  monthlyPayment,
  totalInterest,
  rrso,
  quoteMortgage,
  takeMortgage,
  repayExtra,
  processLoanPayments,
  MORTGAGE_STANDARD_APR,
  MONTH_MS,
} from "./loans";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
}

describe("amortization math", () => {
  it("P=5000, APR=8%, n=24 → M ≈ 226.14 (industry-standard formula)", () => {
    const m = monthlyPayment(5000, 0.08, 24);
    // Standard bank-calculator range for 8% APR / 24 mo on 5000 principal
    expect(m).toBeGreaterThan(225);
    expect(m).toBeLessThan(228);
  });
  it("zero-rate loan → M = P/n", () => {
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
  });
  it("totalInterest matches M×n − P", () => {
    const P = 5000,
      n = 24,
      apr = 0.08;
    const m = monthlyPayment(P, apr, n);
    const expected = Math.round((m * n - P) * 100) / 100;
    expect(totalInterest(P, apr, n)).toBeCloseTo(expected, 2);
  });
  it("rrso defaults to apr in MVP", () => {
    expect(rrso(0.08)).toBe(0.08);
  });
});

describe("quoteMortgage eligibility", () => {
  const u = "loan-quote-user";
  beforeEach(() => reset(u));

  it("returns zero-principal and principal-exceeds-cap errors when appropriate", async () => {
    const state = await getPlayerState(u);
    const q0 = quoteMortgage(state, { principal: 0, termMonths: 12 });
    expect(q0.eligibility.missing).toContain("zero-principal");

    // No buildings → monthlyCashflow=0 → maxPrincipal=0 → any positive exceeds cap
    const qBig = quoteMortgage(state, { principal: 1, termMonths: 12 });
    expect(qBig.eligibility.missing.some((m) => m.startsWith("principal-exceeds-cap")))
      .toBe(true);
  });

  it("standard APR = 8%, preferred flag false without Bank lokalny", async () => {
    const state = await getPlayerState(u);
    const q = quoteMortgage(state, { principal: 100, termMonths: 12 });
    expect(q.apr).toBe(MORTGAGE_STANDARD_APR);
    expect(q.preferred).toBe(false);
  });

  it("rejects term not in [12,24,36]", async () => {
    const state = await getPlayerState(u);
    const q = quoteMortgage(state, { principal: 100, termMonths: 6 });
    expect(q.eligibility.missing).toContain("invalid-term");
  });
});

describe("takeMortgage + repayment flow", () => {
  const u = "loan-flow-user";
  beforeEach(() => reset(u));

  async function setupPlayerWithCashflow() {
    // Put a lucrative building so monthlyCashflow > 0 → eligibility passes.
    let state = await getPlayerState(u);
    state.buildings.push({
      id: "b-test",
      slotId: 7,
      catalogId: "sklepik", // sklepik yields 6 coins/h (→ 6 × 730 = 4380 W$/mo)
      level: 5, // yield scales ×1.4^4 = 3.84 → 23 coins/h → ~16800/mo → plenty
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    });
    await savePlayerState(state);
    return state;
  }

  it("takeMortgage credits principal to cashZl", async () => {
    await setupPlayerWithCashflow();
    const state = await getPlayerState(u);
    const result = await takeMortgage(state, { principal: 500, termMonths: 12 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.resources.cashZl).toBe(500);
    expect(result.state.loans).toHaveLength(1);
    expect(result.state.loans[0].outstanding).toBe(500);
    expect(result.state.loans[0].status).toBe("active");
  });

  it("processLoanPayments debits cash on due date and increments monthsPaid", async () => {
    await setupPlayerWithCashflow();
    let state = await getPlayerState(u);
    await creditResources(state, "admin_grant", { cashZl: 2000 }, "grant", "g1");
    state = await getPlayerState(u);
    const taken = await takeMortgage(state, { principal: 1000, termMonths: 12 });
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;

    // Advance past first payment due date
    const due = taken.loan.nextPaymentDueAt + 1000;
    const result = await processLoanPayments(taken.state, due);
    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(taken.state.loans[0].monthsPaid).toBeGreaterThanOrEqual(1);
    // cashZl should have decreased
    expect(taken.state.resources.cashZl).toBeLessThan(3000); // started with 1000 principal + 2000 grant
  });

  it("default triggers after 3 consecutive missed payments", async () => {
    await setupPlayerWithCashflow();
    let state = await getPlayerState(u);
    const taken = await takeMortgage(state, { principal: 1000, termMonths: 12 });
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;

    // Manually set cashZl to 0 so every payment misses
    state = await getPlayerState(u);
    state.resources.cashZl = 0;
    await savePlayerState(state);

    const laterState = await getPlayerState(u);
    const due = taken.loan.nextPaymentDueAt + 3 * MONTH_MS + 1000;
    const result = await processLoanPayments(laterState, due);
    expect(result.defaulted).toContain(taken.loan.id);
    expect(laterState.loans[0].status).toBe("defaulted");
  });

  it("repayExtra reduces outstanding and rewards credit score +3", async () => {
    await setupPlayerWithCashflow();
    let state = await getPlayerState(u);
    const taken = await takeMortgage(state, { principal: 1000, termMonths: 12 });
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;
    // Disbursed 1000 cashZl; repay 200 extra
    state = await getPlayerState(u);
    const beforeScore = state.creditScore;
    const result = await repayExtra(state, taken.loan.id, 200);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.newOutstanding).toBe(800);
    expect(result.state.creditScore).toBe(beforeScore + 3);
  });
});
