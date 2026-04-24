import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  ensureAccount,
  getBalance,
  topup,
  transfer,
  mirrorToJunior,
  auditLog,
} from "./pko-junior-mock";
import { resolveTheme, CORE_THEME, PKO_THEME } from "./theme";

async function reset(u: string) {
  await kvDel(`xp:pko-mock:${u}`);
  await kvDel(`xp:pko-audit:${u}`);
}

describe("PKO Junior mock", () => {
  beforeEach(async () => {
    await reset("kid1");
    await reset("kid2");
  });

  it("ensureAccount is idempotent", async () => {
    const a1 = await ensureAccount("kid1", "Ola");
    const a2 = await ensureAccount("kid1", "Ola");
    expect(a1.username).toBe(a2.username);
    expect(a2.balancePln).toBe(a1.balancePln);
  });

  it("topup rejects 0/negative amounts", async () => {
    await ensureAccount("kid1", "Ola");
    const r = await topup("kid1", 0);
    expect(r.ok).toBe(false);
  });

  it("topup increments balance and writes audit", async () => {
    await ensureAccount("kid1", "Ola");
    const r = await topup("kid1", 50, "test");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.balanceAfter).toBe(50);
    const log = await auditLog("kid1", 5);
    expect(log[0].kind).toBe("topup");
    expect(log[0].amount).toBe(50);
  });

  it("transfer moves balance across linked accounts", async () => {
    await ensureAccount("kid1", "Ola");
    await ensureAccount("kid2", "Ania");
    await topup("kid1", 100);
    const r = await transfer("kid1", "kid2", 30);
    expect(r.ok).toBe(true);
    const bal1 = await getBalance("kid1");
    const bal2 = await getBalance("kid2");
    expect(bal1.ok && bal1.balance).toBe(70);
    expect(bal2.ok && bal2.balance).toBe(30);
  });

  it("mirrorToJunior refuses below-min amount and audits mirror kind", async () => {
    await ensureAccount("kid1", "Ola");
    const tooSmall = await mirrorToJunior("kid1", 5, 0.1); // 0.5 → floors to 0
    expect(tooSmall.ok).toBe(false);
    const r = await mirrorToJunior("kid1", 500, 0.1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.balanceAfter).toBe(50);
    const log = await auditLog("kid1", 5);
    expect(log[0].kind).toBe("mirror");
    expect(log[0].wattCityBalance).toBe(500);
  });
});

describe("theme resolution", () => {
  it("core theme has the Watt City brand and no mascot", () => {
    const t = resolveTheme("core");
    expect(t.id).toBe("core");
    expect(t.mascot).toBeNull();
    expect(t.brand).toBe("Watt City");
  });
  it("pko theme is the light-mode default (mascot null until asset ships)", () => {
    const t = resolveTheme("pko");
    expect(t.id).toBe("pko");
    // Placeholder mascot reads as broken image — SKO-revert lesson C.
    expect(t.mascot).toBeNull();
    expect(t.disclaimer).toMatch(/GRA EDUKACYJNA/);
  });
  it("exported constants match resolveTheme output", () => {
    expect(resolveTheme("core")).toEqual(CORE_THEME);
    expect(resolveTheme("pko")).toEqual(PKO_THEME);
  });
});
