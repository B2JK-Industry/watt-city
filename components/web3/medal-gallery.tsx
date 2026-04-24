"use client";

/* W5 — /profile on-chain medal gallery (client).
 *
 * Renders:
 *   - RainbowKit <ConnectButton /> at the top
 *   - A list of medals from /api/web3/my-medals (backend-authoritative)
 *   - For each achievement the user owns off-chain but hasn't minted
 *     on-chain: a <MintButton /> that SIWE-signs + POSTs /api/web3/mint
 *
 * Gating handled by the server-side `MedalGallerySection` wrapper —
 * this file only renders when NEXT_PUBLIC_WEB3_ENABLED=true AND the
 * user's onboarding.web3OptIn flag (plus parental consent for minors)
 * has already been verified. No defensive guards inside.
 *
 * a11y: prefers-reduced-motion is respected via tailwind's `motion-safe`
 * prefix on animated elements. `role=status` for the async-loading
 * placeholder so screen readers announce it.
 */

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { Web3Providers } from "./web3-providers";
import type { AchievementId } from "@/lib/achievements";

type MedalEntry = {
  tokenId: string;
  achievementId: AchievementId;
  walletAddress: `0x${string}`;
  txHash: `0x${string}`;
  mintedAt: number;
  explorerUrl: string | null;
  alive: boolean;
  currentOwner: `0x${string}` | null;
  tokenURI: string | null;
};

type GalleryProps = {
  username: string;
  ownedAchievements: AchievementId[];
  achievementLabels: Record<AchievementId, string>;
  achievementIcons: Record<AchievementId, string>;
  strings: {
    connectPromptTitle: string;
    connectPromptBody: string;
    mintableHeading: string;
    mintedHeading: string;
    mintCta: string;
    minting: string;
    minted: string;
    burned: string;
    viewOnExplorer: string;
    noMedalsYet: string;
    signatureRequestedTitle: string;
    signatureRequestedBody: string;
    errorTitle: string;
  };
};

export function Web3MedalGallery(props: GalleryProps) {
  // Wrap every caller in the provider tree. This is the only surface
  // exposed back to the (server-rendered) profile page, so the provider
  // setup stays scoped to the single mounting point.
  return (
    <Web3Providers>
      <GalleryInner {...props} />
    </Web3Providers>
  );
}

function GalleryInner({
  username,
  ownedAchievements,
  achievementLabels,
  achievementIcons,
  strings,
}: GalleryProps) {
  const { address, isConnected } = useAccount();
  const [medals, setMedals] = useState<MedalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshMedals() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/web3/my-medals", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; medals?: MedalEntry[]; error?: string };
      if (!json.ok) {
        setError(json.error ?? "fetch-failed");
        setMedals([]);
      } else {
        setMedals(json.medals ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isConnected) return;
    // Deferred to a microtask so the setState inside refreshMedals() lands
    // outside the effect body (keeps react-hooks/set-state-in-effect quiet).
    const id = setTimeout(() => void refreshMedals(), 0);
    return () => clearTimeout(id);
  }, [isConnected]);

  const mintedIds = new Set(medals.filter((m) => m.alive).map((m) => m.achievementId));
  const mintable = ownedAchievements.filter((id) => !mintedIds.has(id));

  return (
    <section
      className="card p-4 flex flex-col gap-4 border-[var(--accent)]"
      aria-labelledby="web3-gallery-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="web3-gallery-heading" className="text-lg font-semibold">
            {strings.mintedHeading}
          </h2>
        </div>
        <ConnectButton
          showBalance={false}
          accountStatus="avatar"
          chainStatus="icon"
        />
      </header>

      {!isConnected && (
        <div
          className="border border-[var(--ink)] rounded p-3 text-sm leading-snug bg-[var(--background)]/50"
          role="status"
        >
          <p className="font-bold mb-1">{strings.connectPromptTitle}</p>
          <p className="text-zinc-400">{strings.connectPromptBody}</p>
        </div>
      )}

      {isConnected && loading && (
        <p className="text-xs text-zinc-400" role="status">
          …
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="border border-red-500 rounded p-2 text-xs text-red-400"
        >
          <strong className="block">{strings.errorTitle}</strong>
          {error}
        </div>
      )}

      {isConnected && medals.length === 0 && !loading && !error && (
        <p className="text-xs text-zinc-400">{strings.noMedalsYet}</p>
      )}

      {medals.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {medals.map((m) => (
            <li
              key={m.tokenId}
              className="border border-[var(--accent)]/40 rounded p-3 flex flex-col items-center gap-1 text-center"
            >
              <span className="text-3xl" aria-hidden>
                {achievementIcons[m.achievementId] ?? "🏅"}
              </span>
              <span className="text-[11px] font-bold">
                {achievementLabels[m.achievementId] ?? m.achievementId}
              </span>
              <span className="text-[10px] text-zinc-400">
                {m.alive ? strings.minted : strings.burned}
              </span>
              {m.explorerUrl && (
                <a
                  href={m.explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[10px] underline text-[var(--accent)]"
                >
                  {strings.viewOnExplorer}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {isConnected && mintable.length > 0 && address && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{strings.mintableHeading}</h3>
          <ul className="flex flex-col gap-2">
            {mintable.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between border border-dashed border-[var(--ink)] rounded p-2 gap-2"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{achievementIcons[id] ?? "🏅"}</span>
                  <span className="text-xs">{achievementLabels[id] ?? id}</span>
                </span>
                <MintButton
                  username={username}
                  achievementId={id}
                  walletAddress={address}
                  onMinted={refreshMedals}
                  strings={strings}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MintButton({
  username,
  achievementId,
  walletAddress,
  onMinted,
  strings,
}: {
  username: string;
  achievementId: AchievementId;
  walletAddress: `0x${string}`;
  onMinted: () => Promise<void>;
  strings: GalleryProps["strings"];
}) {
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Mirror of lib/web3/signatures.ts buildMintMessage. Kept in lockstep
  // via the vitest guard components/web3/medal-gallery.test.ts.
  function buildMessage(): string {
    const issuedAt = Date.now();
    const iso = new Date(issuedAt).toISOString();
    return [
      "Watt City — zgoda na mint medalu (soulbound).",
      "",
      `User: ${username}`,
      `Achievement: ${achievementId}`,
      `Wallet: ${walletAddress}`,
      `Issued: ${iso}`,
      `IssuedAt: ${issuedAt}`,
      "",
      "Podpisanie tej wiadomości NIE wykonuje żadnej transakcji on-chain.",
      "Serwer użyje podpisu tylko aby potwierdzić że jesteś właścicielem tej peseweli.",
    ].join("\n");
  }

  function readCsrfCookie(): string | null {
    const m = document.cookie.match(/(?:^|;\s*)wc_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function onMint() {
    setBusy(true);
    setErr(null);
    try {
      const message = buildMessage();
      const signature = await signMessageAsync({ message });
      const csrf = readCsrfCookie();
      const res = await fetch("/api/web3/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        body: JSON.stringify({
          achievementId,
          walletAddress,
          signature,
          message,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        alreadyMinted?: boolean;
      };
      if (!json.ok) {
        setErr(json.error ?? "mint-failed");
        return;
      }
      await onMinted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onMint}
        disabled={busy}
        className="chip chip-accent text-xs motion-safe:transition-opacity disabled:opacity-50"
      >
        {busy ? strings.minting : strings.mintCta}
      </button>
      {err && <span className="text-[10px] text-red-400">{err}</span>}
    </span>
  );
}
