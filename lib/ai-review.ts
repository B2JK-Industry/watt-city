/* AI mission reviewer queue — audit log + decision recording.
 *
 * Implements the governance surface promised in the PKO Internal Review
 * §09 ("PKO does not have to trust our AI. PKO controls it"). Read-only
 * over the currently active AI missions: a designated reviewer can
 * Approve / Request Changes / Reject any live mission, with the decision
 * recorded in a permanent audit log.
 *
 * Current implementation is post-publish review: missions are visible
 * to players the moment they are generated, and Reject pulls them from
 * the live index. A future pre-publish gate (mission stays in a pending
 * queue until approved) is a Phase 1 (POC) implementation item — the
 * audit log and decision API designed here will continue to work
 * unchanged when the gate is added.
 */

import { kvGet, kvSet } from "@/lib/redis";
import { archiveOnExpire } from "@/lib/ai-pipeline/publish";

export type ReviewDecision = "approve" | "request-changes" | "reject";

export type ReviewRecord = {
  gameId: string;
  decision: ReviewDecision;
  reviewer: string;
  reviewerRole: "admin";
  decidedAt: number;
  reason?: string;
};

const AUDIT_KEY = "xp:ai-review:audit";
const AUDIT_MAX = 1000; // rolling window — UI shows last 30d, history kept for ~6mo at typical rate

export async function readAuditLog(): Promise<ReviewRecord[]> {
  return (await kvGet<ReviewRecord[]>(AUDIT_KEY)) ?? [];
}

async function appendAuditRecord(record: ReviewRecord): Promise<void> {
  const log = await readAuditLog();
  const next = [record, ...log].slice(0, AUDIT_MAX);
  await kvSet(AUDIT_KEY, next);
}

export type ReviewSummary = {
  total: number;
  approved: number;
  changesRequested: number;
  rejected: number;
  windowDays: number;
};

/* Summary for the audit footer. Window default 30 days. */
export async function summariseAuditLog(
  windowDays = 30,
  now = Date.now(),
): Promise<ReviewSummary> {
  const log = await readAuditLog();
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  const inWindow = log.filter((r) => r.decidedAt >= cutoff);
  return {
    total: inWindow.length,
    approved: inWindow.filter((r) => r.decision === "approve").length,
    changesRequested: inWindow.filter((r) => r.decision === "request-changes").length,
    rejected: inWindow.filter((r) => r.decision === "reject").length,
    windowDays,
  };
}

/* Last N records for the audit drawer. */
export async function recentAudit(limit = 50): Promise<ReviewRecord[]> {
  return (await readAuditLog()).slice(0, limit);
}

export type RecordDecisionInput = {
  gameId: string;
  decision: ReviewDecision;
  reviewer: string;
  reason?: string;
};

export type RecordDecisionResult =
  | { ok: true; record: ReviewRecord; sideEffect?: "archived" }
  | { ok: false; error: string };

/* Record a decision in the audit log and apply the side effect.
 *
 * Side effects:
 *  - approve         : noop in this implementation. Mission stays live.
 *  - request-changes : noop. Reason is logged. (Phase 1 will surface
 *                      a notification to the generator pipeline.)
 *  - reject          : pull the mission from the live index. Envelope
 *                      stays persisted so /games/ai/<id> still resolves
 *                      historically; it just stops being one of the
 *                      "currently active" rotation slots.
 */
export async function recordDecision(
  input: RecordDecisionInput,
  now = Date.now(),
): Promise<RecordDecisionResult> {
  if (!input.gameId.startsWith("ai-")) {
    return { ok: false, error: "invalid-game-id" };
  }
  if (
    input.decision !== "approve" &&
    input.decision !== "request-changes" &&
    input.decision !== "reject"
  ) {
    return { ok: false, error: "invalid-decision" };
  }
  if ((input.decision === "request-changes" || input.decision === "reject") && !input.reason) {
    return { ok: false, error: "reason-required" };
  }

  const record: ReviewRecord = {
    gameId: input.gameId,
    decision: input.decision,
    reviewer: input.reviewer,
    reviewerRole: "admin",
    decidedAt: now,
    reason: input.reason,
  };

  let sideEffect: "archived" | undefined;
  if (input.decision === "reject") {
    const r = await archiveOnExpire(input.gameId);
    if (r.removed) sideEffect = "archived";
  }

  await appendAuditRecord(record);

  return { ok: true, record, sideEffect };
}
