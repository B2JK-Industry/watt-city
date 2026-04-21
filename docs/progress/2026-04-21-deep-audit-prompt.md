# Watt City — deep end-to-end audit prompt

> Run against `main` at `/Users/danielbabjak/Desktop/watt-city-ethsilesia2026`
> and the live deploy at `https://watt-city.vercel.app`. Converge until
> every phase exits green. Time is not a constraint. No hardcoded
> values, no magic-number sleeps, no suppressing findings — fix at the
> source. The earlier sessions (`docs/progress/2026-04-21-review-fix.md`,
> `docs/progress/2026-04-21-prod-smoke.md`) are the starting baseline;
> do not regress any of their assertions.

## Operating rules

1. **Tooling.** Use `pnpm` scripts, `gh`, `curl`, `playwright`, `axe`,
   `vitest`, `next build`. Put heavy research on sub-agents (`Explore`,
   `general-purpose`) when the question spans more than a handful of
   files. Run independent checks in parallel via background tasks.
2. **No hardcoding.** Credentials/URLs/paths come from env or test
   fixtures; constants are named with explanatory comments. No
   `waitForTimeout(n)` where animation/state signals exist. No
   per-element eslint-disable unless the linter is demonstrably wrong
   about that one case.
3. **Fix at source.** When a finding surfaces, decide whether it's a
   design flaw (fix the class), a bug (fix the callsite) or a test
   artefact (fix the test). Document the decision inline.
4. **Production safety.** Any test that hits prod must be idempotent
   and read-only by default. Anything that mutates prod state must be
   gated behind an explicit env flag + cleanup step.
5. **Report-as-you-go.** Each phase ends with a short status update
   (greens / reds / deferred). Final summary goes to
   `docs/progress/2026-04-21-deep-audit.md`.

## Phase 1 — baseline re-verify (no new work)

- `pnpm test` → 618/618.
- `npx tsc --noEmit` → clean.
- `pnpm lint` → 0 errors.
- `pnpm build` → compiles, static-pages count steady.
- `pnpm test:e2e` → 20/20 (dev smoke + prod-smoke against dev server).
- `PLAYWRIGHT_BASE_URL=https://watt-city.vercel.app PLAYWRIGHT_WEBSERVER=0 npx playwright test prod-smoke` → 17/17.

If any of these regress vs. the end state of `docs/progress/2026-04-21-prod-smoke.md`, stop and fix before continuing.

## Phase 2 — API contract sweep

For every route under `app/api/**`, verify:

- **Method allow-list.** Unsupported methods return 405, not 200 with a
  stack trace. Enumerate via `find app/api -name route.ts`, parse
  exported `GET|POST|PATCH|PUT|DELETE`, curl each missing verb
  against prod.
- **Auth gate.** `getSession`-protected routes answer 401 to
  unauthenticated callers; admin routes (`app/api/admin/**`) answer 401
  to missing/invalid `ADMIN_SECRET`; cron routes answer 401 to missing
  `CRON_SECRET`.
- **CSRF.** Every mutating POST/PATCH/PUT/DELETE not in
  `EXEMPT_PATH_PREFIXES` requires the `wc_csrf` cookie/header pair —
  absence returns 403. Build a single fetch harness that exercises
  this.
- **Zod validation.** Send intentionally-malformed JSON (missing
  fields, wrong types, payloads at the upper byte limit). Expect 400
  + structured error, never 500.
- **Rate limits.** Identify rate-limited routes (`lib/rate-limit*.ts`
  consumers). Verify the 429 path fires when exceeded. Confirm the
  limit resets.
- **Response shape matches TS types.** For each route that exports a
  response type, assert the runtime response parses against a zod
  schema mirror.

Deliver: a table of routes × (method, auth, csrf, zod, rate-limit)
with ✓/✗ per cell. Any ✗ is a fix target.

## Phase 3 — security deep-dive

- **IDOR.** Create two users (via `page.request.post("/api/auth/register")`
  into two separate browser contexts). From user A, attempt to read
  B's private data — `/api/parent/child/<B>`, `/api/me/...` with
  params pointing at B, score submission with `userId: B`. Expect
  403 or correctly-scoped response.
- **Admin bypass.** Try every `/api/admin/**` with no header, wrong
  bearer, valid-length-but-wrong-value bearer, stale bearer. Expect
  401.
