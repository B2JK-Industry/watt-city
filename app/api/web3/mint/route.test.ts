import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* W4 guard — static-source assertions for the mint route. Full e2e
 * runs against anvil via the scripts/ smoke path (not CI — needs a
 * live anvil + seeded user). These grep-level checks catch the most
 * common regressions cheaply. */

const SRC = readFileSync(
  join(process.cwd(), "app/api/web3/mint/route.ts"),
  "utf8",
);
const MY_SRC = readFileSync(
  join(process.cwd(), "app/api/web3/my-medals/route.ts"),
  "utf8",
);

describe("W4 — mint route static surface", () => {
  it("declares nodejs runtime + force-dynamic", () => {
    expect(SRC).toMatch(/export const runtime\s*=\s*["']nodejs["']/);
    expect(SRC).toMatch(/export const dynamic\s*=\s*["']force-dynamic["']/);
  });

  it("is a POST handler", () => {
    expect(SRC).toMatch(/export async function POST\s*\(/);
  });

  it("validates the body with zod", () => {
    expect(SRC).toMatch(/z\.object/);
    expect(SRC).toMatch(/walletAddress/);
    expect(SRC).toMatch(/achievementId/);
    expect(SRC).toMatch(/signature/);
    expect(SRC).toMatch(/message/);
  });

  it("runs every required gate before minting", () => {
    // Session
    expect(SRC).toMatch(/getSession\(\)/);
    // Feature flag + consent
    expect(SRC).toMatch(/checkWeb3Gate\(/);
    // Achievement ownership
    expect(SRC).toMatch(/ownedAchievements\(/);
    // Wallet signature
    expect(SRC).toMatch(/verifyMintSignature\(/);
    // Single-flight lock
    expect(SRC).toMatch(/kvSetNX\(/);
    expect(SRC).toMatch(/kvDel\(/);
    // Mint call (idempotency + balance guard are inside mintMedal)
    expect(SRC).toMatch(/mintMedal\(/);
  });

  it("returns 503 on relayer-empty", () => {
    expect(SRC).toMatch(/relayer-empty/);
    expect(SRC).toMatch(/status:\s*503/);
  });

  it("returns alreadyMinted:true instead of reverting on duplicates", () => {
    expect(SRC).toMatch(/alreadyMinted:\s*true/);
  });

  it("appends the mint to the Redis mint log", () => {
    expect(SRC).toMatch(/lPush\(MINT_LOG_KEY\(/);
    expect(SRC).toMatch(/lTrim\(MINT_LOG_KEY\(/);
  });
});

describe("W4 — my-medals route", () => {
  it("is a GET handler, nodejs runtime", () => {
    expect(MY_SRC).toMatch(/export async function GET\s*\(/);
    expect(MY_SRC).toMatch(/export const runtime\s*=\s*["']nodejs["']/);
  });

  it("runs the same session + gate as mint", () => {
    expect(MY_SRC).toMatch(/getSession\(\)/);
    expect(MY_SRC).toMatch(/checkWeb3Gate\(/);
  });

  it("reads ownership on-chain per logged tokenId", () => {
    expect(MY_SRC).toMatch(/readOwnership\(/);
  });
});
