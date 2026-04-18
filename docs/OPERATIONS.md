# Watt City — Operations runbook

How to deploy, monitor, debug, recover. Day-2 stuff.

## 1. Environments

| Env | URL | Branch | Redis | Notes |
|---|---|---|---|---|
| **dev (local)** | http://localhost:3000 | any | uses `.env.local` (defaults to prod Upstash, can override) | `pnpm dev` |
| **preview (Vercel)** | per-PR auto URL | any non-`main` | inherits production env vars | `vercel deploy` (no --prod) |
| **prod XP Arena** | https://xp-arena-ethsilesia2026.vercel.app | `main` | XP Arena Upstash | frozen — bug fixes only |
| **prod Watt City** | TBD (e.g. https://watt-city.vercel.app) | `watt-city` | separate Watt City Upstash (recommended) | active development |

## 2. Deploy procedure

### Standard deploy (Watt City)

```bash
# 1. Verify branch + clean working tree
git status
git checkout watt-city
git pull --rebase

# 2. Local pre-flight
pnpm install                 # ensure deps current
pnpm build                   # must pass
pnpm dev                     # smoke test critical flows

# 3. Push to GitHub (triggers Vercel preview build)
git push

# 4. Verify preview URL works
# (Vercel dashboard shows the preview URL)
curl -s -o /dev/null -w "%{http_code}" "https://<preview-url>/"

# 5. Promote to production
vercel deploy --prod --yes

# 6. Post-deploy smoke test
curl -s -o /dev/null -w "%{http_code}" "https://watt-city.vercel.app/"
curl -s "https://watt-city.vercel.app/api/cron/rotate-if-due" -X POST \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Pre-deploy checklist

- [ ] Working tree clean (no uncommitted changes)
- [ ] All TypeScript errors resolved
- [ ] Tests green
- [ ] Mobile UX manually verified
- [ ] No new SK string leaks (grep audit)
- [ ] Privacy implications reviewed if collecting new data
- [ ] Migration script written if schema changes
- [ ] CHANGELOG entry added

### Rollback procedure

```bash
# List recent deployments
vercel ls

# Identify last good production deployment
# Promote it back to production
vercel rollback <deployment-url>

# Verify production is back
curl -s -o /dev/null -w "%{http_code}" "https://watt-city.vercel.app/"

# Investigate the broken deploy on watt-city branch
git log -1
```

### Vercel deploy quotas

| Plan | Daily deploys | Notes |
|---|---|---|
| Hobby | 100 / day per project | Resets at 24h from first deploy of day |
| Pro | 6000 / day | Vastly higher |

Watch for `Resource is limited - try again in 24 hours` error. We hit this once during MVP iteration. **Mitigation**: batch changes, test locally, deploy 3–5×/day max.

## 3. Environment variables

### Production env vars (Vercel)

| Var | Value example | Set via | Rotation |
|---|---|---|---|
| `SESSION_SECRET` | hex 64 chars (random) | `vercel env add` | annually |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | `vercel env add` | per Upstash docs |
| `UPSTASH_REDIS_REST_TOKEN` | base64 | `vercel env add` | annually |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | `vercel env add` (sensitive) | quarterly |
| `ADMIN_SECRET` | hex 64 chars | `vercel env add` (sensitive) | quarterly |
| `CRON_SECRET` | hex 64 chars | `vercel env add` (sensitive) | quarterly |

### Add a new env var

```bash
vercel env add <NAME> production
# Paste value when prompted

# For sensitive values:
vercel env add <NAME> production --sensitive
```

After adding any env var, **redeploy** is required for it to take effect:

```bash
vercel deploy --prod --yes
```

### Pull env to local dev

```bash
vercel env pull .env.local --environment=production --yes
# Sensitive values come back masked (empty quotes); manually paste those
```

`.env.local` is in `.gitignore`. Never commit secrets.

## 4. Cron jobs

### Configured in `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-game",
      "schedule": "0 9 * * *"            // Hobby tier limit: daily-only
    }
  ]
}
```

### Hobby vs Pro

- **Hobby**: only daily granularity. We have `0 9 * * *` (every day 9 UTC).
- **Pro** (when upgraded): allows `*/5 * * * *` for /5min granularity.

### External cron pinger (Hobby workaround)

When we need /5min cadence on Hobby, use cron-job.org (free):

1. Sign up at cron-job.org
2. Create job: `POST https://watt-city.vercel.app/api/cron/rotate-if-due`
3. Header: `Authorization: Bearer <CRON_SECRET>`
4. Schedule: every 5 minutes
5. Save

