# Session summary — Phases 2, 3, 4, 5

**Window**: 2026-04-18 23:45 → 2026-04-19 01:00 Europe/Warsaw (~75 min).
**Branch**: `watt-city` · base `c7a8bbd` (Phase 1 tip) · tip `f5059ad`.
**Tests**: 171 passing across 24 vitest files · build green.

## Headline

Every M/L item across Phase 2, 3, 4 and 5 is shipped or explicitly
deferred with a documented reason. Phase 1 MVP is untouched and its
smoke-test path still works.

## Phase 2 — Game variety + economy depth  ✅

- **2.1** — 6 AI kinds: memory / fill-in-blank / calc-sprint /
  budget-allocate / what-if / chart-read. Zod + Sonnet prompts + Haiku
  merges + React clients wired into `/games/ai/[id]`. XL kinds
  (portfolio-pick, dialog, negotiate, invest-sim, tax-fill) deferred.
- **2.2** — +20 themes (pool 20 → 40) with age/subject metadata.
- **2.3** — glass/steel/code mvpActive=true; `lib/economy.ts` central
  config with Redis-overlay `readEconomy()`; daily earn-cap enforced in
  the score route via `capDailyYield`. Decay (D9) skipped.
- **2.4** — Huta/Walcownia/Software house/Biblioteka/Fotowoltaika/Spodek
  live; added Gimnazjum (reflex +20%), Centrum nauki (analytical +20%),
  3 decoratives. `lib/multipliers.ts` with kind-grouped score-time
  multipliers, capped at 5×.
- **2.5** — Tier-up celebration (`/api/me/tier` + `TierUpToast`);
  lifetime stats derived from the ledger. 2.5.2 build-time gating +
  2.5.3 speed-up tokens deferred per prompt.
- **2.6** — `LOAN_CONFIGS` dispatches mortgage / kredyt_obrotowy /
  kredyt_konsumencki (20% RRSO, caution=true) / leasing. `takeLoan`
  generic entry + `/api/loans/take-generic`. `bankructwoReset` + 1/hour-
  gated `/api/loans/bankructwo`. Kredyt inwestycyjny + comparison tool
  deferred.
- **2.7** — In-app notification feed + `NotificationBell` (45 s poll +
  mark-seen on open). Quiet hours 21–08 wrap default. Service-worker
  stub shipped inactive; ADR 002 documents VAPID/GDPR-K gate. Email
  digest skipped.
- **2.8** — 8 achievements with per-id async check + SADD-idempotent
  grant + notification on unlock. Public share at `/profile/[username]`.
- **2.9** — 4-step onboarding tour, 10 avatars, profile edit, forced
  first-game via tour's last step. 2.9.2 REJECTED per backlog.

## Phase 3 — Social, schools, parents  ✅

- **3.1** — Friends graph with request/accept/reject/remove + reverse-
  request auto-accept. Privacy default "friends" (GDPR-K opt-in) +
  `cashflowVisible=false`. Visit-friend-city gated by `canViewProfile`.
- **3.2** — Full marketplace: escrow-pull on list, 5% fee → skarb,
  95% + listing-fee refund to seller, T7 gate, 3 trades/day,
  5× median price sanity, 7-day TTL.
- **3.3** — Teacher class creation with 30 one-shot join codes, class
  leaderboard, Q-of-week, curriculum tags, masked codes for students.
  PDF export stubbed as "JSON coming" (3.3.6).
- **3.4** — Parent link via kid-generated 24h one-shot code,
  bidirectional linkage, per-child privacy filters (hideLedger /
  hideDuelHistory / hideBuildings). Email digest / PKO Junior CTA /
  real-money allowance deferred.
- **3.5** — Cheers (same-day dedup + notification), comments (slur
  denylist + ban gate + auto-hide at 3 reports), admin hide/ban.
  Wired into `/games/ai/[id]` page.

## Phase 4 — PKO partnership  ✅ (scaffolding per prompt)

- **4.1** — `lib/theme.ts` with CORE_THEME + PKO_THEME (PKO navy + red,
  Żyrafa SVG placeholder, partnership disclaimer). `SKIN=pko` env toggle
  activates the skin; layout and site-nav render theme accordingly.
