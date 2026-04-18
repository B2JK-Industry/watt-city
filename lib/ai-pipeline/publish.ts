import { kvGet, kvSet, kvDel } from "@/lib/redis";
import {
  AiGameSchema,
  GameSpecSchema,
  MAX_ACTIVE_AI_GAMES,
  AI_GAME_TTL_SECONDS,
  type AiGame,
} from "./types";
import { pickResearchSeed } from "./research";
import { generateGameSpec } from "./generate";

const INDEX_KEY = "xp:ai-games:index"; // JSON array of active AI game ids, oldest first

async function readIndex(): Promise<string[]> {
  return (await kvGet<string[]>(INDEX_KEY)) ?? [];
}

async function writeIndex(ids: string[]): Promise<void> {
  await kvSet(INDEX_KEY, ids);
}

export async function listActiveAiGames(): Promise<AiGame[]> {
  const ids = await readIndex();
  const games = await Promise.all(
    ids.map((id) => kvGet<AiGame>(`xp:ai-games:${id}`)),
  );
  return games.filter((g): g is AiGame => g !== null);
}

export async function getAiGame(id: string): Promise<AiGame | null> {
  return await kvGet<AiGame>(`xp:ai-games:${id}`);
}

type RunResult =
  | { ok: true; game: AiGame; evicted: string | null }
  | { ok: false; error: string };

// Single orchestrated run — meant to be invoked by Vercel Cron every 6h.
export async function runPipeline(now = Date.now()): Promise<RunResult> {
  // 1) Research → seed
  const seed = pickResearchSeed(now);

  // 2) Generate game spec
  const deterministicSeed = Math.floor(now / (6 * 60 * 60 * 1000));
  let generated;
  try {
    generated = await generateGameSpec({ seed, deterministicSeed });
  } catch (e) {
    return { ok: false, error: `generate: ${(e as Error).message}` };
  }

  // 3) Validate strictly
  const specParse = GameSpecSchema.safeParse(generated.spec);
  if (!specParse.success) {
    return {
      ok: false,
      error: `spec-validation: ${specParse.error.message}`,
    };
  }

  // 4) Portfolio diversity — reject if same theme is already live
  const index = await readIndex();
  for (const id of index) {
    const existing = await kvGet<AiGame>(`xp:ai-games:${id}`);
    if (existing && existing.theme === seed.theme) {
      return { ok: false, error: `portfolio: theme already live (${seed.theme})` };
    }
  }

  // 5) Shape envelope + validate envelope too
  const id = `ai-${Math.floor(now / 1000).toString(36)}`;
  const game: AiGame = {
    id,
    title: seed.theme.split(" — ")[0],
    tagline: seed.notes.slice(0, 120),
    description: `${seed.theme}. AI-generated 6-hour challenge. Top 3 hráči dostanú permanentnú medailu.`,
    theme: seed.theme,
    source: seed.source,
    buildingName: seed.buildingName,
    buildingGlyph: seed.buildingGlyph,
    buildingRoof: seed.buildingRoof,
    buildingBody: seed.buildingBody,
    spec: specParse.data,
    generatedAt: now,
    validUntil: now + 6 * 60 * 60 * 1000,
    model: generated.model,
    seed: deterministicSeed,
  };
  const envParse = AiGameSchema.safeParse(game);
  if (!envParse.success) {
    return {
      ok: false,
      error: `envelope-validation: ${envParse.error.message}`,
    };
  }

  // 6) Persist with TTL; update index, evict oldest if over cap
  await kvSet(`xp:ai-games:${id}`, envParse.data, {
    ex: AI_GAME_TTL_SECONDS,
  });
  const nextIndex = [...index, id];
  let evicted: string | null = null;
  while (nextIndex.length > MAX_ACTIVE_AI_GAMES) {
    const oldest = nextIndex.shift();
    if (!oldest) break;
    await kvDel(`xp:ai-games:${oldest}`);
    evicted = oldest;
  }
  await writeIndex(nextIndex);

  return { ok: true, game: envParse.data, evicted };
}
