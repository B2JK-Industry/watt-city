# Phase 2 — Watt City Neo-Brutalism Inventory

**Skenované:** `app/`, `components/`, `lib/` na 2026-04-24
**Kategorizácia:**
- 🔴 **must-remove-for-pko** — kompletne zruší PKO banking aesthetic, MUSÍ sa overridnúť
- 🟡 **can-soften** — prijateľné s úpravou (reduce border, swap shadow, lower font weight)
- 🟢 **neutral (keep)** — mechanické / a11y / mobile UX, žiadny vizuálny dopad na skin

## Scan summary (whole repo)

| Pattern | Výskyty (cross-`components/` + `app/`) |
|---------|-----------------------------------------|
| `border-[3px]` (brutal-thick) | **47** |
| `shadow-[Npx_Npx_0_0_var(--ink)]` (offset hard shadow) | **28** |
| `uppercase` Tailwind utility | **124** |
| `brutal-*` CSS class | 37 súborov ich používa |
| Hex literals naprieč repo | 352 |
| Hex v `city-scene.tsx` (jeden súbor) | 229 výskytov, 73 unique |

---

## 2.1 `app/globals.css` — primárny zdroj brutalism primitives

| Lines | Element / class | Vzor | Kategória | Akcia pre PKO skin |
|-------|-----------------|------|-----------|---------------------|
| 116–136 | `:root` neon palette | `--neo-yellow #fde047`, `--neo-pink #f472b6`, `--neo-cyan #22d3ee`, `--neo-lime #a3e635`, `--neo-purple #a78bfa`, `--neo-orange #fb923c`, `--neo-red #f87171` | 🔴 | Override `--accent`, `--accent-2`, `--brand` cez `:root[data-skin="pko"]`; ponechať `--neo-*` ako legacy fallback |
| 164–170 | `.card` | `border: 3px solid var(--ink); border-radius: 14px; box-shadow: 6px 6px 0 0 var(--ink)` | 🔴 | Override na `border: 1px solid var(--sko-border-light); border-radius: 10px; box-shadow: 0 3px 6px rgba(0,30,75,.16)` |
| 176–206 | `.btn`, `.btn:hover`, `.btn:active`, `.btn:disabled` | `border: 3px solid var(--ink); border-radius: 12px; box-shadow: 5px 5px 0 0 var(--ink); font-weight: 800; letter-spacing: 0.01em;` + `transform: translate(-2px,-2px)` na hover | 🔴 | Kompletný override: PKO `border: none; border-radius: 10px 0; box-shadow: 0 3px 6px rgba(0,0,0,.16); font-weight: 600; transform: none;` |
| 207–218 | `.btn-primary/-ghost/-pink/-cyan/-lime/-danger` | Neon backgrounds | 🔴 | Premapovať na PKO variants: navy primary, white-stroke ghost, navy-500 secondary, dark-red danger |
| 220–235 | `.input` | `border: 3px solid var(--ink); border-radius: 10px; box-shadow: 4px 4px 0 0 var(--ink); transform on focus` | 🔴 | Override: `border: 1px solid var(--sko-border); border-radius: 4px; padding: 11px 13px; box-shadow: none;` focus → `border-color: var(--sko-navy-500)` |
| 237–250 | `.chip` | `border: 2px solid var(--ink); box-shadow: 2px 2px 0 0 var(--ink); border-radius: 999px` | 🟡 | Soften: `border: 1px solid var(--sko-border); box-shadow: none; border-radius: 9999px;` (capsule shape OK, drop offset shadow) |
| 254–271 | `.game-tile` (+ hover/active) | `border: 3px solid var(--ink); box-shadow: 6px 6px 0 0 var(--ink)`, hover `9px 9px`, active `2px 2px` | 🔴 | PKO variant: `border: 1px solid var(--sko-border-light); box-shadow: 0 3px 6px rgba(0,0,0,.16)`; hover `box-shadow: 0 8px 24px rgba(0,30,75,.18)`; bez transform |
| 275–279 | `.podium-tile` | `border: 3px solid var(--ink); box-shadow: 6px 6px 0 0 var(--ink)` | 🔴 | Same as `.card` rewrite |
| 282–292 | `.leaderboard-row-me` | Repeating-linear-gradient yellow-stripes | 🟡 | Replace with `background: var(--sko-navy-500)/.15` solid tint |
| 296–327 | `.new-badge`, `.hot-badge` | `border: 2px solid var(--ink); box-shadow: 3px 3px 0 0 var(--ink); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900` | 🔴 | PKO badge: `border: none; box-shadow: 0 0 0 1px var(--sko-border-light); text-transform: none; letter-spacing: 0; font-weight: 600` |
| 331–357 | `.level-ring` | `border: 2px solid var(--ink); box-shadow: 3px 3px 0 0 var(--ink)`; conic-gradient OK | 🟡 | Drop border + shadow; keep conic-gradient with navy track |
| 361–458 | `@keyframes shake/xp-pop/slide-up/fx-rise/combo-pulse/tile-flash-ok/tile-flash-bad/confetti-fall/stagger-in/glow-ring/fade-in/pop-in/tier-up-enter/hud-delta-flash` | Various brutal-flavor animations (overshoots, hard color flashes) | 🟢 | Keep for `.core` skin; pre `.pko` skin softer easings (`ease`, `cubic-bezier(.4,0,.2,1)`), 200 ms duration cap |
| 462–477 | `.building-link` hover | `drop-shadow(0 0 10px rgba(253,224,71,0.45))` (yellow neon glow), `translateY(-4px)` | 🔴 | PKO version: `drop-shadow(0 4px 8px rgba(0,30,75,0.25))` (navy soft) |
| 481–492 | `.crane-arm`, `.caution-blink` | Animation primitives | 🟢 | Keep — game-mechanic, not brand |
| 494–508 | `.animate-xp-pop`, `.stagger-item` + 9× `:nth-child` | Stagger delays 30–400 ms | 🟢 | Keep |
| 512–528 | `.brutal-heading` | `font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em;` + `::before` square chip with `border: 2px solid var(--ink); box-shadow: 3px 3px 0 0 var(--ink)` | 🔴 | Override: `font-weight: 700; text-transform: none; letter-spacing: 0;` `::before { display: none; }` (SKO heading je čistá typografia bez decorator) |
| 532–543 | `.brutal-tag` | `border: 2px solid var(--ink); border-radius: 6px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; box-shadow: 2px 2px 0 0 var(--ink)` | 🔴 | Override: `border: none; border-radius: 9999px; font-weight: 600; text-transform: none; letter-spacing: 0.02em; box-shadow: none; background: var(--sko-navy-500); color: #fff` (banking pill chip) |

