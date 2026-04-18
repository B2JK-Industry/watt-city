# Restore runbook — Phase 5.4.4

## When to use

- Upstash Redis was wiped or corrupted.
- A bad admin operation (mass grant, botched migration) needs rollback.
- Moving between Redis instances (test → prod, or old → new Upstash region).

## Prerequisites

- `ADMIN_SECRET` env available locally.
- A prior backup JSON from `/api/admin/backup` (see `docs/OPERATIONS.md`).
- `node`, `curl`, and `jq` installed.

## Steps

### 1. Pull the backup

```bash
# Production backup (admin-secret required)
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "https://<your-host>/api/admin/backup" \
  -o backup-$(date +%F).json

# Optional: sample mode first to verify shape
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "https://<your-host>/api/admin/backup?sample=1" | jq .usernameCount
```

### 2. Verify before restoring

```bash
jq '.users | length' backup-2026-04-19.json       # how many users
jq '.aiLiveIndex' backup-2026-04-19.json           # live AI game ids
jq '.users[0].state.resources' backup-2026-04-19.json
```

### 3. Restore (full)

There's no dedicated `POST /api/admin/restore` — destructive ops are
intentionally operator-driven. Use a small node script:

```js
// restore.mjs
import { Redis } from "@upstash/redis";
import fs from "node:fs";
const redis = Redis.fromEnv();
const data = JSON.parse(fs.readFileSync("backup-2026-04-19.json", "utf8"));
for (const { username, state } of data.users) {
  if (!state) continue;
  await redis.set(`xp:player:${username}`, state);
}
await redis.set("xp:ai-games:index", data.aiLiveIndex ?? []);
await redis.set("xp:marketplace:active", data.marketplaceActive ?? []);
console.log(`Restored ${data.users.length} players`);
```

Run with:

```bash
UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... \
  node restore.mjs
```

### 4. Post-restore checks

1. `curl $HOST/api/admin/health -H "Authorization: Bearer $ADMIN_SECRET"`
2. Load `/miasto` as a known user; verify buildings + balance match.
3. `curl $HOST/api/admin/rotation-status` — should show either a live
   game or one ready to publish.

### 5. Caveats

- **Passwords are NOT in the backup.** Users keep their old passwords
  (scrypt-hashed `xp:user:<username>` records were NOT cleared). If you
  wiped Redis entirely, users will need to re-register.
- **Leaderboards are reconstructed at replay**, not restored verbatim.
  For exact leaderboard parity, walk `state.ledger` entries of kind
  "score" and re-POST `/api/admin/leaderboard award` for each one.
- **Notification feeds reset to empty.** Acceptable loss; the 200-entry
  cap meant most content was already pruned anyway.

## Rollback window

We keep 30 days of daily JSON backups in the Phase 4+ deployment.
S3-compatible storage lifecycle rule: retain 30, migrate to cold for 90,
delete after 1 year.
