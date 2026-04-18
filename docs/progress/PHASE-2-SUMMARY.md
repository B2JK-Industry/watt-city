# Phase 2 summary — Game variety + economy depth

**Window**: 2026-04-18 23:45 → 2026-04-19 00:28 Europe/Warsaw.
**Branch**: `watt-city` · base `c7a8bbd` · tip `073d268`.
**Tests**: 109 passing across 14 vitest files · build green.

## What shipped (all 9 sections)

### 2.1 AI kinds (6 of 12)
6 new kinds: `memory`, `fill-in-blank`, `calc-sprint`, `budget-allocate`,
`what-if`, `chart-read`. Each has a zod schema, Sonnet system-prompt
rules, Haiku translation-lock rules, a React client under
`components/games/ai-*-client.tsx`, and `xpCapForSpec` wiring.
**Deferred (XL)**: portfolio-pick, dialog, negotiate, invest-sim,
tax-fill — each needs a dedicated subsystem (market sim, dialog tree,
conversational sub-agent, auto-running chart, PL tax form data).

### 2.2 Themes (20 added, pool now 40)
Phase 2.2.1 + 2.2.2 full lists implemented with the new kinds as
natural hosts. Metadata fields `age` (9-12 / 13-15 / 16-19 / any) +
`subject` (savings / credit / investing / taxes / energy / budgeting /
payments / insurance / realestate / everyday) carry on all 20 new
entries. Themed-weeks (2.2.4) deferred.

### 2.3 Economy depth
glass / steel / code flipped `mvpActive:true` so their descriptions are
green in the ResourceBar and the earn-to-unlock catalog accepts them as
valid unlock gates. `lib/economy.ts` centralises live-tunable knobs
with `readEconomy()` overlay over `xp:config:economy`. Daily per-resource
earn cap (200 default) enforced by the score route via
`capDailyYield` — response carries `capped` flag for UI. Decay (2.3.6)
skipped per D9 default.

### 2.4 Catalog expansion + multipliers
Huta szkła / Bank lokalny / Biblioteka / Walcownia / Fotowoltaika /
Software house / Spodek all live. Added Gimnazjum sportowe (reflex +20%)
and Centrum nauki (order-match +20%) + 3 decoratives (kościół, park,
fontanna). `lib/multipliers.ts` with `scoreMultiplier()` (capped at 5×)
runs at score time for the kind-grouped multipliers. Skarbówka T5
deferred until `tax-fill` ships; Stacja kolejowa T7 deferred until
Phase 3.2 marketplace lands.

### 2.5 Leveling + tier-up
`lifetimeStatsFor(state, instanceId)` derives totalProduced / upgrades /
ageHours from the recent ledger — no schema migration.
`acknowledgedTier` field on PlayerState + `/api/me/tier` GET/POST +
`TierUpToast` confetti pop per transition. Build-time gating (2.5.2)
and speed-up tokens (2.5.3) deferred (kid-UX friction; medal-economy
dependency).

### 2.6 Loan products + bankructwo
`LOAN_CONFIGS` dispatches `mortgage` / `kredyt_obrotowy` /
`kredyt_konsumencki` (20% RRSO, caution-flagged for UI) / `leasing`.
`takeLoan` generic entry point; `/api/loans/take-generic` endpoint.
`bankructwoReset` wipes non-Domek buildings, marks loans seized, score →
0; `/api/loans/bankructwo` with 1-per-hour rate limit.
Kredyt inwestycyjny (2.6.4) + loan comparison tool (2.6.5) deferred.

### 2.7 Notifications
`lib/notifications.ts`: in-app feed (Redis list, capped 200),
per-user prefs, `inQuietHours` with wrap-midnight window (21–08 local
default). `components/notification-bell.tsx` in site-nav with 45s poll +
unread-badge + click-to-mark-seen. Tier-up and mortgage-missed events
push to the feed. `public/service-worker.js` stub ships inactive; ADR
`docs/decisions/002-push-notifications-vapid.md` explains the VAPID +
GDPR-K gate. Email digest (2.7.5) skipped.

### 2.8 Achievements
`lib/achievements.ts`: 8 definitions (spec asked for 7,
backlog items 2.8.2–2.8.7 plus `ai-medals-100` as a higher tier).
`sweepAchievements(username)` runs on score, /api/me/achievements, and
`/profile` load. Public-share page at `/profile/[username]` shows only
earned badges and tier.

### 2.9 Onboarding
`components/onboarding-tour.tsx`: 4-step modal (welcome → wallet →
city → first game) in all 4 langs, skippable, persisted via
`/api/me/profile`. 10 avatars via `lib/avatars.ts`. `ProfileEdit`
client component on `/profile` lets users pick avatar + set display
name. 2.9.2 REJECTED per backlog. 2.9.3 forced-first-game: covered by
the tour's final step linking to `/games/finance-quiz`.

## Commits on this branch since Phase 1 tip

`c7a8bbd..073d268` — 10 feature commits + 1 docs.

## Open blockers for user

- Same as Phase 1: Vercel deploy, env vars, cron-job.org.
- Nothing new from Phase 2 — every subsystem has a documented deferral
  if it hits external constraints.

## Next session

- Phase 3 begins immediately (same session continues).
- 3.1 Friends → 3.2 Marketplace → 3.3 Class mode → 3.4 Parents → 3.5 Community.
- Then Phase 4 scaffolding (no real PKO API calls — mocks only).
- Then Phase 5 admin dashboard + moderation + analytics + ops tools.
