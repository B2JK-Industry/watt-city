import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* W6 guard — burn-all.ts is the single on-chain side of consent
 * revocation. Drift here breaks the GDPR Art. 17 story, so pin the
 * exposed surface statically. */

const ROOT = join(__dirname, "..", "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("W6 — burnAllForUser + revocation wiring", () => {
  it("burn-all exports a Promise-returning burnAllForUser helper", () => {
    const src = read("lib/web3/burn-all.ts");
    expect(src).toMatch(/export async function burnAllForUser/);
    expect(src).toMatch(/MintLogEntry/);
    expect(src).toMatch(/burnMedal/);
    expect(src).toMatch(/tokenIdFromString/);
    // Idempotent: early-skip on already-burned entries.
    expect(src).toMatch(/entry\.burnedAt/);
  });

  it("profile PATCH enforces the under-16 parent gate", () => {
    const src = read("app/api/me/profile/route.ts");
    expect(src).toMatch(/web3OptIn/);
    expect(src).toMatch(/parent-consent-required/);
    expect(src).toMatch(/burnAllForUser/);
    // The burn only fires when flipping OFF, so the diff is the guard.
    expect(src).toMatch(/prevOptIn/);
    expect(src).toMatch(/nextOptIn/);
  });

  it("player state schema includes web3OptIn in onboarding", () => {
    const src = read("lib/player.ts");
    expect(src).toMatch(/web3OptIn\?:\s*boolean/);
  });

  it("parent revoke endpoint exists and calls burnAllForUser", () => {
    const src = read(
      "app/api/parent/child/[username]/web3-consent/route.ts",
    );
    expect(src).toMatch(/isParentOf/);
    expect(src).toMatch(/revokeParentalConsent/);
    expect(src).toMatch(/burnAllForUser/);
    expect(src).toMatch(/web3OptIn:\s*false/);
    expect(src).toMatch(/runtime\s*=\s*["']nodejs["']/);
  });

  it("revokeParentalConsent exists in lib/gdpr-k.ts", () => {
    const src = read("lib/gdpr-k.ts");
    expect(src).toMatch(/export async function revokeParentalConsent/);
  });

  it("hardErase calls burnAllForUser + wipes web3 mint log", () => {
    const src = read("lib/soft-delete.ts");
    expect(src).toMatch(/burnAllForUser/);
    expect(src).toMatch(/xp:web3:mint-log/);
    expect(src).toMatch(/xp:consent-granted/);
  });
});
