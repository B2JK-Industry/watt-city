import { NextRequest } from "next/server";
import { kvGet, kvSet, kvDel } from "@/lib/redis";
import { runPipeline } from "@/lib/ai-pipeline/publish";
import { requireAdmin } from "@/lib/admin";
import {
  listResearchSeeds,
  pickSeedByIndex,
  pickSeedByName,
  type ResearchSeed,
} from "@/lib/ai-pipeline/research";

// Sonnet PL gen (~10–20s) + 3 × Haiku translations in parallel (~10–20s) —
// the pipeline routinely runs 25–45s, past Vercel Hobby's 10s default cap.
export const maxDuration = 60;

// Force-rotate the live AI game slot: wipe live envelopes + index, then run
// the pipeline once. Leaderboards (xp:leaderboard:game:ai-*) and archive
// (xp:ai-games:archive:*) are NOT touched — medals persist.
//
// Optional body: { theme?: string | number } — override today's theme pick.
// Pass either the theme name (from listResearchSeeds) or its pool index.
// Useful for demoing all four rotation themes without waiting 4 days.
//
// Auth: delegated to `requireAdmin` (session role=admin OR ADMIN_SECRET
// bearer). The same helper gates GET, so an anonymous GET can't enumerate
// `themes[]` — that was an information-disclosure regression caught by
// the Phase 2 API contract sweep (2026-04-21).
const INDEX_KEY = "xp:ai-games:index";

export async function POST(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;

  // Optional theme override — accept from either JSON body or `?theme=` query.
  let seedOverride: ResearchSeed | undefined;
  const urlTheme = request.nextUrl.searchParams.get("theme");
  let bodyTheme: string | number | undefined;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "theme" in body) {
      bodyTheme = (body as { theme?: string | number }).theme;
    }
  } catch {
    // no body — that's fine
  }
  const themeRaw = bodyTheme ?? urlTheme;
  if (themeRaw !== undefined && themeRaw !== null && themeRaw !== "") {
    if (typeof themeRaw === "number" || /^\d+$/.test(String(themeRaw))) {
      const seed = pickSeedByIndex(Number(themeRaw));
      if (!seed) {
        return Response.json(
          {
            ok: false,
            error: `unknown theme index ${themeRaw}`,
            available: listResearchSeeds().map((s, i) => ({ index: i, theme: s.theme })),
          },
          { status: 400 },
        );
      }
      seedOverride = seed;
    } else {
      const seed = pickSeedByName(String(themeRaw));
      if (!seed) {
        return Response.json(
          {
            ok: false,
            error: `unknown theme name ${themeRaw}`,
            available: listResearchSeeds().map((s) => s.theme),
          },
          { status: 400 },
        );
      }
      seedOverride = seed;
    }
  }

  const ids = (await kvGet<string[]>(INDEX_KEY)) ?? [];
  for (const id of ids) await kvDel(`xp:ai-games:${id}`);
  await kvSet(INDEX_KEY, []);

  const result = await runPipeline(Date.now(), seedOverride);
  if (!result.ok) {
    return Response.json(
      { ok: false, wiped: ids, error: result.error },
      { status: 500 },
    );
  }
  return Response.json({
    ok: true,
    wiped: ids,
    publishedId: result.game.id,
    theme: result.game.theme,
    model: result.game.model,
    validUntil: result.game.validUntil,
    themeOverridden: Boolean(seedOverride),
  });
}

// GET returns the current theme pool for admin tooling (the POST handler's
// `?theme=` override is easier to use when you can see the names).
// Behind `requireAdmin` — an anonymous caller sees only the 401 gate,
// never the theme list itself.
export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  return Response.json({
    ok: true,
    themes: listResearchSeeds().map((s, i) => ({
      index: i,
      theme: s.theme,
      kind: s.kind,
    })),
  });
}