### Lazy fallback

Even with cron broken, on every authenticated render we call `tickIfDue()` which checks:
- Has cron rotated in last hour?
- Are buildings overdue for tick?

If yes, do work inline (with single-flight lock).

### Cron health checks

Admin endpoint: `GET /api/admin/rotation-status`

Returns:
```json
{
  "lastRotationAt": 1776617170404,
  "minutesSinceLastRotation": 12,
  "expectedNextAt": 1776617470404,
  "indexCount": 2,
  "lockHeld": false,
  "alertIfStale": false       // true if lastRotation > 90 min ago
}
```

If `alertIfStale: true` for > 30 minutes, page on-call.

## 5. Monitoring

### Built-in Vercel observability

- **Logs**: Vercel dashboard → Logs tab. Tail or filter.
- **Function timings**: visible per-route in dashboard
- **Build logs**: per deploy

### Custom telemetry (Phase 5.3)

Events written to Redis lists:
- `xp:telemetry:<YYYY-MM-DD>` — daily event log
- Daily aggregation cron writes summary to `xp:telemetry:summary:<YYYY-MM-DD>`
- Admin dashboard at `/admin/telemetry` reads summaries

### Key metrics to watch

| Metric | Good | Alert |
|---|---|---|
| API p95 latency | < 200ms | > 1000ms for 5 min |
| AI rotation success rate | > 99% | < 95% over 1h |
| Anthropic API daily cost | < $5 | > $20 daily |
| Redis command rate | < 100/s | > 500/s sustained |
| Failed login rate | < 1% | > 10% over 1h (suggests brute force) |
| 4xx rate | < 5% | > 15% (suggests broken client) |
| 5xx rate | < 0.1% | > 1% over 5 min |

### Alerting (Phase 5.4.2)

Once we add Sentry or similar:
- 5xx rate spike → email + Slack
- Anthropic cost > $20 daily → email
- Cron rotation stale > 90 min → page

Until then: manual daily check of Vercel dashboard.

## 6. Database operations (Upstash)

### Connect via REST

```bash
# Read a key
curl -X POST "$UPSTASH_REDIS_REST_URL/get/<key>" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Write a key
curl -X POST "$UPSTASH_REDIS_REST_URL/set/<key>/<value>" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Atomic ops
curl -X POST "$UPSTASH_REDIS_REST_URL/zadd/<key>/<score>/<member>" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

Or use Upstash dashboard's CLI tab.

### Common queries

```bash
# Find all AI games
curl -X POST "$URL/keys/xp:ai-games:*" -H "Authorization: Bearer $TOKEN"

# Top 10 global leaderboard
curl -X POST "$URL/zrevrange/xp:leaderboard:global/0/9/withscores" \
  -H "Authorization: Bearer $TOKEN"

# Player state
curl -X POST "$URL/get/xp:player:<username>" \
  -H "Authorization: Bearer $TOKEN" | jq

# Active rotation lock
curl -X POST "$URL/get/xp:rotation-lock" -H "Authorization: Bearer $TOKEN"
```

### Backup

Manual snapshot:
```bash
# Upstash dashboard → Backups → Create Backup
# Or via API (see Upstash docs)
```

Automated (Phase 5.4.3):
- Daily snapshot to S3-compatible storage
- 30-day retention
- Quarterly restore drill (write run sheet)

### Restore

```bash
# 1. Identify snapshot in Upstash dashboard or S3
# 2. Provision new Redis instance from snapshot
# 3. Update Vercel env vars to point at new instance
# 4. Redeploy
# 5. Verify smoke tests
```

## 7. Common operational tasks

### Force-rotate a stuck AI game

```bash
curl -X POST "https://watt-city.vercel.app/api/admin/rotate-ai" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"theme":"BLIK — kody, przelewy, nowe usługi"}'
```

### Cleanup zombie archive entries

```bash
curl -X POST "https://watt-city.vercel.app/api/admin/archive-cleanup" \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

