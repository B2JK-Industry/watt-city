<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Skin system (PKO redesign, April 2026)

- Default skin is **`pko`** (light-mode, navy primary `#003574`, warm-orange sales accent `#db912c`). Viz `docs/pko-redesign/`.
- Legacy **`core`** neo-brutalist skin is opt-in via `SKIN=core` env var.
- Tokens live in `app/globals.css` (`:root` + `:root[data-skin="core"]`) and `lib/theme.ts`.

### Visual rules (reviewers reject PRs that violate)

- **No** `border-[Npx]` with N ≥ 2, no native `border-2..9`
- **No** `shadow-[Npx_Npx_0_0_...]` hard-offset brutalism shadows
- **No** `uppercase` on headings (OK on `.t-overline` chips)
- **No** `font-black`, `font-extrabold`, `font-[800|900]` — max `font-semibold` (600)
- **No** `rounded-[Npx]` arbitrary — use `rounded-{none,sm,md,lg,full}`
- **No** new hex values outside `docs/pko-redesign/02-DESIGN-TOKENS.md`
- Use existing primitives: `.btn`, `.btn-sales`, `.btn-secondary`, `.btn-ghost`, `.card`, `.card--interactive`, `.card--elevated`, `.chip`, `.input`, `.section-heading`, `.t-*` typo utilities, `.elev-line`, `.elev-soft`
