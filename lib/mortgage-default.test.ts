import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  type PlayerState,
} from "@/lib/player";
import {
  takeMortgage,
  processLoanPayments,
  eligibleForBankructwo,
  bankructwoReset,
  SCORE_DELTA_ON_TIME,
  SCORE_DELTA_MISSED,
  SCORE_DELTA_DEFAULT,
  MONTH_MS,
  CREDIT_SCORE_START,
} from "./loans";

/* Deep-audit Phase 1 backlog #5 — end-to-end mortgage-default flow.
 *
 * The existing loans.test.ts `default triggers after 3 consecutive
 * missed payments` only asserts the status flip. This test walks the
 * *full* default aftermath: credit score math, UI-facing loan shape,
 * bankructwo eligibility, and re-default resilience (a defaulted loan
 * must not be re-processed by a subsequent tick). */

const u = "mortgage-default-user";

async function reset(): Promise<void> {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
  await kvDel(`xp:notifications:${u}`);
}

async function withCashflow(): Promise<PlayerState> {
  // Domek is the signup gift; add a level-5 Sklepik so monthlyCashflow
  // clears the mortgage eligibility threshold.
  const state = await getPlayerState(u);
  state.buildings.push({
    id: "b-default-sklep",
    slotId: 7,
    catalogId: "sklepik",
    level: 5,
    builtAt: Date.now(),
    lastTickAt: Date.now(),
    cumulativeCost: {},
  });
  await savePlayerState(state);
  return getPlayerState(u);
}

describe("mortgage-default aftermath", () => {
  beforeEach(reset);

  it("credit score drops by 3×MISSED + DEFAULT across the default-triggering tick", async () => {
    const state0 = await withCashflow();
    expect(state0.creditScore).toBe(CREDIT_SCORE_START);
    const taken = await takeMortgage(state0, { principal: 1000, termMonths: 12 });
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;

    // Zero out both payment sources so every month misses. V2 R2.2:
    // payments fall back cashZl → coins, so both must be 0.
    const seed = await getPlayerState(u);
    seed.resources.cashZl = 0;
    seed.resources.coins = 0;
    await savePlayerState(seed);

    const state = await getPlayerState(u);
    const beforeScore = state.creditScore;
    const due = taken.loan.nextPaymentDueAt + 3 * MONTH_MS + 1000;
    const result = await processLoanPayments(state, due);
    expect(result.defaulted).toContain(taken.loan.id);

    // Expected delta: 3 misses × -5 + default × -20 = -35 from the
    // mortgage-start baseline. On-time deltas are zero for this run.
    const expected = beforeScore + 3 * SCORE_DELTA_MISSED + SCORE_DELTA_DEFAULT;
    expect(state.creditScore).toBe(expected);
  });

  it("defaulted loan does not advance on a later tick (idempotent status)", async () => {
    const state0 = await withCashflow();
    const taken = await takeMortgage(state0, { principal: 1000, termMonths: 12 });
    if (!taken.ok) return;
    const zeroed = await getPlayerState(u);
    zeroed.resources.cashZl = 0;
    zeroed.resources.coins = 0;
    await savePlayerState(zeroed);

    // First tick pushes the loan into `defaulted`.
    const state1 = await getPlayerState(u);
    const due1 = taken.loan.nextPaymentDueAt + 3 * MONTH_MS + 1000;
    await processLoanPayments(state1, due1);
    expect(state1.loans[0].status).toBe("defaulted");
    const scoreAfterDefault = state1.creditScore;
    const monthsPaidAfterDefault = state1.loans[0].monthsPaid;
    const missedAfterDefault = state1.loans[0].missedConsecutive;

    // Second tick a year later — the loan is already defaulted; the
    // processor must treat `status !== "active"` as a skip, not
    // re-trigger the default penalty.
    const state2 = await getPlayerState(u);
    const due2 = due1 + 12 * MONTH_MS;
    const result2 = await processLoanPayments(state2, due2);
    expect(result2.defaulted).toEqual([]);
    expect(state2.loans[0].status).toBe("defaulted");
    expect(state2.loans[0].monthsPaid).toBe(monthsPaidAfterDefault);
    expect(state2.loans[0].missedConsecutive).toBe(missedAfterDefault);
    expect(state2.creditScore).toBe(scoreAfterDefault);
  });

  it("defaulted user becomes bankructwo-eligible; reset clears defaulted loans + restores score floor", async () => {
    const state0 = await withCashflow();
    const taken = await takeMortgage(state0, { principal: 1000, termMonths: 12 });
    if (!taken.ok) return;
    const zeroed = await getPlayerState(u);
    zeroed.resources.cashZl = 0;
    zeroed.resources.coins = 0;
    await savePlayerState(zeroed);

    const stateForDefault = await getPlayerState(u);
    await processLoanPayments(
      stateForDefault,
      taken.loan.nextPaymentDueAt + 3 * MONTH_MS + 1000,
    );
    expect(stateForDefault.loans[0].status).toBe("defaulted");

    // Eligibility contract — any defaulted loan unlocks the reset.
    const readyForReset = await getPlayerState(u);
    expect(eligibleForBankructwo(readyForReset)).toBe(true);

    // Reset closes defaulted loans via seizure + resets score to 0
    // (the documented "rebuild trust from scratch" contract). The
    // returned shape is `{state, demolished}` — no ok flag.
    const reset = await bankructwoReset(readyForReset);
    expect(reset.state).toBeTruthy();
    await savePlayerState(reset.state);
    const after = await getPlayerState(u);
    expect(after.loans.find((l) => l.status === "defaulted")).toBeUndefined();
    // Every prior active/defaulted loan flips to `paid_off_via_seizure`.
    for (const l of after.loans) {
      expect(l.status).not.toBe("defaulted");
      expect(l.status).not.toBe("active");
    }
    // Credit score is wiped to 0 — "must rebuild trust" (see loans.ts).
    expect(after.creditScore).toBe(0);
  });

  it("on-time payment immediately preceding 3 misses still resets the counter (protects edge case)", async () => {
    const state0 = await withCashflow();
    const taken = await takeMortgage(state0, { principal: 2000, termMonths: 24 });
    if (!taken.ok) return;

    // Top up cashZl so the first payment succeeds.
    const withCash = await getPlayerState(u);
    withCash.resources.cashZl = 500;
    await savePlayerState(withCash);

    const state = await getPlayerState(u);
    const firstDue = taken.loan.nextPaymentDueAt;
    await processLoanPayments(state, firstDue);
    expect(state.loans[0].missedConsecutive).toBe(0);

    // Then zero cash so the next 3 months all miss → default.
    state.resources.cashZl = 0;
    state.resources.coins = 0;
    await savePlayerState(state);

    const later = await getPlayerState(u);
    const dueAfter3Miss = firstDue + 3 * MONTH_MS + 1000;
    const result = await processLoanPayments(later, dueAfter3Miss);
    expect(result.defaulted).toContain(taken.loan.id);
    // Exactly 3 missed counts toward default — the earlier on-time
    // payment's +SCORE_DELTA_ON_TIME must have already applied.
    expect(later.creditScore).toBe(
      CREDIT_SCORE_START +
        SCORE_DELTA_ON_TIME +
        3 * SCORE_DELTA_MISSED +
        SCORE_DELTA_DEFAULT,
    );
  });
});
