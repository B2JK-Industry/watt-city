# Security audit — 2026-04-19 (OWASP Top 10 self-check)

Self-audit against the OWASP Top 10 (2021 edition). Each row states the
control in place, where it lives, and the residual risk. Findings that
require external verification (pen test, SOC2) are flagged as EXTERNAL.

| # | Category | Control | File(s) | Residual |
|---|---|---|---|---|
| A01 | Broken Access Control | Session-cookie HMAC; admin role + `ADMIN_SECRET` bearer for every admin route | `lib/session.ts`, `lib/admin.ts`, `app/api/admin/*` | OK — every admin route calls `requireAdmin()` |
| A02 | Cryptographic Failures | Scrypt password hashing with per-user salt; HMAC-signed session cookies; HTTPS enforced via HSTS header | `lib/auth.ts`, `lib/session.ts`, `next.config.ts` | OK |
| A03 | Injection | All DB access through typed Upstash client; zero raw SQL; every API route validates with zod | `lib/redis.ts`, all `app/api/*/route.ts` | OK |
| A04 | Insecure Design | Rate limiting on every POST (5–30/min per bucket); idempotent ledger via SADD dedup; single-flight locks on tick + rotation | `lib/rate-limit.ts`, `lib/player.ts`, `lib/tick.ts`, `lib/ai-pipeline/publish.ts` | OK |
| A05 | Security Misconfiguration | CSP + X-Frame-Options + X-CTO + Referrer + Permissions + HSTS applied in `next.config.ts`. No default credentials. Admin endpoints fail closed when `ADMIN_SECRET` missing AND no role. | `next.config.ts`, `lib/admin.ts` | OK — verify via `curl -I` after deploy |
| A06 | Vulnerable Components | pnpm lockfile pinned; dependabot config lives at `.github/dependabot.yml` (Phase 10.2) | `package.json`, `pnpm-lock.yaml` | OK |
| A07 | Identification + Authentication | Session cookies are HttpOnly + Secure + SameSite=Lax; login rate-limited via rate-limit on the route | `lib/session.ts`, `app/api/auth/login/route.ts` | OK |
| A08 | Software + Data Integrity | AI-generated content has sha256 contentHash + denylist filter before publish | `lib/ai-pipeline/moderation.ts` | OK |
| A09 | Security Logging + Monitoring | Structured `rotation.fired/.failed/.rejected` logs to stdout (Vercel captures). Webhook alerts via `ALERT_WEBHOOK_URL`. `/api/admin/health` surfaces stale state. | `app/api/cron/rotate-if-due/route.ts`, `lib/ops-alerts.ts`, `app/api/admin/health/route.ts` | OK — need centralised log shipping once traffic grows (Phase 6.7 load-test follow-up) |
| A10 | SSRF | All external HTTP calls are to fixed hosts (`ALERT_WEBHOOK_URL`, Anthropic SDK). No user-supplied URLs forwarded through fetch. | `lib/ops-alerts.ts`, `lib/ai-pipeline/generate.ts` | OK |

## Additional controls

- **CSRF**: double-submit cookie pattern via `middleware.ts` + global fetch
  patch in `components/csrf-bootstrap.tsx`. Exemptions: admin bearer
  paths, cron pings, login/register (they set the cookie).
- **Rate limits per route**: existing `rateLimit()` helper, buckets:
  - `build:<u>` 5/min (place/upgrade/demolish + tick manual)
  - `loan-take:<u>` 1/min
  - `loan-repay:<u>` 5/min
  - `market:<u>` 5/min
  - `friends:<u>` 20/min
  - `cheer:<u>` 30/min
  - `comment:<u>` 10/min
  - `report:<u>` 10/min
  - `theme-proposal:<u>` 10/min
  - `pko:<u>` 5/min (real-money-adjacent, tight)
  - `class:<u>` 10/min
  - `parent:<u>` 10/min
  - `bankructwo:<u>` 1/hour (destructive)
- **SRI** (Subresource Integrity): N/A — we don't load any third-party
  CDN script (no Google Analytics, no Meta Pixel, no font-CDN).
- **Sensitive-data-at-rest**: passwords scrypt-hashed; no card numbers;
  no government IDs; no real-name PII (enforced by GDPR-K validator).

## Findings

None at P0/P1 level as of this audit.

## P2/P3 deferred

- **P3**: Rate-limit buckets use fixed-window keys; a sliding-log design
  would catch burst-then-wait patterns. Upgrade path: swap `kvSet` for
  a ZSET with score=timestamp. Not worth the complexity until we see
  abuse.
- **P3**: CSP allows `'unsafe-inline'` + `'unsafe-eval'` because Next.js
  ships inline hydration data. Nonce-based CSP would need custom edge
  middleware; documented as future work when the partnership pays for
  Vercel Pro.

## External tasks (6.1.1 pen test)

Out of scope for this self-audit. Recommended path:
1. Book a web-app pentest engagement (e.g. Polish CERT-accredited firms
   like Securing or 7ASecurity) once a public-facing deployment is
   stable and has ≥ 100 real-user accounts.
2. Provide them with:
   - A throwaway staging deployment under `SKIN=core`.
   - `ADMIN_SECRET` for testing admin surfaces.
   - A link to this document + `SECURITY.md`.
3. Budget expectation: 5-day engagement for an MVP this size, EUR 8-15k.
4. Mitigations in parallel: ensure the pentest runs against staging, not
   prod; rotate secrets on completion.

## Bug-bounty activation

`SECURITY.md` committed at repo root with scope, severity tiers, response
times, and credit policy. GitHub Security Advisories path documented.
Enable the Security tab on the GitHub repo settings once deployed.
