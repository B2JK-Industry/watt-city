# Phase 3 summary — Social, schools, parents

**Window**: 2026-04-19 00:28 → 00:42 Europe/Warsaw.
**Branch**: `watt-city` · base `073d268` · tip `c19e3d0`.
**Tests**: 140 passing across 18 files · build green.

## What shipped

### 3.1 Friends
- lib/friends.ts: Redis-backed graph (friends / requests / inbox) with
  list-of-truth + SADD shadow, send / accept / reject / remove helpers;
  reverse-request auto-accept.
- Privacy: profileVisibility=friends default (GDPR-K opt-in),
  cashflowVisible=false default. Three tiers: public / friends / private.
- /api/friends, /friends, /friends/[username] — visit friend's city gated
  by canViewProfile; city-scene SVG rendered read-only.
- 10 tests.

### 3.2 Marketplace
- lib/marketplace.ts: Listing type, createListing (escrow-pull building
  from slots), buyListing (5% fee → skarb, 95% to seller, listing-fee
  refund on sale), cancelListing. T7+ gate; 3 trades/day; 5× median
  sanity check; 7-day listing TTL.
- /api/market/{listings,list,buy/[id],cancel/[id],history}.
- /marketplace page with list/buy/cancel/history UI.
- 3 new tests (tier gate, full list→buy ledger maths, cancel restore).
- Deferred: 3.2.4 counter-offer thread.

### 3.3 Class mode
- lib/roles.ts shared role primitives (teacher/parent).
- lib/class-leaderboard.ts: derived filter over global ZSET.
- Teacher creates class → 30 unique join codes; student joins with one
  (single-use). Curriculum tags + Q-of-week are teacher-owned fields.
- /api/class, /class, /class/[code] — teacher sees join codes; students
  see masked codes + class leaderboard.
- 4 tests.
- Deferred: 3.3.6 PDF export (stubbed as "JSON coming"); 3.3.7 curriculum
  tag schema shipped, "podstawa programowa" alignment needs teacher input.

### 3.4 Parent dashboard
- lib/roles.ts parent linkage: kid generates 24h one-shot code → parent
  POSTs code to /api/parent → bidirectional link.
- Per-child privacy filters (hideLedger/hideDuelHistory/hideBuildings).
- /api/parent, /parent, /parent/[username] — parent reads only children
  they're linked to; privacy flags respected server-side.
- 5 tests.
- Deferred: 3.4.3 email digest (no SMTP), 3.4.5 PKO Junior mirror
  (Phase 4), 3.4.6 real-money allowance (legally sensitive).

### 3.5 Community
- lib/community.ts: cheer (🎉 reactions, same-day dedup, notification to
  target), comments (2..400 chars, slur denylist, ban-gated),
  reportComment (SADD-dedup, auto-hide at 3 reports), admin hide/unhide
  + ban/unban with UNBAN_KEY override pattern.
- /api/community/{cheer,comments/[gameId],report/[commentId]}.
- components/game-comments.tsx mounted on AI game pages with per-comment
  report button.
- 13 tests.
- Deferred: 3.5.5 profile background/music (cosmetic; audio gated by
  quiet-hours consideration).

## Open blockers
Same as Phase 1 + 2 — deploy / env / pinger. Nothing new.

## Next

Phase 4 begins immediately:
- 4.1 Theme system + PKO skin + mascot stub.
- 4.2 PKO Junior mock API + Mirror flow.
- 4.3 Legal scaffolding (docs only, no code).
