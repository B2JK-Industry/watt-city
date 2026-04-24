# Design Tokens

Všetko čo FE potrebuje copy-paste. Hodnoty sú odvodené z reálnej analýzy `pkobp.pl/_next/static/css/645585a1fd07418b.css`.

---

## 1. Farby — CSS custom properties

Miesto: `app/globals.css` → nahradiť aktuálny `:root` blok (riadky 116–136) a pridať `:root[data-skin="pko"]` blok.

```css
/* ────────────────────────────────────────────────────────
   PKO skin palette — light-first, navy primary
   Zdroj: pkobp.pl (apríl 2026)
   ──────────────────────────────────────────────────────── */

:root[data-skin="pko"] {
  /* Navy — primary */
  --color-navy-900: #001e4b;
  --color-navy-700: #003574;   /* DEFAULT primary */
  --color-navy-500: #004c9a;   /* hover/focus */

  /* Orange — sales accent */
  --color-orange-700: #cc7a09; /* hover */
  --color-orange-500: #db912c; /* DEFAULT sales */

  /* Green — positive feedback */
  --color-green-600: #2e7d49;

  /* Red — destructive/error (not from pkobp.pl, ale potrebné — pkobp nemá error paletu v hlavnom CSS) */
  --color-red-600: #c0342b;

  /* Ink — text */
  --color-ink-900: #000000;
  --color-ink-500: #636363;
  --color-ink-300: #b7b7b7;

  /* Surface — backgrounds */
  --color-surface-0: #ffffff;
  --color-surface-50: #f9f9f9;

  /* Line — borders, dividers */
  --color-line: #e5e5e5;

  /* ────────── Semantic aliases (komponenty referencujú tieto) ────────── */

  --background: var(--color-surface-0);
  --foreground: var(--color-ink-900);
  --surface: var(--color-surface-0);
  --surface-2: var(--color-surface-50);
  --ink: var(--color-ink-900);
  --ink-muted: var(--color-ink-500);
  --ink-subtle: var(--color-ink-300);
  --line: var(--color-line);

  --accent: var(--color-navy-700);
  --accent-hover: var(--color-navy-500);
  --accent-ink: var(--color-surface-0);

  --sales: var(--color-orange-500);
  --sales-hover: var(--color-orange-700);
  --sales-ink: var(--color-surface-0);

  --success: var(--color-green-600);
  --danger: var(--color-red-600);
  --focus-ring: var(--color-navy-700);

  /* ────────── Elevation ────────── */
  --shadow-line: 0 0 0 1px var(--color-line);
  --shadow-soft: 0 3px 6px rgba(0, 0, 0, 0.16);

  /* ────────── Radius ────────── */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 999px;
}
```

### `core` skin (zachovať pôvodný ako legacy)

Aktuálny `:root` blok v `globals.css` (riadky 116–136) presunúť pod `:root[data-skin="core"]`. Stále funkčný, ale už **nie default**.

### Default skin switch

V `app/layout.tsx` zmeniť:

```ts
// PRED
export function currentSkin(): SkinId {
  const raw = process.env.SKIN ?? process.env.NEXT_PUBLIC_SKIN;
  return raw === "pko" ? "pko" : "core";
}

// PO
export function currentSkin(): SkinId {
  const raw = process.env.SKIN ?? process.env.NEXT_PUBLIC_SKIN;
  if (raw === "core") return "core";
  return "pko"; // default
}
```

---

## 2. Tailwind v4 integration

Zachovať pattern `@theme inline` z `globals.css` (riadky 138–149), rozšíriť:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--line);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-sales: var(--sales);
  --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle);
  --color-success: var(--success);
  --color-danger: var(--danger);

  --font-sans: "Inter", var(--font-geist-sans), system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

Po tomto Tailwind vie vygenerovať: `bg-accent`, `text-ink-muted`, `border-border`, `rounded-md` (= 10 px), `font-sans` atď.

---

## 3. TypeScript token export

Miesto: `lib/theme.ts` — rozšíriť `ThemeTokens` type + `PKO_THEME` const.

