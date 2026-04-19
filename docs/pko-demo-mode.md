# PKO demo mode

V4.10 — how to run Watt City with the PKO skin applied.

## One-line boot

```bash
SKIN=pko pnpm dev
```

Or, equivalently on Vercel / prod:

```bash
# In the deploy environment:
SKIN=pko
NEXT_PUBLIC_SKIN=pko  # optional mirror if any client component reads it
```

## What changes with `SKIN=pko`

| Surface | Core (`SKIN=core`, default) | PKO (`SKIN=pko`) |
|---|---|---|
| Brand label | "Watt City" | "PKO Junior × Watt City" |
| Accent colour | neo yellow `#fde047` | PKO red `#d31f26` |
| Background | charcoal `#0a0a0f` | PKO navy `#052c65` |
| Surface | `#0f172a` | `#0b3a7a` |
| Footer disclaimer | "GRA EDUKACYJNA — to nie są prawdziwe pieniądze" | "GRA EDUKACYJNA W PARTNERSTWIE Z PKO BP — W-dolary NIE mogą być wymienione na PLN" |
| Mascot | none | `Żyrafa PKO` (SVG placeholder; see asset override below) |
| Teacher dashboard corner | — | Żyrafa badge |
| Parent digest card | — | Żyrafa badge |
| Footer | `Watt City` sponsors row | above + "Powered by PKO Bank Polski · SKO 2.0 partnership" strap + Żyrafa mascot |

## Replacing the placeholder mascot

The baked-in Żyrafa SVG in `lib/theme.ts` is a temporary placeholder. To swap
in the final asset without a code change:

```bash
# Upload the real asset (e.g. public/pko-mascot.svg)
# Then set:
NEXT_PUBLIC_PKO_MASCOT_URL=/pko-mascot.svg
```

`components/pko-mascot.tsx` respects this env var and renders the asset via
an `<img>` tag instead of the inline SVG fallback.

## What to screenshot for the pitch deck

1. Boot with `SKIN=pko pnpm dev`.
2. Register (or seed) a demo teacher via `/nauczyciel/signup` or
   `POST /api/admin/seed-demo-school` (Bearer `$ADMIN_SECRET`).
3. Log in as `demo-teacher-pl` / `demo1234`.
4. Screenshot targets:
   - `/dla-szkol` landing — hero + value prop columns in PKO palette.
   - `/nauczyciel` — class list + Żyrafa corner badge.
   - `/klasa/[id]` — leaderboard + weekly theme.
   - `/api/klasa/[id]/report?week=YYYY-Www` — open the PDF in Preview/Chrome
     and grab a page shot.
   - Footer across any logged-in page — "Powered by PKO" strap.

## Compliance checklist (for deploying to real PKO deployments)

- [ ] Swap `pko-mascot` placeholder → final Żyrafa asset from PKO brand team.
- [ ] Confirm accent red `#d31f26` matches current PKO styleguide (public
      values used here reflect the 2025 styleguide — verify before launch).
- [ ] Review `PKO_THEME.disclaimer` wording with PKO legal.
- [ ] If a kid-accessible URL is the target, ensure GDPR-K consent flow runs
      first (HIGH-10 — deferred to V5 scope per user decision).
- [ ] `ADMIN_SECRET` must be set in the demo deploy so the seed endpoint is
      gated. Do **not** deploy with a missing secret — demo seed becomes
      world-callable.
