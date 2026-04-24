# Phase 3 — Gap Analysis: PKO vs. Watt City

Each row maps a verified PKO pattern (Phase 1) against the current Watt City state (Phase 2) and prescribes the rewrite action.

| # | Dimension | PKO pattern (verified) | Watt City current | Gap (redesign action) |
|---|-----------|-------------------------|--------------------|------------------------|
| 1 | Primary brand color | `#003574` (97× v junior, 14× v Next bundle) | `#fde047` (yellow, 28× v city-scene + globals) | Remap `--accent` → `#003574`; remove yellow from primary surfaces |
| 2 | Background page | `#FFFFFF` (junior) alebo `#001E4B` (hero darkest) | `#0a0a0f` (near-black) | PKO skin: light `#F9F9F9` paper alebo dark `#001E4B` navy hero — žiadne čierne |
| 3 | Surface card | `#FFFFFF` na paper, alebo `#003574` solid na navy BG | `#151521` (dark indigo) | Remap `--surface` → `#FFFFFF` (light) alebo `#003574` (dark) |
| 4 | Border width | `1 px` (`box-shadow: 0 0 0 1px #e5e5e5`) — outline pattern | `3 px solid var(--ink)` (47× across repo) | Reduce to `1 px solid var(--sko-border-light)`; in `globals-pko.css` use `!important` to beat Tailwind arbitrary values |
| 5 | Button border-radius | `10px 0` (asymetrický top-left+bottom-right) na primary; `4px 4px` na tertiary | `12px` symetrický + `border: 3px` | Rewrite `.btn` to `border-radius: 10px 0; border: none;` — asymetrický corner je PKO signature |
| 6 | Button shadow | `0 3px 6px #00000029` (alpha 16 %) | `5px 5px 0 0 var(--ink)` (alpha 100 %, hard offset) | Replace offset shadow with soft drop shadow; hover = lift shadow opacity to 24 % |
| 7 | Button hover | `background: #004C9A` (color shift only) | `transform: translate(-2px,-2px)` + `box-shadow: 7px 7px 0 0 var(--ink)` | Disable transform; only color/shadow opacity change on hover |
| 8 | Button active | `background: #002e78` (deeper navy) | `transform: translate(3px,3px)` + `1px 1px` shadow | Drop translate; depress effect via deeper navy bg |
| 9 | Heading weight | `700` (3× v Next), `900` len pre H1 hero (2×) | `900` plošne (`brutal-heading`, `font-black`) | Cap at `700` for H2–H6; allow `900` only for marketing H1 |
| 10 | Heading case | Sentence case (žiadny `text-transform: uppercase`) | `text-transform: uppercase` v `brutal-heading` + 124 ad-hoc Tailwind `uppercase` | Override `.brutal-heading { text-transform: none; }` + `.uppercase { text-transform: none !important; }` scoped pod `[data-skin="pko"]` |
| 11 | Heading letter-spacing | Default (0) | `letter-spacing: 0.02em` minimum, často `0.06em`/`0.1em` (`brutal-tag`, badges) | Reset to 0 under skin |
| 12 | Body text font | `pkobp, Helvetica, Arial, sans-serif` (proprietary) | Geist (Google fonts) | Substitute: `Inter` (open, Latin-Ext, weights 400/600/700/900); `--font-sans` swap |
| 13 | Body text size | `16px` body / `14px` small (banking norm) | `text-sm`/`text-xs` (14/12 px) cluttered with 10–11 px micro-text | Raise base to 16 px; cap minimum to 12 px (kid readability + banking norm) |
| 14 | Tags / chips | Small navy-fill pills `border: none; border-radius: 9999px; font-weight: 600; padding: 4px 10px;` | `.brutal-tag`: neon yellow/pink/cyan/lime `border: 2px solid var(--ink); box-shadow: 2px 2px 0 0 var(--ink); text-transform: uppercase; letter-spacing: 0.06em` | Rewrite: drop border + shadow + uppercase + letter-spacing; navy-500 fill, white text |
| 15 | Inputs | `border: 1px solid #d5d5d5; border-radius: 4px; padding: 11px 13px; font-size: 16px` (top-aligned label) | `border: 3px solid var(--ink); border-radius: 10px; padding: 0.65rem 0.85rem; box-shadow: 4px 4px 0 0 var(--ink)` | Reset to PKO 1-px borders, 4px radius, 11/13 padding, drop offset shadow |
| 16 | Input focus | `border-color: #003574` (1 px shift) | `transform: translate(-1px,-1px); box-shadow: 6px 6px 0 0 var(--accent)` | Replace with `outline: 2px solid var(--sko-navy-500); outline-offset: 0; border-color: var(--sko-navy-700)` |
| 17 | Top nav border-bottom | `1 px solid #e5e5e5` | `border-b-[3px] border-[var(--ink)]` (`site-nav.tsx:87`) | Override to `border-b border-[var(--sko-border-light)]` |
| 18 | Brand chip in nav | navy fill, no border (PKO logo is image, not bordered chip) | `w-9 h-9 border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black uppercase text-base` | Reduce to `border: 1px solid var(--sko-border-light); box-shadow: none; font-weight: 700; text-transform: none; border-radius: 6px` |
| 19 | Footer border-top | `1 px solid #e5e5e5` | `border-t-[3px] border-[var(--ink)]` (`layout.tsx:232`) | Reduce to 1-px border-light |
| 20 | Footer pitch tags | n/a (banking footer = legal links + brand only) | 3× `brutal-tag`: `PKO XP: Gaming`, `ETHSilesia 2026`, `Katowice · PL` (`layout.tsx:268–276`) | **Remove under PKO skin** — pitch artifacts |
| 21 | Disclaimer styling | `font-size: 12px; color: #636363; font-weight: 400; normal case; tracking 0` | `font-bold uppercase tracking-wider text-amber-400` (`layout.tsx:280`) | Reset to PKO body norm |
| 22 | Toast / notification | Solid white card, navy border-left `4 px`, soft shadow `0 8px 24px rgba(0,30,75,.18)`, no emoji | `tier-up-toast.tsx`: yellow accent bg, `🎉` emoji prefix, `shadow-[6px_6px_0_0_var(--ink)]`, `uppercase tracking-wider` headline | Rewrite per `05-COMPONENTS-SPEC.md §Toast` |
| 23 | Cards (`.card`) | `background: #fff; border-radius: 10px; box-shadow: 0 3px 6px #00000029; padding: 24px;` | `background: var(--surface); border: 3px solid var(--ink); border-radius: 14px; box-shadow: 6px 6px 0 0 var(--ink)` | Rewrite: `border: 1px solid var(--sko-border-light); border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,.16)` |
| 24 | Game-tile hover | n/a (no equivalent in PKO) | `transform: translate(-3px,-3px); box-shadow: 9px 9px 0 0 var(--ink)` | Replace with `box-shadow: 0 8px 24px rgba(0,30,75,.18); transform: none;` |
| 25 | Animation duration | 200–300 ms `ease` alebo `cubic-bezier(.4,0,.2,1)` | 110–420 ms, mix of `ease-out`, `cubic-bezier(0.2,0.8,0.2,1)`, custom overshoots | Standardize PKO skin to 200 ms `ease`; cap overshoots; respect `prefers-reduced-motion` |
| 26 | Hover transform | None (color/shadow only) | `translate(-2px,-2px)` ubiquitous (`.btn`, `.game-tile`, `.input`, manual sites in HUD) | Drop transform under PKO skin (override: `transform: none !important`) |
| 27 | Padding rhythm | Asymetric `11px 13–16px` na buttons, `17px 15px` table cells | `0.7rem 1.15rem` (≈ 11px 18px) na `.btn` — close enough; outliers in HUD `0.5rem` | Standardize PKO skin button padding to `11px 16px`; HUD compact to `8px 12px` |
| 28 | Accent: secondary highlight | `#CC7A09` (orange dark, 7×) | `#f472b6` (neon pink) | Skin-aware: pink → `#CC7A09` for warning/highlight badges |
| 29 | Mascot | Żyrafa Lokatka (verified `sko.pkobp.pl` text), Pancernik Hatetepes (secondary) | `lib/theme.ts:42` placeholder SVG (yellow rectangles, dev-quality) | Keep placeholder; **TODO**: PKO BP brand team must supply official Lokatka vector |
| 30 | Voice register | Sentence-case, imperative 2nd-person (`Otwórz konto`, `Sprawdź ofertę`), no emoji in copy | Mix of vykanie+tykanie, several emojis in headlines (`🤖 Nowe wyzwanie AI`, `🎉 Awans!`) | Replace under PKO skin: drop emoji from copy strings, normalize register (vykanie pre rodiča/učiteľa, tykanie pre dieťa, zachované in PL — see `09-VOICE-AND-COPY-PL.md`) |

> **Total dimensions covered: 30** (over the requested minimum of 15).

The actions in this table feed directly into `04-GLOBALS-PKO.css` overrides + `06-EXECUTION-PLAN.md` per-file changes.
