/* Web3 client helpers — Phase 8 scaffold.
 *
 * Returns mocked data when `NEXT_PUBLIC_WEB3_ENABLED` is anything other
 * than "true". Real implementation (wallet connect + indexer query)
 * lands in Phase 8.1.4 + 8.1.5 once the operator deploys to Base and
 * sets `WEB3_RELAYER_PRIVATE_KEY`, `WEB3_CONTRACT_ADDRESS`, etc.
 *
 * All functions here are TYPED so downstream callers don't need to
 * change their signatures when the real impl lands.
 */

export type OnchainMedal = {
  tokenId: string;
  achievementId: string;
  chainId: number;
  mintedAt: number;
  txHash: string;
  tokenURI: string;
};

export function web3Enabled(): boolean {
  // NEXT_PUBLIC_* is inlined at build time; safe to read here.
  return process.env.NEXT_PUBLIC_WEB3_ENABLED === "true";
}

export function web3ChainId(): number {
  const raw = process.env.NEXT_PUBLIC_WEB3_CHAIN_ID;
  const n = raw ? Number.parseInt(raw, 10) : 8453; // Base mainnet
  return Number.isFinite(n) ? n : 8453;
}

/** Return any on-chain medals the wallet holds. Mock path returns `[]`. */
export async function fetchOnchainMedals(
  _wallet: string | null,
): Promise<OnchainMedal[]> {
  if (!web3Enabled()) return [];
  // TODO real impl: subgraph / Alchemy NFT API call by owner.
  return [];
}

/** Kick off a mint. Mock path returns a deterministic fake tokenId so
 *  tests can assert the shape without a chain. */
export async function requestMint(
  wallet: string,
  achievementId: string,
): Promise<{ ok: true; tokenId: string; mock: boolean } | { ok: false; error: string }> {
  if (!web3Enabled()) {
    return {
      ok: true,
      tokenId: `mock-${Buffer.from(`${wallet}:${achievementId}`).toString("hex").slice(0, 12)}`,
      mock: true,
    };
  }
  // TODO real impl: POST to our /api/web3/mint with CSRF; server uses
  // the relayer EOA to submit the mint tx; we poll the indexer for
  // confirmation.
  return { ok: false, error: "not-implemented-yet" };
}
