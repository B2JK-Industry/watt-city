/* Watt City player state — the server-authoritative wallet + building list
 * that every gameplay path reads and mutates. Shipping order (per backlog):
 *
 * 1.2 — resources + ledger (this file today)
 * 1.3 — building catalog + instances (adds `buildings` array; placed later)
 * 1.4 — cashflow tick engine (adds `lastTickAt`, tick fn)
 * 1.5 — loans (adds `loans` array, credit score)
 *
 * Every entry in the ledger is an append-only, idempotent record of a
 * Resources delta. The aggregate `PlayerState.resources` is the cached sum,
 * rehydratable from the ledger if Redis loses the JSON blob. Dedupe is
 * handled by `xp:player:<u>:ledger-dedup` (Redis SET) keyed by
 * `${kind}:${sourceId}`.
 */

import {
  kvGet,
  kvSet,
  lPush,
  lRange,
  lLen,
  lTrim,
  sAdd,
} from "@/lib/redis";
import {
  ZERO_RESOURCES,
  addResources,
  clampResources,
  type Resources,
} from "@/lib/resources";

// Kinds cover every cashflow path. Keep in sync with ARCHITECTURE.md §2.5.
export type LedgerKind =
  | "score"
  | "tick"
  | "build"
  | "demolish"
  | "upgrade"
  | "loan_disburse"
  | "loan_payment"
  | "loan_default"
  | "marketplace_sell"
  | "marketplace_buy"
  | "admin_grant"
  | "achievement"
  | "backfill";

export type LedgerEntry = {
  id: string; // random nanoid — useful when surfacing in UI
  ts: number;
  kind: LedgerKind;
  delta: Partial<Resources>;
  reason: string;
  sourceId?: string; // dedupe key input (kind + sourceId → one-time apply)
  meta?: Record<string, unknown>;
};

export type BuildingInstance = {
  id: string;
  slotId: number;
  catalogId: string;
  level: number;
  builtAt: number;
  lastTickAt: number;
  cumulativeCost: Partial<Resources>; // for 50% demolish refund + seize priority
};

export type LoanStatus =
  | "active"
  | "paid_off"
  | "defaulted"
  | "paid_off_via_seizure";

export type LoanType =
  | "mortgage"
  | "leasing"
  | "kredyt_obrotowy"
  | "kredyt_konsumencki"
  | "kredyt_inwestycyjny";

export type Loan = {
  id: string;
  type: LoanType;
  principal: number;
  outstanding: number;
  monthlyPayment: number;
  rrso: number;
  apr: number;
  termMonths: number;
  takenAt: number;
  nextPaymentDueAt: number;
  monthsPaid: number;
  missedConsecutive: number;
  status: LoanStatus;
};

export type PlayerState = {
  username: string;
  resources: Resources;
  buildings: BuildingInstance[];
  loans: Loan[];
  creditScore: number;
  lastTickAt: number;
  version: number; // schema version for migrations
  createdAt: number;
  /** Last tier the client was informed about. When computePlayerTier(buildings)
   *  exceeds this, layout surfaces the tier-up celebration on next render then
   *  bumps this field. Missing on legacy records — treated as 1. */
  acknowledgedTier?: number;
  /** Onboarding flags — Phase 2.9. Default-unset on legacy records. */
  onboarding?: {
    tourSeen?: boolean;
    mortgageTutorialSeen?: boolean;
    firstGamePlayed?: boolean;
  };
  /** Profile — Phase 2.9.5. avatar is an id from a pre-made set; displayName
   *  is the kid-chosen render name (≠ username). */
  profile?: {
    avatar?: string;
    displayName?: string;
  };
  /** V2 R2.1 — timestamp when the current watt deficit began. null/undefined
   *  means the city is balanced or in surplus. Set/cleared by
   *  `refreshWattDeficit()` at every build/upgrade/demolish and tick entry.
   *  Used to compute brownout severity and the BLOCKER-1 bankruptcy-gate
   *  grace window (72h). */
  wattDeficitSince?: number | null;
};

const STATE_KEY = (username: string) => `xp:player:${username}`;
const LEDGER_KEY = (username: string) => `xp:player:${username}:ledger`;
const DEDUP_KEY = (username: string) => `xp:player:${username}:ledger-dedup`;

const PLAYER_SCHEMA_VERSION = 1;

// Keep the ledger bounded. Older entries are pruned after cap; balance
// reconstruction from truncated ledger is approximate, so we never rely on
// full replay — the cached `resources` is authoritative.
const LEDGER_CAP = 500;

export function emptyPlayerState(username: string, now = Date.now()): PlayerState {
  return {
    username,
    resources: { ...ZERO_RESOURCES },
    buildings: [],
    loans: [],
    creditScore: 50,
    lastTickAt: now,
    version: PLAYER_SCHEMA_VERSION,
    createdAt: now,
    acknowledgedTier: 1,
    wattDeficitSince: null,
  };
}

export async function getPlayerState(username: string): Promise<PlayerState> {
  const existing = await kvGet<PlayerState>(STATE_KEY(username));
  if (!existing) return emptyPlayerState(username);
  // Gentle migration: top up missing keys when we add new ones later.
  return {
    ...emptyPlayerState(username, existing.createdAt ?? Date.now()),
    ...existing,
    resources: { ...ZERO_RESOURCES, ...existing.resources },
  };
}

export async function savePlayerState(state: PlayerState): Promise<void> {
  await kvSet(STATE_KEY(state.username), state);
}

// ---------------------------------------------------------------------------
// Ledger append + idempotency
// ---------------------------------------------------------------------------

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type CreditResult = {
  applied: boolean; // false → duplicate (sourceId already seen)
  entry: LedgerEntry | null;
  resources: Resources; // balance after apply (or before, if duplicate)
};

// Append a ledger entry if `${kind}:${sourceId}` is new. Balance (resources)
// is updated in-place; caller receives the fresh `PlayerState.resources`.
// Passing a blank sourceId skips dedupe (use only for one-time flows like
// admin grants where the caller already enforces uniqueness).
export async function creditResources(
  state: PlayerState,
  kind: LedgerKind,
  delta: Partial<Resources>,
  reason: string,
  sourceId?: string,
  meta?: Record<string, unknown>,
): Promise<CreditResult> {
  const normalized = clampResources(delta);
  if (Object.keys(normalized).length === 0) {
    // nothing to credit — idempotent no-op
    return { applied: false, entry: null, resources: state.resources };
  }

  if (sourceId) {
    const dedupKey = `${kind}:${sourceId}`;
    const isNew = await sAdd(DEDUP_KEY(state.username), dedupKey);
    if (!isNew) {
      return { applied: false, entry: null, resources: state.resources };
    }
  }

  const entry: LedgerEntry = {
    id: randomId(),
    ts: Date.now(),
    kind,
    delta: normalized,
    reason,
    sourceId,
    meta,
  };

  state.resources = addResources(state.resources, normalized);
  await lPush(LEDGER_KEY(state.username), entry);
  // cheap pruning — cap the list length to LEDGER_CAP (newest kept)
  const len = await lLen(LEDGER_KEY(state.username));
  if (len > LEDGER_CAP) {
    await lTrim(LEDGER_KEY(state.username), 0, LEDGER_CAP - 1);
  }
  await savePlayerState(state);
  return { applied: true, entry, resources: state.resources };
}

export async function recentLedger(
  username: string,
  n = 20,
): Promise<LedgerEntry[]> {
  return await lRange<LedgerEntry>(LEDGER_KEY(username), n);
}
