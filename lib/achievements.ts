/* Achievements — Phase 2.8.
 *
 * Definitions live here. Each achievement has an id, a localized label, an
 * icon, and an async `check(username)` that inspects state + ledger +
 * leaderboards to decide whether the player should own it.
 *
 * Storage: `xp:player:<u>:achievements` is a Redis SET of unlocked ids.
 * Idempotent — SADD no-ops on duplicate.
 */

import { kvGet, sAdd, sHas } from "@/lib/redis";
import { getPlayerState, recentLedger } from "@/lib/player";
import { zTopN } from "@/lib/redis";
import { getCatalogEntry } from "@/lib/building-catalog";
import { dayBucket } from "@/lib/economy";
import { pushNotification } from "@/lib/notifications";
import type { Lang } from "@/lib/i18n";

export type AchievementId =
  | "first-mortgage-paid"
  | "evergreen-top3-sweep"
  | "ai-medals-10"
  | "ai-medals-100"
  | "built-t7"
  | "all-slots-filled"
  | "credit-score-100"
  | "streak-30";

export type AchievementDef = {
  id: AchievementId;
  icon: string;
  labels: Record<Lang, string>;
  descriptions: Record<Lang, string>;
  check: (username: string) => Promise<boolean>;
};

const SET_KEY = (u: string) => `xp:player:${u}:achievements`;

export async function ownedAchievements(
  username: string,
): Promise<AchievementId[]> {
  const arr = (await kvGet<AchievementId[]>(`xp:player:${username}:achievements-list`)) ?? [];
  // Redis SET doesn't have a portable cross-store enumerate via our lib;
  // we mirror to a list on grant. Legacy accounts rebuild on first grant.
  return arr;
}

async function alreadyHas(username: string, id: AchievementId): Promise<boolean> {
  return await sHas(SET_KEY(username), id);
}

async function grant(username: string, id: AchievementId): Promise<boolean> {
  const isNew = await sAdd(SET_KEY(username), id);
  if (isNew) {
    // Mirror into a list so we can enumerate cheaply later.
    const list = await ownedAchievements(username);
    if (!list.includes(id)) {
      const { kvSet } = await import("@/lib/redis");
      await kvSet(`xp:player:${username}:achievements-list`, [...list, id]);
    }
    // Fire a notification for the reveal animation on the client.
    const def = ACHIEVEMENT_DEFS[id];
    await pushNotification(username, {
      kind: "achievement",
      title: def.labels.pl,
      body: def.descriptions.pl,
      href: "/profile",
      meta: { achievementId: id },
    });
  }
  return isNew;
}

// ---------------------------------------------------------------------------
// Individual checks — each pure(ish) against Redis state
// ---------------------------------------------------------------------------

async function checkFirstMortgagePaid(username: string): Promise<boolean> {
  const state = await getPlayerState(username);
  return state.loans.some((l) => l.type === "mortgage" && l.status === "paid_off");
}

async function checkEvergreenTop3(username: string): Promise<boolean> {
  const ids = [
    "energy-dash",
    "power-flip",
    "stock-tap",
    "budget-balance",
    "finance-quiz",
    "math-sprint",
    "memory-match",
    "currency-rush",
    "word-scramble",
  ];
  for (const gameId of ids) {
    const top = await zTopN(`xp:leaderboard:game:${gameId}`, 3);
    if (!top.some((e) => e.username === username)) return false;
  }
  return true;
}

async function aiMedalsCount(username: string): Promise<number> {
  // Count how many AI-game leaderboards the player is top-3 on. We don't
  // have an index of "every AI gameId ever generated", but the archive
  // index does — use it as the canonical list.
  const archiveIds = (await kvGet<string[]>("xp:ai-games:archive-index")) ?? [];
  // Also check currently-live ones
  const liveIds = (await kvGet<string[]>("xp:ai-games:index")) ?? [];
  const all = Array.from(new Set([...archiveIds, ...liveIds]));
  let medals = 0;
  for (const id of all) {
    const top = await zTopN(`xp:leaderboard:game:${id}`, 3);
    if (top.some((e) => e.username === username)) medals += 1;
  }
  return medals;
}

async function checkAiMedals(username: string, threshold: number): Promise<boolean> {
  return (await aiMedalsCount(username)) >= threshold;
}

async function checkBuiltT7(username: string): Promise<boolean> {
  const state = await getPlayerState(username);
  return state.buildings.some((b) => {
    const entry = getCatalogEntry(b.catalogId);
    return entry && entry.tier >= 7;
  });
}

async function checkAllSlotsFilled(username: string): Promise<boolean> {
  const state = await getPlayerState(username);
  return state.buildings.length >= 20;
}

async function checkCreditScore100(username: string): Promise<boolean> {
  const state = await getPlayerState(username);
  return state.creditScore >= 100;
}

