import { kvGet, kvSet } from "@/lib/redis";

export const DUEL_TTL_SECONDS = 60 * 60 * 6; // 6 hours
export const DUEL_ROUNDS = 6;
export const DUEL_ROUND_SECONDS = 10;

export type DuelRound = {
  problem: {
    from: "EUR" | "USD" | "PLN";
    to: "EUR" | "USD" | "PLN";
    amount: number;
    rate: number;
    answer: number; // canonical: amount * rate
  };
};

export type DuelAnswer = {
  value: number;
  elapsedMs: number;
};

export type DuelRecord = {
  code: string;
  gameId: "currency-rush-duel";
  seed: number;
  createdAt: number;
  playerA: string;
  playerB: string | null;
  answersA: DuelAnswer[];
  answersB: DuelAnswer[];
  finishedA: boolean;
  finishedB: boolean;
};

export type DuelSummary = {
  code: string;
  createdAt: number;
  playerA: string;
  playerB: string | null;
  winsA: number;
  winsB: number;
  roundWinners: ("A" | "B" | "tie")[];
  finishedA: boolean;
  finishedB: boolean;
  rounds: DuelRound[];
  answersA: DuelAnswer[];
  answersB: DuelAnswer[];
};

const KEY_PREFIX = "xp:duel:";

/* ---------- Seeded RNG + round generation ---------- */

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RATES: { from: DuelRound["problem"]["from"]; to: DuelRound["problem"]["to"]; rate: number }[] = [
  { from: "EUR", to: "PLN", rate: 4.3 },
  { from: "PLN", to: "EUR", rate: 1 / 4.3 },
  { from: "USD", to: "PLN", rate: 3.95 },
  { from: "PLN", to: "USD", rate: 1 / 3.95 },
  { from: "EUR", to: "USD", rate: 1.08 },
  { from: "USD", to: "EUR", rate: 1 / 1.08 },
];

const AMOUNTS = [5, 10, 20, 25, 50, 80, 100, 150, 200];

export function generateRounds(seed: number): DuelRound[] {
  const rnd = mulberry32(seed);
  const rounds: DuelRound[] = [];
  for (let i = 0; i < DUEL_ROUNDS; i++) {
    const pair = RATES[Math.floor(rnd() * RATES.length)];
    const amount = AMOUNTS[Math.floor(rnd() * AMOUNTS.length)];
    rounds.push({
      problem: {
        from: pair.from,
        to: pair.to,
        amount,
        rate: pair.rate,
        answer: Number((amount * pair.rate).toFixed(2)),
      },
    });
  }
  return rounds;
}

/* ---------- Code generation ---------- */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous O/0/I/1

export function makeCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/* ---------- Persistence ---------- */

export async function createDuel(
  playerA: string,
  opts?: { code?: string; seed?: number },
): Promise<DuelRecord> {
  const code = opts?.code ?? makeCode();
  const seed = opts?.seed ?? Math.floor(Math.random() * 2 ** 31);
  const record: DuelRecord = {
    code,
    gameId: "currency-rush-duel",
    seed,
    createdAt: Date.now(),
    playerA,
    playerB: null,
    answersA: [],
    answersB: [],
    finishedA: false,
    finishedB: false,
  };
  await kvSet(`${KEY_PREFIX}${code}`, record, { ex: DUEL_TTL_SECONDS });
  return record;
}

export async function getDuel(code: string): Promise<DuelRecord | null> {
  return await kvGet<DuelRecord>(`${KEY_PREFIX}${code}`);
}

export async function saveDuel(record: DuelRecord): Promise<void> {
  await kvSet(`${KEY_PREFIX}${record.code}`, record, { ex: DUEL_TTL_SECONDS });
}

export function assignPlayer(
  record: DuelRecord,
  username: string,
): "A" | "B" | "spectator" | "full" {
  if (record.playerA === username) return "A";
  if (record.playerB === username) return "B";
  if (!record.playerB) return "B";
  return "spectator";
}

export function summarize(record: DuelRecord): DuelSummary {
  const rounds = generateRounds(record.seed);
  const winners: ("A" | "B" | "tie")[] = [];
  let winsA = 0;
  let winsB = 0;
  for (let i = 0; i < rounds.length; i++) {
    const a = record.answersA[i];
    const b = record.answersB[i];
    if (!a && !b) {
      winners.push("tie");
      continue;
    }
    if (!a) {
      winners.push("B");
      winsB++;
      continue;
    }
    if (!b) {
      winners.push("A");
      winsA++;
      continue;
    }
    const dA = Math.abs(a.value - rounds[i].problem.answer);
    const dB = Math.abs(b.value - rounds[i].problem.answer);
    if (dA < dB) {
      winners.push("A");
      winsA++;
    } else if (dB < dA) {
      winners.push("B");
      winsB++;
    } else {
      // tie on accuracy → faster wins; equal time = tie
      if (a.elapsedMs < b.elapsedMs) {
        winners.push("A");
        winsA++;
      } else if (b.elapsedMs < a.elapsedMs) {
        winners.push("B");
        winsB++;
      } else {
        winners.push("tie");
      }
    }
  }
  return {
    code: record.code,
    createdAt: record.createdAt,
    playerA: record.playerA,
    playerB: record.playerB,
    winsA,
    winsB,
    roundWinners: winners,
    finishedA: record.finishedA,
    finishedB: record.finishedB,
    rounds,
    answersA: record.answersA,
    answersB: record.answersB,
  };
}
