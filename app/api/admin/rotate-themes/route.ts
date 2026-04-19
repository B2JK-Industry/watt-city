import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { listResearchSeeds } from "@/lib/ai-pipeline/research";
import { zTopN, zIncrBy, kvGet, kvSet } from "@/lib/redis";

/* Phase 10.1.1 — quarterly theme refresh endpoint.
 *
 * Swap the N stalest themes for N admin-supplied new themes. "Stalest" =
 * smallest play count over the last 90 days per theme. Admin hits this
 * endpoint at the start of each quarter with the list of new themes to
 * onboard; the endpoint responds with a ranking + a disable list to
 * apply to xp:config:themes:disabled (respecting the Phase 5.1 admin
 * surface). Actual pool edits require a code commit — this endpoint is
 * a decision-support tool, not a runtime mutator of research.ts.
 */

const Body = z.object({
  newThemes: z.array(z.string().min(3).max(120)).min(1).max(10),
  retireCount: z.number().int().min(1).max(10).default(5),
});

const DISABLED_KEY = "xp:config:themes:disabled";
const REFRESH_LOG = "xp:admin:theme-refresh-log";

export async function POST(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  let body;
  try {
    body = Body.parse(await request.json());
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }

  // Rank themes by plays over the last 30 days as a staleness proxy.
  const pool = listResearchSeeds();
  const plays = await Promise.all(
    pool.map(async (s) => ({
      theme: s.theme,
      plays: Math.floor(
        (await zTopN(`xp:theme-plays:${s.theme}`, 1))[0]?.xp ?? 0,
      ),
    })),
  );
  plays.sort((a, b) => a.plays - b.plays);
  const toRetire = plays.slice(0, body.retireCount).map((p) => p.theme);

  // Append to existing disabled list (don't overwrite).
  const existingDisabled = (await kvGet<string[]>(DISABLED_KEY)) ?? [];
  const nextDisabled = Array.from(
    new Set([...existingDisabled, ...toRetire]),
  );
  await kvSet(DISABLED_KEY, nextDisabled);

  // Log the refresh event so quarterly retros can audit.
  const ts = Date.now();
  await zIncrBy(REFRESH_LOG, ts, `refresh:${ts}`);

  return Response.json({
    ok: true,
    retired: toRetire,
    newThemesAccepted: body.newThemes,
    disabledNow: nextDisabled,
    note:
      "Retired themes added to xp:config:themes:disabled. New themes must be committed to lib/ai-pipeline/research.ts in a code PR; this endpoint is advisory.",
    playsRanking: plays.slice(0, body.retireCount + 3),
  });
}

export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const pool = listResearchSeeds();
  const plays = await Promise.all(
    pool.map(async (s) => ({
      theme: s.theme,
      plays: Math.floor(
        (await zTopN(`xp:theme-plays:${s.theme}`, 1))[0]?.xp ?? 0,
      ),
    })),
  );
  plays.sort((a, b) => b.plays - a.plays);
  return Response.json({ ok: true, plays });
}