---

## 2.2 `app/layout.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 56 | `viewport.themeColor` | `"#fde047"` | 🔴 | Skin-aware: `theme.colors.accent` (PKO `#003574`) |
| 232 | Footer wrapper | `border-t-[3px] border-[var(--ink)]` | 🔴 | Override: `border-t border-[var(--sko-border-light)]` |
| 237–242 | Brand chip | `border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black` | 🔴 | PKO chip: `border: none; box-shadow: 0 0 0 1px var(--sko-border-light); font-weight: 600` |
| 268–276 | Footer brutal-tags `PKO XP: Gaming`, `ETHSilesia 2026`, `Katowice · PL` | Neon cyan/pink/lime backgrounds | 🔴 | **REMOVE under PKO skin** — pitch artifacts (ETHSilesia, Katowice tags) nemajú miesto v banking footer. Replace with: brand name + disclaimer link only. |
| 280–283 | Disclaimer | `text-amber-400 font-bold uppercase tracking-wider` | 🔴 | PKO version: `text-[var(--sko-text-secondary)] font-medium normal-case tracking-normal` |
| 284–301 | Mascot panel | `border-t-2 border-[var(--ink)]/20`, brand title `font-black uppercase tracking-widest` | 🔴 | Override font-weight 600, no uppercase, no tracking-widest |

