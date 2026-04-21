# 2026-04-21 — production smoke audit + robust a11y fixes

Follow-up to the morning's `2026-04-21-review-fix.md` convergence pass.
After commit 0c3c407 shipped and Vercel promoted it to
`watt-city.vercel.app`, we ran a purpose-built read-only production
smoke suite. It found three classes of real accessibility regressions
that the single-page dev smoke had missed.

## Prod smoke design (non-mutating)

`e2e/prod-smoke.spec.ts` is built to run against any deployed URL
without polluting its data set — zero POST/PATCH/DELETE. Coverage:

| # | Category | Assertion |
|---|---|---|
| 1 | Public pages × 9 | `<h1>` visible + zero WCAG 2 A/AA serious/critical axe findings |
| 2 | Auth-gated pages × 3 | anonymous GET redirects to `/login` |
| 3 | Security headers × 6 | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy all match `next.config.ts` |
| 4 | CSRF seed | wc_csrf cookie set on first HTML response |
| 5 | JSON API × 2 | `/api/me` → `{authenticated:false}`, `/api/leaderboard` returns valid JSON |
| 6 | Static assets × 1 | `/favicon.ico` served with long-max-age immutable Cache-Control |

Run: `PLAYWRIGHT_BASE_URL=https://watt-city.vercel.app
PLAYWRIGHT_WEBSERVER=0 pnpm test:e2e -- prod-smoke`.

Shared helpers live in `e2e/_helpers.ts` — `randomAlphaSuffix`,
`scanSeriousA11y`, `waitForAnimationsSettled`. The file prefix `_`
keeps it out of Playwright's default `*.spec.ts` glob.

## First run: 11/17 pass, 6 fail

All six failures were `color-contrast` serious findings on
`/games`, `/register`, `/o-platforme`, `/ochrana-sukromia`,
`/sin-slavy` and `/dla-szkol`. Landing + leaderboard + login passed.

## Three-layer diagnosis

### Layer 1 — animation-mid-frame false positives

Axe samples a single rendered frame. Keyframes that go
`opacity: 0 → 1` composite partially-opaque foreground over the dark
page body. At opacity ≈ 0.4, bright cyan `#22d3ee` rendered as
`#135967` against `#151521` — axe reports 2.49:1 with no way to
distinguish "transient animation" from "permanent design choice".

The real-world risk is smaller than the axe flag (human eye
perceives motion, not frames), but users on low-end devices see the
low-contrast frame for longer, and the animation is page-load
entrance — unavoidable. Two-part fix:

1. **`@keyframes slide-up` / `stagger-in` are now transform-only.**
   No opacity fade. Text stays at `opacity: 1` throughout the slide.
   `prefers-reduced-motion` still short-circuits via the global
   `*` reset up top.
2. **Test waits for animations to settle.** `waitForAnimationsSettled`
   calls `document.getAnimations()` and awaits each `Animation.finished`
   promise, with a timing-derived cap for looping animations
   (`crane-sway`, `caution-blink`). No `waitForTimeout(n)` in the
   path — the wait is deterministic against the page's actual
   animation set.

### Layer 2 — text-zinc-500 on --surface is sub-AA

This was the *real* bug hiding behind the animation flag. Post-settle,
axe still reported `color-contrast` on `text-zinc-500` (Tailwind's
`#71717b`) inside `.card` (background `#151521` via `--surface`):
**3.74:1**, below WCAG AA's 4.5:1 for body text.

Design pattern: the app uses `text-zinc-500` everywhere for "muted"
or "tertiary" text — building name subtitles, empty-state copy,
metadata. 64 occurrences across `app/` + `components/`. Global swap
to `text-zinc-400` (`#a1a1aa`) clears AA everywhere:

| Surface | Contrast (zinc-400) |
|---|---|
| `--background` `#0a0a0f` | ~8:1 |
| `--surface` `#151521` | ~6.5:1 |
| `--surface-2` `#1e1e2e` | ~5.5:1 |

Also swept the single `text-zinc-600` (in `sin-slavy`) up to zinc-400
for the same reason.

### Layer 3 — SVG `role="img"` with focusable children

`<svg role="img" aria-label="…">` in `components/city-scene.tsx`
contained `<Link>` children (building nav links). Axe rule
`nested-interactive` — an element declared an image cannot contain
tabbable descendants. Swapped to `aria-labelledby="city-scene-title"`
+ a proper `<title>` element inside the SVG. Screen readers still
announce the scene name; the image-landmark semantic is gone, so
the building Links tab normally.

## Bonus find — link-in-text-block on /register + /sin-slavy

Axe's `link-in-text-block` rule wants links inside prose to be
distinguishable from surrounding text by *more than* color. Our
inline Links (`hover:underline` only) were 1.98:1 vs surrounding
text — below the 3:1 threshold for color-only cues.

Fix in `globals.css`:

```css
:where(p, li, blockquote, dd) a:not([class*="btn"]):not(.chip) {
  text-decoration: underline;
  text-underline-offset: 2px;
}
```

`:where` has 0 specificity so Tailwind utilities still win when
explicitly applied. `.btn*` and `.chip` exemptions keep decorative
CTAs unaffected. Nav / header / footer links live outside text-block
containers so this doesn't double up on their `hover:underline`.

## Final prod-smoke state

After commit 094ac9e:

| Check | Result |
|---|---|
| `pnpm test` (vitest) | 618 / 618 pass |
| `npx tsc --noEmit` | clean |
| `pnpm lint` | 0 errors, 82 warnings |
| `pnpm build` | 76 static pages |
| `pnpm test:e2e` (local, includes prod-smoke against dev server) | 20 / 20 pass |
| prod-smoke (vs. https://watt-city.vercel.app after deploy) | pending verification — monitored via `gh api` deployment status |

## Non-hardcoding principles applied

Per user instruction — "žiaden hardcoding, robustne riešenia":

- CSS rules target classes of problems, not individual elements.
  The opacity-free slide-up, the inline-link underline rule, and the
  text-zinc-500 swap all fix a pattern, not a symptom.
- `waitForAnimationsSettled` reads each animation's own timing —
  no magic "400 ms should be enough" sleep.
- Test-side improvements live in a shared helper
  (`e2e/_helpers.ts`) so `smoke.spec.ts` and `prod-smoke.spec.ts`
  exercise identical animation-settled axe scans.
- Username generator is alphabet-only by construction (the PII
  phone regex rejects 7+ digit runs); no "retry if username is
  rejected" loop.
- The SVG a11y fix uses `<title>` + `aria-labelledby` — the WCAG-
  compliant way to name an interactive SVG — rather than suppressing
  the axe rule.
