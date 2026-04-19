# Session summary — Phases 6, 7, 8, 9, 10

**Window**: 2026-04-19 01:27 → 02:12 Europe/Warsaw (~45 min).
**Branch**: `watt-city` · base `4da11c5` (Phase 5 tip) · tip `e52cc1e`.
**Tests**: 220 passing across 32 vitest files · build green · Phase 1-5 surface unchanged.

## Phase 6 — Quality, hardening, compliance  ✅

### 6.1 Security
- CSP + HSTS + X-Frame-Options + Permissions-Policy + Referrer-Policy
  via `next.config.ts`.
- Double-submit CSRF: `lib/csrf-shared.ts` edge-safe constants, `middleware.ts`
  issues `wc_csrf` + verifies on POST/PATCH/PUT/DELETE, `CsrfBootstrap`
  patches `window.fetch` so every existing component inherits protection.
- `SECURITY.md` + `docs/SECURITY-AUDIT-2026-04-19.md` (OWASP Top-10
  self-audit + rate-limit bucket inventory).

### 6.2 Privacy / GDPR
- `lib/soft-delete.ts`: 30-day grace → login restores the account.
- `/api/cron/sweep-deletions` hard-erases post-grace, walking 26
  per-user keys + leaderboards.
- `/api/me/export` ships every data point (GDPR Art. 20).
- `components/cookie-consent.tsx` essentials-only banner; privacy page
  §9 links Art.20 export + Art.17 delete + DPO + UODO.
- `docs/legal/DATA-RETENTION.md` with per-category table + breach plan.

### 6.3 GDPR-K
- `lib/gdpr-k.ts`: age bucket (under-13 / 13-15 / 16-plus), PII validator
  (email / phone / First-Last name), parental consent with 48h token
  and mock-SMTP stdout log, idempotent grant.
- `/api/auth/register` requires birthYear; under-16 requires parentEmail.
- `/api/consent/[token]` + `/consent/[token]` parent-facing confirm
  page (deliberately not auto-grant).
- `/api/cron/sweep-inactive-kids` flags 12-month idle kid accounts for
  soft-delete.

### 6.4 Accessibility
- `:focus-visible` ring + `.skip-to-content` + `prefers-reduced-motion`.
- axe-core devDep; full scan integrated into Playwright suite.
- Static a11y linter vitest test.
- `docs/A11Y-AUDIT-2026-04-19.md` WCAG 2.1 AA self-check.

### 6.5 Performance
- `components/web-vitals-reporter.tsx` + `/api/analytics/web-vitals` ship
  every LCP/FID/CLS/INP/TTFB/FCP into Upstash per-day-per-route.
- All 12 AI kind clients dynamically imported (`next/dynamic`) — ~60 KB
  saved on first paint of `/games/ai/[id]`.

### 6.6 i18n
- `lib/i18n-format.ts`: PL pluralization via Intl.PluralRules; formatNumber,
  formatCurrency (PLN/CZK/UAH/EUR), formatDate, formatRelative.
- Dict-completeness audit (empty-string detector).

### 6.7 Tests
- Playwright + axe-playwright config + `e2e/smoke.spec.ts` (3 flows).
- Library-level `lib/integration-flow.test.ts` (register → award →
  credit → gift → place → mortgage).
- `load/k6-smoke.js` staged profile; `docs/LOAD-TEST.md` runbook.

## Phase 7 — Mobile + PWA  ✅

### 7.1 PWA
- `manifest.webmanifest` + 3 icons (192, 512, maskable) + shortcuts.
- `components/pwa-register.tsx`: SW registration + beforeinstallprompt
  banner; dismiss persists.
- `lib/web-push.ts` stub — gracefully no-ops without VAPID env.
- `docs/pwa/IOS-QUIRKS.md` Safari 2026 gotchas + testing checklist.

