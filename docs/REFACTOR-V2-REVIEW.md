# Watt City Refactor Backlog — Independent Review

**Reviewer**: senior tech lead + game designer  
**Target**: `/tmp/REFACTOR-BACKLOG.md` (v1 draft)  
**Verdict**: Do NOT implement as-is. 3 BLOCKER findings + 9 HIGH + 6 MEDIUM. Address BLOCKERs by editing the plan itself before the agent starts work.

## BLOCKER-1 — Watt-deficit cascade traps players

**Category**: Risk  
**Where**: R2.1.2  
**Finding**: Non-energy buildings go offline after 24h watt deficit → produce no coins/bricks → player can't afford energy-building upgrade → permanent lock. Compounds with R6.3.2 happiness penalty and R2.2.1 loan auto-debit — can trigger R7.3.1 bankruptcy in three ticks. Violates Principle 6 (never permanent loss).  
**Fix**: Brownout to 25% yield instead of 0. Persistent amber banner with one-tap rescue "Postav Mała elektrownia (-150 coins)". Gate bankruptcy from triggering while root cause is watt deficit for ≥48h.

## BLOCKER-2 — Resource migration 1:1 redistributes wealth

**Category**: Risk  
**Where**: R1.1.3  
**Finding**: glass/steel/code → coins at 1:1. Resources had wildly different yield rates; whales with 2000 code jump massively in rank, casuals with 50 glass barely notice. No audit, no cap, no reversal path.  
**Fix**: Compute coin-equivalent from ledger data (median coin/h in games producing each resource). Use that as conversion. Emit per-user migration report (before/after balances, rank delta). Store v1 snapshot for 30 days to allow individual reversals. Cap any single user swing at ±2× pre-migration coin balance.

## BLOCKER-3 — Leaderboard rename loses rank during rollout

**Category**: Risk  
**Where**: R1.3.1, R9.3  
**Finding**: `xp:leaderboard:global` renamed → repopulated from building value, but 4-week dual-rollout means V1 users see city-value ranks regardless of flag. 100h XP grinders with no buildings drop to rank near zero day one.  
**Fix**: Keep `xp:leaderboard:global` alive read-only 4 weeks. Write new ranks to `xp:leaderboard:city-value`. V1 reads old, V2 reads new. Seed initial city-value with `max(currentXP × 0.5, computedBuildingValue)` so early adopters not penalized.

## HIGH-4 — Stacked multipliers produce 0.24× to 3.96× variance

**Category**: Coherence  
**Where**: R4.1 × R4.2 × R4.3 × R6.2.1 × R6.3.2  
**Finding**: diminishing (×0.25-1.0) × streak (×1.0-1.5) × dailySpecial (×2) × civic (×1.2) × happiness (×0.8-1.1) = 16× variance on same game. Breaks post-game transparency goal.  
**Fix**: Cap total multiplier at ×3. Post-game modal shows breakdown ladder: "Base 50 × first-play 1.0 × streak 1.2 × happy 1.1 = 66". Regression test: displayed breakdown sums to credited amount.

## HIGH-5 — No plan for in-flight duels at cutover

**Category**: Missing  
**Where**: R5.1.1  
**Finding**: Duel logic replaced wholesale. Duels are synchronous, can't dual-render. Cross-version duel (V1 vs V2) has undefined behavior.  
**Fix**: Add R5.1.5: tag queued/active duels with `schemaVersion: 1|2` at start. Refuse join v1 vs v2. Drain v1 queue 15 min before flip. Display "Pojedynki niedostupné — migrácia (~15 min)" toast during drain. In-flight duels auto-cancel after 15 min with full rank refund.

## HIGH-6 — AI-generated duel scenarios have no moderation/age-gate

**Category**: Missing / Risk  
**Where**: R5.1.2  
**Finding**: Claude Sonnet generating scenarios unsupervised for 10-year-olds is unsafe. Easily produces alcohol/gambling/predatory-lending content. Also no localization plan (machine-translated financial terminology is wrong across PL/CZ/UA).  
**Fix**: Before any generation: (1) explicit age-appropriate allowlist (school, bikes, phones, summer jobs) + denylist (alcohol, gambling, adult relationships). (2) Every scenario reviewed: automated topic classifier + human approval before dailySpecial. (3) PL canonical + human-translated. (4) Budget ~10-20 human-reviewed, not 50 auto-published.

## HIGH-7 — Duel speed-bonus contradicts "pause before spending" lesson

