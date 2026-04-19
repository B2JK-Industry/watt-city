# ADR 004 — Duel removal (V3.6) + future "Mądry Wybór" design sketch

**Date**: 2026-04-19
**Status**: accepted (landed in V3.6)
**Depth**: `lib/duel.ts` → `lib/duel.legacy.ts` (git history retained); `app/duel/`, `app/api/duel/`, `components/duel/` removed.

## Context

The `/duel` feature (6-round math sprint, code-invite PvP) was shipped in XP-Arena era. Independent audit (V3.0) flagged it as orphaned:

- No ledger credit from duel wins (no coins/bricks/cashZl), no city-value update, no achievement.
- No navigation pipeline into city progression (duel scores don't feed multipliers, don't help tier/level up).
- Nav link → page → "play" → win → *nothing on the dashboard changed* = quit-the-app UX.
- Pedagogically weak: 10s-per-round math sprint operant-conditions speed over deliberation, the opposite of the finance-education frame.

Independent HIGH-5/6/7 findings in the V2 review also called for rework of the duel mechanic. V3 scope-cut deferred a full rework; V3.6 accepts the deletion as the honest minimum.

## Decision

Remove `/duel` entirely from V3. Keep `lib/duel.ts` in git history renamed as `lib/duel.legacy.ts` with a warning header. A future "Mądry Wybór" feature (different mechanic, same slot in the surface area) is sketched below but intentionally out of V3 scope.

## Consequences

- Existing in-flight duels on watt-city at V3 deploy become 404. Each duel's TTL is 6h so any duel started before the deploy expires naturally within a day — we accept this minor UX friction.
- Data retention: `xp:duel:*` Redis keys are left untouched (their TTL expires them). The privacy page's duel row removed since no new duel data is created.
- 4-lang dict `duel.*` keys retained (we don't churn dicts mid-cycle) but unused.

## Future: "Mądry Wybór" design sketch

If we revisit a peer-compare feature, the design target is **async deliberation**, not synchronous speed-sprint. Sketch:

- Daily scenario delivered server-side: e.g., "Alicja zarobiła 500 zł, dostała mieszkanie w spadku, potrzebuje decydować: A wziąć kredyt i kupić auto, B wpłacić 500 na fundusz awaryjny, C zainwestować w ETF." Four 4-5 sentence options.
- Player picks, rates (thumbs up on others' picks), sees aggregate distribution ("73% graczy wybrało B").
- Scoring: no "correct answer". Points for volume of deliberation (reading time ≥ 4s, not ≤ 1s). Bonus for matching educational-consensus option (tagged by adult-curator).
- No timer. 60s soft suggestion. Anti-speed-bonus per HIGH-7.
- Ledger credit: modest (~20 coins), fires `mortgage_*` pedagogy events.
- Moderation: scenarios human-curated from a pool (MEDIUM-17). No per-request Claude calls in hot path.

Scope for this is V4+; the V3 removal is the foundation that cleans the nav before we layer any replacement.

## Rollback plan

Should duel need restoration for a classroom deployment: `git mv lib/duel.legacy.ts lib/duel.ts` and restore `app/duel/` + `app/api/duel/` + `components/duel/` from git history (commits prior to the removal PR). No data migration needed (TTL-based Redis keys).
