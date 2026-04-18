---
name: 002 — Push notifications held behind VAPID
description: Why the service-worker ships inactive until VAPID keys are provisioned
type: project
---

# ADR 002 — Push notifications held behind VAPID provisioning

**Date**: 2026-04-19
**Status**: accepted
**Supersedes**: nothing

## Context

Phase 2.7 of the Watt City backlog includes four push-notification triggers
(T-5min before rotation, cashflow tick, mortgage due, duel invite). Web Push
requires:

- A service worker registered on the origin (shipped — `public/service-worker.js`).
- VAPID key pair provisioned on the server and the client's public half
  distributed to the browser at subscribe time.
- An HTTPS delivery endpoint (Vercel already satisfies this).
- Explicit opt-in from each user (kid + parent flow per GDPR-K).

The kid-product implications are non-trivial:

- Under-13 push opt-in in the EU needs documented parental consent (GDPR-K).
- Misfired push ("you have a mortgage payment due" at 03:00 on a Saturday)
  burns trust far faster than a missed in-app badge.
- Revoking an errant key pair mid-pilot is a hard reset for every subscriber.

## Decision

The service worker ships inactive. In-app notifications work today
(`/api/me/notifications`, `NotificationBell`). Push is gated behind:

1. VAPID key pair provisioned on Vercel (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
2. A per-user opt-in UI that includes an explicit GDPR-K consent step for
   users whose age flag says under-16.
3. A "send test push" admin tool so we can validate delivery paths before
   enabling broadcast triggers.

Until those three items land, the `NotificationSettings.enabled.push` flag
defaults to `false` and the settings UI displays "Phase 2+" for the push row.

## Why not ship push immediately?

- GDPR-K consent scaffolding is Phase 6.3, not yet built.
- A stale notification ("you missed your payment" when it was actually
  covered by cashflow at render time) is worse than no notification.
- In-app center already covers the observability gap — users who open
  Watt City see every event in the bell dropdown.

## Revisiting

Revisit when:

- Phase 6.3 (parental-consent flow) is complete, AND
- Pilot program (Phase 4.4) confirms at least 100 kid accounts, AND
- We have a staff-only admin test-push tool proven reliable.
