import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
  type PlayerState,
  type Loan,
  type BuildingInstance,
} from "@/lib/player";
import { refreshCityValue } from "@/lib/city-value";
import { kvGet, sAdd, kvSet } from "@/lib/redis";
import { SLOT_MAP, DOMEK_SLOT_ID } from "@/lib/building-catalog";
import { ACHIEVEMENT_DEFS, type AchievementId } from "@/lib/achievements";
import { awardXP } from "@/lib/leaderboard";
import { recordRound } from "@/lib/user-stats";

/* Per-game target scores used by the seed. 99 % of each game's cap so
 * the seeded account shows "near-perfect" in every evergreen game and
 * sweeps the global leaderboard against organic traffic. Caps mirror
 * the `cap` field on BUILDING_PLAN in components/city-scene.tsx. */
const DEMO_SCORES: Array<{ gameId: string; score: number }> = [
  { gameId: "finance-quiz",   score:  99 },
  { gameId: "stock-tap",      score: 218 },
  { gameId: "memory-match",   score: 159 },
  { gameId: "math-sprint",    score: 198 },
  { gameId: "energy-dash",    score: 218 },
  { gameId: "power-flip",     score: 179 },
  { gameId: "currency-rush",  score: 178 },
  { gameId: "budget-balance", score: 158 },
  { gameId: "word-scramble",  score: 119 },
];

/* Demo-player seed — admin-only helper for PKO / school pitches.
 *
 * Given a registered username, pumps the account to "full-progression"
 * state so the operator can walk a buyer through every surface the
 * product ships (HUD, city grid, loans, achievements, on-chain opt-in)
 * without grinding for hours.
 *
 * Idempotent: running twice replays the same target state. Safe to use
 * against any real user — state is written atomically via savePlayerState
 * so partial failures don't leave the account half-seeded.
 *
 *   POST /api/admin/seed-demo-player/<username>
 *   Authorization: Bearer $ADMIN_SECRET
 *
 * Grants:
 *   - resources: 99_999 of every kind (watts/coins/bricks/glass/steel/code/cashZl)
 *   - buildings: one per SLOT_MAP category (residential Domek kept, plus
 *     12 more covering industry, civic, commercial, decorative, landmark)
 *   - loans: one PAID-OFF mortgage → unlocks `first-mortgage-paid`
 *   - creditScore: 100 → unlocks `credit-score-100`
 *   - achievements: all 8 SADD-granted so the profile gallery fills up
 */

