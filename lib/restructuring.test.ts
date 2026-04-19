import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  type PlayerState,
  type BuildingInstance,
} from "@/lib/player";
import {
  restructureCity,
  issueMentorHelp,
  mentorHelpEligibility,
  classroomRebalanceDeadline,
  RESTRUCTURING_KEEP_MAX_TIER,
  RESTRUCTURING_CREDIT_SCORE,
  MENTOR_HELP_COOLDOWN_MS,
  takeMortgage,
} from "./loans";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
}

function build(catalogId: string, level = 1): BuildingInstance {
  return {
    id: `b-${catalogId}-${Math.random().toString(36).slice(2, 5)}`,
    slotId: 0,
    catalogId,
    level,
    builtAt: 0,
    lastTickAt: 0,
    cumulativeCost: {},
  };
}

async function primeForDefault(u: string, loans = 1) {
  let state = await getPlayerState(u);
  state.buildings = [
    build("sklepik", 5), // heavy cashflow for eligibility
    build("domek"),
    build("walcownia"), // T4
    build("software-house"), // T6
  ];
  await savePlayerState(state);
  for (let i = 0; i < loans; i++) {
    state = await getPlayerState(u);
    await takeMortgage(state, { principal: 500, termMonths: 12 });
  }
  state = await getPlayerState(u);
  // Force a defaulted status to satisfy eligibleForBankructwo.
  if (state.loans.length > 0) {
    state.loans[0].status = "defaulted";
    state.loans[0].missedConsecutive = 3;
  }
  await savePlayerState(state);
  return await getPlayerState(u);
}

describe("R7.3 restructureCity (HIGH-8)", () => {
  const u = "restruct-user";
  beforeEach(() => reset(u));

  it("happy path — seizes T4+ buildings, keeps T1-T3, drops credit to 20", async () => {
    const state = await primeForDefault(u);
    const kept1To3Before = state.buildings.filter((b) => {
      const tiers: Record<string, number> = {
        domek: 1,
        sklepik: 2,
        walcownia: 4,
        "software-house": 6,
      };
      return (tiers[b.catalogId] ?? 99) <= RESTRUCTURING_KEEP_MAX_TIER;
    }).length;
    const result = await restructureCity(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const after = await getPlayerState(u);
    expect(after.buildings.length).toBe(kept1To3Before);
    expect(after.buildings.some((b) => b.catalogId === "walcownia")).toBe(false);
    expect(after.buildings.some((b) => b.catalogId === "software-house")).toBe(false);
    expect(after.buildings.some((b) => b.catalogId === "domek")).toBe(true);
    expect(after.buildings.some((b) => b.catalogId === "sklepik")).toBe(true);
    expect(after.creditScore).toBe(RESTRUCTURING_CREDIT_SCORE);
    // All loans closed.
    for (const loan of after.loans) {
      expect(loan.status).toBe("paid_off_via_seizure");
      expect(loan.outstanding).toBe(0);
    }
  });

  it("BLOCKER-1 composite: REFUSES while in watt-rescue grace window", async () => {
    const state = await primeForDefault(u);
    state.wattDeficitSince = Date.now() - 10 * 60 * 60 * 1000; // 10h deep
    await savePlayerState(state);
    const fresh = await getPlayerState(u);
    const result = await restructureCity(fresh);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("watt-rescue-grace");
    // State untouched.
    const after = await getPlayerState(u);
    expect(after.buildings.length).toBe(fresh.buildings.length);
  });

  it("REFUSES when classroomMode is on", async () => {
    const state = await primeForDefault(u);
    state.classroomMode = true;
    await savePlayerState(state);
    const fresh = await getPlayerState(u);
    const result = await restructureCity(fresh);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("classroom-mode");
  });

  it("REFUSES when not eligible (no defaults, cashflow covers payments)", async () => {
    // Fresh state, no loans → not eligible
    const state = await getPlayerState(u);
    const result = await restructureCity(state);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("not-eligible");
  });
});

describe("R7.3 mentorHelp", () => {
  const u = "mentor-user";
  beforeEach(() => reset(u));

  it("rejects when no active loans", () => {
    const state: PlayerState = {
      ...({} as PlayerState),
      username: u,
      loans: [],
    } as PlayerState;
    const r = mentorHelpEligibility(state);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("no-active-loans");
  });

  it("rejects when watt rescue grace is open", async () => {
    await primeForDefault(u);
    const state = await getPlayerState(u);
    state.wattDeficitSince = Date.now() - 1 * 60 * 60 * 1000;
    await savePlayerState(state);
    const fresh = await getPlayerState(u);
    const r = mentorHelpEligibility(fresh);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("watt-rescue-grace");
  });

  it("rejects before the 2nd missed payment", async () => {
    await primeForDefault(u);
    const state = await getPlayerState(u);
    for (const l of state.loans) {
      l.missedConsecutive = 1;
      l.status = "active";
    }
    await savePlayerState(state);
    const fresh = await getPlayerState(u);
    const r = mentorHelpEligibility(fresh);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("no-missed-yet");
  });

  it("issues a 0% APR loan after 2nd miss, sets lastUsedAt", async () => {
    await primeForDefault(u);
    const state = await getPlayerState(u);
    for (const l of state.loans) {
      l.missedConsecutive = 2;
      l.status = "active";
    }
    await savePlayerState(state);
    const fresh = await getPlayerState(u);
    const r = await issueMentorHelp(fresh, 1_000_000_000_000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.loan.apr).toBe(0);
    const after = await getPlayerState(u);
    expect(after.mentorHelp?.lastUsedAt).toBe(1_000_000_000_000);
    expect(after.mentorHelp?.usageCount).toBe(1);
  });

  it("cooldown enforced — second issuance < 30 days out → reject", async () => {
    await primeForDefault(u);
    const state = await getPlayerState(u);
    for (const l of state.loans) {
      l.missedConsecutive = 2;
      l.status = "active";
    }
    await savePlayerState(state);
    const t0 = 1_000_000_000_000;
    await issueMentorHelp(await getPlayerState(u), t0);

    const r = mentorHelpEligibility(
      await getPlayerState(u),
      t0 + MENTOR_HELP_COOLDOWN_MS / 2,
    );
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("cooldown");

    // 30 days later OK again
    const r2 = mentorHelpEligibility(
      await getPlayerState(u),
      t0 + MENTOR_HELP_COOLDOWN_MS + 1000,
    );
    expect(r2.eligible).toBe(true);
  });
});

describe("R7.3 classroomRebalanceDeadline", () => {
  const u = "classroom-user";
  beforeEach(() => reset(u));

  it("null when classroomMode is off", async () => {
    await primeForDefault(u);
    expect(classroomRebalanceDeadline(await getPlayerState(u))).toBeNull();
  });

  it("null when not eligible for bankructwo", async () => {
    const state = await getPlayerState(u);
    state.classroomMode = true;
    await savePlayerState(state);
    expect(classroomRebalanceDeadline(await getPlayerState(u))).toBeNull();
  });

  it("returns a positive ms duration when classroom + eligible", async () => {
    await primeForDefault(u);
    const state = await getPlayerState(u);
    state.classroomMode = true;
    await savePlayerState(state);
    const fresh = await getPlayerState(u);
    const ms = classroomRebalanceDeadline(fresh, fresh.loans[0].nextPaymentDueAt);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(0);
  });
});
