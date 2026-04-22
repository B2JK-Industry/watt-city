import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
} from "@/lib/player";
import {
  takeMortgage,
  processLoanPayments,
  SCORE_DELTA_MISSED,
} from "@/lib/loans";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
}

async function setupCashflow(u: string) {
  const state = await getPlayerState(u);
  state.buildings.push({
    id: "b-v3",
    slotId: 7,
    catalogId: "sklepik",
    level: 5,
    builtAt: Date.now(),
    lastTickAt: Date.now(),
    cumulativeCost: {},
  });
  await savePlayerState(state);
  return state;
}

describe("V3.5 loan.autoRepay default + respect", () => {
  const u = "v3-loan-user";
  beforeEach(() => reset(u));

  it("takeMortgage creates a loan with autoRepay=true by default", async () => {
    await setupCashflow(u);
    const state = await getPlayerState(u);
    const r = await takeMortgage(state, { principal: 500, termMonths: 12 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.loan.autoRepay).toBe(true);
  });

  it("processLoanPayments auto-deducts when autoRepay=true + funds present", async () => {
    await setupCashflow(u);
    let state = await getPlayerState(u);
    const r = await takeMortgage(state, { principal: 300, termMonths: 12 });
    if (!r.ok) return;
    // Grant extra cash so payment definitely fits.
    state = await getPlayerState(u);
    await creditResources(state, "admin_grant", { cashZl: 500 }, "g", "g:v3.5a");
    state = await getPlayerState(u);
    const cashBefore = state.resources.cashZl;
    const due = r.loan.nextPaymentDueAt + 1000;
    await processLoanPayments(state, due);
    const after = await getPlayerState(u);
    // Some cash was deducted
    expect(after.resources.cashZl).toBeLessThan(cashBefore);
    expect(after.loans[0].monthsPaid).toBe(1);
    expect(after.loans[0].missedConsecutive).toBe(0);
  });

  it("autoRepay=false → miss counted even with sufficient funds", async () => {
    await setupCashflow(u);
    let state = await getPlayerState(u);
    const r = await takeMortgage(state, { principal: 300, termMonths: 12 });
    if (!r.ok) return;
    state = await getPlayerState(u);
    // Flip autoRepay off + top up funds
    state.loans[0].autoRepay = false;
    await creditResources(state, "admin_grant", { cashZl: 10000 }, "g", "g:v3.5b");
    await savePlayerState(state);
    state = await getPlayerState(u);
    const before = state.creditScore;
    const due = r.loan.nextPaymentDueAt + 1000;
    await processLoanPayments(state, due);
    const after = await getPlayerState(u);
    // Missed — no deduction, latePayments tracked, credit score dropped
    expect(after.loans[0].missedConsecutive).toBe(1);
    expect(after.loans[0].latePayments ?? []).toContain(1);
    expect(after.creditScore).toBe(before + SCORE_DELTA_MISSED);
  });

  it("legacy loans (autoRepay undefined) default to auto-repay behaviour", async () => {
    await setupCashflow(u);
    let state = await getPlayerState(u);
    const r = await takeMortgage(state, { principal: 200, termMonths: 12 });
    if (!r.ok) return;
    state = await getPlayerState(u);
    // Simulate a pre-V3.5 record by stripping the field.
    delete state.loans[0].autoRepay;
    await creditResources(state, "admin_grant", { cashZl: 500 }, "g", "g:v3.5c");
    await savePlayerState(state);
    state = await getPlayerState(u);

    const due = r.loan.nextPaymentDueAt + 1000;
    await processLoanPayments(state, due);
    const after = await getPlayerState(u);
    // Auto-deducted because undefined treated as true
    expect(after.loans[0].monthsPaid).toBe(1);
    expect(after.loans[0].missedConsecutive).toBe(0);
  });
});
