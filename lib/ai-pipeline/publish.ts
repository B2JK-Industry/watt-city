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
const ARCHIVE_INDEX_KEY = "xp:ai-games:archive-index"; // never expires — newest first
const ARCHIVE_KEY = (id: string) => `xp:ai-games:archive:${id}`;

// Slim record persisted forever so Hall of Fame can surface past winners
// after the live envelope's 48h TTL elapses.
export type ArchivedAiGame = {
  id: string;
  title: string;
  theme: string;
  model: string;
  kind: "quiz" | "scramble" | "price-guess";
  generatedAt: number;
  validUntil: number;
};

async function readIndex(): Promise<string[]> {
  return (await kvGet<string[]>(INDEX_KEY)) ?? [];
}

async function writeIndex(ids: string[]): Promise<void> {
  await kvSet(INDEX_KEY, ids);
}

async function readArchiveIndex(): Promise<string[]> {
  return (await kvGet<string[]>(ARCHIVE_INDEX_KEY)) ?? [];
}

async function appendToArchive(record: ArchivedAiGame): Promise<void> {
  await kvSet(ARCHIVE_KEY(record.id), record);
  const index = await readArchiveIndex();
  // newest first, dedupe in case of retries
  const next = [record.id, ...index.filter((id) => id !== record.id)];
  await kvSet(ARCHIVE_INDEX_KEY, next);
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

export async function listArchivedAiGames(
  limit = 20,
): Promise<ArchivedAiGame[]> {
  const ids = (await readArchiveIndex()).slice(0, limit);
  const records = await Promise.all(
    ids.map((id) => kvGet<ArchivedAiGame>(ARCHIVE_KEY(id))),
  );
  return records.filter((r): r is ArchivedAiGame => r !== null);
}

type RunResult =
  | { ok: true; game: AiGame; evicted: string | null }
  | { ok: false; error: string };

// Single orchestrated run — meant to be invoked by Vercel Cron once a day.
export async function runPipeline(now = Date.now()): Promise<RunResult> {
  // 1) Research → seed
  const seed = pickResearchSeed(now);

  // 2) Generate game spec
  const deterministicSeed = Math.floor(now / (24 * 60 * 60 * 1000));
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
    description: `${seed.theme}. AI-generated denná výzva. Top 3 hráči dostanú permanentnú medailu.`,
    theme: seed.theme,
    source: seed.source,
    buildingName: seed.buildingName,
    buildingGlyph: seed.buildingGlyph,
    buildingRoof: seed.buildingRoof,
    buildingBody: seed.buildingBody,
    spec: specParse.data,
    generatedAt: now,
    validUntil: now + 24 * 60 * 60 * 1000,
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

  // 7) Persist a permanent archive record so Hall of Fame can surface this
  // game's title/theme + top-3 medal long after the live envelope expires.
  // Leaderboard ZSET (xp:leaderboard:game:ai-<id>) already has no TTL.
  await appendToArchive({
    id,
    title: envParse.data.title,
    theme: envParse.data.theme,
    model: envParse.data.model,
    kind: envParse.data.spec.kind,
    generatedAt: envParse.data.generatedAt,
    validUntil: envParse.data.validUntil,
  });

  return { ok: true, game: envParse.data, evicted };
}