- **PII validator corners.** Run `containsPII` (`lib/gdpr-k.ts`) with
  fuzzed inputs — unicode numerals, zero-width joiners, mixed RTL,
  long phone-like strings with separators, email-looking strings
  with non-ASCII TLDs. Document every false positive and false
  negative.
- **Age gate.** Register users at edge birth years (16 boundary, 9
  floor, < 9, > 100, future year, `birthYear: null`). Confirm the
  consent flow fires only for < 16.
- **Web3 opt-in gate.** With `NEXT_PUBLIC_WEB3_ENABLED` flipped both
  ways, confirm the /profile on-chain gallery is hidden / present
  accordingly and that `/api/web3/mint` hard-fails (403) for any
  under-16 account without `web3OptIn === true`. Replay the
  consent-revocation → burn path.
- **XSS.** Submit game content with `<script>`, `javascript:` URIs,
  SVG `<foreignObject>`, data URIs in usernames/comments. Confirm
  they render escaped everywhere they're displayed.
- **Session tamper.** Flip bits in the `xp_sess` cookie, set
  `issuedAt` to the future, forge an HMAC with the wrong secret.
  Confirm `getSession` returns `null` in every case.
- **Security headers on EVERY page.** Extend the prod-smoke's
  header check to every page listed in `next build` output (not
  just `/`). Catch routes that accidentally opt out of the global
  `headers()` config.

## Phase 4 — data integrity + race conditions

- **Score idempotency.** Submit `/api/score` with the same
  `{gameId, xp, previousBest}` twice. Ledger must dedupe via
  `sourceId`; daily-earned counter must not double.
- **Concurrent score + buildings.** From two sessions of the same
  user, simultaneously POST `/api/score` and `/api/buildings/place`.
  Verify the `v3_score_lock` flag blocks the race window when on,
  and document what happens when off.
- **Cashflow tick.** Manually rewind `state.buildings[i].lastTickAt`
  to 31 days ago, 29 days, 24h, 59m. Verify the tick credits bounded
  by the 30-day cap and not beyond.
- **Mortgage default.** Scripted three missed payments in a row on a
  test user → expect status `default`, credit score −20, resources
  seizure follows the spec in `docs/ECONOMY.md`.
- **Early repayment bonus.** Pay off a loan N months early, verify
  bonus credit lands and is visible in the ledger.
- **AI rotation single-flight.** Fire `/api/cron/rotate-if-due`
  concurrently × 10 with `Promise.all`. Exactly one should run the
  pipeline; the rest return 409 or "already-fresh".
- **Marketplace listings.** Listing + buying + cancel should be
  idempotent; double-buy from two browsers must settle with exactly
  one winner + one 409.

## Phase 5 — E2E golden paths (long-running)

Seed fresh users per test. Every path below gets a Playwright spec
under `e2e/` (new file per feature, kept short for readability).
Tests must be idempotent (fresh username per run) and clean up
mutated state via explicit teardown steps.

1. **Onboarding**: register → first game → first score → tier-up
   toast → resource bar updates → city build hint shown.
2. **Mortgage**: accumulate cashflow → take mortgage →
   auto-repay on + tick → confirm payment schedule → early repay.
3. **Mortgage default**: same as above but skip three ticks →
   confirm `default` state + UI notice.
4. **Buildings**: place on empty slot → upgrade → demolish with
   50% refund → re-place.
5. **Parent invite**: kid generates 24h code → parent joins via
   `/rodzic/dolacz` → parent dashboard lists the kid.
6. **Class mode**: teacher signup → create class → issue 3 codes
   → student joins via code → leaderboard sees them.
7. **AI daily game**: hit `/api/cron/daily-game` with valid
   `CRON_SECRET` → play the AI game → top-3 medal mints.
8. **i18n switch**: for each of PL/UK/CS/EN, switch via
   `/api/lang`, reload, confirm nav/home copy in chosen locale.
9. **Logout**: POST `/api/auth/logout` → subsequent `/api/me`
   returns `{authenticated: false}` → protected pages redirect.
10. **Delete account (soft).** `lib/soft-delete.ts` flow: request
    deletion → verify state flag → retention window expires
    (use injected clock) → data purge.

Run each against dev first, then against a preview deployment if
available. Do NOT run state-mutating E2E against the production
Upstash — gate with `E2E_TARGET_ENV !== "production"`.

