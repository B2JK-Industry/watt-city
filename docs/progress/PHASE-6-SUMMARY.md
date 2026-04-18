# Phase 6 summary — Quality, hardening, compliance

**Window**: 2026-04-19 01:27 → 01:49 Europe/Warsaw (~22 min).
**Branch**: `watt-city` · base `4da11c5` · tip `9c0493d`.
**Tests**: 206 passing across 30 vitest files · build green.

## What shipped

### 6.1 Security
- next.config.ts: CSP / X-Frame / nosniff / HSTS / Permissions-Policy /
  Referrer-Policy / DNS-prefetch-off. Long-cache on icons + favicon.
- lib/csrf-shared + lib/csrf + middleware.ts: double-submit CSRF cookie
  `wc_csrf` with strict SameSite + 7-day TTL; X-CSRF-Token echo enforced
  on POST/PATCH/PUT/DELETE; exempt list for bearer/cron/auth/lang.
- components/csrf-bootstrap: patches `window.fetch` once on mount so
  every mutating same-origin request injects the header — no per-
  component rewrites.
- SECURITY.md + docs/SECURITY-AUDIT-2026-04-19.md (OWASP Top-10 table,
  rate-limit bucket inventory, external-pen-test path).
- 5 CSRF exempt-path tests.

### 6.2 Privacy / GDPR
- lib/soft-delete.ts: flag + 30-day grace + clear + hardErase across 26
  per-user keys + leaderboards.
- /api/me DELETE: soft-delete with restore-via-login.
- /api/auth/login clears flag on successful re-entry.
- /api/cron/sweep-deletions hard-erases past grace.
- /api/me/export: GDPR Art.20 full-JSON dump; attachment download,
  cache-control no-store.
- components/cookie-consent + ochrana-sukromia §9 linking Art.20 export,
  Art.17 delete, DPO, UODO.
- docs/legal/DATA-RETENTION.md: per-category retention table, breach
  notification plan (72h), DPO contact.
- 4 soft-delete lifecycle tests.

### 6.3 GDPR-K
- lib/gdpr-k.ts: age bucket derivation, writeAgeBucket, requiresParentalConsent,
  containsPII (email / phone / First-Last name), openConsentRequest →
  mock-SMTP stdout log, grantConsent idempotent + audit trail.
- /api/auth/register: birthYear required; under-16 forces parentEmail;
  response carries pendingConsentToken.
- /api/consent/[token] + /consent/[token]: parent-facing confirm-click
  page (deliberately not auto-grant on email-preview).
- /api/cron/sweep-inactive-kids: 12-month inactivity flags kid account
  for soft-delete.
- components/auth-form: birth-year select + conditional parentEmail.
- 10 GDPR-K tests (bucket math, PII, consent round-trip, double-grant
  rejection).

### 6.4 Accessibility
- globals.css: :focus-visible ring (WCAG 2.4.7), .skip-to-content link,
  prefers-reduced-motion guards.
- layout.tsx: skip-to-content as first body element → #main-content.
- axe-core devDep; full scan runs in Playwright E2E suite.
- docs/A11Y-AUDIT-2026-04-19.md: WCAG 2.1 AA self-check + deferred
  NVDA/VoiceOver manual pass.
- 4-lang skip-to-content label.
- Static a11y linter test (no img-without-alt).

### 6.5 Performance
- components/web-vitals-reporter.tsx + /api/analytics/web-vitals: every
  Vitals metric beacons into Upstash per-day-per-route.
- Dynamic imports for all 12 AI-kind clients via next/dynamic; only the
  rendered kind loads.
- vercel-side long-cache via next.config headers (landed in 6.1 commit).
- 6.5.2 SVG-only → image optimization N/A.

### 6.6 i18n
- lib/i18n-format.ts: plural() wraps Intl.PluralRules (PL 4-form native);
  formatNumber / formatCurrency (PLN/CZK/UAH/EUR) / formatDate /
  formatRelative per locale.
- lib/i18n-audit.test.ts: walks every locale dict flagging empty strings;
  PL pluralization assertions (1 / 2-4 / 5+ / teens).
- 6.6.2 native-speaker review deferred (external).

### 6.7 Tests
- @playwright/test + @axe-core/playwright; playwright.config.ts with
  chromium + mobile-safari projects.
- e2e/smoke.spec.ts: 3 flows (landing+axe, register, /miasto). 7
  remaining flows tracked in docs/E2E-FLOWS.md.
- lib/integration-flow.test.ts: register → award → credit → gift →
  place → mortgage-shape.
- load/k6-smoke.js: 500-VU staged profile, per-path p95 thresholds.
- docs/LOAD-TEST.md + docs/E2E-FLOWS.md runbooks.

## Commits since Phase 5 tip

```
4da11c5..9c0493d
```

7 feature commits + 1 kickoff docs commit.

## Deferred (each with a documented reason)

- 6.1.1 external pen test.
- 6.1.6 SRI (N/A — no CDN assets).
- 6.4.7 manual NVDA/VoiceOver (needs human).
- 6.6.2 native-speaker review (external).
- 7 E2E flows beyond the first 3 (tracked per-file in E2E-FLOWS.md).
- 6.7.4 visual regression (enable once UI stabilises in Phase 7).

## Next

Phase 7 starts: PWA manifest + service worker activation + Capacitor
iOS/Android config + mobile UX (touch targets, pinch/pan, bottom tabs).
