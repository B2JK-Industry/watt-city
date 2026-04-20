# Security policy — Watt City

We take security seriously. This repo is an educational game for kids; a
breach of kid data, an injection of inappropriate content, or a rate-limit
bypass that spams the Claude API are all treated as P0/P1 incidents.

## Reporting a vulnerability

- **Preferred**: [GitHub Security Advisory](https://github.com/B2JK-Industry/watt-city/security/advisories/new)
  (private, encrypted).
- **Fallback**: email `security@watt-city.example` (rotate as needed).
- Please include: reproduction steps, impact assessment, and whether you
  want public credit in the fix commit.

## Scope

### In scope

- Authentication + session handling (`lib/session.ts`, `lib/auth.ts`)
- Rate limits (`lib/rate-limit.ts`) — bypass is a P2
- CSRF (`lib/csrf.ts`, `middleware.ts`) — bypass is P1
- Content-Security-Policy (`next.config.ts`) regression is P2
- AI-generated content filter (`lib/ai-pipeline/moderation.ts`) — bypass
  that publishes a slur is P1
- Any admin endpoint (`/api/admin/*`) authorisation bypass — P0
- Ledger + loan engine idempotency (`lib/player.ts`, `lib/loans.ts`) —
  double-spend or double-credit is P1
- Marketplace (`lib/marketplace.ts`) — escrow bypass, fee bypass, or
  restoring a cancelled listing to wrong seller — P1
- Parental consent flow (`/api/parent`) — linking a wrong parent is P0

### Out of scope

- Third-party vulns that we don't vendor (Vercel platform, Upstash)
- Social engineering of our team
- DoS via rate-limit exhaustion that only denies traffic to the attacker

## Supported versions

Only the `watt-city` branch is supported. `main` hosts the frozen XP
Arena demo and only receives security patches when they also apply there.

## Response times

| Severity | First response | Fix target |
|---|---|---|
| P0 (data loss, admin bypass, RCE) | 4 h | 24 h |
| P1 (CSRF bypass, idempotency bug, mod bypass) | 24 h | 7 d |
| P2 (rate-limit bypass, CSP regression) | 72 h | 30 d |
| P3 (cosmetic, minor info disclosure) | 7 d | best-effort |

## Bug bounty

No cash rewards in the MVP window. We credit reporters in the fix commit
and on the `/status` page. When the PKO partnership lands, a monetised
bounty may follow — see `docs/decisions/` for updates.
