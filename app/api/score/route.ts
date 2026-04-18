import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { awardXP } from "@/lib/leaderboard";
import { getGame } from "@/lib/games";
import { getAiGame } from "@/lib/ai-pipeline/publish";
import { specKind, xpCapForAnyLang } from "@/lib/ai-pipeline/types";
import { recordRound } from "@/lib/user-stats";
import { levelFromXP } from "@/lib/level";
import {
  yieldForGame,
  resourceDeltaFromYield,
  capDailyYield,
  RESOURCE_KEYS,
  type ResourceKey,
} from "@/lib/resources";
import { creditResources, getPlayerState } from "@/lib/player";
import { readEconomy, dailyYieldKey, dayBucket } from "@/lib/economy";
import { kvGet, kvSet } from "@/lib/redis";
import { scoreMultiplier } from "@/lib/multipliers";
import { sweepAchievements } from "@/lib/achievements";

const BodySchema = z.object({
  gameId: z.string().min(1).max(64),
  xp: z.number().int().min(0).max(10_000),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Musisz być zalogowany." },
      { status: 401 },
    );
  }

  let parsed;
  try {
    const json = await request.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json(
      { ok: false, error: "Nieprawidłowe żądanie." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Nieprawidłowe dane wejściowe." },
      { status: 400 },
    );
  }

  const gameId = parsed.data.gameId;
  let resolvedCap: number;
  let aiKind: string | undefined;
  if (gameId.startsWith("ai-")) {
    const ai = await getAiGame(gameId);
    if (!ai) {
      return Response.json(
        { ok: false, error: "Nieznana gra." },
        { status: 404 },
      );
    }
    resolvedCap = xpCapForAnyLang(ai.spec);
    aiKind = specKind(ai.spec);
  } else {
    const game = getGame(gameId);
    if (!game) {
      return Response.json(
        { ok: false, error: "Nieznana gra." },
        { status: 404 },
      );
    }
    resolvedCap = game.xpCap;
  }

  const xp = Math.min(parsed.data.xp, resolvedCap);
  const [xpResult, recorded] = await Promise.all([
    awardXP(session.username, gameId, xp),
    recordRound(session.username, gameId, xp),
  ]);

  // Credit resources ONLY on new personal best (xpResult.delta), to honour
  // the anti-grind rule: replays that don't beat the prior best yield 0.
  // Ledger dedupe key: `score:${gameId}:${previousBest}->${newBest}` — that
  // exact transition can happen at most once per player.
  let resources = null as Awaited<ReturnType<typeof getPlayerState>>["resources"] | null;
  let capped = false;
  if (xpResult.delta > 0) {
    const y = yieldForGame(gameId, aiKind);
    if (y) {
      const state = await getPlayerState(session.username);
      // Apply score-time kind multipliers (Biblioteka/Gimnazjum/Centrum/Spodek).
      // Delta is in xp terms; multiplier scales resource yield on top.
      const mult = scoreMultiplier(state.buildings, aiKind ?? gameId);
      const rawBase = resourceDeltaFromYield(xpResult.delta, y);
      const raw: Partial<Record<ResourceKey, number>> = {};
      for (const [k, v] of Object.entries(rawBase) as [ResourceKey, number][]) {
        raw[k] = Math.ceil(v * mult);
      }
      const cfg = await readEconomy();
      const day = dayBucket();

      // Read today's already-earned totals per resource (parallel fetch).
      const earned: Partial<Record<string, number>> = {};
      await Promise.all(
        RESOURCE_KEYS.map(async (k) => {
          earned[k] = (await kvGet<number>(dailyYieldKey(session.username, k, day))) ?? 0;
        }),
      );
      const trimmed = capDailyYield(
        raw,
        earned as Partial<Record<typeof RESOURCE_KEYS[number], number>>,
        cfg.resourceCapPerKindDaily,
      );
      capped = Object.entries(raw).some(
        ([k, v]) => (trimmed[k as keyof typeof trimmed] ?? 0) < (v ?? 0),
      );

      const sourceId = `${gameId}:${xpResult.previousBest}->${xpResult.gameXP}`;
      const credit = await creditResources(
        state,
        "score",
        trimmed,
        `score ${gameId} +${xpResult.delta}${capped ? " (capped)" : ""}`,
        sourceId,
        { gameId, aiKind, xp, previousBest: xpResult.previousBest, capped },
      );
      if (credit.applied) {
        // Persist the day-earned counters so future scores in the same UTC day
        // respect the cap. TTL ~2 days to survive across UTC boundaries.
        await Promise.all(
          (Object.entries(trimmed) as [keyof typeof trimmed, number][]).map(
            async ([k, v]) => {
              if (!v || v <= 0) return;
              const next = (earned[k] ?? 0) + v;
              await kvSet(dailyYieldKey(session.username, k, day), next, {
                ex: 48 * 60 * 60,
              });
            },
          ),
        );
      }
      resources = credit.resources;
    }
  }

  const level = levelFromXP(xpResult.globalXP);
  // Fire-and-forget-ish: sweep achievements in the request scope so players
  // see the award on the next /api/me/achievements poll.
  await sweepAchievements(session.username);

  // xpResult already carries the authoritative isNewBest / delta /
  // previousBest derived from the per-game leaderboard ZSET. user-stats
  // (recordRound) only tracks play count / total score; we don't let its
  // flags override the leaderboard's truth.
  return Response.json({
    ok: true,
    awarded: xp,
    ...xpResult,
    level,
    gameStats: recorded.gameStats,
    resources,
    capped,
  });
}
