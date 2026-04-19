/* W4 — server-only mint / burn / ownership helpers.
 *
 * Wraps viem's PublicClient (reads) + WalletClient (writes via relayer
 * EOA) into a tiny function surface the route handlers call. Every
 * function is safe to call whether or not the contract is deployed —
 * the exported helpers return typed error variants instead of throwing,
 * so the route can translate to HTTP codes cleanly.
 *
 * Runtime constraint: this module uses node:crypto (keccak256) + a
 * raw private key, so it MUST only be imported from server-only paths
 * (app/api/web3/*, scripts/*). NEVER from a client component.
 */
import "server-only";

import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  stringToBytes,
  getAddress,
  type Address,
  type Hex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { WATT_CITY_MEDAL_ABI } from "@/lib/web3/contract";
import type { AchievementId } from "@/lib/achievements";

const LOCAL_CHAIN_ID = 31337;
const BASE_SEPOLIA_CHAIN_ID = 84532;
// 0.001 ETH expressed as wei. BigInt literal avoided because the
// repo's tsconfig target predates ES2020 literal support.
const MIN_RELAYER_BALANCE_WEI = BigInt("1000000000000000");

/** Read the configured chain from env. Defaults to Base Sepolia. */
export function configuredChainId(): number {
  const raw = process.env.NEXT_PUBLIC_WEB3_CHAIN_ID;
  const n = raw ? Number.parseInt(raw, 10) : BASE_SEPOLIA_CHAIN_ID;
  return Number.isFinite(n) ? n : BASE_SEPOLIA_CHAIN_ID;
}

function rpcUrlFor(chainId: number): string {
  if (chainId === LOCAL_CHAIN_ID) return "http://127.0.0.1:8545";
  if (chainId === BASE_SEPOLIA_CHAIN_ID) {
    return process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
  }
  throw new Error(`Unsupported chainId for Watt City web3: ${chainId}`);
}

function chainFor(chainId: number) {
  if (chainId === BASE_SEPOLIA_CHAIN_ID) return baseSepolia;
  if (chainId === LOCAL_CHAIN_ID) {
    // Minimal local anvil "chain" descriptor so viem is happy.
    return {
      id: LOCAL_CHAIN_ID,
      name: "Anvil",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: {
        default: { http: ["http://127.0.0.1:8545"] },
        public: { http: ["http://127.0.0.1:8545"] },
      },
    } as const;
  }
  throw new Error(`Unsupported chainId: ${chainId}`);
}

/** BaseScan URL for a tx hash on the configured chain. Returns null
 *  when the chain has no public explorer (e.g. local anvil). */
export function explorerUrlForTx(hash: Hex): string | null {
  const chainId = configuredChainId();
  if (chainId === BASE_SEPOLIA_CHAIN_ID) {
    return `https://sepolia.basescan.org/tx/${hash}`;
  }
  return null;
}

function contractAddress(): Address {
  const raw = process.env.WEB3_CONTRACT_ADDRESS;
  if (!raw) throw new Error("WEB3_CONTRACT_ADDRESS unset");
  // Throws on bad format.
  return getAddress(raw);
}

function relayerAccount() {
  const pk = process.env.WEB3_RELAYER_PRIVATE_KEY;
  if (!pk) throw new Error("WEB3_RELAYER_PRIVATE_KEY unset");
  if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    throw new Error("WEB3_RELAYER_PRIVATE_KEY must be 32-byte hex");
  }
  // All-zeros placeholder means the relayer isn't actually set up.
  if (/^0x0+$/.test(pk)) throw new Error("WEB3_RELAYER_PRIVATE_KEY is placeholder");
  return privateKeyToAccount(pk as Hex);
}

/** Lazy-created, memoised across calls within a single server process.
 *  Stored as `any` because pnpm hoists multiple viem versions via peer
 *  deps of wagmi + rainbowkit, which confuses tsc's structural match
 *  on the inferred return types. The values are well-defined once the
 *  factory runs; the any cast affects only the local alias. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _publicClient: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _walletClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPublicClient(): any {
  if (_publicClient) return _publicClient;
  const chainId = configuredChainId();
  _publicClient = createPublicClient({
    chain: chainFor(chainId),
    transport: http(rpcUrlFor(chainId)),
  });
  return _publicClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWalletClient(): any {
  if (_walletClient) return _walletClient;
  const chainId = configuredChainId();
  _walletClient = createWalletClient({
    account: relayerAccount(),
    chain: chainFor(chainId),
    transport: http(rpcUrlFor(chainId)),
  });
  return _walletClient;
}

// ---------- deterministic tokenId ----------

/** tokenId = BigInt( keccak256(username ":" achievementId) ).
 *  Deterministic, globally unique, and irreversible — you can't
 *  enumerate users from tokenIds. */
