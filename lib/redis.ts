import { Redis } from "@upstash/redis";

type SortedSetEntry = { score: number; member: string };

type MemoryStore = {
  kv: Map<string, string>;
  zsets: Map<string, SortedSetEntry[]>;
};

const memory: MemoryStore = {
  kv: new Map(),
  zsets: new Map(),
};

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

const upstash: Redis | null = hasUpstash() ? Redis.fromEnv() : null;

if (!upstash && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
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
    await upstash.del(key);
    return;
  }
  memory.kv.delete(key);
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
