# Phase 4.5 — Landing Hero Redesign (`app/page.tsx`)

Banking-clean rewrite signature surface. Goal: a parent or teacher landing on `/` under PKO skin sees a banking product, not a hackathon pitch.

---

## Layout (desktop ≥1024px)

```
+-----------------------------------------------------------------------+
| Top nav (navy bg, white text)                                          |
+-----------------------------------------------------------------------+
|                                                                       |
|  Hero band (navy gradient, 480px tall)                                |
|  +-------------------------------------+  +------------------------+   |
|  |  H1: Naucz się oszczędzać.          |  |  Skyline preview SVG  |   |
|  |  H2: SKO × Watt City to gra,        |  |  (small city, 16:10)  |   |
|  |  która łączy SKO z prawdziwymi      |  |                        |   |
|  |  decyzjami finansowymi.             |  |                        |   |
|  |                                     |  |                        |   |
|  |  [Załóż konto] [Zobacz, jak działa] |  |                        |   |
|  +-------------------------------------+  +------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
|  Trust band (white bg, navy text, 80px tall)                          |
|  • W partnerstwie z PKO Bank Polski   • GRA EDUKACYJNA   • RODO       |
+-----------------------------------------------------------------------+
|  Three-up "Co dostajesz?" (white bg)                                  |
|  +-----------+  +-----------+  +-----------+                          |
|  | icon       |  | icon       |  | icon       |                       |
|  | Bezpiecz.  |  | Gra        |  | Rozwój     |                       |
|  | body line  |  | body line  |  | body line  |                       |
|  +-----------+  +-----------+  +-----------+                          |
+-----------------------------------------------------------------------+
|  How it works (3-step strip)                                           |
+-----------------------------------------------------------------------+
|  Footer (navy, 1px border-top, simple links + disclaimer)             |
+-----------------------------------------------------------------------+
```

## Layout (mobile <640px)

Stack everything vertically. Hero shrinks to 360px tall, no skyline (replaced by single Lokatka icon top-right). CTAs full-width stacked (primary + ghost).

---

## Hero copy (PL)

| Slot | Copy (PL, sentence case, no emoji) | Char count |
|------|-------------------------------------|------------|
| H1 | Naucz się oszczędzać. | 22 |
| H2 (sub) | SKO × Watt City to gra, która łączy program SKO z prawdziwymi decyzjami finansowymi dla dzieci 9–14 lat. | 110 |
| Primary CTA | Załóż konto | 11 |
| Secondary CTA | Zobacz, jak działa | 18 |
| Trust line | W partnerstwie z PKO Bank Polski. Bez reklam. Bez zakupów w aplikacji. | 71 |

Source for tone: `pkobp.pl/junior` headlines audit (`01-PKO-AUDIT-RAW.md §1.8`). „Naucz się" je 2. os. singulár imperatív (matches PKO copy register; tykanie pre dieťa, vykanie pre rodiča sa rieši v `/login` page).

---

## CTA styling

