"use client";

/* W5 — RainbowKit + wagmi + React Query provider tree.
 *
 * Only imported from the client-side Web3MedalGallery. Because the
 * gallery itself is dynamic()'d with ssr:false when the feature flag
 * is on, this file never ships to users who don't opt into web3 — no
 * wagmi/viem/rainbowkit in their bundle.
 */

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getWagmiConfig } from "@/lib/web3/config";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Web3Providers({ children }: { children: ReactNode }) {
  const config = getWagmiConfig();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#ffd81a", accentColorForeground: "#000000" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
