import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getRole } from "@/lib/roles";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { specKind } from "@/lib/ai-pipeline/types";
import { summariseAuditLog, recentAudit } from "@/lib/ai-review";
import { ReviewQueueClient } from "@/components/review-queue-client";

export const dynamic = "force-dynamic";

/* /admin/review — AI mission reviewer queue.
 *
 * Operator UI for the governance surface shown in Internal Review §09
 * ("PKO does not have to trust our AI. PKO controls it"). Lists every
 * currently live AI mission and lets the reviewer record an Approve /
 * Changes / Reject decision. Reject pulls the mission from the live
 * index immediately. Every decision is recorded in a permanent audit
 * trail.
 *
 * Role gating: `role === "admin"` (session). Bearer-token clients use
 * `/api/admin/review` directly.
 */
export default async function ReviewQueuePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = await getRole(session.username);
  if (role !== "admin") {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Reviewer queue</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Nie masz roli admin. Jeśli jesteś operatorem,{" "}
          <Link href="/admin" className="underline">
            wróć na pulpit
          </Link>
          .
        </p>
      </div>
    );
  }

  const [games, summary, audit] = await Promise.all([
    listActiveAiGames(),
    summariseAuditLog(30),
    recentAudit(8),
  ]);

  const queue = games
    .map((g) => ({
      id: g.id,
      title: g.title,
      kind: specKind(g.spec),
      theme: g.theme,
      model: g.model,
      generatedAt: g.generatedAt,
      validUntil: g.validUntil,
      rotationSlot: g.rotationSlot ?? "fast",
    }))
    .sort((a, b) => b.generatedAt - a.generatedAt);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)] uppercase tracking-wide">
          <Link href="/admin" className="underline">
            Admin
          </Link>
          <span>·</span>
          <span>Reviewer queue</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="section-heading text-3xl">
            Approval queue · {queue.length} pending
          </h1>
          <span className="text-sm text-[var(--ink-muted)]">
            refreshed {new Date().toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl mt-1">
          Internal Review §09 — every AI-generated mission can be approved,
          asked to be changed, or rejected. Reject pulls the mission from the
          live index immediately. Every decision is captured in the audit
          trail.
        </p>
      </header>

      <section>
        <ReviewQueueClient queue={queue} />
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          Audit · last {summary.windowDays}d
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <strong>{summary.approved}</strong> approved
          </span>
          <span>
            <strong>{summary.changesRequested}</strong> changes-requested
          </span>
          <span>
            <strong>{summary.rejected}</strong> rejected
          </span>
          <span className="text-[var(--ink-muted)]">
            · total {summary.total}
          </span>
        </div>
        {audit.length > 0 && (
          <details>
            <summary className="text-xs text-[var(--ink-muted)] cursor-pointer">
              Recent decisions
            </summary>
            <ul className="mt-2 text-xs font-mono flex flex-col gap-1">
              {audit.map((r) => (
                <li
                  key={`${r.gameId}-${r.decidedAt}`}
                  className="flex flex-wrap gap-2"
                >
                  <span className="text-[var(--ink-muted)]">
                    {new Date(r.decidedAt).toLocaleString("pl-PL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span>{r.gameId}</span>
                  <span
                    className={
                      r.decision === "reject"
                        ? "text-red-700"
                        : r.decision === "request-changes"
                          ? "text-orange-700"
                          : "text-emerald-700"
                    }
                  >
                    {r.decision}
                  </span>
                  <span className="text-[var(--ink-muted)]">
                    by {r.reviewer}
                  </span>
                  {r.reason && (
                    <span className="text-[var(--ink-muted)] truncate">
                      — {r.reason}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
