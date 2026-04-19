"use client";

import { useEffect, useState } from "react";
import { Confetti } from "@/components/confetti";

type Props = {
  /** Optional map of tier → display title. Cleanup issue 2 dropped the
   *  V1 tier-name table ("Drewniana chata" / "Altus Tower" etc.) that
   *  leaked Polish+Slovak identity. Callers may still pass a custom
   *  map; when omitted the toast shows just "Poziom {tier}". */
  titleByTier?: Record<number, string>;
  /** Localized fallback like "Poziom" / "Рівень" / "Úroveň" / "Level". */
  levelWord?: string;
  headline: string; // "Awans!" headline
  dismissLabel: string;
};

// Polls /api/me/tier every 20s. If the server reports a pending celebration
// (tier > acknowledgedTier), pops a confetti toast then POSTs to bump the
// acknowledgement so the same tier-up doesn't replay. The 20s interval lines
// up with the ResourceBar render pattern — tier-up lands within one cycle
// after the player's upgrade POST.
export function TierUpToast({
  titleByTier,
  levelWord,
  headline,
  dismissLabel,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [tier, setTier] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const r = await fetch("/api/me/tier", { cache: "no-store" });
        const j = await r.json();
        if (j.ok && j.pendingCelebration) {
          setTier(j.tier);
          setVisible(true);
          // Bump acknowledgement so poll doesn't loop
          await fetch("/api/me/tier", { method: "POST" });
        }
      } catch {
        // ignore
      }
      timer = setTimeout(poll, 20_000);
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible || tier === null) return null;
  const word = levelWord ?? "Level";
  const customTitle = titleByTier?.[tier];

  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,26rem)] card p-4 flex flex-col gap-2 shadow-[6px_6px_0_0_var(--ink)] bg-[var(--accent)] text-[#0a0a0f] border-[var(--ink)]"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Confetti count={20} />
      </div>
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🎉
          </span>
          <div className="flex flex-col">
            <strong className="uppercase tracking-wider text-xs">{headline}</strong>
            <span className="text-sm font-black">
              {word} {tier}
              {customTitle ? ` — ${customTitle}` : ""}
            </span>
          </div>
        </div>
        <button
          className="text-xs font-bold underline"
          onClick={() => setVisible(false)}
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
