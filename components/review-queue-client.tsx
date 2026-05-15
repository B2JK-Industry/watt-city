"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QueueItem = {
  id: string;
  title: string;
  kind: string;
  theme: string;
  model: string;
  generatedAt: number;
  validUntil: number;
  rotationSlot: string;
};

type Props = {
  queue: QueueItem[];
};

type DecisionState =
  | { kind: "idle" }
  | { kind: "busy"; gameId: string }
  | { kind: "error"; gameId: string; message: string };

/* Reviewer queue client surface — Internal Review §09.
 *
 * Three actions per mission:
 *  - Approve         : audit-only; mission stays live.
 *  - Request changes : audit-only + reason prompt.
 *  - Reject          : pulls from live index immediately + reason prompt.
 *
 * CSRF token is sent via `x-csrf-token` from the cookie set by
 * CsrfBootstrap on every authenticated render.
 */
export function ReviewQueueClient({ queue }: Props) {
  const router = useRouter();
  const [state, setState] = useState<DecisionState>({ kind: "idle" });

  async function submit(
    gameId: string,
    decision: "approve" | "request-changes" | "reject",
  ) {
    let reason: string | undefined;
    if (decision !== "approve") {
      const prompted = window.prompt(
        decision === "reject"
          ? "Reason for rejecting this mission:"
          : "What needs to change?",
      );
      if (prompted === null) return; // user cancelled
      reason = prompted.trim();
      if (!reason) {
        setState({ kind: "error", gameId, message: "Reason cannot be empty." });
        return;
      }
    }
    setState({ kind: "busy", gameId });
    try {
      const res = await fetch(`/api/admin/review/${gameId}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      // refresh server-rendered queue + summary
      router.refresh();
      setState({ kind: "idle" });
    } catch (e) {
      setState({
        kind: "error",
        gameId,
        message: (e as Error).message,
      });
    }
  }

  if (queue.length === 0) {
    return (
      <div className="card p-6 text-sm text-[var(--ink-muted)]">
        Nie ma misji v kolejke. Kolejne misje pojawią się po następnej
        rotacji.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {queue.map((item) => {
        const busy = state.kind === "busy" && state.gameId === item.id;
        const err =
          state.kind === "error" && state.gameId === item.id
            ? state.message
            : null;
        return (
          <li
            key={item.id}
            className="card p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="chip uppercase text-xs">{item.kind}</span>
                <h3 className="text-base font-semibold truncate">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 font-mono">
                {item.id} · model {item.model} ·{" "}
                {new Date(item.generatedAt).toLocaleString("pl-PL", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                theme: {item.theme}
              </p>
              {err && (
                <p className="text-xs text-red-700 mt-1" role="alert">
                  {err}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => submit(item.id, "approve")}
                disabled={busy}
                className="btn"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => submit(item.id, "request-changes")}
                disabled={busy}
                className="btn-secondary"
              >
                Changes
              </button>
              <button
                type="button"
                onClick={() => submit(item.id, "reject")}
                disabled={busy}
                className="btn-ghost text-red-700"
              >
                Reject
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
