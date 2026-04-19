/* W4 — SIWE-lite signature verification.
 *
 * We don't need the full EIP-4361 surface (no ENS, no chain check, no
 * statement template). We just need: given (walletAddress, message,
 * signature), prove the wallet signed the message. Plus we pin the
 * message to the specific (username, achievementId, walletAddress)
 * tuple and demand a timestamp within the last 5 minutes so a leaked
 * signature can't be replayed forever.
 */
import "server-only";

import { verifyMessage, isAddress, getAddress, type Address, type Hex } from "viem";

const MESSAGE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Canonical message that a wallet must sign before we mint. Kept in
 *  PL — the UI this flows through is PL-first. The timestamp is
 *  re-validated server-side. */
export function buildMintMessage(params: {
  username: string;
  achievementId: string;
  walletAddress: string;
  issuedAt: number /* ms since epoch */;
}): string {
  const iso = new Date(params.issuedAt).toISOString();
  return [
    "Watt City — zgoda na mint medalu (soulbound).",
    "",
    `User: ${params.username}`,
    `Achievement: ${params.achievementId}`,
    `Wallet: ${params.walletAddress}`,
    `Issued: ${iso}`,
    `IssuedAt: ${params.issuedAt}`,
    "",
    "Podpisanie tej wiadomości NIE wykonuje żadnej transakcji on-chain.",
    "Serwer użyje podpisu tylko aby potwierdzić że jesteś właścicielem tej peseweli.",
  ].join("\n");
}

export type SignatureVerdict =
  | { ok: true; recovered: Address }
  | { ok: false; reason: string };

export async function verifyMintSignature(params: {
  username: string;
  achievementId: string;
  walletAddress: string;
  message: string;
  signature: Hex | string;
  now?: number;
}): Promise<SignatureVerdict> {
  const now = params.now ?? Date.now();

  if (!isAddress(params.walletAddress)) {
    return { ok: false, reason: "bad-wallet-address" };
  }
  const normalized = getAddress(params.walletAddress);

  // Extract the embedded IssuedAt so we can reject stale / future-dated messages.
  const match = params.message.match(/^IssuedAt:\s*(\d+)/m);
  if (!match) return { ok: false, reason: "missing-issued-at" };
  const issuedAt = Number.parseInt(match[1], 10);
  if (!Number.isFinite(issuedAt)) return { ok: false, reason: "bad-issued-at" };
  if (Math.abs(now - issuedAt) > MESSAGE_WINDOW_MS) {
    return { ok: false, reason: "stale-or-future-message" };
  }

  // Pin the message to (username, achievementId, walletAddress). A leaked
  // signature for a different achievement can't be reused here.
  if (!params.message.includes(`User: ${params.username}\n`)) {
    return { ok: false, reason: "username-mismatch" };
  }
  if (!params.message.includes(`Achievement: ${params.achievementId}\n`)) {
    return { ok: false, reason: "achievement-mismatch" };
  }
  if (!params.message.includes(`Wallet: ${normalized}\n`)) {
    // Clients may send lowercase; rebuild and compare.
    const lower = params.walletAddress.toLowerCase();
    if (!params.message.toLowerCase().includes(`wallet: ${lower}\n`)) {
      return { ok: false, reason: "wallet-mismatch" };
    }
  }

  // viem.verifyMessage recovers the signer and constant-time-compares.
  // Accepts EIP-191 personal-sign signatures as produced by
  // MetaMask / Coinbase Wallet / RainbowKit's signMessage.
  const sig = params.signature.startsWith("0x")
    ? (params.signature as Hex)
    : (`0x${params.signature}` as Hex);
  let valid: boolean;
  try {
    valid = await verifyMessage({
      address: normalized,
      message: params.message,
      signature: sig,
    });
  } catch {
    return { ok: false, reason: "signature-verify-threw" };
  }
  if (!valid) return { ok: false, reason: "signature-mismatch" };

  return { ok: true, recovered: normalized };
}