export function tokenIdFor(username: string, id: AchievementId): bigint {
  const preimage = `${username}:${id}`;
  const hash = keccak256(stringToBytes(preimage));
  return BigInt(hash);
}

// ---------- reads ----------

export type OwnershipStatus =
  | { kind: "unminted" }
  | { kind: "minted"; owner: Address; tokenURI: string };

export async function readOwnership(
  tokenId: bigint,
): Promise<OwnershipStatus> {
  const client = getPublicClient();
  const address = contractAddress();
  try {
    const owner = (await client.readContract({
      address,
      abi: WATT_CITY_MEDAL_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    })) as Address;
    const tokenURI = (await client.readContract({
      address,
      abi: WATT_CITY_MEDAL_ABI,
      functionName: "tokenURI",
      args: [tokenId],
    })) as string;
    return { kind: "minted", owner, tokenURI };
  } catch {
    // ownerOf reverts with TokenDoesNotExist when unminted.
    return { kind: "unminted" };
  }
}

export async function readRelayerBalance(): Promise<bigint> {
  const client = getPublicClient();
  const account = relayerAccount();
  return client.getBalance({ address: account.address });
}

export async function relayerHasFunds(): Promise<{
  ok: boolean;
  balanceWei: bigint;
}> {
  try {
    const balanceWei = await readRelayerBalance();
    return { ok: balanceWei >= MIN_RELAYER_BALANCE_WEI, balanceWei };
  } catch {
    return { ok: false, balanceWei: BigInt(0) };
  }
}

// ---------- writes ----------

export type MintResult =
  | { kind: "minted"; txHash: Hex; explorerUrl: string | null }
  | { kind: "alreadyMinted"; owner: Address; tokenURI: string }
  | { kind: "relayerEmpty"; balanceWei: bigint }
  | { kind: "error"; message: string };

export async function mintMedal(params: {
  to: Address;
  tokenId: bigint;
  tokenURI: string;
  achievementId: AchievementId;
}): Promise<MintResult> {
  const { to, tokenId, tokenURI, achievementId } = params;

  // Idempotency first — if the token already exists, short-circuit.
  const status = await readOwnership(tokenId);
  if (status.kind === "minted") {
    return {
      kind: "alreadyMinted",
      owner: status.owner,
      tokenURI: status.tokenURI,
    };
  }

  const balance = await relayerHasFunds();
  if (!balance.ok) {
    return { kind: "relayerEmpty", balanceWei: balance.balanceWei };
  }

  const wallet = getWalletClient();
  const address = contractAddress();
  const account = relayerAccount();
  try {
    const txHash = await wallet.writeContract({
      address,
      abi: WATT_CITY_MEDAL_ABI,
      functionName: "mint",
      args: [to, tokenId, tokenURI, achievementId],
      account,
      chain: chainFor(configuredChainId()),
    });
    return { kind: "minted", txHash, explorerUrl: explorerUrlForTx(txHash) };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export type BurnResult =
  | { kind: "burned"; txHash: Hex; explorerUrl: string | null }
  | { kind: "notMinted" }
  | { kind: "relayerEmpty"; balanceWei: bigint }
  | { kind: "error"; message: string };

export async function burnMedal(tokenId: bigint): Promise<BurnResult> {
  const status = await readOwnership(tokenId);
  if (status.kind === "unminted") return { kind: "notMinted" };

  const balance = await relayerHasFunds();
  if (!balance.ok) {
    return { kind: "relayerEmpty", balanceWei: balance.balanceWei };
  }

  const wallet = getWalletClient();
  const address = contractAddress();
  const account = relayerAccount();
  try {
    const txHash = await wallet.writeContract({
      address,
      abi: WATT_CITY_MEDAL_ABI,
      functionName: "burn",
      args: [tokenId],
      account,
      chain: chainFor(configuredChainId()),
    });
    return { kind: "burned", txHash, explorerUrl: explorerUrlForTx(txHash) };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------- mint log ----------

export type MintLogEntry = {
  tokenId: string;
  achievementId: AchievementId;
  walletAddress: Address;
  txHash: Hex;
  mintedAt: number;
  /** Flipped true after burnMedal() successfully submits for this
   *  tokenId. Retained in the log for audit (don't delete burns). */
  burnedAt?: number;
  burnTxHash?: Hex;
};

export const MINT_LOG_KEY = (username: string) =>
  `xp:web3:mint-log:${username}`;

/** Encode bigint tokenId as a decimal string for JSON storage.
 *  `toHex` is available if we ever need a compact form, but decimal
 *  matches how Etherscan displays tokens. */
export function tokenIdToString(tokenId: bigint): string {
  return tokenId.toString(10);
}

export function tokenIdFromString(s: string): bigint {
  return BigInt(s);
}

export { toHex }; // re-export for callers that need it