### Primary CTA (`Załóż konto`)
- Class: `.btn .btn-primary .btn-cta-hero`
- Bg: `var(--sko-navy-700)` (#003574)
- Text: white, weight 600, 16px
- Padding: `14px 24px`
- Radius: `10px 0 10px 0` (signature asymmetric)
- Shadow: `var(--sko-shadow-card)`
- Hover: bg → `var(--sko-navy-500)`, shadow → `var(--sko-shadow-lg)`

### Secondary CTA (`Zobacz, jak działa`)
- Class: `.btn .btn-ghost`
- Background: transparent
- Border: `1px solid var(--sko-white)` (because hero is on navy bg)
- Text: white, weight 600
- Hover: `bg: rgba(255, 255, 255, 0.08)`, no transform

> Pod core skin: existujúce `Demo · 4 minigry` style. Pod PKO skin: clean banking-CTA pair s asymetrickým corner.

---

## Hero right-side card (TOP 3 RANKING)

**Core skin** (current): brutal yellow/cyan/lime cards with offset shadows.

**PKO skin** redesign — Skyline preview SVG (480×300, viewBox 1800×1125 sub-region of city-scene at low fidelity):
- Frame: white card, `radius: var(--sko-radius-md)`, shadow `var(--sko-shadow-lg)`
- Content: 3 line silhouettes scaled to 480w × 300h; navy + orange palette (skin-aware via §3 city-scene refactor)
- Footer band inside the card: small typography "Twoje miasto" + small badge `[Demo]`

If skyline isn't ready in PR-2, fallback: a static `<img src="/marketing/sko-hero-skyline.svg">` placeholder.

---

## Removals under PKO skin

The following hero artifacts must be **conditionally hidden** under `theme.id === "pko"`:

| File:Line | Element | Why remove |
|-----------|---------|-----------|
| `app/page.tsx:99–106` | 3× `brutal-tag` chips (PKO XP / ETHSilesia / Katowice) | Pitch artifacts, not product copy |
| `app/page.tsx:111–115` | Inline brutal callout `<span>` blocks (yellow + cyan with `border-[3px] shadow-[6px_6px_0_0]`) | Brand-incompatible chrome |
| Anywhere | "Content Machine Phase 2" dev banner | Internal sprint label, not user-facing |
| Anywhere | Polish/Slovak mixed dev notes (e.g. `Sin-slávy`) — verify Polish-only under skin | Localization hygiene |

---

## Three-up "Co dostajesz?" cards

| Card | Title (PL, 18px weight 700) | Body (14px weight 400, line-height 1.5) | Icon |
|------|-----------------------------|------------------------------------------|------|
| 1 | Bezpieczeństwo | Bez reklam, bez zakupów, bez prawdziwych pieniędzy. RODO i SKO w jednym. | shield SVG (navy outline, 48×48) |
| 2 | Gra | 9 minigier i AI wyzwania zmieniają lekcje finansów w grę o miasto. | controller SVG |
| 3 | Rozwój | Każda decyzja w grze odpowiada zagadnieniom z podstawy programowej V–VIII klasy. | chart-up SVG |

Each card: `.card`, padding 24px, white bg, navy text, soft shadow.

---

## How-it-works (3-step strip)

```
[1] Załóż konto z rodzicem  →  [2] Graj minigry, buduj miasto  →  [3] Co tydzień: raport dla rodzica
```

- Numeric step circles (32×32, navy fill, white number, weight 700).
- Connector arrows: 1px navy-300 dashed.
- Body line under each step: 14px, secondary text colour.

---

## Footer rewrite under PKO skin

Single tier:
```
+-----------------------------------------------------------------------+
| [SKO chip]  SKO × Watt City                                            |
|             W partnerstwie z PKO Bank Polski.                          |
|                                                                       |
| GRA EDUKACYJNA — to nie są prawdziwe pieniądze. (sentence case)        |
|                                                                       |
| O platformie · Polityka prywatności · Sala sławy · GitHub · Kontakt    |
+-----------------------------------------------------------------------+
```

- 1px border-top `--sko-border-light`
- 24px vertical padding
- No `brutal-tag` chips. No emoji prefix on disclaimer.
- Mascot row (Żyrafa Lokatka): keep but remove brutal heading style. Body copy: 14px, secondary text.

---

## CSS for the redesigned hero

```css
:root[data-skin="pko"] .hero-band {
  background: linear-gradient(180deg, var(--sko-navy-700) 0%, var(--sko-navy-900) 100%);
  color: var(--sko-white);
  padding: 64px 0 80px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
  align-items: center;
}
@media (max-width: 1024px) { :root[data-skin="pko"] .hero-band { grid-template-columns: 1fr; } }

:root[data-skin="pko"] .hero-h1 {
  font-size: 48px; font-weight: 900; line-height: 1.1; margin-bottom: 16px;
  font-family: var(--sko-font-sans);
}
:root[data-skin="pko"] .hero-sub {
  font-size: 18px; font-weight: 400; line-height: 1.5; max-width: 540px;
  color: rgba(255,255,255,.85); margin-bottom: 32px;
}
:root[data-skin="pko"] .hero-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
:root[data-skin="pko"] .btn-cta-hero { font-size: 18px; padding: 14px 24px; }

:root[data-skin="pko"] .trust-band {
  background: var(--sko-white); color: var(--sko-ink);
  padding: 20px 0; font-size: 14px;
  border-top: 1px solid var(--sko-border-light);
  border-bottom: 1px solid var(--sko-border-light);
  display: flex; justify-content: center; gap: 32px;
  flex-wrap: wrap;
}
```

---

## Hero acceptance criteria

1. No yellow visible above the fold.
2. No `🎉` / `🤖` emoji in copy.
3. No `text-transform: uppercase` rendered for any visible text.
4. `Załóż konto` CTA appears with asymmetric `10px 0 10px 0` corner.
5. Trust band ("W partnerstwie z PKO Bank Polski. Bez reklam. Bez zakupów w aplikacji.") visible without scrolling on viewport ≥ 1024×768.
6. On mobile (375×667), hero fits within 100vh; CTA pair stacks.
7. Lighthouse mobile ≥ 90 (perf, a11y, best-practices). The PKO skin should not regress the existing core-skin Lighthouse score.
8. axe DevTools: 0 serious violations on `/` under skin.

---

## Effort estimate

- Layout markup rewrite (`app/page.tsx`): 3 h
- CSS (added to `globals-pko.css`): 1 h
- Icons (3 outline SVGs, 1 hero skyline placeholder): 1.5 h
- Copy review with PKO BP brand team: 0.5 h (assuming verbal sign-off)
- Playwright golden + mobile snapshot: 1 h

**Total: ≈7 h** (split across PR-2 + a small content PR).
