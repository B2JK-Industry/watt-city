---
name: 001 — Hourly rotation on Vercel Hobby
description: Why Watt City rotates hourly without Pro, and how the three trigger paths compose
type: project
---

# ADR 001 — Hourly rotation on Vercel Hobby

**Date**: 2026-04-18
**Decision authors**: autonomous agent (executing the tech-lead kickoff prompt)
**Status**: accepted
**Supersedes**: previous daily-at-09:00 cron schedule

## Context

Phase 1.1 of the Watt City backlog calls for hourly AI-game rotation. The
original backlog (item 1.1.4) assumed a Vercel Pro upgrade so that
`"schedule": "*/5 * * * *"` would be allowed. Decision D2 (see
`docs/README.md`) resolved this by rejecting the Pro upgrade for now:

> **D2**: Lazy-only + free external pinger; no Vercel Pro yet.

Vercel Hobby Cron only permits daily schedules, not 5-minute or hourly.
Therefore the rotation has to be triggered by external means.

## Decision

The rotation runs on **three converging triggers**, any one of which will
produce the right outcome because the endpoint is idempotent:

1. **External cron pinger** (primary). A free service like cron-job.org hits
   `POST /api/cron/rotate-if-due` every 5 minutes with
   `Authorization: Bearer $CRON_SECRET`.
2. **Vercel Cron** (safety net). The `vercel.json` cron fires the same
   endpoint daily at 09:00 UTC. Guarantees a rotation even if the external
   pinger is misconfigured.
3. **Lazy fallback** (backstop). On any authenticated page render, if the
   live index contains a game with `validUntil <= now`, we call
   `rotateIfDue()` inline behind the same lock. Item 1.1.6 wires this into
   the city-scene server component.

All three paths hit `rotateIfDue()`, which is guarded by:

- `xp:rotation-lock` (Redis `SET NX EX 60`) — single-flight lock
- `xp:ai-games:last-rotation-bucket` — per-hour sentinel so we only publish
  once per hour even under load

## Why not upgrade to Pro?

- Revenue doesn't justify $20/mo yet; Watt City is pre-partnership.
- Decision D2 is explicit.
- The three-trigger design produces equivalent reliability at $0/mo.

## How to configure the external pinger

See `docs/OPERATIONS.md` (section "External rotation pinger") for the
cron-job.org setup. Required env vars on Vercel:

- `CRON_SECRET` — shared secret used in the `Authorization: Bearer …`
  header by the pinger and by Vercel Cron itself.
- `ADMIN_SECRET` — used by admin endpoints, not by the pinger.

## Revisiting

Revisit this decision when:

- Monthly revenue exceeds $50/mo (Pro becomes reasonable), OR
- Vercel introduces a cheaper tier with hourly cron, OR
- The external pinger proves unreliable for >3 consecutive hours over a
  two-week window.