## Phase 6 — i18n exhaustive coverage

- Read every key from `lib/locales/pl.ts` (reference) and cross-check
  the other three locales for missing keys. No silent
  `dict.foo?.bar ?? "fallback"` should hide a missing string.
- For every page in `next build`'s output, render in all four
  locales (set `NEXT_LOCALE` cookie or route equivalent), dump the
  DOM text content, scan for untranslated keys (strings that match
  locale file key syntax like `auth.submitLogin`), scan for leaked
  `{placeholder}` tokens.
- Check that numbers/currencies use locale-appropriate formatting
  (`toLocaleString(lang === "pl" ? "pl-PL" : …)`).

## Phase 7 — accessibility matrix (every page, every locale)

Current axe coverage is 9 public pages in PL only. Expand to:

- 9 public + 4 auth-gated = 13 pages × 4 locales = 52 axe scans.
- Keyboard-only walk of the register / mortgage / buildings flows.
- Screen-reader landmark audit (NVDA-like tree via axe's
  `region` rule).
- Focus management: every modal/dialog must trap focus + return it
  on close. Confetti + tier-up toasts must not steal focus.
- Motion respect: set `prefers-reduced-motion: reduce` at the
  browser level via `page.emulateMedia({ reducedMotion: "reduce" })`
  and re-run the a11y sweep — confetti empty, slide-up no
  transform, etc.
- Touch target ≥ 44×44 px on mobile (verify via computed styles on
  iPhone 13 viewport).

Every violation → trace to its component, fix at source (as you
did for `text-zinc-500` and inline-link underline).

## Phase 8 — performance + bundle

- Core Web Vitals via Lighthouse (or Playwright's CDP) on the 9
  public pages — LCP < 2.5 s, CLS < 0.1, INP < 200 ms on a
  simulated slow-4G + mid-tier CPU.
- Bundle size baseline: first-party JS per route should not grow
  > 10 % vs. current `next build` output.
- Web3 tree-shake proof: with `NEXT_PUBLIC_WEB3_ENABLED=false`,
  grep the built chunks for `wagmi`, `@rainbow-me/rainbowkit`,
  `viem` — expect zero occurrences on non-/profile routes.

## Phase 9 — resilience

- Kill Redis (unset Upstash env vars locally) and verify the
  in-memory fallback keeps the app functional.
- Stall/kill Anthropic SDK (set `ANTHROPIC_API_KEY` to a bogus
  value) and verify the AI pipeline falls back to `model:
  "mock-v1"` rather than 500-ing.
- Middleware CSRF cookie race: repro the "first visit, no cookie
  yet" scenario on a POST — confirm the exempt list carries
  register/login through.
- Simulate a slow Upstash (inject artificial latency via a wrapper)
  and measure that user-facing endpoints don't serialize badly.

## Phase 10 — structured logging + observability

- Enumerate every `console.log`/`console.error` in `lib/**` and
  `app/api/**`. Confirm each is JSON-structured with a `event:`
  field (per existing convention).
- Verify no PII (passwords, email bodies, session tokens) can leak
  into logs — scan emitted log lines on a test run.
- Document the log schema (event catalog) in
  `docs/OPERATIONS.md` if missing.

## Phase 11 — prod reality check

Re-run from scratch:

- `gh api "repos/B2JK-Industry/watt-city/commits/<latest>/statuses"`
  → Vercel success.
- `curl -sI https://watt-city.vercel.app/` security headers visually
  matched.
- `PLAYWRIGHT_BASE_URL=… pnpm test:e2e -- prod-smoke` → 17/17.
- New tests from phases 3 + 5 (read-only portions) run against prod
  via the `prod-smoke` grep filter.

## Phase 12 — regression guard

- Every fix from `2026-04-21-review-fix.md` + `-prod-smoke.md`
  still stands. Re-read the assertions in those files and grep the
  code for reversions.
- Commit each phase's findings as a separate commit on `main` with
  clear prose explaining WHY, not just WHAT.
- Final session summary at `docs/progress/2026-04-21-deep-audit.md`
  with a phase-by-phase green/red table.

## Exit criteria

- All 12 phases green.
- All fixes committed + pushed.
- Vercel deploy of final commit status=success.
- Memory / repo docs updated.
- Task list (TaskList) all closed or explicitly deferred with a
  `FOLLOW-UP` GitHub issue.
