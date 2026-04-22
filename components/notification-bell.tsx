"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NotificationEntry } from "@/lib/notifications";
import { SwipeToDismiss } from "@/components/swipe-to-dismiss";

// Mobile-only swipe-to-dismiss wraps each notification list item.
// Dismissing POSTs a mark-seen for all + hides that item locally.

type Payload = {
  entries: NotificationEntry[];
  unread: number;
  seenAt: number;
};

type Props = {
  labels: {
    bell: string; // "Powiadomienia"
    empty: string;
    markSeen: string;
    quietActive: string;
  };
};

// Polls /api/me/notifications every 45s. Shows a 🔔 with a red-dot badge
// when `unread > 0`. Clicking opens a drop panel that lists the 50 latest
// entries; the panel's open action POSTs `{action:"mark-seen"}` to clear
// the badge. Entries with `silent:true` (quiet hours) render muted.
export function NotificationBell({ labels }: Props) {
  const [data, setData] = useState<Payload | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    try {
      const r = await fetch("/api/me/notifications", { cache: "no-store" });
      const j = await r.json();
      if (j.ok) setData({ entries: j.entries, unread: j.unread, seenAt: j.seenAt });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    // Defer the first fetch to a microtask so the setState inside refresh()
    // doesn't land in the effect's synchronous body (the rule treats that
    // as a cascade risk). Every subsequent tick already runs outside the
    // effect via the interval callback.
    const kick = setTimeout(refresh, 0);
    const id = setInterval(refresh, 45_000);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function toggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && data && data.unread > 0) {
      await fetch("/api/me/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-seen" }),
      });
      await refresh();
    }
  }

  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        title={labels.bell}
        className="relative w-8 h-8 flex items-center justify-center border-2 border-[var(--ink)] bg-[var(--surface)] rounded"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center bg-rose-500 text-white rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={labels.bell}
          className="absolute right-0 top-full mt-2 z-40 w-[min(95vw,22rem)] max-w-[calc(100vw-1rem)] card p-2 shadow-[6px_6px_0_0_var(--ink)] bg-[var(--surface)] border-2 border-[var(--ink)]"
        >
          <header className="flex items-center justify-between px-2 py-1 text-xs uppercase tracking-wider text-zinc-400 border-b border-[var(--ink)]/30 mb-1">
            <span className="font-bold">{labels.bell}</span>
          </header>
          <ul className="flex flex-col max-h-96 overflow-y-auto divide-y divide-[var(--ink)]/20">
            {(data?.entries ?? []).length === 0 && (
              <li className="p-3 text-sm text-zinc-400">{labels.empty}</li>
            )}
            {(data?.entries ?? []).map((e) => {
              const isUnread = e.ts > (data?.seenAt ?? 0);
              const body = (
                <>
                  <div className="flex items-start gap-2">
                    <span aria-hidden>
                      {e.kind === "mortgage-missed" ? "⚠️" : e.kind === "tier-up" ? "🎉" : "🔔"}
                    </span>
                    <div className="flex-1">
                      <p className={"text-sm font-semibold " + (isUnread ? "" : "opacity-60")}>
                        {e.title}
                      </p>
                      <p className="text-xs text-zinc-400">{e.body}</p>
                      {e.silent && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          🌙 {labels.quietActive}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );
              if (dismissedIds.has(e.id)) return null;
              return (
                <li key={e.id} className="p-2">
                  <SwipeToDismiss
                    onDismiss={() =>
                      setDismissedIds((s) => new Set(s).add(e.id))
                    }
                  >
                    {e.href ? (
                      <Link href={e.href} onClick={() => setOpen(false)}>
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </SwipeToDismiss>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
