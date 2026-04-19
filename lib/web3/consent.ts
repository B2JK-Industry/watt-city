/* W4/W6 — consent gate for web3 minting.
 *
 * The gate composes three signals:
 *   1. `profile.onboarding.web3OptIn === true` — the user themselves
 *      opted in on /profile. Required for EVERY user.
 *   2. Age bucket — 16+ users are done at step 1. Under-16 users also
 *      need step 3.
 *   3. `hasParentalConsent(username)` — a linked parent granted
 *      consent via the V4.6 observer flow.
 *
 * Revoking at any step disables minting. W6 wires the revoke path to
 * burn existing medals; this module just reads state.
 */
import "server-only";

import { getPlayerState } from "@/lib/player";
import {
  readAgeBucket,
  requiresParentalConsent,
  hasParentalConsent,
} from "@/lib/gdpr-k";

export type Web3GateReason =
  | "ok"
  | "web3-disabled"
  | "opt-in-missing"
  | "parent-consent-missing";

export type Web3GateResult = {
  allowed: boolean;
  reason: Web3GateReason;
  ageBucket: Awaited<ReturnType<typeof readAgeBucket>>;
  optIn: boolean;
  parentalConsent: boolean;
};

/** Pull the user-side opt-in flag from the profile onboarding record.
 *  Returns `false` when the field is missing — default-deny. */
export async function readWeb3OptIn(username: string): Promise<boolean> {
  const state = await getPlayerState(username);
  const ob = state.onboarding as
    | undefined
    | { web3OptIn?: boolean; [k: string]: unknown };
  return ob?.web3OptIn === true;
}

export async function checkWeb3Gate(username: string): Promise<Web3GateResult> {
  if (process.env.NEXT_PUBLIC_WEB3_ENABLED !== "true") {
    return {
      allowed: false,
      reason: "web3-disabled",
      ageBucket: null,
      optIn: false,
      parentalConsent: false,
    };
  }

  const [ageBucket, optIn, parentalConsent] = await Promise.all([
    readAgeBucket(username),
    readWeb3OptIn(username),
    hasParentalConsent(username),
  ]);

  if (!optIn) {
    return {
      allowed: false,
      reason: "opt-in-missing",
      ageBucket,
      optIn,
      parentalConsent,
    };
  }

  // No age bucket recorded — treat as under-16 for the safer default.
  const needsParent = ageBucket ? requiresParentalConsent(ageBucket) : true;
  if (needsParent && !parentalConsent) {
    return {
      allowed: false,
      reason: "parent-consent-missing",
      ageBucket,
      optIn,
      parentalConsent,
    };
  }

  return {
    allowed: true,
    reason: "ok",
    ageBucket,
    optIn,
    parentalConsent,
  };
}
