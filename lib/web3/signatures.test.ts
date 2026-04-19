import { describe, it, expect } from "vitest";
import {
  privateKeyToAccount,
  generatePrivateKey,
} from "viem/accounts";
import { buildMintMessage, verifyMintSignature } from "./signatures";

/* W4 guard — SIWE-lite verification proves wallet control AND pins
 * the message content to (username, achievementId, walletAddress,
 * freshness). We fabricate a key in-test, sign the canonical message,
 * and assert the server accepts the valid case + rejects every way
 * it can go wrong. */

describe("W4 — verifyMintSignature", () => {
  const username = "demo-teacher-pl";
  const achievementId = "first-mortgage-paid";
  const now = 1_766_000_000_000;

  async function signValid() {
    const pk = generatePrivateKey();
    const account = privateKeyToAccount(pk);
    const message = buildMintMessage({
      username,
      achievementId,
      walletAddress: account.address,
      issuedAt: now,
    });
    const signature = await account.signMessage({ message });
    return { account, message, signature };
  }

  it("accepts a valid signature in the freshness window", async () => {
    const { account, message, signature } = await signValid();
    const res = await verifyMintSignature({
      username,
      achievementId,
      walletAddress: account.address,
      message,
      signature,
      now,
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recovered).toBe(account.address);
  });

  it("rejects when the signature was signed by a different key", async () => {
    const { message, signature } = await signValid();
    const other = privateKeyToAccount(generatePrivateKey());
    const res = await verifyMintSignature({
      username,
      achievementId,
      walletAddress: other.address, // tell verifier the wrong wallet
      // but the message still includes the original wallet
      message,
      signature,
      now,
    });
    expect(res.ok).toBe(false);
  });

  it("rejects stale messages (> 5 min old)", async () => {
    const pk = generatePrivateKey();
    const account = privateKeyToAccount(pk);
    const staleIssued = now - 10 * 60 * 1000; // 10 min back
    const message = buildMintMessage({
      username,
      achievementId,
      walletAddress: account.address,
      issuedAt: staleIssued,
    });
    const signature = await account.signMessage({ message });
    const res = await verifyMintSignature({
      username,
      achievementId,
      walletAddress: account.address,
      message,
      signature,
      now,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("stale-or-future-message");
  });

  it("rejects when achievementId in the message doesn't match", async () => {
    const { account, message, signature } = await signValid();
    const res = await verifyMintSignature({
      username,
      achievementId: "streak-30", // mismatch vs message's first-mortgage-paid
      walletAddress: account.address,
      message,
      signature,
      now,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("achievement-mismatch");
  });

  it("rejects when username in the message doesn't match", async () => {
    const { account, message, signature } = await signValid();
    const res = await verifyMintSignature({
      username: "someone-else",
      achievementId,
      walletAddress: account.address,
      message,
      signature,
      now,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("username-mismatch");
  });

  it("rejects a badly-formatted wallet address", async () => {
    const res = await verifyMintSignature({
      username,
      achievementId,
      walletAddress: "not-an-address",
      message: "whatever",
      signature: "0xdead",
      now,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("bad-wallet-address");
  });
});