```ts
export type ThemeTokens = {
  id: SkinId;
  brand: string;
  brandShort: string;
  colors: {
    accent: string;
    accentHover: string;
    accentInk: string;
    sales: string;
    salesHover: string;
    salesInk: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    ink: string;
    inkMuted: string;
    inkSubtle: string;
    line: string;
    success: string;
    danger: string;
  };
  disclaimer: string;
  mascot: MascotDef | null; // Pre `pko` skin = null, kým PKO nedodá asset
};

export const PKO_THEME: ThemeTokens = {
  id: "pko",
  brand: "Watt City",
  brandShort: "WC",
  colors: {
    accent: "#003574",
    accentHover: "#004c9a",
    accentInk: "#ffffff",
    sales: "#db912c",
    salesHover: "#cc7a09",
    salesInk: "#ffffff",
    background: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#f9f9f9",
    ink: "#000000",
    inkMuted: "#636363",
    inkSubtle: "#b7b7b7",
    line: "#e5e5e5",
    success: "#2e7d49",
    danger: "#c0342b",
  },
  disclaimer:
    "GRA EDUKACYJNA — to nie są prawdziwe pieniądze. Budynki, kredyty i W-dolary istnieją tylko w grze.",
  mascot: null, // Do dodania skutočného assetu nerenderovať
};
```

**Pozor:** `lib/pko-skin.test.ts` očakáva konkrétne stringy. Aktualizovať testy paralelne (viď tiket E0-04 v backlogu).

---

## 4. skinVars injection (layout.tsx)

Miesto: `app/layout.tsx` riadky 128–146. Rozšíriť mapping tokenov na CSS premenné.

```ts
const skinVars: React.CSSProperties =
  theme.id === "pko"
    ? ({
        "--accent": theme.colors.accent,
        "--accent-hover": theme.colors.accentHover,
        "--accent-ink": theme.colors.accentInk,
        "--sales": theme.colors.sales,
        "--sales-hover": theme.colors.salesHover,
        "--background": theme.colors.background,
        "--surface": theme.colors.surface,
        "--surface-2": theme.colors.surfaceAlt,
        "--ink": theme.colors.ink,
        "--ink-muted": theme.colors.inkMuted,
        "--ink-subtle": theme.colors.inkSubtle,
        "--line": theme.colors.line,
        "--success": theme.colors.success,
        "--danger": theme.colors.danger,
      } as React.CSSProperties)
    : {};
```

---

## 5. Typografia

### Font loader

Miesto: `app/layout.tsx` riadky 29–37. Nahradiť Geist + pridať Inter ako primárny sans pre `pko` skin.

```ts
import { Inter, Geist, Geist_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// V <html> class:
<html className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`} />
```

Potom v globals.css:

```css
@theme inline {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}
```

### Typo škála — Tailwind utility classes

Pridať do `app/globals.css` pod `@theme inline` blok:

```css
@layer utilities {
  .t-display  { font-size: 48px; line-height: 56px; font-weight: 700; letter-spacing: -0.01em; }
  .t-h1       { font-size: 40px; line-height: 48px; font-weight: 700; letter-spacing: -0.01em; }
  .t-h2       { font-size: 32px; line-height: 40px; font-weight: 700; letter-spacing: -0.005em; }
  .t-h3       { font-size: 24px; line-height: 32px; font-weight: 600; }
  .t-h4       { font-size: 20px; line-height: 28px; font-weight: 600; }
  .t-h5       { font-size: 18px; line-height: 26px; font-weight: 600; }
  .t-body-lg  { font-size: 18px; line-height: 28px; font-weight: 400; }
  .t-body     { font-size: 16px; line-height: 24px; font-weight: 400; }
  .t-body-sm  { font-size: 14px; line-height: 20px; font-weight: 400; }
  .t-caption  { font-size: 13px; line-height: 18px; font-weight: 400; }
  .t-micro    { font-size: 11px; line-height: 14px; font-weight: 400; }
  .t-overline {
    font-size: 12px; line-height: 16px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
  }
}
```

### Pravidlá použitia

| Element | Trieda | Farba |
|---|---|---|
| Hero H1 | `t-h1` | `text-accent` (navy) |
| Sekcia H2 | `t-h2` | `text-accent` |
| Karta titul | `t-h3` | `text-accent` |
| Intro odsek | `t-body-lg` | `text-foreground` |
| Body default | `t-body` | `text-foreground` |
| Metadata | `t-body-sm` | `text-ink-muted` |
| RRSO, legal | `t-caption` | `text-ink-muted` |
| Tag, kategória | `t-overline` | `text-ink-muted` |

---

## 6. Spacing

Zachovať Tailwind defaulty (4-pt base). Žiaden custom spacing token.

Canonical values (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120) pokrývajú všetko. Ak FE potrebuje iný step — je to pravdepodobne bug.

Sekčný rytmus — zaviesť utility:

```css
@layer utilities {
  .section-y     { padding-top: 96px; padding-bottom: 96px; }
  .section-y-sm  { padding-top: 64px; padding-bottom: 64px; }
  @media (max-width: 767px) {
    .section-y   { padding-top: 64px; padding-bottom: 64px; }
    .section-y-sm { padding-top: 48px; padding-bottom: 48px; }
  }
}
```

---

## 7. Radius tokens (Tailwind aliases)

```
rounded-none  → 0
rounded-sm    → 4px   (chips)
rounded-md    → 10px  (buttons, cards) ← DEFAULT pre akčné povrchy
rounded-lg    → 16px  (modal, drawer)
rounded-full  → 9999  (avatar, pill badge)
```

**Žiadne `rounded-[Npx]` arbitrárne classes. Jedno z troch, nič iné.**

---

## 8. Shadow tokens

```css
@layer utilities {
  .elev-line { box-shadow: 0 0 0 1px var(--line); }
  .elev-soft { box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16); }
  .elev-soft-lg { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }  /* iba pre modal/drawer */
}
```

Žiadne `shadow-[Npx_Npx_0_0_...]` hard-offset classes.

---

## 9. Motion tokens

```css
@layer utilities {
  .motion-fast  { transition: all 120ms ease-out; }
  .motion-base  { transition: all 200ms cubic-bezier(.4, 0, .2, 1); }
  .motion-slow  { transition: all 300ms cubic-bezier(.4, 0, .2, 1); }
}

