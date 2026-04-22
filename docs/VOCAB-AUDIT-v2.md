# XP-Arena vocabulary audit — V2 refactor (R1.4 / REVIEW HIGH-9)

**Scope**: every occurrence of `xp`, `arena`, `tier`, `rank`, `level`,
`title`, `hero` across `app/`, `lib/`, `components/`, `lib/locales/`,
`docs/`.

**Classification**:
- **keep** — V1 persistence or generic computer-English term; leave alone
- **rename** — user-facing PL/UK/CS/EN text (already mostly done Phase 1.8)
- **redirect** — internal symbol that should migrate to a V2 city-* equivalent before sunset

This document blocks R9.3.4 V1 sunset — every "redirect" row must either
be migrated or explicitly re-classified as "keep" before that ADR triggers.

---

## 1. Redis key namespace

### 1.1 Keep (V1 persistence, already guarded by BLOCKER-3)

| Key | Owner | Why keep |
|---|---|---|
| `xp:leaderboard:global` | `lib/leaderboard.ts` | BLOCKER-3: V1 read-only during rollout. Do NOT rename. |
| `xp:leaderboard:game:<id>` | `lib/leaderboard.ts` | Per-game bests — dictionary backer; stable identity. |
| `xp:player:<u>` | `lib/player.ts` | Canonical player state. Rename = migration work with no value. |
| `xp:player:<u>:ledger` | `lib/player.ts` | History append-log. |
| `xp:player:<u>:ledger-dedup` | `lib/player.ts` | Idempotency set. |
| `xp:player:<u>:achievements` | `lib/achievements.ts` | Achievement SET. |
| `xp:user:<u>` | `lib/auth.ts` | Auth record. |
| `xp:stats:<u>` | `lib/user-stats.ts` | Per-game play counters. |
| `xp:ai-games:*` | `lib/ai-pipeline/publish.ts` | Rotating AI catalog. |
| `xp:notifications:<u>` | `lib/notifications.ts` | In-app feed. |
| `xp:marketplace:*` | `lib/marketplace.ts` | P2P marketplace (Phase 3.2). |
| `xp:pko-audit:<u>` | `lib/pko-junior-mock.ts` | Regulatory retention (5y). |
| `xp:config:*` | multiple | Admin overrides. |
| `xp:ev:*` | `lib/analytics.ts` | First-party events (no third-party). |
| `xp:parental-consent:<u>` | `lib/gdpr-k.ts` | GDPR-K evidencing (5y retention). |
| `xp:tick-lock:<u>` | `lib/tick.ts` | Single-flight guard. |
| `xp:rotation-lock` | `lib/ai-pipeline/publish.ts` | AI rotation SF lock. |
| `xp:ratelimit:*` | `lib/rate-limit.ts` | Fixed-window buckets. |
| `xp:ops:*` | `lib/ops-alerts.ts` | Alert dedupe. |

**Rationale**: Redis keys are internal identifiers. Renaming costs a full
migration + 4-week parallel window. The "xp:" prefix is a vestigial
namespace not visible to users. Cost ≫ benefit.

### 1.2 Add (V2 new)

| Key | Owner | Why new |
|---|---|---|
| `xp:leaderboard:city-value` | `lib/city-value.ts` | V2 canonical rank per BLOCKER-3. |
| `xp:migration:v2:*` | (R9.1 forthcoming) | Migration sentinels + per-user reports. |
| `xp:feature-flags` | (R9.3.1 forthcoming) | Percentile-based config. |

---

## 2. Source symbols

### 2.1 Redirect (move to V2 city-\* equivalents)

Status reflected 2026-04-22 against `main` @ `69ee7c9`:

| Symbol | Location | V2 redirect | Status |
|---|---|---|---|
| `titleForLevel` | ~~`lib/level.ts`~~ | V2 uses `cityLevelFromBuildings.currentUnlocks` | **DELETED** (V3.1) |
| `tierForLevel` | ~~`lib/level.ts`~~ | same | **DELETED** (V3.1) |
| `CITY_TIERS` | ~~`lib/level.ts`~~ | → `LEVEL_UNLOCKS` in `lib/city-level.ts` | **DELETED** (V3.1) — guarded by `lib/tier-names-purge.test.ts` |
| `levelFromXP` | `lib/level.ts` | Kept; now the XP ring helper on the dashboard + leaderboard formatter, not the primary progression | **KEPT** — see header comment in `lib/level.ts` |
| `formatWatts` | `lib/level.ts` | Still in use for leaderboard rows (display-only) | **KEPT** for now — rename deferred |
| `AwardResult.isNewBest` | `lib/leaderboard.ts` | natural term | **KEPT** |
| `dashboard.tsx` "Waty łącznie" / "Pozycja" | `components/dashboard.tsx` | replaced with "City Level" card | **DONE** (V3.1) |
| `TierUpToast` component | `components/tier-up-toast.tsx` | renamed → `LevelUpToast` + dict keys swept | **DONE** (file still named `tier-up-toast.tsx` for import stability; component export is the new one) |

