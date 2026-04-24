"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Latest = {
  id: string;
  title: string;
  theme: string;
  generatedAt: number;
  validUntil: number;
  glyph?: string;
};

type Props = {
  /** Localized text. */
  newChallengeLabel: string; // e.g. "🤖 Nowe wyzwanie"
  dismissLabel: string;
  playLabel: string;
};

// Poll-based new-game reveal (backlog 1.7). Hits /api/events/latest-game
// every 30s; when the returned `id` changes the toast pops and the page
// refreshes so the city-scene picks up the new building. `useRef` on
// `lastSeenId` prevents the toast from firing on hydration (we seed with
// whatever's live when the component mounts). A manual dismiss hides the
// toast and seeds the ref so the next new-game fires again.
export function NewGameToast({
  newChallengeLabel,
  dismissLabel,
  playLabel,
}: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<Latest | null>(null);
  const lastSeenId = useRef<string | null>(null);
  const firstPoll = useRef(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const r = await fetch("/api/events/latest-game", { cache: "no-store" });
        const j = (await r.json()) as { latest: Latest | null };
        if (j.latest) {
          if (firstPoll.current) {
            lastSeenId.current = j.latest.id;
            firstPoll.current = false;
          } else if (lastSeenId.current !== j.latest.id) {
            lastSeenId.current = j.latest.id;
            setPayload(j.latest);
            setVisible(true);
            // Pull fresh server-side data so the city-scene reveals the new
            // building on next paint (cranes in via existing CSS transitions).
            router.refresh();
          }
        }
      } catch {
        // Transient network error — silently skip this poll cycle.
      }
      timer = setTimeout(poll, 30_000);
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  if (!visible || !payload) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-md w-[min(92vw,24rem)] card p-4 bg-[var(--background)] border-[var(--accent)] flex flex-col gap-2"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {payload.glyph ?? "🤖"}
        </span>
        <div className="flex-1 flex flex-col">
          <strong className=" text-xs text-[var(--accent)]">
            {newChallengeLabel}
          </strong>
          <span className="text-sm font-bold mt-0.5">{payload.title}</span>
          <span className="text-xs text-[var(--ink-muted)]">{payload.theme}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={`/games/ai/${payload.id}`}
          className="btn btn-primary text-xs flex-1 text-center"
        >
          {playLabel}
        </a>
        <button
          className="btn btn-ghost text-xs"
          onClick={() => setVisible(false)}
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
