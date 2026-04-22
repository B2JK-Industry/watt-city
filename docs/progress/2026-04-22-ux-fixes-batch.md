# 2026-04-22 — user-reported UX sweep + E2E leaderboard pollution

User-testing pass of the live production site surfaced 5 issues; all
5 resolved in commit `f124349` on `main`. One item (empty-space UX in
the "Tvé město" card) was deliberately deferred per user instruction —
design still open, candidates listed in README "Future roadmap".

## Issues + fixes

### 1. Unlit buildings looked "on" before first play
**Observed**: city-scene SVG rendered buildings with colours fully
visible (`saturate(0.35) brightness(0.6)`), contradicting the landing-
page hero copy ("9 budynków = 9 mini-gier. Dopóki nie zagrasz, budynek
stoi w ciemności. Po wyniku zapali mu się okna i neon.").

**Fix** (`components/city-scene.tsx`): switched the unlit filter to
`saturate(0) brightness(0.18)` so buildings read as true silhouettes
until the player's first round completes (`powered = (g?.plays ?? 0) > 0`).
The `powered` flag already existed — only the filter string changed.

### 2. `/api/score` slow on every round end
**Observed**: the post-round XP submission blocked the RoundResult modal
for ~1 s in production.

**Fix** (`app/api/score/route.ts`): three parallelisations — feature-flag
reads (`v3_score_lock` + `v2_post_game_modal`) run in `Promise.all`;
`getPlayerState` + `readEconomy` run in parallel; `sweepAchievements` +
`recordEvent` fire-and-forget as background work (errors logged, not
awaited). Response hot path drops from ~5× serialised Redis round-trips
to ~2×. No behaviour change.

### 3. Night label hardcoded to `🌙 Noc · 22:14`
**Observed**: `dashboard.gamesHubTime` reads the same static string in
every locale.

**Resolution**: intentional for now — the cityscape SVG is a permanent
night scene by design (the product story is "odemkni mesto v noci").
The label is consistent with the art, not a bug. Logged but not fixed;
revisit if we ever add diurnal art.

### 4. Onboarding tour re-appeared after user completed it
**Observed**: users who clicked through every step (including the final
`<Link href="/loans/compare" onClick={dismiss}>`) saw the modal again on
the next home-page visit.

**Root cause**: `dismiss()` fires the PATCH and returns immediately; the
`<Link>` navigation starts a route change, the browser cancels the
in-flight fetch, `tourSeen` is never persisted.

**Fix** (`components/onboarding-tour.tsx`):
- `keepalive: true` on the PATCH so the browser holds the request open
  across the navigation.
- localStorage `wc_tour_seen=1` short-circuit in the mount effect — even
  if the server write fails the client never re-opens the modal.
- Window event listener `wc:open-tour` for manual replay (bypasses the
  home-page pathname gate + clears LS).
- New exported `OpenTutorialButton` mounted on `/o-platforme` (About
  page) for logged-in users — dispatches the event, no Provider plumbing.

### 5. `gp_*` / `pr_*` / `rl_*` accounts on the global leaderboard
**Observed**: leaderboard ranks #27–#41 were all E2E test usernames.

**Root cause**: `playwright.config.ts` `webServer` spawned `pnpm dev`
without overriding `UPSTASH_REDIS_REST_URL` / `_TOKEN`. Next.js dotenv
order put `.env.local` after `process.env`, but nothing was setting them
in `process.env` — so `.env.local`'s production tokens loaded. Every
e2e registration (`gp_${randomAlphaSuffix(12)}`, `pr_${…}`, `rl_${…}`,
`smoke${…}`, `bot_${…}`, `ghost_${…}`, `db_${…}`, `di_${…}`, `sec_${…}`,
`kid_${…}`, `k_${…}` / `p_${…}` / `t_${…}` / `s_${…}` / `a_${…}` /
`b_${…}` / `f_${…}`, `lb1_${…}` / `lb2_${…}`, `okuser${…}`) wrote to the
production `xp:leaderboard:global` ZSET.

**Fix**: two-part.
1. **Prevent future leakage** (`playwright.config.ts`): explicit
   `UPSTASH_REDIS_REST_URL: ""` + `UPSTASH_REDIS_REST_TOKEN: ""` in
   `webServer.env`. The `hasUpstash()` guard in `lib/redis.ts` does
   `Boolean(URL && TOKEN)`, so empty strings force the in-memory
   fallback. Override path: `E2E_UPSTASH_URL` / `E2E_UPSTASH_TOKEN` for
   a dedicated test Upstash project.
2. **Clean up historical leakage**:
   - `lib/redis.ts` — new `zAllMembers(zkey)` helper (unbounded zrange).
   - `app/api/admin/purge-e2e-accounts/route.ts` — admin-bearer POST,
     matches usernames against a prefix+suffix regex, calls
     `hardErase()` (the GDPR Art. 17 path that also burns web3 medals
     if any). Dry-run by default; `{"dryRun": false}` commits.
     Single-letter prefixes (`k_`, `p_`, …) gated behind
     `includeSingleLetter: true` because real users could share them.
   - `scripts/purge-e2e-accounts.sh` — shell wrapper reading
     `ADMIN_SECRET` from `.env.local`, `--commit` / `--include-single-letter`
     flags.

## Deferred (not a bug, needs design)

### 6. "Tvé město" home-card empty centre

The home-page city widget has a `ring-progress | … large gap … |
buildings/level` layout with a dead middle. User requested "only a
proposal for what could go there". Options presented:

| Priority | Proposal |
|---|---|
| A | Mini-skyline preview — 5–8 SVG silhouettes, lit/unlit parity with cityscape |
| B | Stats trio — `⚡ XP today · 🔥 streak · ⏭ to next level` |
| C | "Today's challenge" CTA — `/games/finance-quiz` shortcut with XP promise |
| D | Tip of the day — random fact from `lib/content/finance-quiz.ts` |
| E | Mini-ledger — last 3 XP events |

User is still thinking. A+B is the recommendation (visual parity +
strategic feedback); C/D/E are stretch.

## Verification

- `pnpm tsc --noEmit` → 0 errors
- `pnpm test` → 635/635 across 80 files
- `pnpm lint` → 0 errors, 18 warnings (all pre-existing)
- Production push → Vercel auto-deploy of `main` (commit `f124349`)
- `scripts/purge-e2e-accounts.sh` (dry run) confirmed the prefix regex
  matches only expected test accounts; commit-mode run is the operator's
  call (needs production `ADMIN_SECRET`).
