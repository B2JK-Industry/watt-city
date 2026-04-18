import { kvGet, kvSet, kvDel, kvSetNX } from "@/lib/redis";
import {
  AiGameSchema,
  LocalizedSpecSchema,
  MAX_ACTIVE_AI_GAMES,
  ROTATION_HOURS,
  specKind,
  type AiGame,
} from "./types";
import { pickResearchSeed, type ResearchSeed } from "./research";
import { generateGameSpec } from "./generate";

const INDEX_KEY = "xp:ai-games:index"; // JSON array of active AI game ids, oldest first
const ARCHIVE_INDEX_KEY = "xp:ai-games:archive-index"; // never expires — newest first
const ARCHIVE_KEY = (id: string) => `xp:ai-games:archive:${id}`;
const ROTATION_LOCK_KEY = "xp:rotation-lock"; // single-flight guard for rotate-if-due
const LAST_ROTATION_BUCKET_KEY = "xp:ai-games:last-rotation-bucket"; // last hour-bucket a publish ran

// Slim record persisted forever so Hall of Fame can surface past winners
// after the live envelope's 48h TTL elapses.
export type ArchivedAiGame = {
  id: string;
  title: string;
  theme: string;
  model: string;
  kind: import("./types").SpecKind;
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

// "Should the lazy path fire a rotation now?" — cheap (1 KV read for the
// bucket sentinel + the already-loaded game list). No locking, no writes.
// Callers use this to decide whether to await `rotateIfDue()` inline.
export async function rotationIsDue(
  games: AiGame[],
  now = Date.now(),
): Promise<boolean> {
  const currentBucket = Math.floor(now / (ROTATION_HOURS * 60 * 60 * 1000));
  const lastBucket = (await kvGet<number>(LAST_ROTATION_BUCKET_KEY)) ?? -1;
  if (lastBucket === currentBucket) return false; // already rotated this hour
  // Only rotate on-path if the live list is empty OR every game is already
  // past its expiry. A partial refresh (some live, some expired) waits for
  // the next cron/pinger to avoid stalling renders on a fresh game.
  if (games.length === 0) return true;
  return games.every((g) => g.validUntil <= now);
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
// Pass `seedOverride` (from admin endpoints) to force a specific theme
// instead of today's calendar-deterministic pick.
export async function runPipeline(
  now = Date.now(),
  seedOverride?: ResearchSeed,
): Promise<RunResult> {
  // 1) Research → seed
  const seed = seedOverride ?? pickResearchSeed(now);

  // 2) Generate game spec.
  // Hourly rotation (Watt City): seed is the hour-bucket so two publishes in the
  // same hour feed Claude the same deterministicSeed (harmless — it's only used
  // by the generator to seed its per-call temperature jitter).
  const deterministicSeed = Math.floor(now / (ROTATION_HOURS * 60 * 60 * 1000));
  let generated;
  try {
    generated = await generateGameSpec({ seed, deterministicSeed });
  } catch (e) {
    return { ok: false, error: `generate: ${(e as Error).message}` };
  }

  // 3) Validate strictly (localized: pl/uk/cs/en all present)
  const specParse = LocalizedSpecSchema.safeParse(generated.spec);
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
    description: `${seed.theme}. AI-generowane wyzwanie co godzinę. Top 3 graczy dostanie permanentny medal.`,
    theme: seed.theme,
    source: seed.source,
    buildingName: seed.buildingName,
    buildingGlyph: seed.buildingGlyph,
    buildingRoof: seed.buildingRoof,
    buildingBody: seed.buildingBody,
    spec: specParse.data,
    generatedAt: now,
    validUntil: now + ROTATION_HOURS * 60 * 60 * 1000,
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

  // 6) Persist forever (no TTL) and cap the LIVE index at MAX_ACTIVE_AI_GAMES.
  // Evicted games stay in Redis and remain playable via /games/ai/[id] — their
  // leaderboard ZSET is already permanent, so users can still score on old AI
  // games and earn medals that stick. The live index only controls which game
  // the city scene / "LIVE" card surface.
  await kvSet(`xp:ai-games:${id}`, envParse.data);
  const nextIndex = [...index, id];
  let evicted: string | null = null;
  while (nextIndex.length > MAX_ACTIVE_AI_GAMES) {
    const oldest = nextIndex.shift();
    if (!oldest) break;
    evicted = oldest; // envelope NOT deleted — game stays playable
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
    kind: specKind(envParse.data.spec),
    generatedAt: envParse.data.generatedAt,
    validUntil: envParse.data.validUntil,
  });

  return { ok: true, game: envParse.data, evicted };
}

/* ==========================================================================
 * archiveOnExpire + rotateIfDue
 * ==========================================================================
 * Separated from runPipeline so the rotation loop can prune the live index
 * without having to generate a new game (cheap heartbeat call) and so admins
 * can force-archive without re-running the Claude pipeline.
 * ========================================================================== */

// Remove `id` from the live index. The envelope + archive record stay — past
// games remain playable at /games/ai/<id> and their leaderboard ZSET persists.
// Idempotent: if `id` is not in the index, this is a no-op.
export async function archiveOnExpire(id: string): Promise<{ removed: boolean }> {
  const index = await readIndex();
  if (!index.includes(id)) return { removed: false };
  const next = index.filter((x) => x !== id);
  await writeIndex(next);
  // Ensure an archive record exists (runPipeline writes one on publish, but
  // older legacy envelopes predating that write may be missing it).
  const existingArchive = await kvGet<ArchivedAiGame>(ARCHIVE_KEY(id));
  if (!existingArchive) {
    const envelope = await kvGet<AiGame>(`xp:ai-games:${id}`);
    if (envelope) {
      await appendToArchive({
        id,
        title: envelope.title,
        theme: envelope.theme,
        model: envelope.model,
        kind: specKind(envelope.spec),
        generatedAt: envelope.generatedAt,
        validUntil: envelope.validUntil,
      });
    }
  }
  return { removed: true };
}

export type RotateIfDueResult =
  | {
      ok: true;
      rotated: string[]; // ids archived off the live index
      published: string | null; // id of newly published game (null if none)
      theme?: string;
      skipped: boolean; // true when we held the lock but decided not to publish
      reason?: string;
    }
  | { ok: false; error: string; contended?: boolean };

// Idempotent rotation: intended to be poked by Vercel Cron or an external pinger
// every ~5 minutes. Guarded by a single-flight Redis lock (60s TTL) and a
// per-hour-bucket sentinel so concurrent calls collapse to one publish.
//
//  1. Try SET NX EX 60 on `xp:rotation-lock` — contended → return {skipped:true}
//  2. Walk the live index, archive anything past validUntil
//  3. If the current hour bucket already rotated, skip publish
//  4. Otherwise call runPipeline() and record the hour bucket on success
//  5. Release lock in `finally`
export async function rotateIfDue(
  now = Date.now(),
): Promise<RotateIfDueResult> {
  const lockValue = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const acquired = await kvSetNX(ROTATION_LOCK_KEY, lockValue, { ex: 60 });
  if (!acquired) {
    return { ok: false, error: "lock-contended", contended: true };
  }
  try {
    // Prune expired games from the live index
    const index = await readIndex();
    const rotated: string[] = [];
    for (const id of index) {
      const envelope = await kvGet<AiGame>(`xp:ai-games:${id}`);
      if (!envelope) {
        // orphaned id in index; drop it
        rotated.push(id);
        continue;
      }
      if (envelope.validUntil <= now) {
        await archiveOnExpire(id);
        rotated.push(id);
      }
    }

    // Skip publish if this hour bucket already rotated (idempotent across the hour)
    const currentBucket = Math.floor(now / (ROTATION_HOURS * 60 * 60 * 1000));
    const lastBucket = (await kvGet<number>(LAST_ROTATION_BUCKET_KEY)) ?? -1;
    if (lastBucket === currentBucket) {
      return {
        ok: true,
        rotated,
        published: null,
        skipped: true,
        reason: "already-rotated-this-hour",
      };
    }

    const result = await runPipeline(now);
    if (!result.ok) {
      // "portfolio: theme already live" is a benign collision — this hour's
      // theme pick matched an existing LIVE game (can happen if the index
      // wasn't fully pruned). Treat as a soft skip rather than an error.
      if (result.error.startsWith("portfolio:")) {
        return {
          ok: true,
          rotated,
          published: null,
          skipped: true,
          reason: result.error,
        };
      }
      return { ok: false, error: result.error };
    }
    await kvSet(LAST_ROTATION_BUCKET_KEY, currentBucket);
    return {
      ok: true,
      rotated,
      published: result.game.id,
      theme: result.game.theme,
      skipped: false,
    };
  } finally {
    // Only release the lock if we still hold it (defensive; a 60s TTL expiry
    // could let another caller take over mid-flight).
    const current = await kvGet<string>(ROTATION_LOCK_KEY);
    if (current === lockValue) {
      await kvDel(ROTATION_LOCK_KEY);
    }
  }
}