**Category**: Pedagogy  
**Where**: R5.1.1, R5.1.3  
**Finding**: "Most correct in fastest time" rewards split-second financial decisions — the exact opposite of what banks want. Training kids to pick "save" in 2 seconds for a speed bonus is operant-conditioning the wrong reflex.  
**Fix**: Remove speed bonus OR invert it: sweet spot at 4-8s, penalize <2s as "didn't read". Alternative: untimed per round, 60s match cap for fairness. Rename "Duel" → "Mądry Wybór" (smart choice) to reinforce frame.

## HIGH-8 — Bankruptcy framing too harsh for kids + classroom context

**Category**: Risk / Kid-appropriateness  
**Where**: R7.3.1, R7.3.2  
**Finding**: "Prehral si toto mesto" + mass building seizure = quit-the-app event for a 10-year-old with 15h invested. In classroom, a bankrupted kid cries = teacher rage + support tickets.  
**Fix**: Reframe "restructuring" not "lost". Keep T1-T3 buildings (not just Domek), seize only T4+. One-time "mentor help" per account — PKO-branded 0% emergency loan = 1 missed payment, available after 2nd miss, once per 30 days. Teacher-mode flag: classroom deployments disable bankruptcy, replaced by "red alert" requiring rebalance within 3 days.

## HIGH-9 — XP-Arena vocabulary sweep not scoped

**Category**: Completeness  
**Where**: R1 (implicit, not a ticket)  
**Finding**: R1 renames a few keys but doesn't enumerate ALL remaining XP vocabulary: Redis keys (`xp:*` on dozens), env vars, telemetry events (`xp_earned`), component names (`XpChip`, `LevelBadge`), API routes, analytics dashboards, dict keys. Grep pass implied but not ticketed.  
**Fix**: Add R1.4 "XP-Arena vocabulary sweep". Deliverable: grep report of every `xp`, `arena`, `tier`, `rank`, `level`, `title` in source/config/dicts/analytics. Classify rename/keep/redirect. Blocks R9.3.4 sunset.

## HIGH-10 — GDPR-K / parental-consent impact not scoped

**Category**: Missing  
**Where**: R7.2 covers in-app disclaimer; nothing about consent docs  
**Finding**: New duel scenarios mentioning money/debt/consumption = behavioral data processing for <13 users. In PL, UODO may consider material change requiring re-consent. Backlog has no legal review gate.  
**Fix**: Add R9.4 "Legal & consent review". Deliverables: (1) revised ToS/Privacy Policy covering new purposes, (2) triggered re-consent flow for existing <13 on first V2 login, (3) PKO legal sign-off on duel scenarios + loan language, (4) `docs/decisions/NNN-gdprk-v2-refactor.md`. Block V2 launch until complete.

## HIGH-11 — "4-6 hours autonomous" is off by 3×

**Category**: Feasibility  
**Where**: doc header estimate  
**Finding**: 7 XL items, one (R6.1.1) is a full day of content. R5.1.2 (scenarios + moderation) = 1+ day. R9.2.1 (Playwright E2E) = 2-4h alone. Realistic: 3-5 working days.  
**Fix**: Cut aggressive scope. **Must-ship for demo**: R1 (resource/progression), R2 (cashflow HUD), R3.2 (dashboard redesign), R6.1.2-R6.1.5 (15 core buildings, drop civic/decorative). **Defer to phase 2**: R4 streaks, R5 duel reframe, R6.2-R6.3, R7.1.3 comparison tool, R8.4-R8.5 animations/sound. Mark R5/R7 explicitly as "follow-up".

## HIGH-12 — Cashflow HUD viewport spec incomplete

**Category**: Completeness  
**Where**: R2.3.1, R2.3.4  
**Finding**: Desktop + mobile covered. Missing: tablet portrait (768-1024), mobile landscape (HUD collides with keyboard + safe area), iPad split view, fold devices. No z-index rules for modal overlay, no behavior on /miasto city canvas (HUD covering tiles), no stale state.  
**Fix**: Expand R2.3 with (1) breakpoint table, (2) z-index rules: HUD hides during fullscreen modals, swipe-dismissible on mobile, (3) stale state: if last tick >5min, HUD shows clock icon + "aktualizuj", (4) iOS safe-area insets, (5) HUD auto-hide on city tile hover or move to side dock on /miasto.

## MEDIUM-13 — Civic unlocks need pedagogical moments

