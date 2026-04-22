# Watt City — smoke test runbook

End-to-end check list for the Phase 1 MVP. Use this before every promotion
to production. Every check should take ≤ 10 minutes total.

Target URLs:
- `dev`: `http://localhost:3000`
- `preview`: the per-PR Vercel preview URL
- `prod`: `https://watt-city.vercel.app` (or whatever the `watt-city` alias
  resolves to — `vercel alias ls` shows active mappings)

Required env (any of dev/preview/prod):
- `ANTHROPIC_API_KEY` — real rotation runs against Claude. When missing, the
  mock-v1 fallback fires and the test still works end-to-end.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — persistent state.
  Without them the in-memory store is used (dev only; each server restart
  wipes state).
- `CRON_SECRET` — required for external pinger; pass in
  `Authorization: Bearer …`.
- `ADMIN_SECRET` — required for admin endpoints.

## 1. Auth + register golden path

1. Load `/`. Nav shows the "WC" lockup and the Miasteczko → Gry → Pojedynek
   row. Footer shows the amber "GRA EDUKACYJNA" disclaimer.
2. Click "Rejestracja". Create `smoketester_<date>` / any password.
3. You are redirected to `/` with the resource bar visible: 4 active
   resources (⚡ coins 🧱 W$) and 3 locked (🪟 🔩 💾) with 🔒 markers.
4. Level ring + tier chip visible in nav.

## 2. Play an evergreen game → resources credit

1. Open `/games/finance-quiz`. Answer at least one question correctly.
2. Finish. The score modal appears.
3. Back to `/`: the resource bar should now show `🪙 coins > 0`.
4. Open `/miasto`. Confirm balance matches what the nav showed (resources
   read from the same source).

Expected result: `resources.coins` on the `/miasto` page ≥ the xp you
earned. If it doesn't, check `/api/me/resources` and the latest 20 ledger
entries — the top one should be a `kind: "score"` entry with the correct
`delta` and `sourceId: "finance-quiz:0->N"`.

## 3. Place a building

1. On `/miasto`: the empty slot grid has slot 10 auto-occupied by Domek
   (signup gift). Confirm the 🏠 glyph + amber roof appear on a small
   slot in the right-hand row.
2. Click another residential slot (e.g. slot 11). Detail panel opens to
   "Pick a slot" with the compatible catalog entries below.
3. If you haven't earned 50 ⚡ yet, Mała elektrownia is locked with "🔒
   earn-watts:50". Similarly Sklepik requires 50 🪙.
4. Play a game or two until you've crossed a threshold; refresh `/miasto`;
   the catalog should now offer the Build button. Click it. Resources
   deduct; the slot turns filled.

Expected result: build succeeds, slot visual shows the new building with
an L1 badge and the ledger has a `kind:"build"` entry. If you see a
`rate-limited` error with status 429, wait 60s and retry — Phase 1 caps
build/upgrade/demolish at 5/min per user.

## 4. Upgrade → yield grows

1. Click your newly-built Mała elektrownia. Click "Ulepsz (L2)".
2. Resources deduct by the L2 cost (baseCost × 1.6).
3. Building's `currentYield` chip grows (baseYield × 1.4).

## 5. Cashflow tick

