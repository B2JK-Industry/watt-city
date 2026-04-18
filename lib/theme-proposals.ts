/* Community theme proposals — Phase 5.5.1 + 5.5.2.
 *
 * Players can suggest a theme; other players upvote. Admins read the top-
 * voted queue on /admin/themes and decide which to promote into the
 * static research pool (a manual code commit for now — no runtime
 * mutation of the production pool, too risky).
 *
 * Storage:
 *   xp:theme-proposals                 = JSON array of { id, text, author, ts, voteCount }
 *   xp:theme-proposals:votes:<id>      = SET of usernames who voted
 *   xp:theme-proposals:ip-throttle     = set of IPs that already proposed today (Phase 6 anti-abuse)
 */

import { kvGet, kvSet, sAdd, sHas } from "@/lib/redis";

export type Proposal = {
  id: string;
  text: string;
  author: string;
  ts: number;
  voteCount: number;
};

const LIST_KEY = "xp:theme-proposals";
const VOTES_KEY = (id: string) => `xp:theme-proposals:votes:${id}`;

export async function listProposals(n = 50): Promise<Proposal[]> {
  const all = (await kvGet<Proposal[]>(LIST_KEY)) ?? [];
  return all
    .slice()
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, n);
}

export async function submitProposal(
  author: string,
  text: string,
): Promise<{ ok: boolean; error?: string; proposal?: Proposal }> {
  const t = text.trim();
  if (t.length < 8) return { ok: false, error: "too-short" };
  if (t.length > 100) return { ok: false, error: "too-long" };
  // Very basic duplicate check
  const all = (await kvGet<Proposal[]>(LIST_KEY)) ?? [];
  const dup = all.find(
    (p) => p.text.toLowerCase() === t.toLowerCase(),
  );
  if (dup) return { ok: false, error: "duplicate" };
  const proposal: Proposal = {
    id: `th-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    text: t,
    author,
    ts: Date.now(),
    voteCount: 1, // author's own vote counts
  };
  await sAdd(VOTES_KEY(proposal.id), author);
  await kvSet(LIST_KEY, [proposal, ...all].slice(0, 500));
  return { ok: true, proposal };
}

export async function votePro(
  voter: string,
  proposalId: string,
): Promise<{ ok: boolean; error?: string; voteCount?: number }> {
  const already = await sHas(VOTES_KEY(proposalId), voter);
  if (already) return { ok: false, error: "already-voted" };
  const added = await sAdd(VOTES_KEY(proposalId), voter);
  if (!added) return { ok: false, error: "already-voted" };
  const all = (await kvGet<Proposal[]>(LIST_KEY)) ?? [];
  const idx = all.findIndex((p) => p.id === proposalId);
  if (idx < 0) return { ok: false, error: "unknown-proposal" };
  all[idx] = { ...all[idx], voteCount: all[idx].voteCount + 1 };
  await kvSet(LIST_KEY, all);
  return { ok: true, voteCount: all[idx].voteCount };
}