---

## 2.3 `components/site-nav.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 87 | `<header>` | `border-b-[3px] border-[var(--ink)]` | 🔴 | PKO: `border-b border-[var(--sko-border-light)]` (1 px) |
| 92–101 | Brand `<Link>` chip | `border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black uppercase` | 🔴 | PKO: `border: 1px solid var(--sko-border-light); box-shadow: none; font-weight: 700; text-transform: none` |
| 99 | Brand label | `<span className="uppercase">{theme.brand}</span>` | 🔴 | Drop `uppercase` under PKO skin (sentence case `SKO × Watt City`) |
| 124 | Level ring `.level-ring` | (inherits from globals.css) | 🟡 | Soften per §2.1 |
| 130–134 | Chip | `.chip` (inherits) | 🟡 | Soften per §2.1 |
| 137 | Username badge | `font-bold uppercase tracking-tight` | 🔴 | Drop `uppercase`; keep `font-bold` |
| 173 | Mobile secondary nav | `border-t border-[var(--ink)]/30 bg-[var(--surface)]` | 🟢 | Keep — opacity wrapper safe |

---

## 2.4 `components/cashflow-hud.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 218 | HUD container | `border-[3px] border-[var(--ink)] shadow-[4px_4px_0_0_var(--ink)] bg-[var(--surface)]` | 🔴 | PKO HUD: `border: 1px solid var(--sko-border-light); box-shadow: 0 8px 24px rgba(0,30,75,.18); background: var(--sko-white)`; on dark navy BG → `background: var(--sko-navy-500); color: var(--sko-white)` |
| 224, 259 | Section labels | `text-[10px] uppercase` / `text-[11px] uppercase` | 🔴 | Override `uppercase` to `normal-case`; raise font-size to 12px (banking compact) |
| 256, 296, 305 | Banner border | `border-t-2 border-[var(--ink)]` | 🟡 | PKO: `border-t border-[var(--sko-border-light)]` |
| 286–289 | Rescue CTA | `border-2 border-[var(--ink)] bg-[var(--neo-yellow)] font-bold ... hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_0_var(--ink)]` | 🔴 | Replace with `.btn .btn-primary` (after override applies via globals-pko.css), drop transform-on-hover |
| 333 | Watt chip | `border-2 border-[var(--ink)]; bg neo-pink/neo-lime` | 🔴 | PKO: `border: none; bg var(--sko-danger)/var(--sko-success); color: #fff; border-radius: 9999px` |

---

## 2.5 `components/resource-bar.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 40 | Resource li | `border-2 border-[var(--ink)]` | 🟡 | PKO: `border: 1px solid var(--sko-border-light)` |
| 42 | borderColor inline | `def.color` (per-resource neon) | 🔴 | Skin-aware: pull from `lib/resources.ts` PKO palette (Phase 4 token deliverable) |
| 62 | Legacy chip | `border-2 border-dashed border-[var(--ink)]/40` | 🟢 | Keep — legacy semantic |

---

## 2.6 `components/tier-up-toast.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 62 | Toast container | `card p-4 ... shadow-[6px_6px_0_0_var(--ink)] bg-[var(--accent)] text-[#0a0a0f] border-[var(--ink)]` | 🔴 | PKO: `border: 1px solid var(--sko-border-light); box-shadow: 0 8px 24px rgba(0,30,75,.18); background: var(--sko-navy-700); color: var(--sko-white);` (no offset shadow) |
| 73 | Headline | `uppercase tracking-wider` | 🔴 | Drop `uppercase` |
| 74 | Level word | `font-black` | 🟡 | Reduce to `font-bold` (700) |
| 70 | Emoji prefix `🎉` | inline emoji | 🔴 | **REMOVE under PKO skin** — emoji not in brand identity. Replace with SVG badge icon (silver/gold) or omit. |

