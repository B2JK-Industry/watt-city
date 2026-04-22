/* Thin Upstash Redis wrapper with an in-memory fallback.
 *
 * Every primitive we use (kv get/set/del, zset incr/score/top, set add/
 * members/has/rem, list push/range/trim, kvSetNX for single-flight locks)
 * has a production path against Upstash and a dev path against a Map/Array
 * triple kept in-process.
 *
 * Fallback triggers when `UPSTASH_REDIS_REST_URL` + `_TOKEN` are both
 * unset — that's the default for local `pnpm dev` + the vitest suite
 * (each test run starts fresh). `console.warn` at module init announces
 * the degraded mode so nobody ships to production without realising.
 *
 * Invariants
 *  - Never use both paths at once — `upstash === null` permanently if
 *    either env var is missing; no late retries.
 *  - TTLs are best-effort on the in-memory path (setTimeout with unref);
 *    Upstash enforces exactly. Never write a test that asserts on TTL
 *    timing unless it's running against Upstash.
 *  - `kvSetNX` is atomic in both paths — Upstash via `SET NX EX`, memory
 *    via synchronous Map.has/set (single-threaded JS event loop keeps it
 *    race-safe for the check-then-set sequence).
 */
import { Redis } from "@upstash/redis";

type SortedSetEntry = { score: number; member: string };

type MemoryStore = {
  kv: Map<string, string>;
  zsets: Map<string, SortedSetEntry[]>;
  lists: Map<string, string[]>; // LPUSH-newest-first
  sets: Map<string, Set<string>>;
};

const memory: MemoryStore = {
  kv: new Map(),
  zsets: new Map(),
  lists: new Map(),
  sets: new Map(),
};

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

const upstash: Redis | null = hasUpstash() ? Redis.fromEnv() : null;

if (!upstash && process.env.NODE_ENV !== "production") {
  console.warn(
    "[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — falling back to in-memory store (dev only, data lost on restart).",
  );
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  if (upstash) {
    return (await upstash.get<T>(key)) ?? null;
  }
  const raw = memory.kv.get(key);
  if (raw === undefined) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function kvSet(
  key: string,
  value: unknown,
  opts?: { ex?: number },
): Promise<void> {
  if (upstash) {
    if (opts?.ex) {
      await upstash.set(key, value, { ex: opts.ex });
    } else {
      await upstash.set(key, value);
    }
    return;
  }
  memory.kv.set(key, JSON.stringify(value));
}

export async function kvSetNX(
  key: string,
  value: unknown,
  opts?: { ex?: number },
): Promise<boolean> {
  if (upstash) {
    // SET NX EX: atomic single-flight with TTL — prevents a crashed holder from
    // permanently blocking future attempts.
    const result = opts?.ex
      ? await upstash.set(key, value, { nx: true, ex: opts.ex })
      : await upstash.set(key, value, { nx: true });
    return result === "OK";
  }
  if (memory.kv.has(key)) return false;
  memory.kv.set(key, JSON.stringify(value));
  if (opts?.ex) {
    setTimeout(() => {
      // best-effort release in dev in-memory store
      memory.kv.delete(key);
    }, opts.ex * 1000).unref?.();
  }
  return true;
}

export async function kvDel(key: string): Promise<void> {
  if (upstash) {
    // Redis DEL works on any type — kv/list/set/zset share the same keyspace.
    await upstash.del(key);
    return;
  }
  // In-memory stores are per-type buckets, so clear the key from each.
  memory.kv.delete(key);
  memory.lists.delete(key);
  memory.sets.delete(key);
  memory.zsets.delete(key);
}

export async function zIncrBy(
  zkey: string,
  delta: number,
  member: string,
): Promise<number> {
  if (upstash) {
    return await upstash.zincrby(zkey, delta, member);
  }
  const entries = memory.zsets.get(zkey) ?? [];
  const existing = entries.find((e) => e.member === member);
  const newScore = (existing?.score ?? 0) + delta;
  if (existing) existing.score = newScore;
  else entries.push({ member, score: newScore });
  memory.zsets.set(zkey, entries);
  return newScore;
}

export async function zScore(zkey: string, member: string): Promise<number> {
  if (upstash) {
    return (await upstash.zscore(zkey, member)) ?? 0;
  }
  const entries = memory.zsets.get(zkey) ?? [];
  return entries.find((e) => e.member === member)?.score ?? 0;
}

export type LeaderboardEntry = { username: string; xp: number; rank: number };

export async function zTopN(
  zkey: string,
  n: number,
): Promise<LeaderboardEntry[]> {
  if (upstash) {
    const raw = (await upstash.zrange(zkey, 0, n - 1, {
      rev: true,
      withScores: true,
    })) as (string | number)[];
    const out: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      out.push({
        username: String(raw[i]),
        xp: Number(raw[i + 1]),
        rank: out.length + 1,
      });
    }
    return out;
  }
  const entries = memory.zsets.get(zkey) ?? [];
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((e, i) => ({ username: e.member, xp: e.score, rank: i + 1 }));
}

export async function zRank(
  zkey: string,
  member: string,
): Promise<number | null> {
  if (upstash) {
    const rank = await upstash.zrevrank(zkey, member);
    return rank === null ? null : rank + 1;
  }
  const entries = memory.zsets.get(zkey) ?? [];
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const idx = sorted.findIndex((e) => e.member === member);
  return idx === -1 ? null : idx + 1;
}

