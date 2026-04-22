# Data retention policy — Phase 6.2.5

> Draft operational policy. Legal review pending (see
> `docs/legal/README.md`).

## Scope

Applies to every piece of personal data held about a Watt City user.
Consumer-facing summary lives at `/ochrana-sukromia`; this document
drives engineering choices.

## Per-category retention

| Category | Storage | Retention | Trigger |
|---|---|---|---|
| Auth record (username + scrypt hash + salt + createdAt) | `xp:user:<u>` | Until account deletion + 30-day soft-delete grace | User DELETE → soft-delete → cron sweep |
| Session cookie | Browser + `xp:session:*` | 30 days sliding + logout | Logout, expiry, or session rotate |
| Progress state (resources, buildings, loans, score) | `xp:player:<u>` | Same as auth record | Same |
| Ledger entries | `xp:player:<u>:ledger` (LIST, cap 500) | 500 most recent entries — rolling | LTRIM on each append |
| Leaderboard (global + per-game + networth) | ZSETs | Until account deletion | Same as auth |
| Notifications | `xp:notifications:<u>` (LIST cap 200) | 200 most recent | LTRIM |
| Friends graph | `xp:user:<u>:friends*` | Until unilateral remove OR account deletion | User action |
| Marketplace history | `xp:marketplace:history:<u>` (LIST cap 200) | 200 trades | LTRIM |
| Analytics events | `xp:ev:day:YYYY-MM-DD` (LIST) + ZSETs | 90 days sliding | Manual prune via admin runbook (Phase 6.7+) |
| PKO Junior mock audit | `xp:pko-audit:<u>` (LIST cap 200) | 200 entries or 5 years (legal), whichever is longer | LTRIM + cron sweep |
| Parent↔child link codes | `xp:link-code:<code>` | 24 h TTL | Redis TTL |
| Rate-limit buckets | `xp:ratelimit:*:<window>` | ~1-60 min TTL | Redis TTL |
| Parental consent audit | `xp:parental-consent:*` (Phase 6.3.5) | 50-entry rolling cap via `lPush` + `lTrim`; 5 years target retention per GDPR Art. 7 §1 evidencing | Cron sweep after 5 years |
| Consent pending tokens | `xp:consent-pending:<token>` | 48 h TTL | Redis TTL |
| Consent granted record | `xp:consent-granted:<u>` | Until revocation or account delete | Manual revoke / hard-erase |
| Mail dispatch logs | Vercel logs only (structured `event:"mail.would-send"`) — domain + subject prefix, never full address or body | Retained per Vercel log-retention policy | Log rotation |
| Web3 mint log + consent-revoked flag | `xp:web3:mint-log:<u>`, `xp:web3:consent-revoked:<u>` | Until hard-erase | Soft-delete cascade |
| Cookie-consent ack | Browser `localStorage` | Client-side until user clears | N/A |

## Soft-delete grace (Phase 6.2.4)

- Flag: `xp:user:<u>:deleted-at` = epoch ms of DELETE request.
- Grace window: 30 days (`SOFT_DELETE_GRACE_MS` in `lib/soft-delete.ts`).
- Within grace: login clears the flag automatically (user returns).
- After grace: `/api/cron/sweep-deletions` calls `hardErase()` which
  deletes every per-user Redis key listed above and removes the user
  from every leaderboard.

## Inactive-account retention (Phase 6.3.4 — kids only)

- Cron `/api/cron/sweep-inactive-kids` (Phase 6.3) scans for users:
  - Age-flag < 16 (from `xp:user:<u>:age-bucket`)
  - `xp:player:<u>.lastTickAt` > 12 months ago (`INACTIVE_KID_AUTO_DELETE_MS` in `lib/gdpr-k.ts`)
  - No session activity in 12 months
- Action: flag for 30-day soft-delete (same path as user-initiated).
- Cron auth: shared via `lib/cron-auth.ts`. Dev-bypass is gated on
  `NODE_ENV === "development"` with no secret configured; every other
  environment (preview / CI / production) requires a bearer match —
  anonymous triggers cannot purge accounts.

## Backup retention (Phase 5.4.3)

- Daily JSON backup per `docs/RESTORE.md`.
- 30 days hot retention in S3-compatible storage.
- 90 days cold retention (rare-access tier).
- 1 year max; deleted after.
- Backup content excludes password hashes — matches retention-of-
  necessity principle.

## Breach notification plan (Phase 6.2.6)

### Detection
- Signal sources: `/api/admin/health` `alertIfStale`, webhook alert on
  rotation.failed, unexpected spike in `moderation.rejected` log lines,
  manual user reports to `security@…`.

### Assessment (within 24 h)
- Triage against `SECURITY.md` severity table.
- Determine whether personal data was accessed / exfiltrated / altered.
- Identify affected users list.

### Notification (within 72 h per GDPR Art. 33)
- Supervisory authority (UODO, Warsaw) for any breach likely to risk
  users' rights + freedoms.
- Affected users directly within 72 h when the breach is "high risk".
- Template: copy `docs/INCIDENT-TEMPLATE.md` + append "User-facing
  breach notification" section with plain-language description.

### Post-mortem (within 14 days)
- File under `docs/incidents/YYYY-MM-DD-<slug>.md`.
- Close with follow-up task list; each item owned and dated.

## DPO

- Primary: [DPO NAME — TBD]
- Email: `dpo@watt-city.example` (rotate + configure mail routing)
- Contact via `/ochrana-sukromia` footer link.
- Authority: UODO, ul. Stawki 2, 00-193 Warszawa, +48 22 531 03 00.
