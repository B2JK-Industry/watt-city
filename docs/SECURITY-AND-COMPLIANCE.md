# Watt City — Security & compliance

Threat model, GDPR, GDPR-K (children's data), KNF (financial regulator) alignment, content moderation, incident response. This doc must be reviewed by counsel before any live deployment serving real users in PL.

## 1. Threat model

### Assets

| Asset | Sensitivity | Why protect |
|---|---|---|
| User passwords (scrypt hash + salt) | Critical | Account takeover, credential stuffing |
| Session cookies | High | Account takeover until expiry |
| Player game state (resources, buildings, loans) | Medium | Cheating, leaderboard manipulation |
| Per-user telemetry (plays, scores) | Low | Privacy concern only |
| Anthropic API key | Critical | Cost abuse, content abuse |
| Admin secret (`ADMIN_SECRET`) | Critical | Full system control |
| Cron secret (`CRON_SECRET`) | High | Force-rotate AI games |
| Upstash credentials | Critical | Database access |
| Vercel deployment | Critical | Code execution / config tampering |

### Attackers

| Attacker | Likely action | Motivation |
|---|---|---|
| Bored kid | Try to break leaderboard via console hax | Bragging rights |
| Skilled hobbyist | Reverse-engineer scoring API to inflate XP | Reputation |
| Spammer | Automated account creation | Marketplace exploit (Phase 3) |
| Malicious player (insider) | Brute-force login on others' accounts | Griefing |
| Curious researcher | Probe for SSRF, SQL-i, prototype pollution | Disclosure / bug bounty |
| Sponsor competitor | Plant CSAM or political content via game answers | Brand damage to PKO |
| State-level | Out of scope for hackathon project | — |

### Trust boundaries

```
[Browser]              ←  untrusted; must validate everything server-side
       ↓
[Vercel Edge cache]    ←  trusted infrastructure
       ↓
[Next.js server route] ←  our code, trusted
       ↓
[Upstash Redis]        ←  trusted vendor (EU region)
       ↓
[Anthropic API]        ←  trusted vendor (US region; data minimization)
```

Critical rule: **never trust client-supplied resource amounts, building IDs, or scores**. All economy mutations must be authoritative server-side.

## 2. Authentication

### Current implementation

```
Registration:
  – username validation (regex: 3–24 chars, [A-Za-z0-9._-])
  – password validation (≥ 6 chars, ≤ 200)
  – scrypt hash with 16-byte random salt, 64-byte hash
  – HMAC-SHA256 signed cookie session (HttpOnly, Secure, SameSite=Lax, 30d)
  – stored: { username, passwordHash, createdAt } only

Login:
  – Constant-time comparison (timingSafeEqual)
  – Same error message for bad username + bad password
  – Per-IP rate-limit via `lib/client-ip.ts` + `lib/rate-limit.ts`
    (default 20/min; tunable via `LOGIN_IP_LIMIT` env).
```

### Hardening required pre-launch

- [x] **Rate limiting (per-IP)** — register + login guarded by a fixed
      window on `clientIp(req)`. Defaults 5/h (register) and 20/min
      (login). See `REGISTER_IP_LIMIT` / `LOGIN_IP_LIMIT`.
- [ ] **Password complexity** — currently only length; consider rejecting top-1000 common passwords
- [ ] **Brute force lockout** — 10 failed logins → temporary account lockout (15 min)
- [ ] **CAPTCHA** on registration (Phase 6.1; weighed against UX cost for kids)
- [ ] **Email verification** for parent accounts (Phase 6.3.2)
- [ ] **2FA** optional for parents (Phase 4)
- [ ] **Session rotation** on permission change (kid → parent role)

### Session security

```
Cookie format: <username>.<expiry>.<HMAC-SHA256(username + expiry, SESSION_SECRET)>

Secret rotation:
  – Old secret kept for grace period (1 hour) after rotation
  – Both secrets accepted during grace; new sessions signed with new
  – Forces clean rotation without mass logout
```

## 3. Authorization

Role model:

| Role | Permissions | Source |
|---|---|---|
| anonymous | Read public pages, register, login | no session |
| player | Play games, build, take loans, marketplace | session cookie |
| parent | Read child's progress (read-only), trigger PKO real-money mirror | session + parent_role flag |
| teacher | Read class progress, set Q-of-the-week | session + teacher_role flag |
| admin | All admin endpoints | session + admin_role flag (or ADMIN_SECRET) |
| service | Cron endpoints | CRON_SECRET Bearer |

Role flags stored on `xp:user:<username>` JSON. Admin endpoints check both Bearer secret AND user's admin_role; double layer.

### Admin endpoint protection

```
Order of checks per request:
  1. Is method allowed? (POST/GET as designed)
  2. Is ADMIN_SECRET env var set?
     YES → require Bearer token = ADMIN_SECRET
     NO  → log warning, accept (DEV mode only)
  3. Process request
```

In production, ADMIN_SECRET MUST be set. Deployment runbook (OPERATIONS.md) lists this as preflight check.

## 4. Input validation

### Server-side (zod)

Every API route wraps body parsing in `BodySchema.safeParse()`. Reject with 400 + clear error on validation failure.

Examples:
- `/api/score`: `{gameId: string(1-64), xp: number().int().min(0).max(10000)}`
- `/api/buildings/place`: `{slotId: number().int().min(0).max(19), catalogId: string()}`
- `/api/loans/take`: `{type: enum, principal: number().positive(), termMonths: enum([12,24,36])}`

Zod errors logged but not echoed to user (don't leak schema internals).

### Client-side (defense in depth)

Forms validate before submit (better UX). Server still validates; never trust client.

### Rate limiting

Shipped (2026-04-21 backlog sweep) as a Redis fixed-window counter in
`lib/rate-limit.ts`. Per-IP caps on `/api/auth/login` and
`/api/auth/register` use `lib/client-ip.ts` to key on the first
`x-forwarded-for` entry.

Active per-endpoint policy:

```
/api/auth/login        → LOGIN_IP_LIMIT    (default 20 / IP / minute)
/api/auth/register     → REGISTER_IP_LIMIT (default 5  / IP / hour)
/api/buildings/*       → 5 / user / minute (place, upgrade, demolish)
/api/admin/*           → bearer-gated; no count cap (monitored via logs)
```

Keys look like `xp:ratelimit:<scope>:<windowStart>` — TTL = window +
5s grace. Both env vars are overridable at runtime; Playwright bumps
both to `1000` so bot-protection tests only fire on explicit opt-in
(`BOT_PROTECTION_E2E=1`).

## 5. Data privacy (GDPR)

### Legal basis

Processing: legitimate interest (gameplay) + explicit consent (notifications, marketing).

### Data we collect

| Data | Why | Retention |
|---|---|---|
| Username | Identification | Until account deletion |
| Password hash | Authentication | Until account deletion |
| Game scores, resources, buildings | Gameplay | Until account deletion (or 12 months inactive) |
| Last-seen timestamp | Anti-abuse, retention metrics | Same as above |
| Display name (optional) | UI personalization | Same |
| Avatar selection (1 of 10) | UI | Same |
| Lang cookie | i18n | Per cookie expiry (1 year) |

### Data we DON'T collect

- ❌ Email addresses (none required for kid accounts)
- ❌ Phone numbers
- ❌ Real names
- ❌ IP addresses (no logs of IP)
- ❌ Device fingerprints
- ❌ Geographic location
- ❌ Third-party tracker data (no Google Analytics, no Meta Pixel)
- ❌ Cross-site cookies

### Subject rights

| Right (GDPR Art.) | Implementation |
|---|---|
| 15 — Access | `GET /api/me` returns full state |
| 16 — Rectification | Display name + avatar editable; username immutable (re-register if needed) |
| 17 — Erasure | `DELETE /api/me` purges everything: user record, stats, all leaderboard entries, ledger, dedup set. Same `hardErase()` path is reused by `/api/admin/purge-e2e-accounts` for operator-initiated bulk cleanup. |
| 18 — Restriction | Currently no logged-in account can be restricted; out of scope |
| 20 — Portability | `GET /api/me/export` returns JSON dump (Phase 6.2.3) |
| 21 — Objection | "Cofnięcie zgody" via account deletion |
| 22 — Auto-decision | We don't make automated decisions about users (leaderboard is deterministic) |

### Data residency

- Primary: Upstash Redis EU (Frankfurt)
- Compute: Vercel Edge EU regions
- Anthropic API: US — **data minimization in place**: only the seed/theme is sent, never user data, never per-user game history. User identity is never sent to Claude.

### Privacy by design checklist

- [x] No PII collected beyond chosen username
- [x] Password hashing irreversible
- [x] Session cookies HttpOnly + Secure + SameSite
- [x] No third-party trackers
- [x] EU data residency
- [x] One-click account deletion
- [ ] Privacy policy in 4 langs (pending professional translation)
- [ ] Cookie consent banner (Phase 6.2.1)
- [ ] Data export endpoint (Phase 6.2.3)

## 6. GDPR-K (children's data — under-16 in PL)

### Polish GDPR threshold

In PL, the GDPR consent age is **16** (not the GDPR-default 13). For users under 16:

- Parental consent required
- Verifiable (not just check-box)

### Implementation (Phase 6.3 — wired 2026-04-21)

```
Registration flow for kid (claimed age < 16):
  1. Show "Czy masz 16 lat?" question
     – YES → standard registration, kid is treated as full GDPR data subject
     – NO  → enter parent's email
  2. `lib/mailer.ts` dispatches the invite. Adapter order: Resend →
     SendGrid → structured `mail.would-send` log line (used in dev /
     CI / when no provider is configured).
  3. Parent clicks link → confirmation page → grant consent
  4. Account activated only after parent confirms
  5. Audit trail: { kidUsername, parentEmail, confirmedAt, ipAddress } stored encrypted in xp:consent:<username>
  6. Parent can revoke consent at any time → kid account becomes read-only, then deleted after 30 days
```

Env required to actually mail: `RESEND_API_KEY` or `SENDGRID_API_KEY`
plus `MAIL_FROM` and `APP_BASE_URL` for absolute link construction.
Without them the adapter logs what it would have sent but does not
block the registration path — a deliberate dev-ergonomics choice.

**Critical**: parent email is the ONLY PII collected from a real adult. Encrypted at rest (`xp:consent:` keys are encrypted via separate KMS key, not just scrypt — actually a symmetric key, so we can decrypt for parent to revoke).

### Special considerations for kid app

- No marketing or sponsored content
- No friend invitations sent via email (only in-app)
- No public sharing without parental opt-in
- All notifications muted by default
- "Quiet hours" 21:00–08:00 default
- No purchase mechanics (no virtual goods sold for real money in MVP)

## 7. KNF (financial regulator) alignment

### What KNF cares about

- Misleading representation of financial products
- Pretending to offer financial advice without licensing
- Real-money instruments without authorization

### Our position

> **This is an educational simulation. No real money is held, transferred, or invested in or by Watt City. All "loans", "interest", and "investments" are gameplay mechanics.**

This disclaimer must appear:
- On every loan dialog (top of modal)
- On the homepage footer
- In the privacy policy
- In the terms of service
- In app store descriptions (when published)

### Specific compliance items

- Mortgage UI shows BOTH the in-game APR AND a label: "RRSO w grze · symulacja edukacyjna"
- Default consequences are real (in-game) but flagged as "to nie są prawdziwe pieniądze"
- "Take real PKO loan" CTAs (Phase 4) only deep-link to PKO, never originate the actual loan
- Content review: any AI-generated game item that mentions a specific financial product gets flagged for human review before publish (Phase 5.2.4)

## 8. Content moderation (AI-generated content)

### Risk

Sonnet 4.6 might produce:
- Factually wrong financial advice
- Politically charged statements
- Sexual / violent content (very unlikely with our prompts but possible)
- References to real people (defamation risk)
- Real brand mentions in critical light (legal risk)

### Mitigations (Phase 5.2)

```
Pre-publish filter (synchronous, blocks publish):
  1. Banned-words list scan: politically charged terms, slurs, real-name patterns
  2. Brand mention check: if any specific bank/company named, route to human queue
  3. Numeric sanity: if prompts contain financial amounts > 1M zł, flag (often hallucination)
  4. Length sanity: if any field outside zod min/max bounds, reject

Post-publish report mechanism:
  1. Each game has a "🚩 Zgłoś problem" button
  2. Player flags → entry created in xp:report:<gameId>
  3. After 3 reports → game auto-suspended (removed from index, but envelope kept)
  4. Admin reviews queue at /admin/reports
  5. Admin marks: false alarm (restore) / valid (delete + log) / unsure (escalate)
```

### Audit trail

Every published AI game has:
- `model`: which Claude version
- `seed`: deterministic hash for reproducibility
- `generatedAt`: timestamp
- `originalPrompt`: stored separately in `xp:ai-games:audit:<id>` for forensic review

We can re-generate with same seed to reproduce content.

## 9. Anti-cheat

### Score submission

Server validates:
- `xp ≤ game.xpCap` (server-known cap)
- `xp ≥ 0`
- gameId exists
- not duplicate within last 1s (quick replay)

### Resource ledger

Append-only with idempotency. Cannot be modified retroactively except by admin endpoint (audit-logged).

### Marketplace fairness

- T7 gating (kid can't trade until reaching T7)
- Daily trade limit (3/day)
- Wash-trade detection (A→B→A in 24h flagged)
- Sybil detection (accounts created < 1h apart from same IP fingerprint, even though we don't store IPs we have request-time signature)
- Manual review queue for trades > 5000 W$

### Time-travel attacks

Player can't:
- Submit score for old expired game (envelope check)
- Backdate a building build (server uses Date.now, never client-supplied)
- Skip mortgage payments by adjusting client clock (server-side schedule check)

## 10. Secrets management

### Production secrets (Vercel env vars)

| Var | Purpose | Rotation policy |
|---|---|---|
| `SESSION_SECRET` | HMAC-sign cookies | Annual; with grace period |
| `UPSTASH_REDIS_REST_URL` | DB endpoint | Per Upstash docs |
| `UPSTASH_REDIS_REST_TOKEN` | DB auth | Annual |
| `ANTHROPIC_API_KEY` | LLM access | When leaked or quarterly |
| `ADMIN_SECRET` | Admin endpoint guard | Quarterly OR on suspicion of leak |
| `CRON_SECRET` | Cron endpoint guard | Same as admin |

### Secret leak response

```
1. Detect leak (alert from Anthropic dashboard, GitHub secret scanner, etc.)
2. Within 1h:
   – Rotate the leaked key in source platform
   – Update Vercel env var (vercel env rm + add)
   – Trigger redeploy
3. Within 24h:
   – Investigate scope (what data accessed, what cost incurred)
   – Notify affected users if PII exposed (none expected)
   – Post-mortem in docs/incidents/
```

### Local dev secrets

`.env.local` in `.gitignore`. Pulled via `vercel env pull .env.local --environment=production`. Never committed. Sensitive values may not pull (Vercel masks them) — manual paste required.

## 11. HTTPS & TLS

- Vercel auto-provisions Let's Encrypt
- HSTS header in `next.config.ts` (Phase 6.1.5)
- Certificate Transparency monitoring (built into Vercel)

## 12. Headers (CSP, security headers)

`next.config.ts` should set:

```
{
  headers: async () => [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: cspString() },
    ],
  }],
}
```

CSP allowlist:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'` (Next.js needs inline; pin via nonces in Phase 6)
- `style-src 'self' 'unsafe-inline'` (Tailwind inline)
- `img-src 'self' data:`
- `connect-src 'self' https://*.upstash.io https://api.anthropic.com`
- `font-src 'self' data:`

## 13. Logging policy

- No PII in logs (no usernames in error messages — use IDs)
- No secrets in logs (redact via middleware)
- Logs retained 30 days (Vercel default)
- Application logs go to stderr; Vercel captures
- Critical events (deploy, secret rotation, admin actions) go to a separate audit log: `xp:audit:<YYYY-MM-DD>` Redis list

## 13.1. Test-environment data hygiene

E2E fixture users (`gp_*`, `pr_*`, `rl_*`, `bot_*`, `ghost_*`, `smoke*`,
`db_*`, `di_*`, `sec_*`, `kid_*`, `lb\d+_*`, `okuser*`) must never leak
into production data stores. Two layers enforce this:

1. **Config-level isolation** (commit `f124349`). `playwright.config.ts`
   blanks `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` on the
   webServer boot env. Next.js reads `process.env` before `.env.local`,
   so the explicit empty string wins and `lib/redis.ts` falls down the
   in-memory path — regardless of what an operator has in `.env.local`.
   Operators who genuinely want a dedicated test Redis set
   `E2E_UPSTASH_URL` / `E2E_UPSTASH_TOKEN` instead.
2. **Cleanup endpoint** (admin bearer). `/api/admin/purge-e2e-accounts`
   enumerates `xp:leaderboard:global` via `zAllMembers()`, regex-filters
   candidates against the documented prefix set, and runs each match
   through the same `hardErase()` routine used by GDPR Art. 17. Default
   `dryRun: true`; single-letter prefixes gated behind an explicit flag
   to prevent collisions with real short handles.

Historical leaks from runs predating `f124349` were cleaned with this
endpoint. No PII was involved — these are synthetic accounts created by
the suite itself — but leaderboard integrity is a stated product
invariant, so the cleanup is still a P2.

## 14. Backup & disaster recovery

- Upstash daily snapshot to S3-compatible storage (Phase 5.4.3)
- Test restore quarterly (write run sheet)
- Code: GitHub is the source of truth; Vercel deploys are rebuildable
- Secrets backup: stored encrypted in 1Password (or similar) — only 2 people have access

## 15. Incident response runbook

### Severity levels

| Level | Definition | Response time |
|---|---|---|
| SEV1 | Total outage, data loss, secrets leaked | Immediate (< 30 min) |
| SEV2 | Partial outage, leaderboard wrong, key feature broken | Within 4h |
| SEV3 | Cosmetic bug, minor data inconsistency | Next business day |

### SEV1 playbook (skeleton)

```
1. Acknowledge: post in incident channel within 15 min
2. Assess: what's broken, who's affected, what's the blast radius
3. Stabilize: revert deploy / rotate secret / scale up / etc.
4. Communicate: status page + in-app banner
5. Resolve: root cause fix
6. Document: post-mortem in docs/incidents/<YYYY-MM-DD>-title.md
```

### Rollback procedure (deploy break)

```
vercel ls                         # find last good deployment
vercel rollback <deployment-url>  # promote it to production
# verify smoke tests
# investigate broken deploy on main, fix, re-deploy
```

### Data corruption recovery

```
1. Stop writes (set xp:read-only-mode = true; routes check flag)
2. Identify scope (which keys / users affected)
3. Restore from Upstash snapshot (if irreversible)
   – OR replay from ledger (if affected data is downstream of ledger)
4. Validate restore against known-good fixture
5. Re-enable writes
6. Communicate to affected users with credits
```

## 16. Compliance roadmap

Phase 1 MVP — minimum compliance:
- [x] Privacy policy in 4 langs (already exists)
- [x] Account deletion endpoint (already exists)
- [ ] Cookie consent banner
- [ ] In-game financial disclaimer ("to gra edukacyjna…")

Phase 4 (PKO partnership):
- [ ] KNF review of in-game financial product depictions
- [ ] PL kids' marketing law review
- [ ] Real-money disclaimer copy reviewed with PKO compliance
- [ ] Updated Terms of Service for SKO 2.0
- [ ] Updated Privacy Policy for PKO partnership

Phase 6 (full launch):
- [ ] Penetration test
- [ ] Bug bounty program
- [ ] DPO contact info
- [ ] Breach notification plan
- [ ] Annual security audit

## 17. Bug bounty program (Phase 6.1.8)

Lightweight, GitHub-Security-Advisory based:
- Scope: anything at `*.wattcity.pl` (when domain provisioned)
- In-scope: SQLi, XSS, auth bypass, IDOR, CSRF, RCE, secrets leak
- Out-of-scope: rate limiting, social engineering, physical attacks, DoS
- Rewards: GitHub repo "hall of researchers" + small swag (€20 bookstore voucher) for valid reports
- No money rewards until revenue model established

## 18. Quick reference — what to do if…

| Scenario | Action |
|---|---|
| Suspect API key leaked | Rotate within 1h, full incident process |
| Find SQLi in code | Hot-patch + force redeploy + post-mortem |
| User reports inappropriate game content | Auto-suspend per Phase 5.2.3 → moderator queue |
| Admin endpoint hit by unauthenticated curl | Verify ADMIN_SECRET set; alert if it was |
| Player claims their account was hacked | Reset password (manual admin), check session table for unusual logins, change SESSION_SECRET if needed |
| GDPR data subject access request | Reply within 30 days; export JSON via /api/me + ledger dump |
| GDPR right-to-erasure request | Trigger DELETE /api/me; document deletion |
| KNF inquiry | Stop on-page (anything that resembles real financial product); contact counsel |
| PKO compliance flag during pilot | Emergency call w/ partnership lead; root-cause within 24h |

---

This document is living. Threats evolve, regulations change, the product changes. Re-review at every phase boundary.
