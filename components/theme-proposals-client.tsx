"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Proposal } from "@/lib/theme-proposals";

type Copy = {
  placeholder: string;
  submit: string;
  vote: string;
  voted: string;
  empty: string;
  ranking: string;
};

export function ThemeProposalsClient({
  currentUser,
  initialProposals,
  copy,
}: {
  currentUser: string;
  initialProposals: Proposal[];
  copy: Copy;
}) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initialProposals);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/community/theme-proposals", { cache: "no-store" });
    const j = await r.json();
    if (j.ok) setProposals(j.proposals);
    router.refresh();
  }, [router]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/community/theme-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", text }),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else {
        setText("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const vote = async (id: string) => {
    setBusy(true);
    try {
      await fetch("/api/community/theme-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", proposalId: id }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={copy.placeholder}
            maxLength={100}
            className="flex-1 px-3 py-2 border-[3px] border-[var(--ink)] rounded bg-[var(--surface-2)]"
          />
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={busy || text.trim().length < 8}
          >
            {copy.submit}
          </button>
        </div>
        {error && <p className="text-rose-400 text-xs">{error}</p>}
      </section>
      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">{copy.ranking}</h2>
        {proposals.length === 0 ? (
          <p className="text-xs text-zinc-400">{copy.empty}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {proposals.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-[var(--ink)]/20 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm">{p.text}</span>
                  <span className="text-[11px] text-zinc-400">
                    {p.author} · {p.voteCount} 👍
                  </span>
                </div>
                {p.author !== currentUser && (
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => vote(p.id)}
                    disabled={busy}
                  >
                    {copy.vote}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
