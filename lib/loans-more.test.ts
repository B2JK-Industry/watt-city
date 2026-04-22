import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
} from "@/lib/player";
import {
  quoteLoan,
  takeLoan,
  bankructwoReset,
  eligibleForBankructwo,
  LOAN_CONFIGS,
} from "./loans";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
}

async function withCashflow(username: string): Promise<void> {
  const state = await getPlayerState(username);
  state.buildings.push({
    id: "b-test",
    slotId: 7,
    catalogId: "sklepik",
    level: 5,
    builtAt: Date.now(),
    lastTickAt: Date.now(),
    cumulativeCost: {},
  });
  await savePlayerState(state);
}

describe("Phase 2.6 loan products", () => {
  const u = "loans-more";
  beforeEach(() => reset(u));

  it("kredyt_obrotowy APR 12%, 1-month term", async () => {
    const cfg = LOAN_CONFIGS.kredyt_obrotowy;
    expect(cfg.apr).toBeCloseTo(0.12, 5);
    expect(cfg.allowedTermsMonths).toEqual([1]);
    expect(cfg.caution).toBe(false);
  });

  it("kredyt_konsumencki is marked caution (RRSO 20%)", () => {
    expect(LOAN_CONFIGS.kredyt_konsumencki.apr).toBeCloseTo(0.2, 5);
    expect(LOAN_CONFIGS.kredyt_konsumencki.caution).toBe(true);
  });

  it("takeLoan(kredyt_konsumencki) credits principal + uses 20% APR schedule", async () => {
    await withCashflow(u);
    const state = await getPlayerState(u);
    const result = await takeLoan(state, {
      type: "kredyt_konsumencki",
      principal: 1000,
      termMonths: 12,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.loan.type).toBe("kredyt_konsumencki");
    expect(result.loan.apr).toBeCloseTo(0.2, 5);
    // Monthly payment at 20% APR 12mo on 1000 principal ≈ 92.63
    expect(result.loan.monthlyPayment).toBeGreaterThan(90);
    expect(result.loan.monthlyPayment).toBeLessThan(95);
  });

  it("quoteLoan rejects invalid term per loan type", async () => {
    await withCashflow(u);
    const state = await getPlayerState(u);
    const q = quoteLoan(state, {
      type: "kredyt_obrotowy",
      principal: 500,
      termMonths: 24, // not allowed — obrotowy is 1-month only
    });
    expect(q.ok).toBe(false);
    expect(q.eligibility.missing.some((m) => m.startsWith("invalid-term"))).toBe(true);
  });
});

describe("bankructwoReset", () => {
  const u = "bankrut";
  beforeEach(() => reset(u));

  it("not eligible with zero defaulted loans", async () => {
    const state = await getPlayerState(u);
    expect(eligibleForBankructwo(state)).toBe(false);
  });

  it("eligible + reset wipes non-Domek buildings, keeps Domek, sets score 0", async () => {
    await withCashflow(u);
    let state = await getPlayerState(u);
    // Seed a defaulted loan + a high monthly obligation vs zero cashflow fake
    state.loans.push({
      id: "L-test",
      type: "mortgage",
      principal: 10_000,
      outstanding: 10_000,
      monthlyPayment: 999_999, // forces cashflow < monthly → eligible
      rrso: 0.08,
      apr: 0.08,
      termMonths: 36,
      takenAt: Date.now(),
      nextPaymentDueAt: Date.now(),
      monthsPaid: 0,
      missedConsecutive: 3,
      status: "defaulted",
    });
    state.buildings.push({
      id: "b-extra",
      slotId: 1,
      catalogId: "biblioteka",
      level: 1,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    });
    state.buildings.push({
      id: "b-domek",
      slotId: 10,
      catalogId: "domek",
      level: 1,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    });
    await savePlayerState(state);
    state = await getPlayerState(u);
    expect(eligibleForBankructwo(state)).toBe(true);
    const { demolished } = await bankructwoReset(state);
    expect(demolished).toBe(2); // sklepik + biblioteka removed
    expect(state.buildings.length).toBe(1);
    expect(state.buildings[0].catalogId).toBe("domek");
    expect(state.creditScore).toBe(0);
  });
});