**Category**: Coherence  
**Where**: R6.2  
**Finding**: "Bank → better APR" is video-game meta-progression. Doesn't teach the concept. No narrative moment explaining why banks + credit history = better rates.  
**Fix**: Add R6.2.5: first-unlock modal per civic building — one-sentence educational explainer. "Bank lokálny pomaga: keď máš banku v meste, úroky sú lepšie (5% namiesto 12%). V reálnom svete dobrá úverová história + lokálna banka = lepšie podmienky." Skippable after first view, logged as `edu_moment_seen`.

## MEDIUM-14 — "Sunset V1 after 4 weeks" is time-based + irreversible

**Category**: Risk  
**Where**: R9.3.4  
**Finding**: 4 weeks doesn't cover monthly billing tick, monthly duel reset, 30-day streak. Rollback after code deletion = git revert + full redeploy, painful during PKO demo week.  
**Fix**: Criteria-based sunset: (a) 8 weeks elapsed, (b) zero V1 users 14 consecutive days, (c) V2 error rate <0.1% for 14 days, (d) one full monthly duel reset observed, (e) PKO partnership checkpoint passed. Keep V1 code behind dead-flag additional 4 weeks after criteria met.

## MEDIUM-15 — Analytics events + A/B measurement not specified

**Category**: Missing  
**Where**: R9.3 (flags exist, measurement doesn't)  
**Finding**: No instrumentation for `cashflow_hud_clicked`, `loan_compared`, `duel_scenario_chose`, `bankruptcy_triggered`, `civic_unlock_viewed`, `streak_milestone_hit`. Without events, rollout at 50% can't compare V2 vs V1 retention. No pedagogy KPI (share of loans chosen = cheapest qualified = actual learning signal).  
**Fix**: Add R9.2.4 analytics schema doc (20+ new events with properties). Add R9.3.5 side-by-side V1 vs V2 dashboard (DAU, D1/D7 retention, median session, bankruptcies/1000, pedagogy KPI). Rollout gates advance only on metric improvement or flat.

## MEDIUM-16 — Accessibility pass absent

**Category**: Missing  
**Where**: All of R8 (animations), R2.3 (HUD)  
**Finding**: New HUD + animations + count-up + sparklines + confetti + level-up takeover + sound + haptics. No mention of `prefers-reduced-motion`, keyboard nav, screen reader labels, AA contrast, independent toggles for sound/haptic/motion. PL school deployments typically require WCAG 2.1 AA.  
**Fix**: Add R8.6 "Accessibility baseline": (1) all animations respect `prefers-reduced-motion`, (2) keyboard-reachable with focus ring, (3) VoiceOver/NVDA tested, (4) AA contrast audit, (5) independent toggles. Add axe-core automated check on 5 pages to R9.2.

## MEDIUM-17 — Claude API cost / rate limits unbounded

**Category**: Feasibility  
**Where**: R5.1.2, R4.3.1  
**Finding**: Scenarios generation spec doesn't specify cost, rate limit, fallback, cache. AI daily special implies ongoing load. Per-user scenarios at 100k users = runaway spend.  
**Fix**: Add R5.1.6: scenario pool generated offline, curated, stored in Redis, served deterministically (hash of userId+date → scenario). No per-request Claude calls in hot path. New AI games: batched nightly, budget cap (~$2/day for 5 games), cached, shared across users. Document expected spend + Anthropic tier.

## MEDIUM-18 — Per-user Redis feature-flag scales badly

**Category**: Feasibility  
**Where**: R9.3.1  
**Finding**: Per-user flag = 1 key per user. 100k users = 100k keys. Upstash is per-request; every request checks flag = 2× request count. No default for new signups.  
**Fix**: Percentile-based flag: one global config `ff:refactor_v2 = {mode: "percentage", value: 50, allowlist: [...], denylist: [...]}`. Resolve: `sha1(userId) % 100 < value`. New users auto-resolve. Only allowlist/denylist are per-user. 100k keys → ~10 + one roundtrip.

---

## Summary top-10 action items for plan update

1. Watt-deficit brownout (not offline) + bankruptcy cooldown while deficit persists
2. Value-based resource migration + per-user report + reversibility
3. Parallel leaderboard keys during rollout + seeded city-value
4. Cap multiplier stack at ×3, display breakdown in post-game modal
5. Duel version-pinning + 15-min drain procedure
6. Scenario moderation pipeline + human-approved PL→UK/CS/EN translation BEFORE generation
7. Scope cut: ship R1+R2+R3.2+core R6 first; defer R5/R7.1.3/R8.4/R8.5
8. Replace duel speed-bonus with "read carefully" curve
9. GDPR-K legal review as launch gate
10. Criteria-based V1 sunset (5 criteria), not 4-week timer