/* ------------------------ List ops (ledger append) ----------------------- */

// LPUSH: prepend to the list (newest at index 0). Stores values as JSON.
export async function lPush(
  key: string,
  value: unknown,
): Promise<void> {
  if (upstash) {
    await upstash.lpush(key, JSON.stringify(value));
    return;
  }
  const existing = memory.lists.get(key) ?? [];
  existing.unshift(JSON.stringify(value));
  memory.lists.set(key, existing);
}

// LRANGE 0..n-1: returns newest-first slice, parsed from JSON. Drops malformed entries.
export async function lRange<T = unknown>(
  key: string,
  n: number,
): Promise<T[]> {
  if (upstash) {
    const raw = await upstash.lrange(key, 0, n - 1);
    // Upstash returns strings (as typed) — but if a caller stored objects it
    // auto-parses. Normalise.
    return raw.map((v) => {
      if (typeof v === "string") {
        try {
          return JSON.parse(v) as T;
        } catch {
          return null as unknown as T;
        }
      }
      return v as unknown as T;
    }).filter((v): v is T => v !== null);
  }
  const existing = memory.lists.get(key) ?? [];
  return existing.slice(0, n).map((v) => {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null as unknown as T;
    }
  }).filter((v): v is T => v !== null);
}

// LLEN
export async function lLen(key: string): Promise<number> {
  if (upstash) {
    return await upstash.llen(key);
  }
  return memory.lists.get(key)?.length ?? 0;
}

// LTRIM: keep indices [start, end] inclusive; drop the rest.
export async function lTrim(
  key: string,
  start: number,
  end: number,
): Promise<void> {
  if (upstash) {
    await upstash.ltrim(key, start, end);
    return;
  }
  const existing = memory.lists.get(key) ?? [];
  memory.lists.set(key, existing.slice(start, end + 1));
}

/* ------------------------ Set ops (dedupe + flags) ----------------------- */

// SADD: returns true if `member` was newly added, false if already present.
// Used for idempotent operations (ledger dedupe key).
export async function sAdd(key: string, member: string): Promise<boolean> {
  if (upstash) {
    const added = await upstash.sadd(key, member);
    return added === 1;
  }
  const existing = memory.sets.get(key) ?? new Set<string>();
  const was = existing.has(member);
  existing.add(member);
  memory.sets.set(key, existing);
  return !was;
}

export async function sHas(key: string, member: string): Promise<boolean> {
  if (upstash) {
    const result = await upstash.sismember(key, member);
    return result === 1;
  }
  return memory.sets.get(key)?.has(member) ?? false;
}

export async function sMembers(key: string): Promise<string[]> {
  if (upstash) {
    const result = (await upstash.smembers(key)) as string[];
    return Array.isArray(result) ? result.map(String) : [];
  }
  return Array.from(memory.sets.get(key) ?? []);
}

export async function sRem(key: string, member: string): Promise<boolean> {
  if (upstash) {
    const removed = await upstash.srem(key, member);
    return removed === 1;
  }
  const existing = memory.sets.get(key);
  if (!existing) return false;
  const was = existing.has(member);
  existing.delete(member);
  return was;
}

/** Atomic INCR with TTL — returns the new counter value. Sets the TTL
 *  on every call (Redis `EXPIRE` is idempotent + cheap); avoids the
 *  classic GET-then-SET race where two concurrent readers both see
 *  `current=0`, each write `1`, and both pass a limit check. Used by
 *  `lib/rate-limit.ts` fixed-window buckets.
 *
 *  On Upstash: single round-trip via `multi()` pipeline (MULTI/EXEC is
 *  atomic server-side).
 *  On the in-memory fallback: synchronous map increment + best-effort
 *  TTL clear. The JS event loop is single-threaded so the in-process
 *  race window doesn't exist. */
export async function kvIncrWithTTL(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  if (upstash) {
    const pipe = upstash.multi();
    pipe.incr(key);
    pipe.expire(key, ttlSeconds);
    const [count] = (await pipe.exec()) as [number, unknown];
    return count;
  }
  const cur = Number(memory.kv.get(key) ?? 0);
  const next = cur + 1;
  memory.kv.set(key, String(next));
  setTimeout(() => {
    if (memory.kv.get(key) === String(next)) memory.kv.delete(key);
  }, ttlSeconds * 1000).unref?.();
  return next;
}

/** Read every member of a ZSET (unbounded). Used by the E2E-purge admin
 *  endpoint to enumerate candidates before filtering by username regex —
 *  the leaderboard is at most a few hundred entries in practice, so a
 *  single ZRANGE 0..-1 is simpler than SCAN-based pagination. */
export async function zAllMembers(zkey: string): Promise<string[]> {
  if (upstash) {
    const raw = (await upstash.zrange(zkey, 0, -1)) as unknown[];
    return raw.map((v) => String(v));
  }
  const entries = memory.zsets.get(zkey) ?? [];
  return entries.map((e) => e.member);
}

export async function zRem(zkey: string, member: string): Promise<void> {
  if (upstash) {
    await upstash.zrem(zkey, member);
    return;
  }
  const entries = memory.zsets.get(zkey);
  if (!entries) return;
  memory.zsets.set(
    zkey,
    entries.filter((e) => e.member !== member),
  );
}