### Award resources to a user (apology / bug compensation)

```bash
curl -X POST "https://watt-city.vercel.app/api/admin/leaderboard" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"action":"award","gameId":"finance-quiz","username":"<user>","xp":100}'
```

### Remove a user from a game leaderboard (test cleanup)

```bash
curl -X POST "https://watt-city.vercel.app/api/admin/leaderboard" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"action":"remove","gameId":"finance-quiz","username":"<user>","alsoGlobal":true}'
```

### Suspend a user (admin)

```
# Currently no built-in suspension; manual:
# 1. Reset their password to random unknown value (via direct Redis write to xp:user:<u>.passwordHash)
# 2. They can no longer log in
# 3. Account preserved (data not deleted)
# 
# Better: build proper /api/admin/suspend endpoint (Phase 5.1.7)
```

## 8. Incident playbooks

### Playbook A: Production down (5xx spike)

```
1. Confirm: visit https://watt-city.vercel.app/ — does it 500?
2. Check Vercel dashboard → Recent deploys
   – If recent deploy → ROLLBACK (vercel rollback <previous>)
   – Else continue
3. Check Vercel dashboard → Logs → recent errors
   – Pattern? File specific error
4. Check Upstash dashboard → status / quota
   – If Redis down → wait + post status
5. Status page: post incident
6. Once resolved: post-mortem in docs/incidents/
```

### Playbook B: Anthropic API down

```
1. Symptoms: AI game generation fails, /api/admin/rotate-ai returns 5xx
2. Lazy fallback should handle: mock-v1 path serves fixture content
3. If mock fixtures missing for current theme → admin force-rotate to theme that has fixture
4. Wait for Anthropic recovery
5. After recovery, force-rotate to refresh content
```

### Playbook C: Cron stopped firing

```
1. Symptom: rotation-status shows lastRotation > 90 min ago
2. Check Vercel cron logs: did the route get hit?
   – If no → Vercel cron broken; switch to external pinger
   – If yes but errored → check logs for why
3. Manual trigger to unblock: curl /api/admin/rotate-ai
4. Lazy fallback also catches this on next user visit
```

### Playbook D: Secret leaked

```
1. Identify which secret leaked (GitHub secret scanner alert, etc.)
2. Rotate immediately:
   vercel env rm <SECRET> production --yes
   vercel env add <SECRET> production --sensitive
   # Paste new value
3. Redeploy: vercel deploy --prod --yes
4. Audit usage:
   – If ANTHROPIC_API_KEY: check Anthropic dashboard for unusual cost spikes
   – If ADMIN_SECRET: check audit log (xp:audit:*) for unauthorized admin calls
   – If SESSION_SECRET: all sessions invalidated (users re-login); no further action
5. Post-mortem
```

### Playbook E: Database growing too large

```
1. Symptom: Upstash dashboard shows >80% of free tier limit
2. Identify big keys:
   – AI game envelopes: each ~2KB; 1 per hour = ~17 MB/year
   – Player ledger: per-player, capped at 30 days of entries effectively
   – Telemetry: aggregated daily, raw drop after 30 days
3. Cleanup actions:
   – Run /api/admin/archive-cleanup
   – Trim old ledger entries (LTRIM xp:player:<u>:ledger 0 999)
   – Drop telemetry > 30 days
4. Long-term: upgrade to Upstash Pro
```

## 9. Local development setup

### From scratch

