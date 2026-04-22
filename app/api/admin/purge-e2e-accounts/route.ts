import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { zAllMembers } from "@/lib/redis";
import { hardErase } from "@/lib/soft-delete";

/* Admin endpoint — nuke every leaked E2E test account from the global
 * leaderboard ZSET (`xp:leaderboard:global`).
 *
 * Background: until 2026-04-22 the Playwright webServer inherited the
 * production Upstash tokens from `.env.local`, so every `gp_*`, `pr_*`,
 * `rl_*`, … user spawned by the e2e suite wrote to the real ZSET. From
 * this commit forward `playwright.config.ts` blanks the Upstash env so
 * tests fall back to the in-memory store — but historical noise is
 * already persisted. This endpoint lets us one-shot clean it.
 *
 *   POST /api/admin/purge-e2e-accounts
 *   Authorization: Bearer $ADMIN_SECRET
 *   Body: { "dryRun": true }           // list candidates, erase nothing
 *   Body: { "dryRun": false }          // actually delete
 *   Body: { "prefixes": ["gp","pr"] }  // override default prefix list
 *
 * Safety:
 *  - Default prefix list is restrictive (multi-char only) to avoid
 *    catching real users whose names happen to start with "a_" / "k_".
 *    Opt into the single-letter prefixes with `includeSingleLetter`.
 *  - Deletion goes through `hardErase` (GDPR Art. 17 path), so web3
 *    medals are burned + every per-user key is wiped, not just the
 *    leaderboard entry.
 *  - `dryRun: true` is the default when the body is missing.
 */

const DEFAULT_PREFIXES = [
  "gp",
  "pr",
  "rl",
  "bot",
  "ghost",
  "smoke",
  "db",
  "di",
  "sec",
  "okuser",
  "kid",
];

// Single-letter prefixes used by e2e (k_, p_, t_, s_, a_, b_, f_, lb1_, lb2_).
// Gated behind an explicit opt-in flag because a real user could
// conceivably register as `a_something`.
const SINGLE_LETTER_PREFIXES = ["k", "p", "t", "s", "a", "b", "f"];

const BodySchema = z.object({
  dryRun: z.boolean().optional().default(true),
  prefixes: z.array(z.string().min(1).max(16)).optional(),
  includeSingleLetter: z.boolean().optional().default(false),
  // Minimum random-suffix length; e2e helpers default to 6+. Anything
  // shorter is probably a real user choosing an evocative short handle.
  minSuffixLen: z.number().int().min(4).max(32).optional().default(6),
});

const GLOBAL_KEY = "xp:leaderboard:global";

export async function POST(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json().catch(() => ({}));
    body = BodySchema.parse(raw);
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  const prefixes = new Set([
    ...(body.prefixes ?? DEFAULT_PREFIXES),
    // Always recognise the numbered `lb\d+` family (lb1_, lb2_, …) as e2e.
  ]);
  if (body.includeSingleLetter) {
    for (const p of SINGLE_LETTER_PREFIXES) prefixes.add(p);
  }

  // Escape regex-special chars in the prefix list itself — future-proof if
  // someone adds a prefix with a dot or similar.
  const escaped = [...prefixes].map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Accept `lb\d+_…` as a numbered family regardless of the prefix list;
  // it's unambiguous (real users don't start with `lb42_…`).
  const pattern = new RegExp(
    `^(?:${escaped.join("|")}|lb\\d+)_[A-Za-z0-9]{${body.minSuffixLen},}$`,
  );

  const members = await zAllMembers(GLOBAL_KEY);
  const candidates = members.filter((u) => pattern.test(u));

  if (body.dryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
      total: members.length,
      matched: candidates.length,
      candidates,
    });
  }

  const results = await Promise.allSettled(
    candidates.map(async (u) => ({
      username: u,
      keys: await hardErase(u),
    })),
  );
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .map((r, i) =>
      r.status === "rejected"
        ? { username: candidates[i], reason: String(r.reason) }
        : null,
    )
    .filter((x): x is { username: string; reason: string } => x !== null);

  return Response.json({
    ok: true,
    dryRun: false,
    total: members.length,
    matched: candidates.length,
    erased: succeeded,
    failed,
  });
}
