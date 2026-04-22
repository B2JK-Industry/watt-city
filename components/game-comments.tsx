"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment } from "@/lib/community";

type Props = {
  gameId: string;
  currentUser: string;
  labels: {
    title: string;
    placeholder: string;
    post: string;
    report: string;
    empty: string;
    slurWarn: string;
  };
};

export function GameComments({ gameId, currentUser, labels }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/community/comments/${encodeURIComponent(gameId)}`);
    const j = await r.json();
    if (j.ok) setComments(j.comments);
  }, [gameId]);

  useEffect(() => {
    // Deferred to a microtask so the setState inside refresh() lands outside
    // the effect body (keeps react-hooks/set-state-in-effect quiet).
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  const post = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/community/comments/${encodeURIComponent(gameId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error === "contains-slur" ? labels.slurWarn : j.error);
      } else {
        setText("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const report = async (id: string) => {
    await fetch(`/api/community/report/${encodeURIComponent(id)}`, {
      method: "POST",
    });
    await refresh();
  };

  return (
    <section className="card p-4 flex flex-col gap-3">
      <h2 className="text-sm font-black uppercase">{labels.title}</h2>
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={labels.placeholder}
          maxLength={400}
          rows={2}
          className="flex-1 px-3 py-2 border-[3px] border-[var(--ink)] rounded bg-[var(--surface-2)] text-sm"
        />
        <button className="btn btn-primary" onClick={post} disabled={busy || text.trim().length < 2}>
          {labels.post}
        </button>
      </div>
      {error && <p className="text-rose-400 text-xs">{error}</p>}
      {comments.length === 0 ? (
        <p className="text-xs text-zinc-400">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="border border-[var(--ink)]/20 rounded p-2 flex justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">{c.author}</span>
                <span>{c.text}</span>
              </div>
              {c.author !== currentUser && (
                <button className="text-[10px] underline text-zinc-400" onClick={() => report(c.id)}>
                  {labels.report}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