```bash
git clone https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026.git
cd xp-arena-ETHSilesia2026
git checkout watt-city
pnpm install

# Pull env from Vercel (sensitive values may be empty)
vercel env pull .env.local --environment=production --yes

# Manual paste of sensitive values:
# - ANTHROPIC_API_KEY
# - ADMIN_SECRET
# (Use ones from password manager; never paste keys to chat)

# Start dev server
pnpm dev

# Open http://localhost:3000
```

### Common dev issues

| Symptom | Cause | Fix |
|---|---|---|
| `pnpm dev` OOMs | Turbopack memory leak with HMR | `NODE_OPTIONS="--max-old-space-size=6144" pnpm dev` |
| Lang switch doesn't apply | Cookie cached | Open in private window |
| AI game returns mock-v1 unexpectedly | ANTHROPIC_API_KEY empty in .env.local | Paste real value, restart dev |
| Auth fails locally | SESSION_SECRET differs from prod cookies | Logout + re-login (clears stale cookies) |
| Hot reload breaks Redis | Module re-evaluation re-creates in-memory store | Use Upstash creds in .env.local instead of in-memory fallback |

## 10. Cost monitoring

### Monthly forecast (1k DAU)

| Item | Cost |
|---|---|
| Vercel Hobby | $0 |
| Vercel Pro (when upgraded) | $20 |
| Upstash Free | $0 |
| Upstash Pro (at 1k DAU) | ~$10 |
| Anthropic API | ~$15 (24 games/day × 30 days × $0.02) |
| Domain | ~$1 |
| **Total** | **~$46–66/mo** |

### Cost alerts

- Anthropic dashboard: set monthly budget alert at $30
- Upstash dashboard: alert at 80% command quota
- Vercel: alert at 80% function-execution quota

### Reduce cost when needed

- Pause cron during low-traffic hours (`* 7-23 * * *` instead of always)
- Reduce AI rotation frequency (every 2h instead of 1h)
- Cache Anthropic responses harder (prompt caching is already on)
- Aggressive content TTL on archived games (drop spec after N days, keep meta only)

## 11. Communication

### Status page (Phase 5.4.7)

`status.wattcity.pl` — show:
- Up/Down indicator
- Recent incidents
- Planned maintenance
- Subscribe (RSS / email)

Until provisioned: incidents posted to project README + Discord.

### In-app banner

Server-controlled banner via Redis key `xp:banner:active`:
```json
{
  "message": "Konserwacja: 22:00–22:30 dziś",
  "type": "warning",
  "expiresAt": 1700000000000
}
```

UI checks on every page load, displays if active.

### User communication channels

- In-app notification feed (Phase 2.7)
- Email digest (Phase 2.7.5) — only for parents
- Discord/Slack webhook (Phase 1.7) — community channel

## 12. On-call rotation

For now: solo dev. When team grows:
- Primary on-call: rotates weekly
- Severity 1: page primary; backup if no response in 30 min
- Severity 2: notify; respond within 4h
- Severity 3: ticket; respond next business day

## 13. Disaster recovery test (quarterly)

Run drill:
1. Pretend production is gone
2. Provision new Vercel project from `watt-city` branch
3. Restore Upstash from latest backup
4. Update DNS / domain
5. Verify smoke tests pass
6. Time taken: target < 4h end-to-end
7. Document gaps; fix runbook

## 14. Capacity planning

| User count | Current bottleneck | Action |
|---|---|---|
| 100 | None | — |
| 1,000 | Upstash command quota | Upgrade to Pro |
| 10,000 | Anthropic cost ($150/mo) | Investigate prompt caching effectiveness |
| 100,000 | Vercel function timeouts | Move heavy work to background workers |
| 1,000,000 | Need real database | Migrate from Redis to Postgres + Redis cache |

## 15. Documentation duty

After any production incident:
- Post-mortem in `docs/incidents/<YYYY-MM-DD>-title.md`
- Format: timeline, root cause, impact, mitigation, prevention
- Link from CHANGELOG

After any new operational tool/script:
- Document in this file
- Add to relevant playbook section

---

This runbook is living. Update after every incident, every new operational pattern, every tool added.