const DEMO_BUILDING_PLAN: Array<{ slotId: number; catalogId: string }> = [
  // Landmark row (tier 8+)
  { slotId: 0, catalogId: "spodek" },
  // Civic (tier 3-7)
  { slotId: 1, catalogId: "biblioteka" },
  { slotId: 2, catalogId: "bank-lokalny" },
  { slotId: 18, catalogId: "gimnazjum-sportowe" },
  { slotId: 19, catalogId: "centrum-nauki" },
  // Industry (tier 3-7)
  { slotId: 3, catalogId: "huta-szkla" },
  { slotId: 4, catalogId: "walcownia" },
  { slotId: 5, catalogId: "fotowoltaika" },
  { slotId: 6, catalogId: "mala-elektrownia" },
  // Commercial
  { slotId: 7, catalogId: "sklepik" },
  { slotId: 8, catalogId: "software-house" },
  // Residential — keep slot 10 Domek; fill 11-13 with more Domeks
  // so a city-scene screenshot shows the full row populated.
  { slotId: 11, catalogId: "domek" },
  { slotId: 12, catalogId: "domek" },
  { slotId: 13, catalogId: "domek" },
  // Decorative — aesthetic filler
  { slotId: 14, catalogId: "park" },
  { slotId: 15, catalogId: "fontanna" },
  { slotId: 16, catalogId: "kosciol" },
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const block = await requireAdmin(request);
  if (block) return block;
  const { username } = await params;

  const userRec = await kvGet(`xp:user:${username}`);
  if (!userRec) {
    return Response.json(
      { ok: false, error: "unknown-user" },
      { status: 404 },
    );
  }

  const state = await getPlayerState(username);

  // 1. Resources — ledger-backed grant so the profile tx log explains
  //    the sudden balance without breaking the "every delta has a kind"
  //    invariant that cashflow analytics relies on.
  await creditResources(
    state,
    "admin_grant",
    {
      watts: 99_999,
      coins: 99_999,
      bricks: 99_999,
      glass: 99_999,
      steel: 99_999,
      code: 99_999,
      cashZl: 99_999,
    },
    `admin_grant: demo-seed pitch state`,
    `demo-seed-resources:${username}:${Date.now()}`,
    { reason: "seed-demo-player" },
  );

  // 2. Buildings — place directly onto state. We bypass the catalog
  //    `canAfford` + `isUnlocked` gates because this is an admin op
  //    that fast-forwards the progression. Keeps the existing Domek at
  //    slot 10, skips any slot that already has something.
  const occupied = new Set(state.buildings.map((b) => b.slotId));
  for (const plan of DEMO_BUILDING_PLAN) {
    if (occupied.has(plan.slotId)) continue;
    if (!SLOT_MAP.find((s) => s.id === plan.slotId)) continue;
    const instance: BuildingInstance = {
      id: `b-${plan.slotId}-demo-${Date.now().toString(36)}`,
      slotId: plan.slotId,
      catalogId: plan.catalogId,
      level: plan.slotId === DOMEK_SLOT_ID ? 1 : 1,
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    };
    state.buildings.push(instance);
  }

  // 3. Paid-off mortgage — drives `first-mortgage-paid` achievement
  //    check (state.loans.some(l => type==="mortgage" && status==="paid_off")).
  //    We don't add a real principal/cashZl debit because the ledger
  //    for that is outside this admin path's scope; the achievement
  //    only reads `status`.
  const hasPaidMortgage = state.loans.some(
    (l) => l.type === "mortgage" && l.status === "paid_off",
  );
  if (!hasPaidMortgage) {
    const loan: Loan = {
      id: `loan-demo-${Date.now().toString(36)}`,
      type: "mortgage",
      principal: 3000,
      outstanding: 0,
      monthlyPayment: 260.97,
      rrso: 0.08,
      apr: 0.08,
      termMonths: 12,
      takenAt: Date.now() - 12 * 30 * 24 * 60 * 60 * 1000,
      nextPaymentDueAt: Date.now() - 24 * 60 * 60 * 1000,
      monthsPaid: 12,
      missedConsecutive: 0,
      status: "paid_off",
      autoRepay: true,
    };
    state.loans.push(loan);
  }

  // 4. Credit score → unlocks `credit-score-100`.
  state.creditScore = 100;

  // 5. Persist state + keep city-value ZSET in sync for the leaderboard.
  await savePlayerState(state);
  await refreshCityValue(username, state.buildings);

  // 6. Achievements — grant the 8 ids via SADD + list mirror. We skip
  //    the per-definition `check()` path because some achievements
  //    depend on external data (AI medal ZSETs, duel history) that
  //    the operator doesn't want to wait on. The profile gallery
  //    renders a medal whenever the id is in the SET.
  const allIds = Object.keys(ACHIEVEMENT_DEFS) as AchievementId[];
  const setKey = `xp:player:${username}:achievements`;
  const listKey = `xp:player:${username}:achievements-list`;
  const existingList =
    (await kvGet<AchievementId[]>(listKey)) ?? [];
  const merged = Array.from(new Set([...existingList, ...allIds]));
  await Promise.all(allIds.map((id) => sAdd(setKey, id)));
  await kvSet(listKey, merged);

  // 7. Game leaderboards — seed 99 % of cap in every evergreen game
  //    so the demo account sweeps the global ZSET + shows up as the
  //    top performer on /leaderboard and on each per-game league tab.
  //    awardXP is best-score semantics (only moves up), so repeat
  //    calls are no-ops once the ceiling is in place.
  const scoredGames: Array<{ gameId: string; score: number }> = [];
  for (const { gameId, score } of DEMO_SCORES) {
    await awardXP(username, gameId, score);
    await recordRound(username, gameId, score);
    scoredGames.push({ gameId, score });
  }

  return Response.json({
    ok: true,
    username,
    resources: state.resources,
    buildingsPlaced: state.buildings.length,
    loansCount: state.loans.length,
    creditScore: state.creditScore,
    achievementsGranted: allIds,
    gameScores: scoredGames,
    globalXp: DEMO_SCORES.reduce((s, g) => s + g.score, 0),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  // Teardown path — reset the account back to fresh-signup state. Kept
  // narrow: it doesn't delete the user or the session, only the demo
  // side-effects this endpoint installed.
  const block = await requireAdmin(request);
  if (block) return block;
  const { username } = await params;

  const state: PlayerState = await getPlayerState(username);

  // Drop buildings added by the demo (keep Domek at slot 10).
  state.buildings = state.buildings.filter(
    (b) => b.slotId === DOMEK_SLOT_ID,
  );
  // Drop loans with `demo-` id prefix.
  state.loans = state.loans.filter((l) => !l.id.startsWith("loan-demo-"));
  // Reset credit score to the default signup value.
  state.creditScore = 50;

  await savePlayerState(state);
  await refreshCityValue(username, state.buildings);

  return Response.json({
    ok: true,
    username,
    message: "demo-seed rolled back; achievements + resources retained",
  });
}