async function checkStreak30(username: string): Promise<boolean> {
  // Distinct day-buckets that carry a score ledger entry. We check the last
  // 500 entries (recentLedger cap) — enough to see ≥ 30 days for any
  // reasonable active player; veteran players who've already unlocked will
  // be granted and then the check is a no-op.
  const log = await recentLedger(username, 500);
  const days = new Set<string>();
  for (const entry of log) {
    if (entry.kind !== "score") continue;
    days.add(dayBucket(entry.ts));
  }
  return days.size >= 30;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DEFS: Record<AchievementId, AchievementDef> = {
  "first-mortgage-paid": {
    id: "first-mortgage-paid",
    icon: "🏠",
    labels: {
      pl: "Pierwszy spłacony kredyt",
      uk: "Перший виплачений кредит",
      cs: "První splacený úvěr",
      en: "First mortgage paid off",
    },
    descriptions: {
      pl: "Spłaciłeś pierwszy kredyt hipoteczny do końca. +10 scoring.",
      uk: "Ти виплатив перший іпотечний кредит. +10 скорингу.",
      cs: "Splatil jsi první hypotéku. +10 skóre.",
      en: "You paid off your first mortgage. +10 credit score.",
    },
    check: checkFirstMortgagePaid,
  },
  "evergreen-top3-sweep": {
    id: "evergreen-top3-sweep",
    icon: "🥇",
    labels: {
      pl: "Komplet medali — 9 gier evergreen",
      uk: "Повний комплект — 9 ігор",
      cs: "Kompletní sada — 9 her",
      en: "Full sweep — 9 evergreen games",
    },
    descriptions: {
      pl: "Top-3 w każdej z 9 gier evergreen.",
      uk: "Топ-3 у всіх 9 іграх.",
      cs: "Top-3 ve všech 9 hrách.",
      en: "Top-3 in every evergreen game.",
    },
    check: checkEvergreenTop3,
  },
  "ai-medals-10": {
    id: "ai-medals-10",
    icon: "🤖",
    labels: {
      pl: "10 medali AI",
      uk: "10 AI-медалей",
      cs: "10 AI medailí",
      en: "10 AI medals",
    },
    descriptions: {
      pl: "Top-3 w 10 różnych AI wyzwaniach.",
      uk: "Топ-3 у 10 AI-викликах.",
      cs: "Top-3 v 10 AI výzvách.",
      en: "Top-3 in 10 different AI challenges.",
    },
    check: (u) => checkAiMedals(u, 10),
  },
  "ai-medals-100": {
    id: "ai-medals-100",
    icon: "🌟",
    labels: {
      pl: "100 medali AI",
      uk: "100 AI-медалей",
      cs: "100 AI medailí",
      en: "100 AI medals",
    },
    descriptions: {
      pl: "Top-3 w 100 AI wyzwaniach — status legendy.",
      uk: "Топ-3 у 100 AI-викликах — легенда.",
      cs: "Top-3 ve 100 AI výzvách — legenda.",
      en: "Top-3 in 100 AI challenges — legendary.",
    },
    check: (u) => checkAiMedals(u, 100),
  },
  "built-t7": {
    id: "built-t7",
    icon: "🏗️",
    labels: {
      pl: "Pierwszy budynek T7",
      uk: "Перша будівля T7",
      cs: "První T7 stavba",
      en: "First T7 building",
    },
    descriptions: {
      pl: "Postawiłeś budynek z 7. poziomu miasta.",
      uk: "Поставив будівлю 7-го рівня.",
      cs: "Postavil jsi budovu 7. úrovně.",
      en: "Built a tier-7 building.",
    },
    check: checkBuiltT7,
  },
  "all-slots-filled": {
    id: "all-slots-filled",
    icon: "🧩",
    labels: {
      pl: "Wszystkie 20 slotów",
      uk: "Усі 20 слотів",
      cs: "Všech 20 slotů",
      en: "All 20 slots filled",
    },
    descriptions: {
      pl: "Zajęłeś każdy z 20 slotów miasta.",
      uk: "Заповнив усі 20 слотів.",
      cs: "Zaplnil jsi všech 20 slotů.",
      en: "Every slot on the city map is yours.",
    },
    check: checkAllSlotsFilled,
  },
  "credit-score-100": {
    id: "credit-score-100",
    icon: "💯",
    labels: {
      pl: "Scoring 100/100",
      uk: "Скоринг 100/100",
      cs: "Skóre 100/100",
      en: "Credit score 100/100",
    },
    descriptions: {
      pl: "Maksymalny scoring — perfekcyjny kredytobiorca.",
      uk: "Максимальний скоринг.",
      cs: "Maximální skóre.",
      en: "Perfect credit — borrowed, paid, never missed.",
    },
    check: checkCreditScore100,
  },
  "streak-30": {
    id: "streak-30",
    icon: "🔥",
    labels: {
      pl: "30-dniowy streak",
      uk: "30-денний streak",
      cs: "30denní série",
      en: "30-day streak",
    },
    descriptions: {
      pl: "Zagrałeś co najmniej raz dziennie przez 30 dni.",
      uk: "Грав щодня 30 днів.",
      cs: "Hrál jsi každý den 30 dní.",
      en: "Played at least once a day for 30 days.",
    },
    check: checkStreak30,
  },
};

/** Run every undone achievement's check and grant those that now pass. */
export async function sweepAchievements(
  username: string,
): Promise<AchievementId[]> {
  const newly: AchievementId[] = [];
  for (const id of Object.keys(ACHIEVEMENT_DEFS) as AchievementId[]) {
    if (await alreadyHas(username, id)) continue;
    const def = ACHIEVEMENT_DEFS[id];
    try {
      if (await def.check(username)) {
        const granted = await grant(username, id);
        if (granted) newly.push(id);
      }
    } catch {
      // individual check failure shouldn't block others
    }
  }
  return newly;
}

export async function achievementStatus(username: string): Promise<
  Array<{ id: AchievementId; owned: boolean; def: AchievementDef }>
> {
  const list = await ownedAchievements(username);
  return (Object.keys(ACHIEVEMENT_DEFS) as AchievementId[]).map((id) => ({
    id,
    owned: list.includes(id),
    def: ACHIEVEMENT_DEFS[id],
  }));
}
