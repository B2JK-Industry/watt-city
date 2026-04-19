# ADR 005 — Cleanup (Issue 4): V4.6 parent observer restoration

**Date**: 2026-04-19
**Status**: accepted (landed in `fix(cleanup):issue-4`)
**Scope**: cleanup audit §Issue 4 — "V4.6 parent observer was reverted — restore or document".

## Context

The UX audit found that `11bc684 Revert "feat(v4):V4.6 — parent observer dashboard + 24h link code"` had reverted the initial V4.6 commit (`271df9f`). That revert happened in a session where V4.6 was accidentally pushed to the wrong branch (`watt-city` instead of `watt-city-v3v4`); the revert cleared it off `watt-city`, and a subsequent cherry-pick restored V4.6 on `watt-city-v3v4`, which then merged into `watt-city` as part of PR #3.

The net effect was that the revert + re-apply cycle ended in the correct state: all V4.6 files are live on the current `watt-city` tree.

## Verification

Backend:
- `lib/parent-link.ts` — issue/redeem helpers present. 8 unit tests pass.
- `POST /api/rodzic/code` — issues a 24h code.
- `POST /api/rodzic/dolacz` — redeems a code.
- `app/rodzic/page.tsx` — observer dashboard.
- `app/rodzic/dolacz/page.tsx` — redemption form.
- `components/parent-digest-card.tsx` — in-app weekly digest card.

Gap found during cleanup verification: **no UI affordance for the kid to trigger `POST /api/rodzic/code`**. The `/profile` page had no "Generate parent invite code" button, so the flow was effectively unreachable from the product surface even though every backend piece worked.

## Decision

Add the missing affordance rather than document the gap. This is the minimum scope the audit's acceptance criterion required:

> Acceptance: fresh kid account → generate parent code via `/profile` → open incognito → `/rodzic/dolacz` with code → `/rodzic` shows read-only dashboard with cityLevel + weekly digest card.

## Implementation

`components/parent-invite-card.tsx` — client component:
- Single "Generate code" button.
- On success shows the 6-char code + copy-to-clipboard + expiry countdown (`24h` from `expiresAt` returned by the API).
- Error path for network/backend failures.
- 4-lang copy (PL/UK/CS/EN).
- Re-issue link so a kid who misplaced a code can refresh.

Mounted on `app/profile/page.tsx` under the existing `ProfileEdit` section. No API or schema changes required — the backend route `POST /api/rodzic/code` already returns `{ok, code, expiresAt}`.

## Rollback

Delete `components/parent-invite-card.tsx` and the import + `<ParentInviteCard>` usage in `app/profile/page.tsx`. Backend routes stay untouched; API contract unchanged. No data migration.
