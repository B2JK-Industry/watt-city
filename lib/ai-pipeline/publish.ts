import { kvGet, kvSet, kvDel, kvSetNX } from "@/lib/redis";
import {
  AiGameSchema,
  LocalizedSpecSchema,
  MAX_ACTIVE_AI_GAMES,
  SLOT_INTERVAL_HOURS,
  ALL_SLOTS,
  resolveSlot,
  specKind,
  type AiGame,
  type RotationSlot,
} from "./types";
import { pickResearchSeed, type ResearchSeed } from "./research";
import { generateGameSpec } from "./generate";
import { moderateSpec, contentHash } from "./moderation";

// Single union index of live AI game ids across all slots (unchanged key so
// legacy envelopes already indexed here continue to render without migration).
// Slot affinity lives inside each envelope (`rotationSlot`) — the index itself
// stays slot-agnostic so `listActiveAiGames()` remains a single KV read.
const INDEX_KEY = "xp:ai-games:index";
const ARCHIVE_INDEX_KEY = "xp:ai-games:archive-index"; // never expires — newest first
const ARCHIVE_KEY = (id: string) => `xp:ai-games:archive:${id}`;

// Per-slot rotation lock — three independent single-flight guards so one slot
// rotating doesn't block another. Legacy "xp:rotation-lock" corresponds to the
// "fast" slot key below by string equality, so a lingering pre-deploy lock
// still collapses into the fast-slot lane.
const ROTATION_LOCK_KEY = (slot: RotationSlot): string =>
  slot === "fast" ? "xp:rotation-lock" : `xp:rotation-lock:${slot}`;

// Per-slot "last published bucket" sentinel. Bucket math is in the slot's own
// interval — so a 6h medium-slot bucket advances 4x/day, a 12h slow bucket 2x.
// Legacy key for fast preserves the pre-3-slot write so a hot deploy won't
// re-publish on top of a game that was just generated.
const LAST_ROTATION_BUCKET_KEY = (slot: RotationSlot): string =>
  slot === "fast"
    ? "xp:ai-games:last-rotation-bucket"
    : `xp:ai-games:last-rotation-bucket:${slot}`;

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

// Which envelope (if any) is currently live in the given slot. Uses the union
// index + `rotationSlot` field; legacy envelopes without that field are
// treated as "fast" by `resolveSlot`. Returns the *latest* live envelope for
// the slot if duplicates ever leak in (defensive — runPipeline guards against
// this via the bucket sentinel, but a botched admin force-rotate could create
// one).
export async function liveGameForSlot(
  slot: RotationSlot,
  now = Date.now(),
): Promise<AiGame | null> {
  const games = await listActiveAiGames();
  const matches = games.filter(
    (g) => resolveSlot(g.rotationSlot) === slot && g.validUntil > now,
  );
  if (matches.length === 0) return null;
  // Newest generatedAt wins if ever duplicated
  matches.sort((a, b) => b.generatedAt - a.generatedAt);
  return matches[0];
}

// "Should the lazy path fire a rotation now?" — cheap (per-slot bucket reads
// plus the already-loaded game list). No locking, no writes. Returns true if
// ANY slot looks due. Callers use this to decide whether to await
// `rotateIfDue()` inline.
export async function rotationIsDue(
  games: AiGame[],
  now = Date.now(),
): Promise<boolean> {
  for (const slot of ALL_SLOTS) {
    if (await slotIsDue(slot, games, now)) return true;
  }
  return false;
}