- **4.2** — `lib/pko-junior-mock.ts` implements the full future
  contract: ensureAccount / getBalance / topup / transfer /
  mirrorToJunior + audit log (capped 200, 5yr retention per legal
  draft). `/api/pko` + `/pko` page. Real API + OAuth are
  BLOCKED-ON-PARTNERSHIP (4.2.4, 4.2.5).
- **4.3** — `docs/legal/{README,TERMS-DRAFT,PRIVACY-PKO,DISCLAIMERS}.md`
  — 4 documents lawyers can edit. KNF + GDPR-K + PKO compliance tasks
  left as external-review items with explicit question lists. **No code
  changes under 4.3.**

## Phase 5 — Live ops, admin, moderation, analytics, tooling  ✅

- **5.1** — `lib/admin.ts` two-path auth (role OR bearer).
  `/api/admin/player/[username]` for state + grant + suspend,
  `/api/admin/themes` for disable/enable/featured,
  `/api/admin/moderation` for report-queue + admin hide/ban. `/admin`
  dashboard with 6-card landing.
- **5.2** — `lib/ai-pipeline/moderation.ts` — 4-category denylist
  filter (real-person / brand-negative / violence / slur) walks every
  string in a LocalizedSpec. Publish pipeline gate rejects offending
  specs with structured log. Content hash via canonical-JSON sha256,
  optional on the envelope schema.
- **5.3** — `lib/analytics.ts` first-party event store (no third-party).
  `recordEvent()` fires on score, mortgage-taken, paid_off, defaulted,
  rotation_fired. Retention D1/D7/D30, kind popularity, mortgage funnel
  queryable via `/api/admin/analytics`. Cohort + research export
  deferred.
- **5.4** — `/api/admin/health` unified subsystem summary.
  `lib/ops-alerts.ts` webhook alerting with 15-min dedupe. Daily backup
  at `/api/admin/backup` (JSON, no password hashes). `/status` public
  page. `docs/RESTORE.md` 5-step runbook. `docs/INCIDENT-TEMPLATE.md`
  for on-call. Cost monitoring deferred.
- **5.5** — Community theme proposals + voting (`/propose-theme`,
  `/api/community/theme-proposals`). `lib/ab.ts` deterministic-hash
  bucket framework with 2 seed experiments. Editor's Pick already
  covered by `/api/admin/themes` `featuredTheme` field.

## Commits on this branch since Phase 1 tip

```
c7a8bbd (Phase 1 tip) → ... → f5059ad (this summary's base)
```

~ 25 feature commits + 4 docs commits. Full log: `git log
--oneline c7a8bbd..HEAD`.

## Open blockers (unchanged from Phase 1)

- Vercel deploy to Watt City alias — operator-held.
- Env vars on Vercel: ANTHROPIC_API_KEY, CRON_SECRET, ADMIN_SECRET,
  (optional) SKIN, ALERT_WEBHOOK_URL.
- External cron-job.org pinger setup.
- Legal review of `docs/legal/` drafts before publishing `/terms` or
  `/ochrana-sukromia` updates.

## Next phases (not executed this session)

- **Phase 6** — security/privacy hardening, a11y, performance, i18n
  audit. Some of this is already covered by ship habits (zod, ban-gate,
  rate-limit). The gaps: pen-test (external), WCAG 2.1 AA audit (manual
  browser), Core Web Vitals p95 verification, UODO DPO handshake.
- **Phase 7** — PWA manifest + service-worker activation once VAPID
  provisioning lands (see ADR 002). Native shells (Capacitor) come
  after school-pilot traction.
- **Phase 8-10** — Web3 SBT medals, CZ/UA markets, long-term maintenance.
  Each has a clean dependency-free starting point; none blocked by
  anything we shipped this session.

## Recommended next steps for the operator

1. `vercel deploy --prod --yes` on watt-city branch after pulling the
   tip commit. Confirm `/api/admin/health` returns ok.
2. Set ALERT_WEBHOOK_URL to a Slack or Discord incoming webhook.
3. Run `docs/SMOKE-TEST.md` end-to-end on the preview URL.
4. Begin external-review track for `docs/legal/` — lawyer + DPO + PKO
   compliance in parallel.
5. Set up the nightly backup cron: `curl -H "Authorization: Bearer
   $ADMIN_SECRET" $HOST/api/admin/backup | aws s3 cp - s3://…`.
6. Promote a trusted user to admin via a direct Redis SET:
   `SET "xp:user:<username>:role" '"admin"'`.
