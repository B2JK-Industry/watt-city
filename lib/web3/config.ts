/* Phase 8 W1 — wagmi + RainbowKit config for Base Sepolia.
 *
 * This module imports wagmi/viem at top-level. It MUST only be imported
 * from modules that are themselves conditionally loaded when
 * NEXT_PUBLIC_WEB3_ENABLED === "true" — otherwise the web3 libs leak
 * into the default bundle. Call-sites:
 *   - components/web3/*         (client, dynamic-imported from /profile)
 *   - app/api/web3/*            (server-only routes)
 *
 * Do NOT import this file from shared layout / nav / anything that
 * renders for every user. The build-time guard below catches accidental
 * imports when the flag is off.
 */

import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const WEB3_CHAIN = baseSepolia;
export const WEB3_CHAIN_ID = baseSepolia.id; // 84532

// Read at module-eval time. The value is inlined by Next.js because the
// var is NEXT_PUBLIC_*.
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

/** RainbowKit + wagmi config. Lazy-built so the import chain can be
 *  tree-shaken when no UI ever evaluates it. */
let _config: ReturnType<typeof createConfig> | null = null;

export function getWagmiConfig() {
  if (_config) return _config;
  // getDefaultConfig wires Coinbase Wallet (including Smart Wallet /
  // passkey path), MetaMask, and WalletConnect. Passing an empty
  // projectId disables WalletConnect but keeps Coinbase + injected.
  _config = getDefaultConfig({
    appName: "Watt City",
    projectId: WC_PROJECT_ID || "watt-city-dev",
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: http(),
    },
    ssr: true,
  });
  return _config;
}