async function slotIsDue(
  slot: RotationSlot,
  games: AiGame[],
  now: number,
): Promise<boolean> {
  const slotHours = SLOT_INTERVAL_HOURS[slot];
  const windowMs = slotHours * 60 * 60 * 1000;
  const currentBucket = Math.floor(now / windowMs);
  const lastBucket = (await kvGet<number>(LAST_ROTATION_BUCKET_KEY(slot))) ?? -1;
  // For each slot: rotate when no live envelope exists for it, or the one
  // there has expired, or we've rolled into a new bucket and haven't published
  // yet. The bucket check mirrors the single-slot version pre-3-slot.
  const slotGames = games.filter((g) => resolveSlot(g.rotationSlot) === slot);
  const hasLive = slotGames.some((g) => g.validUntil > now);
  if (!hasLive) return true;
  if (lastBucket === currentBucket) return false;
  // New bucket, something still live — only eager-rotate if every game in this
  // slot is already past expiry. Matches pre-3-slot "partial refresh waits"
  // behaviour to avoid stalling renders on a fresh game.
  return slotGames.every((g) => g.validUntil <= now);
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

// Single orchestrated run — meant to be invoked by `rotateIfDue` per slot, or
// manually from the admin force-rotate endpoint. Pass `seedOverride` (from
// admin endpoints) to force a specific theme instead of the calendar-
// deterministic pick. `slot` selects which interval the validUntil uses and
// which `rotationSlot` the envelope is stamped with (default "fast" preserves
// pre-3-slot semantics).
export async function runPipeline(
  now = Date.now(),
  seedOverride?: ResearchSeed,
  slot: RotationSlot = "fast",
): Promise<RunResult> {
  // 1) Research → seed. Per-slot offset ensures parallel rotation picks
  // distinct themes — the portfolio-diversity check would otherwise reject 2
  // of 3 slots every time they rotate in the same tick. Offsets chosen to
  // spread residues mod(ROTATION_POOL.length = 40): fast 0, medium 7, slow 13.
  const slotOffset = slot === "fast" ? 0 : slot === "medium" ? 7 : 13;
  const seed = seedOverride ?? pickResearchSeed(now, slotOffset);

  // 2) Generate game spec.
  // Per-slot rotation: seed is this slot's bucket so two publishes in the
  // same slot-bucket feed Claude the same deterministicSeed (harmless — it's
  // only used by the generator to seed its per-call temperature jitter).
  // Including the slot in the bucket value keeps generator seeds distinct
  // across slots even when their bucket numbers happen to coincide.
  const slotHours = SLOT_INTERVAL_HOURS[slot];
  const slotSalt = slot === "fast" ? 0 : slot === "medium" ? 1 : 2;
  const deterministicSeed =
    Math.floor(now / (slotHours * 60 * 60 * 1000)) * 10 + slotSalt;
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

  // 3b) Content moderation — reject on any denylist hit. We'd rather drop a
  // rotation and let the next hour try again than publish something a
  // parent will flag.
  const findings = moderateSpec(specParse.data);
  if (findings.length > 0) {
    console.log(
      JSON.stringify({
        event: "moderation.rejected",
        theme: seed.theme,
        findings: findings.slice(0, 3),
      }),
    );
    return {
      ok: false,
      error: `moderation: ${findings[0].category} in ${findings[0].field}`,
    };
  }

  // 4) Portfolio diversity — reject if same theme is already live in ANY slot.
  // Rationale: with 3 simultaneous games on screen, thematic overlap is more
  // noticeable than with a single rotation, so we keep the across-slot
  // distinctness guarantee. A benign collision from a narrow seed pool is
  // treated as a soft skip by the caller (rotateIfDue maps "portfolio:" to
  // `skipped: true`), which means the slot just waits for its next bucket.
  const index = await readIndex();
  for (const id of index) {
    const existing = await kvGet<AiGame>(`xp:ai-games:${id}`);
    if (existing && existing.theme === seed.theme) {
      return { ok: false, error: `portfolio: theme already live (${seed.theme})` };
    }
  }

  // 5) Shape envelope + validate envelope too
  const id = `ai-${Math.floor(now / 1000).toString(36)}${slot === "fast" ? "" : slot[0]}`;
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
    validUntil: now + slotHours * 60 * 60 * 1000,
    model: generated.model,
    seed: deterministicSeed,
    contentHash: contentHash(specParse.data),
    rotationSlot: slot,
  };
  const envParse = AiGameSchema.safeParse(game);
  if (!envParse.success) {
    return {
      ok: false,
      error: `envelope-validation: ${envParse.error.message}`,
    };
  }

  // 6) Persist forever (no TTL) and evict any PRIOR entry for THIS slot from
  // the live index. Per-slot eviction (not "oldest in index") is load-bearing
  // for the 3-slot design: the old global "shift oldest until cap=3" rule
  // would evict a still-fresh medium/slow game the moment a fast-slot
  // publish pushed the index past 3, breaking the invariant of "1 live per
  // slot". Envelopes NOT deleted — they stay playable at /games/ai/[id] and
  // their leaderboard ZSET is permanent; only the live index reference
  // drops.
  await kvSet(`xp:ai-games:${id}`, envParse.data);
  const evictedIds: string[] = [];
  const filteredIndex: string[] = [];
  for (const existingId of index) {
    if (existingId === id) continue; // just-written, will re-append below
    const env = await kvGet<AiGame>(`xp:ai-games:${existingId}`);
    if (!env) {
      // Orphaned index entry (envelope already purged). Drop it silently.
      continue;
    }
    if (resolveSlot(env.rotationSlot) === slot) {
      // Prior entry for this slot — evict from live index.
      evictedIds.push(existingId);
      continue;
    }
    filteredIndex.push(existingId);
  }
  const nextIndex = [...filteredIndex, id];
  const evicted = evictedIds[0] ?? null;
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

export type SlotRotateResult =
  | {
      ok: true;
      slot: RotationSlot;
      rotated: string[]; // ids archived off the live index in this slot
      published: string | null; // id of newly published game (null if none)
      theme?: string;
      skipped: boolean; // true when we held the lock but decided not to publish
      reason?: string;
    }
  | { ok: false; slot: RotationSlot; error: string; contended?: boolean };

export type RotateIfDueResult =
  | {
      ok: true;
      // Aggregate flattened view (union across slots) — preserves the
      // pre-3-slot consumer contract: callers that only inspect these fields
      // see behaviour equivalent to legacy rotate-if-due.
      rotated: string[];
      published: string | null; // newest published id across slots
      theme?: string;
      skipped: boolean; // true iff every slot skipped/was idempotent
      reason?: string;
      // Per-slot breakdown for new consumers (cron telemetry, admin UIs).
      slots: Record<RotationSlot, SlotRotateResult>;
    }
  | { ok: false; error: string; contended?: boolean; slots?: Record<RotationSlot, SlotRotateResult> };

// Idempotent rotation: intended to be poked by Vercel Cron or an external
// pinger every ~5 minutes. When called without `slot`, iterates across all
// 3 slots (fast/medium/slow), each guarded by its own single-flight Redis
// lock (60s TTL) and per-slot bucket sentinel.
//
// Per-slot flow:
//  1. Try SET NX EX 60 on `xp:rotation-lock[:slot]` — contended → skip this slot
//  2. Walk the live index, archive anything past validUntil belonging to this slot
//  3. If the current slot bucket already rotated, skip publish
//  4. Otherwise call runPipeline(now, undefined, slot) and record the bucket on success
//  5. Release lock in `finally`
export async function rotateIfDue(
  now?: number,
  slot?: RotationSlot,
): Promise<RotateIfDueResult>;
export async function rotateIfDue(
  now = Date.now(),
  slot?: RotationSlot,
): Promise<RotateIfDueResult> {
  if (slot) {
    const single = await rotateSingleSlot(now, slot);
    return aggregateResults({ [slot]: single } as Record<RotationSlot, SlotRotateResult>);
  }
  // Run slots sequentially. Each slot has its own lock so concurrent external
  // callers still collapse safely — sequential here avoids a read-modify-write
  // race on the SINGLE `xp:ai-games:index` key: two parallel `runPipeline`s
  // would both load index=[], append their id to a local copy, and the last
  // writer would erase the other's entry. Sequential is cheap (each slot's
  // lock + publish is already the critical path) and keeps the union index
  // consistent without introducing a second global mutex.
  const slots: Partial<Record<RotationSlot, SlotRotateResult>> = {};
  for (const s of ALL_SLOTS) {
    slots[s] = await rotateSingleSlot(now, s);
  }
  return aggregateResults(slots as Record<RotationSlot, SlotRotateResult>);
}

function aggregateResults(
  slots: Record<RotationSlot, SlotRotateResult>,
): RotateIfDueResult {
  const present = ALL_SLOTS.filter((s) => slots[s]);
  // If no slot returned a structured result we treat the whole thing as
  // an error — unreachable in normal flow but keeps the types tight.
  if (present.length === 0) {
    return { ok: false, error: "no-slots", slots };
  }

  // Partial success is fine: if at least one slot returned ok, the aggregate
  // reports ok=true and surfaces its data. Slots that errored are discoverable
  // via `slots[...]`. Contention on EVERY slot collapses to `contended: true`.
  const oks = present.filter((s) => slots[s].ok);
  if (oks.length === 0) {
    const allContended = present.every(
      (s) => !slots[s].ok && (slots[s] as { contended?: boolean }).contended === true,
    );
    // Surface the first error so legacy callers' error-field parsing keeps working.
    const firstErr = present[0];
    const errResult = slots[firstErr] as { error: string; contended?: boolean };
    return {
      ok: false,
      error: errResult.error,
      contended: allContended ? true : errResult.contended,
      slots,
    };
  }

  const rotated: string[] = [];
  let published: string | null = null;
  let theme: string | undefined;
  let anyPublished = false;
  const reasons: string[] = [];
  for (const s of present) {
    const r = slots[s];
    if (!r.ok) continue;
    rotated.push(...r.rotated);
    if (r.published) {
      anyPublished = true;
      // Preserve legacy "newest published wins" semantics: the fast slot is
      // the most likely publisher each hour, so prefer it when multiple slots
      // publish in the same tick.
      if (s === "fast" || !published) {
        published = r.published;
        theme = r.theme;
      }
    }
    if (r.reason) reasons.push(`${s}:${r.reason}`);
  }

  return {
    ok: true,
    rotated,
    published,
    theme,
    skipped: !anyPublished,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
    slots,
  };
}

async function rotateSingleSlot(
  now: number,
  slot: RotationSlot,
): Promise<SlotRotateResult> {
  const lockKey = ROTATION_LOCK_KEY(slot);
  const lockValue = `${now}-${slot}-${Math.random().toString(36).slice(2, 8)}`;
  const acquired = await kvSetNX(lockKey, lockValue, { ex: 60 });
  if (!acquired) {
    return { ok: false, slot, error: "lock-contended", contended: true };
  }
  try {
    // Two-pass cleanup for THIS slot. Ignore envelopes belonging to other
    // slots — each slot owns its own lifecycle.
    //
    // Pass 1 — prune expired OR orphaned envelopes from the live index.
    //
    // Pass 2 — dedupe within the slot. When legacy data (pre-3-slot) put
    // multiple "fast" games into the live index, `listActiveAiGames()
    // .slice(0, 3)` on the UI would surface three fast duplicates instead
    // of fast+medium+slow. We keep the newest live envelope for the slot
    // and archive the rest; the 1-per-slot invariant is then enforced on
    // the live index regardless of what state rolled over from the
    // pre-refactor snapshot.
    const index = await readIndex();
    const rotated: string[] = [];
    const liveInSlot: AiGame[] = [];
    for (const id of index) {
      const envelope = await kvGet<AiGame>(`xp:ai-games:${id}`);
      if (!envelope) {
        rotated.push(id);
        await archiveOnExpire(id);
        continue;
      }
      if (resolveSlot(envelope.rotationSlot) !== slot) continue;
      if (envelope.validUntil <= now) {
        await archiveOnExpire(id);
        rotated.push(id);
      } else {
        liveInSlot.push(envelope);
      }
    }
    // If more than one live envelope exists for this slot, keep the newest
    // (max generatedAt) and archive the older siblings from the live index.
    if (liveInSlot.length > 1) {
      liveInSlot.sort((a, b) => b.generatedAt - a.generatedAt);
      const [, ...older] = liveInSlot;
      for (const e of older) {
        await archiveOnExpire(e.id);
        rotated.push(e.id);
      }
    }

    // Skip publish if this slot's bucket already rotated (idempotent across
    // the slot's interval).
    const slotHours = SLOT_INTERVAL_HOURS[slot];
    const currentBucket = Math.floor(now / (slotHours * 60 * 60 * 1000));
    const lastBucket =
      (await kvGet<number>(LAST_ROTATION_BUCKET_KEY(slot))) ?? -1;
    if (lastBucket === currentBucket) {
      return {
        ok: true,
        slot,
        rotated,
        published: null,
        skipped: true,
        reason: "already-rotated-this-bucket",
      };
    }

    const result = await runPipeline(now, undefined, slot);
    if (!result.ok) {
      // "portfolio: theme already live" is a benign collision — this bucket's
      // theme pick matched an existing LIVE game (can happen if the index
      // wasn't fully pruned). Treat as a soft skip rather than an error.
      if (result.error.startsWith("portfolio:")) {
        return {
          ok: true,
          slot,
          rotated,
          published: null,
          skipped: true,
          reason: result.error,
        };
      }
      return { ok: false, slot, error: result.error };
    }
    await kvSet(LAST_ROTATION_BUCKET_KEY(slot), currentBucket);
    return {
      ok: true,
      slot,
      rotated,
      published: result.game.id,
      theme: result.game.theme,
      skipped: false,
    };
  } finally {
    // Only release the lock if we still hold it (defensive; a 60s TTL expiry
    // could let another caller take over mid-flight).
    const current = await kvGet<string>(lockKey);
    if (current === lockValue) {
      await kvDel(lockKey);
    }
  }
}
