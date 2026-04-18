import { NextRequest } from "next/server";
import { kvGet, kvSet, kvDel } from "@/lib/redis";
import { runPipeline } from "@/lib/ai-pipeline/publish";
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
// Auth: if ADMIN_SECRET is set, requires matching Bearer token. Otherwise
// accepts any caller (dev / small-team hackathon ergonomics).
const INDEX_KEY = "xp:ai-games:index";

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  if (expected) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token !== expected) {
      return Response.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }

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

export async function GET() {
  return Response.json(
    {
      ok: false,
      error: "use POST",
      themes: listResearchSeeds().map((s, i) => ({
        index: i,
        theme: s.theme,
        kind: s.kind,
      })),
    },
    { status: 405 },
  );
}