---

## 2.7 `components/city-scene.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 117 | Outer wrapper | `rounded-2xl border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)]` | 🔴 | PKO: `border: 1px solid var(--sko-border-light); box-shadow: 0 8px 24px rgba(0,30,75,.18); border-radius: 12px` |
| 119 | `style.background` | `"#07071a"` (hardcoded near-black) | 🔴 | Skin-aware via CSS variable |
| 142–155 | SVG `<defs>` gradients (sky, ground) | Hardcoded `#02021a → #2a1458 → #0a0a0f`, plus `#fef3c7`/`#fde68a` (moon yellow) | 🔴 | **Refactor into 6 CSS variables** — see `08-CITY-SCENE-REFACTOR-PLAN.md` |
| 156–160 | Cobble pattern | `#0f0f1f`, `#222` | 🔴 | Same — semantic role extraction |
| Throughout | 73 unique hex values | yellow windows, purple sky, magenta accents, lime crane | 🔴 | Phase 4.6 — refactor to 6 semantic vars |

---

## 2.8 `components/city-skyline-hero.tsx`

| Lines | Element | Vzor | Kategória | Akcia |
|-------|---------|------|-----------|-------|
| 76–79 | Sky gradient | `#1e1b4b → #0f172a` (dark indigo) | 🟡 | Skin-aware: PKO version `#003574 → #001E4B` (already matches navy ramp) |
| 88, 89 | Ground pattern | `#1f2937`, `#0a0a0f` lines | 🟡 | PKO: `#172B4D` ground, `#001E4B` lines |
| 122 | Empty-state heading | `font-black uppercase tracking-tight` | 🔴 | Drop `font-black uppercase tracking-tight` under PKO; use `font-bold` only |

---

## 2.9 Cross-cutting: every `app/<page>/page.tsx`

`grep -l "brutal-" app/` returns **22 page files** + **15 component files** = **37 source files** with explicit `brutal-*` class usage. Each is a candidate for the `:root[data-skin="pko"]` override approach (no per-file edit needed if `globals-pko.css` covers `.brutal-heading`, `.brutal-tag`, `.btn`, `.card`, `.chip`).

The 47 `border-[3px]` Tailwind arbitrary values **cannot** be overridden via CSS without `!important` (Tailwind utilities have higher specificity than CSS classes). For these we have two paths:

1. **Add `:root[data-skin="pko"] .border-\[3px\] { border-width: 1px !important; }`** in `globals-pko.css` (works, but `!important` is a code smell).
2. **Replace inline `border-[3px]` with `.card`/`.input` semantic classes** in source — surgical change, but 47 sites.

Recommendation in `06-EXECUTION-PLAN.md`: ship with path (1) for v1, refactor to (2) in v1.1 cleanup PR.

---

## Summary

| Category | Count |
|----------|-------|
| 🔴 must-remove-for-pko | ~32 distinct artifacts (every primitive in `globals.css` + every `border-[3px]`/`shadow-[Npx_Npx_0_0]` site) |
| 🟡 can-soften | ~10 (chips, level-ring, leaderboard-row, hero gradient) |
| 🟢 neutral (keep) | a11y rules (`.skip-to-content`, `:focus-visible`, `prefers-reduced-motion`), mobile UX (`.tap-target`, `.bottom-tabs`, `.swipeable`), animations not used in PKO skin |

The override surface is concentrated in `app/globals.css` (10 primitives), `app/layout.tsx` (footer), `components/site-nav.tsx` (header chip), `components/cashflow-hud.tsx` + `tier-up-toast.tsx` (per-component shadows), and `components/city-scene.tsx` (the 73-hex blocker).