1. Note `resources.coins` exactly.
2. Keep `/miasto` open but do not reload for ~65 minutes. (For faster
   verification, manually `POST /api/buildings/tick` — it's idempotent.)
3. Reload. `resources.coins` grew by Domek's 5 coins/h + any other
   yields. A new ledger entry of `kind:"tick"` should be visible in
   `/api/me/resources`.

Offline catch-up sanity: if you simulate > 30 days of absence (mock in
tests), the tick engine caps at 720 hours — this is the `offline-cap-hit`
reason in the TickResult payload.

## 6. Mortgage dialog

1. `/miasto` → scroll to "Kredyt hipoteczny" card → click "Kalkulator".
2. Slider picks principal; buttons pick term (12/24/36 months).
3. Live quote shows APR 8% (standard) or 5% (preferred, requires Bank
   lokalny — T3). Monthly payment matches amortization formula
   M = P·r / (1 − (1+r)⁻ⁿ).
4. Click "Weź kredyt". Cash balance jumps by `principal`. Active loan
   appears in the list below.
5. After ~30 days (or advance the clock in tests), the first monthly
   payment auto-deducts via `processLoanPayments` inside the tick engine.

Edge case: if `cashZl < monthlyPayment` on a due date, the loan
`missedConsecutive` counter ticks up and credit score −5. Three
consecutive misses flip the loan into `defaulted` status with score −20.

## 7. Hourly AI rotation

1. `GET /api/admin/rotation-status` (with `Authorization: Bearer …`).
2. Verify `indexCount ≥ 1`, `live[].msUntilExpiry ≤ 3_600_000` (1h),
   `minutesSinceLastRotation < 90`, `alertIfStale: false`.
3. `POST /api/cron/rotate-if-due` manually. Should publish a new game
   when the hour bucket hasn't rotated yet; otherwise `skipped: true`.
4. Reload `/` — city-scene shows the new AI building with a live
   countdown chip; the hero toast should pop for logged-in users.

## 8. Admin endpoints reject without secret

1. `curl -X POST /api/admin/rotate-ai` → expect 401.
2. `curl /api/admin/rotation-status` → 401 when ADMIN_SECRET set.
3. `curl -X POST /api/admin/backfill-resources -d '{"username":"anyone"}'`
   → 401.

## 9. Language switching

1. Click each of PL / UK / CS / EN in the language switcher.
2. Nav labels + `/miasto` copy + Coming-soon tiles all swap.
3. Resource tooltips (hover a resource chip) update.

## 10. Mobile UX (320 px width sanity)

1. Chrome devtools → iPhone SE (375×667). Works:
   - Nav collapses; resource bar stays readable.
   - `/miasto` SVG is horizontally scrollable; detail panel fits.
   - Mortgage dialog usable with one thumb.
2. Touch targets ≥ 44 px on buttons.

## 11. Notification bell popover

1. Nav → click 🔔. The popover opens below the button (`top-full mt-2`),
   sits on `var(--surface)` with the ink-coloured border, and clamps to
   `max-w-[calc(100vw-1rem)]` on narrow viewports.
2. Open it over `/miasto` where the SVG competes for stacking context —
   the popover stays above the city at `z-40`; no building should
   occlude the list.
3. With unread notifications, clicking the bell POSTs `{action:
   "mark-seen"}` and the red-dot badge clears on the next poll (≤45 s).

## 12. Tutorial replay (`/o-platforme`)

1. Fresh account on `/` → 4-step onboarding modal appears (welcome →
   wallet → city → no-risk credit). Skip/finish.
2. Reload `/` — modal does not re-appear (server + localStorage cache).
   Watch the devtools Network panel: the PATCH to `/api/me/profile`
   goes out with `keepalive: true`, so it still completes even if you
   click the last step's `/loans/compare` link before the response
   lands.
3. Visit `/o-platforme` and click "Pokaż samouczek ponownie" (the
   `OpenTutorialButton`). The tour re-opens in place, even though the
   auto-show is pathname-gated to `/`. Dismissing again re-sets the
   `wc_tour_seen` localStorage flag.

## 13. City-scene "unlit" appearance

1. Log in as a fresh user so no evergreen game has been played.
2. `/` hero city-scene: every evergreen building should render as a
   near-silhouette (filter `saturate(0) brightness(0.18)`) — no base
   colour visible. This matches the hero copy "9 budynków = 9 mini-gier.
   Dopóki nie zagrasz, budynek stoi w ciemności."
3. Play any evergreen game, reload — the corresponding building lights
   up (filter `none`, neon sign glows yellow, windows powered). All
   other buildings stay dark.

## 14. E2E isolation + purge endpoint (operator-only)

1. `pnpm test:e2e` locally: the test run must NEVER touch production
   Upstash. `playwright.config.ts` blanks the Upstash REST env at
   webServer start — confirm by running `pnpm test:e2e -- smoke.spec`
   with a `.env.local` that has production tokens; afterwards
   production `xp:leaderboard:global` must show zero new `gp_*`,
   `pr_*`, `rl_*`, … members.
2. If you spot leaked E2E usernames in production (older runs), clean
   up with `/api/admin/purge-e2e-accounts` — start with `dryRun: true`
   and confirm the candidate list before flipping to `dryRun: false`.
   See `docs/OPERATIONS.md` §7 for the curl recipes.

If any step fails, capture a quick `curl`/browser-console snippet and file
it under `docs/progress/<date>.md` with the blocker. Do NOT mark a backlog
item as DONE if its corresponding smoke-step is red.
