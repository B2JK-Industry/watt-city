# Branching strategy — XP Arena vs Watt City

## TL;DR

- **`main`** = current XP Arena (the hackathon submission). **Frozen** for code changes; only docs may land here.
- **`watt-city`** = active development of the new product. All Phase 1+ work commits here.
- When Watt City is ready to replace XP Arena, we cut over with a single merge or a Vercel project swap (decision pending).

## Why this split

Two reasons:
1. **XP Arena is the live demo for ETHSilesia 2026 judging.** It must keep working. Kids are already on the URL (testtestowy1, etc.). Disrupting it mid-pivot would lose users.
2. **Watt City is multi-week work.** It involves a full UI rebuild (city map → 20-slot grid), data model expansion (resources ledger), and new gameplay loops (loans). Doing this on `main` would require feature flags everywhere — slower iteration.

Separate branch = clean iteration, low risk to existing prod.

## Daily workflow

```bash
# Work on Watt City
git checkout watt-city
# … edit, commit, push as normal
git push

# Need to fix something on XP Arena (rare)
git checkout main
git pull
# … fix
git push
# Then return to Watt City
git checkout watt-city
git rebase main         # bring in any XP Arena fixes
```

## Deployment

| Branch | Vercel deploy | Domain |
|---|---|---|
| `main` | auto-deploys to production | https://xp-arena-ethsilesia2026.vercel.app |
| `watt-city` | preview deploys per push | unique preview URL per commit |

To make Watt City have its own stable preview URL, optionally create a **separate Vercel project** pointing at the same repo but tracking `watt-city` branch instead of `main`. That way:
- XP Arena prod (main) lives at xp-arena-ethsilesia2026.vercel.app
- Watt City preview lives at watt-city-xxxxx.vercel.app (or wattcity.vercel.app if domain provisioned)
- Both share the same Upstash Redis (or split — see below)

**Pending decision:** does Watt City share the existing Upstash Redis or get a fresh one?

| Option | Pro | Con |
|---|---|---|
| Share Redis | one DB, easy to test cross-product features | risk of polluting XP Arena leaderboards |
| Separate Redis | clean isolation | need to provision second instance, slight cost |

Default suggestion: **separate Redis** for Watt City (Upstash free tier covers second DB). Spinning up new instance is 2 min. Reduces risk to existing XP Arena users.

## Cut-over plan (when Watt City is ready)

When all Phase 1 acceptance criteria are met on the `watt-city` branch:

1. **Beta period** (1–2 weeks): Watt City available at separate URL, invited testers only
2. **Communication**: notify existing XP Arena users via in-app banner: "We're moving to Watt City — new URL, your account migrates"
3. **Data migration script**: copy `xp:user:*`, `xp:stats:*`, `xp:leaderboard:*` from XP Arena Redis → Watt City Redis (with reasonable transformations: existing W → starter resources of equivalent value)
4. **Domain swap**: point xp-arena-ethsilesia2026.vercel.app at the Watt City project (or vice versa — depending on which name we keep)
5. **Read-only XP Arena**: archive the original at a memorable URL like xp-arena-archive.vercel.app for posterity / pitch reference
6. **Merge `watt-city` → `main`** as a single squash commit; tag the prior `main` HEAD as `xp-arena-final-v1.0`

## What can land on `main` while Watt City is in flight

Strictly **bug fixes only**:
- Critical security issues (`/api/admin/*` lock bypass, etc.)
- Data corruption fixes
- Documentation updates (allowed)

Anything else → `watt-city` branch.

## What CANNOT land on `main`

- New features
- Refactors
- Schema migrations
- Branding changes
- New routes

## Conflict policy

When `main` gets a bugfix, `watt-city` should `git rebase main` to stay current. If a rebase produces deep conflicts, resolve by preferring `watt-city`'s direction — Watt City is the future direction; XP Arena is the legacy.

## Visibility checklist

- [x] Branch created and pushed
- [x] This doc explains the policy
- [ ] First Phase 1 commit lands on `watt-city`
- [ ] Vercel project for `watt-city` separate or shared (pending decision)
- [ ] Separate Upstash Redis provisioned (pending decision)
- [ ] Cut-over runbook drafted before week-1 of Watt City coding ends