### 7.2 Native shells
- `capacitor.config.ts` (loose-typed for zero-dep build).
- `docs/mobile/SUBMISSION-RUNBOOK.md` iOS + Android submission flows.
- No app-store submission (charter constraint #13).

### 7.3 Mobile UX
- 44×44 px touch-target CSS rule scoped to <640px.
- `components/bottom-tabs.tsx` 4-tab mobile-only nav with safe-area.
- `.city-scene-viewport` class enables native pinch-zoom.
- `components/swipe-to-dismiss.tsx` wraps notification entries.

## Phase 8 — Web3 scaffold (per ADR 003)  ✅

Scaffold-ONLY — no deploy, no gas, no committed keys.

- `contracts/WattCityMedal.sol`: minimal soulbound ERC-721 (transfer
  reverts, approvals disabled, onlyOwner mint/burn, GDPR-compatible
  burn, no selfdestruct).
- `contracts/test/WattCityMedal.test.ts`: vitest-based static invariant
  check (7 assertions).
- `lib/web3/client.ts`: `web3Enabled()` + `fetchOnchainMedals()` + mock
  `requestMint()`.
- `/profile` gains conditional "On-chain medals" section.
- `docs/web3/PLAN.md`, `docs/web3/DEPLOY.md`,
  `docs/decisions/003-web3-scope.md`.

## Phase 9 — International markets  ✅

- `lib/market.ts`: MarketId (pl|cz|ua), `marketKey()` leaves PL bare
  per charter constraint #3 (no destructive rename), prefixes CZ/UA.
- `lib/ai-pipeline/markets.ts`: 20 CZ + 20 UA themes with metadata,
  per-market landmark catalogue (Spodek/Varso/PKiN, Žižkov/Karlův most/
  Národní/Tančící, Pecherska/Khreshchatyk/Batkivshchyna).
- `/api/admin/market` per-market config (featuredTheme + disabled).
- `/api/admin/migrate-to-multimarket` DRY-RUN listing only.
- 9.1.2 CZ partnership / 9.1.4 legal / 9.1.5 marketing deferred
  (non-engineering).

## Phase 10 — Long-term maintenance  ✅

### 10.1 Content
- `/api/admin/rotate-themes` quarterly refresh (rank by plays, retire
  stalest N, append to disabled list; pool edits still code-committed).
- `docs/RETRO-TEMPLATE.md` monthly retro template.

### 10.2 Engine evolution
- `/api/admin/engine-check` polls Anthropic /v1/models, surfaces newer.
- `.github/dependabot.yml` weekly grouped audits against watt-city.
- `docs/upgrade-playbook.md` Next/React/Claude/SDK/Tailwind/Node major
  checklist + rollback.
- `docs/UPSTASH-SCALING.md` signal→action table + cost curve + self-host
  playbook.

### 10.3 Research
- `docs/partnerships/RESEARCH.md` SGH/UW/AGH targets, conferences,
  outreach preconditions, hard-no list.

## Commits since Phase 5 tip

```
4da11c5..e52cc1e  (~25 feature commits + 2 docs)
```

`git log --oneline 4da11c5..HEAD` for the full list.

## Deferred (each with a documented reason)

- **6.1.1** external pen test (requires contractor)
- **6.4.7** manual NVDA/VoiceOver pass (requires human)
- **6.6.2** native-speaker review (external)
- **6.7.3** 7 more E2E flows (3 shipped, 7 stubbed with file-per-flow)
- **6.7.4** visual regression enablement (wait for UI stabilisation)
- **7.1.6** real Web Push delivery (gated on VAPID + ADR 002)
- **7.2.3-7.2.5** app-store submission (needs dev accounts + human
  assets)
- **8.1.3, 8.1.4, 8.1.5, 8.1.6, 8.1.7** testnet + mainnet + paymaster
  + wallet connect UI + audit (operator-led per ADR 003)
- **8.2.1, 8.2.2, 8.2.3** NFT skins + DAO + bridge (scope reduction)
- **9.1.2, 9.1.4, 9.1.5** CZ partnership / legal / marketing
- **10.1.3** annual visual refresh
- **10.3.1, 10.3.2, 10.3.3** university study / dataset / conference
  talks

## Stop conditions check

1. Phases 6, 7, 8-scaffold, 9, 10 all ≥ 80 % DONE. ✅
2. <12 continuous hours. ✅
3. No hard blockers. ✅

## Recommended next steps for the operator

1. `vercel deploy --prod --yes` on `watt-city` tip and smoke-test
   headers: CSP present, CSRF cookie set on first response.
2. Set `ALERT_WEBHOOK_URL` (Slack/Discord) so alerts fire.
3. Configure `VAPID_*` env + activate Web Push when GDPR-K consent
   scaffolding satisfies UODO review.
4. Run `docs/SMOKE-TEST.md` + the 3 Playwright flows on preview.
5. Engage legal (docs/legal/), KNF (4.3.1), and a contract audit firm
   (8.1.7) — all three in parallel.
6. Promote a real user to role=admin: `SET "xp:user:<u>:role" '"admin"'`.
7. Plan the CZ market launch: pick a partnership target, legal, marketing
   — all non-engineering per prompt scope.
