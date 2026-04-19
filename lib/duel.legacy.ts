/* V3.6 — LEGACY, no longer mounted.
 *
 * /duel + /api/duel routes were removed in V3.6 because the feature
 * was orphaned: 6-round math sprint with no ledger credit, no
 * achievement, no feedback into city progression. Retained as
 * `lib/duel.legacy.ts` for git history only — a future "Mądry Wybór"
 * async scenario feature (see docs/decisions/001-v3-duel-removal-and-
 * future.md) will design around the player-first finance lesson
 * rather than reviving the speed-sprint frame.
 *
 * If this file is imported from anywhere outside a test/ADR, that's
 * a regression — grep should only hit comments + this header.
 */

import { kvGet, kvSet } from "@/lib/redis";

export const DUEL_TTL_SECONDS = 60 * 60 * 6; // 6 hours
export const DUEL_ROUNDS = 6;
export const DUEL_ROUND_SECONDS = 10;

export type DuelGameId = "currency-rush-duel" | "math-sprint-duel";

export const DUEL_GAMES: {
  id: DuelGameId;
  title: string;
  emoji: string;
  tagline: string;
}[] = [
  {
    id: "currency-rush-duel",
    title: "Kurzový šprint",
    emoji: "💱",
    tagline: "EUR ↔ PLN ↔ USD · presnejší vyhráva",
  },
  {
    id: "math-sprint-duel",
    title: "Matematický šprint",
    emoji: "🧮",
    tagline: "Počty na čas · kto bližšie, ten víťaz",
  },
];

export type CurrencyProblem = {
  kind: "currency";
  from: "EUR" | "USD" | "PLN";
  to: "EUR" | "USD" | "PLN";
  amount: number;
  rate: number;
  answer: number;
};

export type MathProblem = {
  kind: "math";
  a: number;
  b: number;
  op: "+" | "-" | "×";
  answer: number;
};

export type DuelProblem = CurrencyProblem | MathProblem;

export type DuelRound = { problem: DuelProblem };

export type DuelAnswer = {
  value: number;
  elapsedMs: number;
};

export type DuelRecord = {
  code: string;
  gameId: DuelGameId;
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
  gameId: DuelGameId;
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

const RATES: {
  from: CurrencyProblem["from"];
  to: CurrencyProblem["to"];
  rate: number;
}[] = [
  { from: "EUR", to: "PLN", rate: 4.3 },
  { from: "PLN", to: "EUR", rate: 1 / 4.3 },
  { from: "USD", to: "PLN", rate: 3.95 },
  { from: "PLN", to: "USD", rate: 1 / 3.95 },
  { from: "EUR", to: "USD", rate: 1.08 },
  { from: "USD", to: "EUR", rate: 1 / 1.08 },
];

const AMOUNTS = [5, 10, 20, 25, 50, 80, 100, 150, 200];

export function generateRounds(
  seed: number,
  gameId: DuelGameId,
): DuelRound[] {
  const rnd = mulberry32(seed);
  const rounds: DuelRound[] = [];
  for (let i = 0; i < DUEL_ROUNDS; i++) {
    if (gameId === "currency-rush-duel") {
      const pair = RATES[Math.floor(rnd() * RATES.length)];
      const amount = AMOUNTS[Math.floor(rnd() * AMOUNTS.length)];
      rounds.push({
        problem: {
          kind: "currency",
          from: pair.from,
          to: pair.to,
          amount,
          rate: pair.rate,
          answer: Number((amount * pair.rate).toFixed(2)),
        },
      });
    } else {
      const ops: MathProblem["op"][] = ["+", "-", "×"];
      const op = ops[Math.floor(rnd() * ops.length)];
      let a: number, b: number, answer: number;
      if (op === "×") {
        a = 2 + Math.floor(rnd() * 11);
        b = 2 + Math.floor(rnd() * 11);
        answer = a * b;
      } else if (op === "-") {
        a = 20 + Math.floor(rnd() * 80);
        b = 1 + Math.floor(rnd() * (a - 1));
        answer = a - b;
      } else {
        a = 10 + Math.floor(rnd() * 90);
        b = 10 + Math.floor(rnd() * 90);
        answer = a + b;
      }
      rounds.push({
        problem: { kind: "math", a, b, op, answer },
      });
    }
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
  opts?: { code?: string; seed?: number; gameId?: DuelGameId },
): Promise<DuelRecord> {
  const code = opts?.code ?? makeCode();
  const seed = opts?.seed ?? Math.floor(Math.random() * 2 ** 31);
  const gameId = opts?.gameId ?? "currency-rush-duel";
  const record: DuelRecord = {
    code,
    gameId,
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
  const raw = await kvGet<DuelRecord>(`${KEY_PREFIX}${code}`);
  if (!raw) return null;
  // Older duel records before the gameId field was added default to currency
  if (!raw.gameId) raw.gameId = "currency-rush-duel";
  return raw;
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
  const rounds = generateRounds(record.seed, record.gameId);
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
    const truth = rounds[i].problem.answer;
    const dA = Math.abs(a.value - truth);
    const dB = Math.abs(b.value - truth);
    if (dA < dB) {
      winners.push("A");
      winsA++;
    } else if (dB < dA) {
      winners.push("B");
      winsB++;
    } else {
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
    gameId: record.gameId,
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
