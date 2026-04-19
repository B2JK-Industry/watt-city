# Upstash scaling runbook — Phase 10.2.4

This doc describes the signals that tell us Upstash Free/Pro has run
out of room, and the migration paths if the signals fire. Agent does
NOT actually migrate (DB migration is destructive); this is a runbook
for the operator.

## Current footprint (2026-04)

- **Tier**: Upstash Redis Free (expected; flip to Pro when metrics
  below cross thresholds).
- **Storage**: ~100 KB per active user (player state + ledger cap 500
  + achievements + notifications cap 200).
- **Commands**: ~10 per typical page load (tick + read state + lazy
  rotation check).

## Signals → action map

| Signal | Measurement | Threshold | Action |
|---|---|---|---|
| Daily commands | Upstash dashboard → "Commands" | ≥ 80 % of free-tier 10 000/day | Flip to Pro (USD 10/mo starting) |
| Max memory | Upstash dashboard → "Storage" | ≥ 80 % of free-tier 256 MB | Flip to Pro 1 GB (same USD 10) |
| p99 latency | `/api/admin/health` latency field | > 500 ms sustained for > 1 hour | Regional migration |
| Rate-limit bucket misses | Application logs — grep "rate-limited" spikes | > 5 % of POSTs being 429'd | Tune buckets per `lib/rate-limit.ts` |
| TLS handshake timeouts | Vercel logs | Any sustained occurrence | Upstash region too far; migrate |

## Migration path: Free → Pro

1. Order the new Pro instance at Upstash dashboard. Keep the same
   region (Frankfurt `eu-central-1` for us).
2. Dual-write for ≥ 24 hours — operator sets `UPSTASH_REDIS_SECONDARY_*`
   envs and we add a short shim that writes to both (not currently
   implemented; land before migration).
3. Run `/api/admin/backup` against the current (Free) instance.
4. Swap Vercel env to point at the Pro instance.
5. Restore the backup (see `docs/RESTORE.md`).
6. Monitor `/api/admin/health` + Upstash dashboard for 24 hours; cut
   over the dual-write to Pro-only.
7. Cancel the Free instance after 7 days (safety window).

## Migration path: Upstash → self-hosted (≥ 100k DAU)

Only at this scale does self-hosting make sense. Options in priority
order:
1. **AWS ElastiCache Redis** (Frankfurt) — managed, good AZ redundancy.
2. **Self-hosted Redis cluster on Hetzner** — cheaper but ops cost.
3. **KeyDB / Dragonfly** — Redis-compatible forks with better throughput.

Migration pattern identical to Free→Pro: dual-write → backup →
cut-over.

## What NOT to migrate casually

- **Leaderboard ZSETs**: these back the visible XP ladder. Any
  leaderboard migration needs a freeze-play-window (admin endpoint
  `/api/admin/freeze-leaderboards` — future; not yet implemented).
- **Ledger LPUSH lists**: capped at 500, dual-write works fine.
- **Session cookies**: no migration needed — cookies are client-side
  and HMAC'd against `SESSION_SECRET`; changing Redis host doesn't
  invalidate them.

## Cost modelling (2026-04 prices)

| Scale | Commands/day | Storage | Monthly cost |
|---|---|---|---|
| 100 DAU | 1 000 | 10 MB | $0 (Free) |
| 1 000 DAU | 10 000 | 100 MB | $10 (Pro) |
| 10 000 DAU | 100 000 | 1 GB | $50 (Pro) |
| 100 000 DAU | 1 000 000 | 10 GB | $250 (Pro tier upgrade) |
| 500 000+ DAU | 5 000 000+ | 50 GB | Self-hosted territory |

## Signals to ignore

- **Momentary spikes**: a single hour over threshold is noise (e.g.
  the rotation cron firing for all users on a schedule change).
- **Dev-mode traffic**: local development hits the in-memory fallback
  (`lib/redis.ts` has that path); don't factor into prod budgeting.