### 2.2 Keep (internal mechanics — not user-facing)

| Symbol | Why keep |
|---|---|
| `xpCap` / `xpPerCorrect` / `xpPerWord` / `xpPerMatch` / `xpPerOnTarget` | Game-spec field names; shared across AI pipeline + evergreen games. Renaming touches every game client. Field semantic is "score points per correct answer" — rename to `pointsPer*` only if the spec schema ever breaks for another reason. |
| `awardXP()` | `lib/leaderboard.ts` function. Writes to xp:leaderboard:global (V1 path preserved per BLOCKER-3). Internal symbol; not user-facing. |
| `xpIntoLevel` / `xpForLevel` / `xpToNext` | Fields on `LevelInfo` type. Used only by V1 dashboard path. Will die with `titleForLevel` once V2 ships. |
| `LevelInfo` type itself | Same — V1 scope; V2 replaces with `CityLevel` in `city-level.ts`. |
| `tier` in `LOAN_CONFIGS` items if they exist | LOAN_CONFIGS doesn't use `tier` keyword — OK. |
| `tier` in `BuildingCatalogEntry.tier` | Building-catalog tier is a numeric category (1-10) — stable design vocabulary across the Backlog. Keep. |
| `rank` in `zRank` / per-game `rank` | "Position in a sorted ranking" — generic; not XP-Arena-branded. |
| `duel-rank` references (if any) | Duel rank is a standalone mechanic (R5, deferred); keep its naming. |
| `hero` in `hero` section of a page (hero card, hero image) | UX convention, not XP-Arena branded. |
| `Arena` in PR descriptions or git history | Historical only. |

### 2.3 Rename (user-facing strings)

Most PL/UK/CS/EN text was swept in Phase 1.8 ("XP Arena" → "Watt City").
Remaining occurrences:

| File | Line context | Action |
|---|---|---|
| `lib/locales/pl.ts`, `uk.ts`, `cs.ts`, `en.ts` | GDPR data-controller copy references `github.com/…xp-arena-ETHSilesia2026` as the repo URL | KEEP — that's the literal repo URL, not a product name. |
| `app/o-platforme/page.tsx` | Three GitHub links to `xp-arena-ETHSilesia2026` | KEEP — literal repo URL. |
| `app/layout.tsx` footer | GitHub source link | KEEP. |
| `lib/content/finance-quiz.ts` | Legacy XP-style copy | Re-audit during content refresh (R10.1.1) — low priority. |
| `lib/ai-pipeline/generate.ts` | Prompt: "You are the content designer for XP Arena" | RENAME to "Watt City" in the system prompt for consistency. Do NOT rename existing Redis data. |
| `docs/AGENT-KICKOFF.md`, `docs/SKO-VISION.md`, etc. | Historical docs explaining the XP Arena → Watt City pivot | KEEP — narrative history. |

---

## 3. Specific cleanups shipped as part of V2 + V3

| Date | Symbol | Commit | Result |
|---|---|---|---|
| V3.1 sprint | `titleForLevel` → removed; unlock list now lives in `LEVEL_UNLOCKS[level]` | V3.1 batch | DONE |
| V3.1 sprint | `tierForLevel` → `cityLevelFromBuildings()` | V3.1 batch | DONE |
| V3.1 sprint | `CITY_TIERS` array deleted; guarded by `lib/tier-names-purge.test.ts` | V3.1 batch | DONE |
| V3.1 sprint | `TierUpToast` renamed to level-up semantics; file kept for import continuity | V3.1 batch | DONE |
| 2026-04-22 `2964d71` | user-facing "XP Arena" strings (landing, o-platforme, emails) swept → "Watt City" | `fix(brand)` | DONE |
| pending | `lib/ai-pipeline/generate.ts` system prompt says "XP Arena" in one place | vocab-cleanup follow-up | TODO (low priority per §2.3) |

---

## 4. Sunset gate

Before R9.3.4 V1 sunset fires, EVERY **redirect** row in §2.1 must be
either completed or re-classified as "keep with rationale". This file is
the source of truth.

## 5. What we do NOT do in this session

- Rename V1 Redis keys (BLOCKER-3 constraint — 4-week parallel window).
- Rename game-spec `xpPer*` fields (blast radius too big for MVP refactor).
- Rename repository itself (GitHub repo URL is the `xp-arena-ETHSilesia2026` literal).