:root {
  --ease-standard: cubic-bezier(.4, 0, .2, 1);
  --ease-enter: cubic-bezier(0, 0, .2, 1);
  --ease-exit: cubic-bezier(.4, 0, 1, 1);
}
```

---

## 10. Z-index stack (pridať do komentára v globals.css)

```
0     base
10    sticky nav
20    dropdown
30    modal backdrop
31    modal content
40    toast
50    tooltip
100   skip-to-content (už existuje)
```

---

## 11. Export ako JSON (pre Figma, handoff)

Miesto: `docs/pko-redesign/tokens.json` — W3C Design Tokens Community Group formát. Vytvoriť v tikete E0-05.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "navy": {
      "900": { "$type": "color", "$value": "#001e4b" },
      "700": { "$type": "color", "$value": "#003574" },
      "500": { "$type": "color", "$value": "#004c9a" }
    },
    "orange": {
      "700": { "$type": "color", "$value": "#cc7a09" },
      "500": { "$type": "color", "$value": "#db912c" }
    },
    "green": { "600": { "$type": "color", "$value": "#2e7d49" } },
    "red": { "600": { "$type": "color", "$value": "#c0342b" } },
    "ink": {
      "900": { "$type": "color", "$value": "#000000" },
      "500": { "$type": "color", "$value": "#636363" },
      "300": { "$type": "color", "$value": "#b7b7b7" }
    },
    "surface": {
      "0": { "$type": "color", "$value": "#ffffff" },
      "50": { "$type": "color", "$value": "#f9f9f9" }
    },
    "line": { "$type": "color", "$value": "#e5e5e5" }
  },
  "radius": {
    "sm": { "$type": "dimension", "$value": "4px" },
    "md": { "$type": "dimension", "$value": "10px" },
    "lg": { "$type": "dimension", "$value": "16px" }
  },
  "shadow": {
    "line": { "$type": "shadow", "$value": { "offsetX": "0", "offsetY": "0", "blur": "0", "spread": "1px", "color": "#e5e5e5" } },
    "soft": { "$type": "shadow", "$value": { "offsetX": "0", "offsetY": "3px", "blur": "6px", "spread": "0", "color": "#00000029" } }
  }
}
```

---

## 12. Rýchla referencia — čo pri akom use-case

| Use case | Token |
|---|---|
| Pozadie stránky | `--background` (#fff) |
| Pozadie karty | `--surface` (#fff) s `elev-line` tieňom |
| Hover row v zozname | `--surface-2` (#f9f9f9) |
| Primary nadpis | `color: var(--accent)` (navy) |
| Body text | `color: var(--foreground)` (#000) |
| Secondary text | `color: var(--ink-muted)` (#636363) |
| Placeholder | `color: var(--ink-subtle)` (#b7b7b7) |
| Delimiter/border | `border: 1px solid var(--line)` |
| Primary CTA bg | `background: var(--accent)`, text biely |
| Sales CTA bg | `background: var(--sales)`, text biely |
| Secondary CTA | `bg: transparent`, `border: 1px solid var(--accent)`, `color: var(--accent)` |
| Link inline | `color: var(--accent)`, hover: underline |
| Success badge | `color: var(--success)` |
| Error state | `color: var(--danger)`, border `var(--danger)` |
