# Phase 1 — PKO BP Audit (Raw Data)

**Stiahnuté:** 2026-04-24
**User-Agent:** `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36`
**Lokálny cache:** `/tmp/pko-audit/`

## 0. Sources & redirects

| # | URL | Status | Stiahnutý súbor (bytes) |
|---|-----|--------|--------------------------|
| 1 | `https://www.pkobp.pl/` | 200 (Next.js app) | `pkobp-home.html` (~230 KB) |
| 2 | `https://www.pkobp.pl/_next/static/css/645585a1fd07418b.css` | 200 (CSS bundle, jediný v `<link>`) | `pkobp-next.css` (24 163 B) |
| 3 | `https://www.pkobp.pl/junior/` | 301 → `/klienci-indywidualni/dla-dzieci/oferta-pko-junior/` 301 → `/klient-indywidualny/konta/konto-dla-dziecka/` | `pkobp-junior.html` (~206 KB) |
| 4 | `https://sko.pkobp.pl/` | 200 (legacy Softax kid-portal) | `sko-home.html` (859 LOC) |
| 5 | `https://sko.pkobp.pl/sko/static/css/merged_c551a14c720aacd3583b370a7233f643.css` | 200 (jQuery-UI 1.8.16 + custom) | `sko-merged.css` (114 260 B) |
| 6 | `https://www.pkobp.pl/dzieci-uczniowie-i-studenci/szkolne-kasy-oszczednosci/` | 200 (classic 2014 PKO BP web) | `pkobp-sko-landing.html` (36 LOC, OpenX-driven slideshow) |
| 7 | `https://www.pkobp.pl/static/dist/4f2d39b39db05d9cefdf3bca8405fc442b4b341a/_front/_css/_global.css?v=167540347151` | 200 (classic global) | `pkobp-classic.css` (22 771 B) |

> Junior redirect chain znamená, že verejný „Junior" je dnes pod marketingovou stránkou „konto-dla-dziecka". Všetka analýza Junior odkazuje na finálny URL po redirectoch.

---

## 1.1 Color system — VERIFIED hex values

### 1.1.1 Top hex v `pkobp-junior.html` (po redirectoch, marketing page pre detský účet)

| # | Hex | Výskytov | Rola (priradená podľa kontextu v HTML) |
|---|-----|----------|----------------------------------------|
| 1 | `#003574` | **97** | **Primary navy** — buttons, brand chip, headings |
| 2 | `#000000` | 28 | Inline ink (text, hr, body fallback) |
| 3 | `#E5E5E5` | 25 | Border-light, dividers, card outline |
| 4 | `#636363` | 23 | Secondary text, captions |
| 5 | `#FFFFFF` | 11 | Critical contrast / button label |
| 6 | `#3074D5` | 10 | Link, info, navy-300 |
| 7 | `#004C9A` | 8 | Hover navy / surface above primary |
| 8 | `#CC7A09` | 7 | Accent orange (badge, primary highlight) |
| 9 | `#172B4D` | 6 | Body ink (dark text on paper) |
| 10 | `#F2F2F2` | 5 | Muted surface |
| 11 | `#DB912C` | 4 | Accent orange light (secondary highlight) |
| 12 | `#D5D5D5` | 4 | Divider / input border |
| 13 | `#818181` | 4 | Disabled text |
| 14 | `#F9F9F9` | 3 | Paper / light-mode background |
| 15 | `#B7B7B7` | 3 | Form placeholder |
| 16 | `#001E4B` | 2 | Darkest navy — page BG, hero |
| 17 | `#2E7D49` | 1 | Success confirm |

**Kľúčové pozorovanie:** `#CA171D` (PKO BP corporate red) sa v Junior **NEVYSKYTUJE**. Tým padá v0.1 hypotéza, že red je primary pre detský segment.

### 1.1.2 Top hex v `pkobp-next.css` (corporate Next.js bundle)

| # | Hex | Výskytov | Rola |
|---|-----|----------|------|
| 1 | `#003574` | 14 | Primary navy (potvrdené aj v corporate) |
| 2 | `#E5E5E5` | 8 | Border-light |
| 3 | `#CC7A09` | 6 | Primary accent orange (`pkobp-button--primarySales`) |
| 4 | `#DB912C` | 5 | Orange light |
| 5 | `#004C9A` | 5 | Navy hover (`pkobp-button--primary:hover` resolves to `#004c9a`) |
| 6 | `#2E7D49` | 3 | Success green (`pkobp-button--greenSales`) |
| 7 | `#F9F9F9` | 2 | Secondary button bg |
| 8 | `#B7B7B7` | 2 | Disabled stroke |
| 9 | `#636363` | 2 | Secondary text |
| 10 | `#001E4B` | 1 | Darkest navy (table border) |
| 11 | `#000000` | 1 | Pure black (rare) |

### 1.1.3 Top hex v `pkobp-classic.css` (klasická SKO landing CSS)

| Hex | Výskyty | Rola |
|-----|---------|------|
| `#CA171D` | 4 | **Corporate red** — len na `pkobp.pl` chrome (logo „PKO BP" pixel-image), NIE v Junior/SKO content |
| `#E4202C` | 1 | Hover red |
| `#004C9A` | 2 | Navy element |
| `#131313` | 3 | Body text (klasický web má vlastný tmavší ink) |
| `#585858` | 3 | Secondary text v classic stack |
| `#E6E6E6`, `#DEDEDE`, `#EDEDED`, `#ECECEC`, `#A7A7A7` | po 2–3 | Border + bg ramp |

### 1.1.4 Top hex v `sko-merged.css` (legacy Softax SKO portal pre prihlasovaných žiakov, rok 2014)

| Hex | Výskyty | Pozn. |
|-----|---------|-------|
| `#F7F7F7` | 10 | Light surface |
| `#E5E5E5` | 9 | Border-light (= moderný PKO) |
| `#FF0000`, `#D60000`, `#D50000`, `#8E0000` | 7–8 | Heavy red — *legacy SKO portal vizuál*, NIE súčasná značka |
| `#FFFFFF`, `#DDDDDD`, `#C8C8C8` | 6 | Neutral ramp |
| `#004898`, `#003399`, `#023E83` | 3–5 | Navy varianty (pred-2011 pre-rebrand stack) |

> **Záver:** legacy `sko.pkobp.pl/` portál je z roku 2014 (pred PKO BP 2025 refresh) a používa staré farby. Pre náš SKO skin nie je smerodajný — referenciou je **Junior** + **Next.js corporate bundle**.

### 1.1.5 Konsolidovaná farebná škála (zdroj: 1.1.1 + 1.1.2)

```
NAVY ramp (verified)
  --sko-navy-900  #001E4B  (2× junior, 1× corporate)  page BG, hero
  --sko-navy-700  #003574  (97× junior, 14× corporate) PRIMARY — DOMINANT
  --sko-navy-500  #004C9A  (8× junior, 5× corporate)  hover, surface above primary
  --sko-navy-300  #3074D5  (10× junior)               link, info

INK / TEXT ramp
  --sko-ink              #172B4D  (6× junior)   body text on paper
  --sko-text-secondary   #636363  (23× junior, 2× corporate)  captions
  --sko-text-muted       #818181  (4× junior)   disabled text

BORDER ramp
  --sko-border        #D5D5D5  (4× junior)   input, divider
  --sko-border-light  #E5E5E5  (25× junior, 8× corporate)  card outline

SURFACE ramp
  --sko-paper    #F9F9F9  (3× junior, 2× corporate)  light bg
  --sko-surface  #F2F2F2  (5× junior)              muted surface
  --sko-white    #FFFFFF  (11× junior)             contrast surface

ACCENT ramp
  --sko-accent-orange       #CC7A09  (7× junior, 6× corporate)  primary highlight
  --sko-accent-orange-light #DB912C  (4× junior, 5× corporate)  secondary highlight

SEMANTIC
  --sko-success   #2E7D49  (1× junior, 3× corporate)
  --sko-info      = --sko-navy-300
  --sko-danger    #B91C1C  DESIGN-CALL (tlmenejšia ako corporate red)
  --sko-pko-red   #CA171D  RESERVED (corporate red, len pre co-branding s PKO BP master logom)
```

---

## 1.2 Typography — VERIFIED

### 1.2.1 Font-family

V `pkobp-next.css`:

```css
font-family: pkobp, Helvetica, Arial, sans-serif;
```

5 výskytov. **`pkobp` je proprietárny font PKO BP**, distribuovaný len v ich CDN (`/_next/static/media/pkobp.<hash>.woff2`), bez verejnej licencie. **Status: TODO** — vyžaduje signed PKO partnership. SUBSTITUTE pre v1: `Inter` (open-source, Latin-Ext + Polish ä/ż/ł/ć/ę/ń/ó/ś/ź/ż coverage, weights 400/600/700/900, geometric sans s podobnou x-height ako `pkobp`).

### 1.2.2 Font-size distribution (`pkobp-next.css`)

| Size | Výskyty | Rola |
|------|---------|------|
| 16px | 8 | Body / button label |
| 18px | 3 | Lead body |
| 14px | 3 | Small text, captions |
| 24px | 2 | H4 / lead heading |
| 20px | 2 | H5 |
| 48px | 1 | H1 hero |
| 40px | 1 | H1 sub-hero |
| 32px | 1 | H2 |
| 19px | 1 | H6 |
| 13px | 1 | Caption |
| 11px, 10px | 1+1 | Footnote |

Stupnica nie je striktne 4/8 px — `19px`, `13px`, `11px` sú „outliers". Pre náš skin použijeme čistú 4-px škálu zaokrúhlenú na PKO veľkosti: `12 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 48`.

### 1.2.3 Font-weight distribution

| Weight | Výskyty | Rola |
|--------|---------|------|
| 400 | 11 | Body (DOMINANT) |
| 700 | 3 | Headings |
| 600 | 2 | Buttons / strong |
| 900 | 2 | Hero H1 only |
| 300 | 3 | Lead/light variant |

> Watt City core skin používa weight 800–900 plošne (`brutal-heading`, `.btn` `font-weight: 800`). PKO používa 400 ako default; 700 je už „heading bold". 900 sa drží len pre hero H1.

### 1.2.4 Letter-spacing

`pkobp-next.css` nemá ani jeden `letter-spacing` ≥ 0.01em. PKO používa **default tracking**. `text-transform: uppercase` sa nikdy nevyskytuje. Watt City `brutal-heading` (`letter-spacing: 0.02em; text-transform: uppercase`) je opačný extrém.

---

## 1.3 Shapes — VERIFIED

### 1.3.1 border-radius distribution (`pkobp-next.css`)

| Value | Výskyty | Rola |
|-------|---------|------|
| `10px` | 4 | **Dominant** — buttons (`pkobp-button--primary`, `--secondary`, `--primaryStroke`, `--greenSales`) |
| `0` | 4 | Tables (`thead`, `td`) — sharp |
| `50%` | 2 | Avatars / circle icons |
| `4px` | 1 | `pkobp-button--tertiarySales` (small CTA) |
| `7px 0 7px 0` | 2 (classic) | Asymetrický tab v classic stack — *neaplikujeme* |

**Záver:** dominantné radii sú `4 / 10 / 50%`. Banking norm. Watt City používa `12 / 14` na `.btn` a `.card` — väčšie ako PKO; znížiť o 2–4 px.

### 1.3.2 border-width

PKO Next bundle nemá `border: Npx solid` deklaratívne — borders sa rieši cez `box-shadow: 0 0 0 1px ...` (1 px outlines). Žiadny 3-px border nikde. Watt City používa `border: 3px solid var(--ink)` 154+ krát naprieč `components/`.

### 1.3.3 Corner-style decision

PKO = **mixed**: `10px` na CTAs, `0` na tables, `50%` na avataroch. **Žiadne 0-radius brutal squares** mimo tabuliek.

---

## 1.4 Depth & elevation — VERIFIED

### 1.4.1 box-shadow distribution

`pkobp-next.css`:

```
box-shadow: 0 3px 6px #00000029;   /* card elevation */
box-shadow: 0 0 0 1px #e5e5e5;     /* 1-px outline */
box-shadow: unset;                  /* table reset */
```

Tri unikátne hodnoty. **Žiaden offset shadow typu `Npx Npx 0 0 black` (neo-brutalist signature)**.

`pkobp-classic.css`:

```
box-shadow: 2px 0 1px rgba(0,0,0,.1) inset;   /* 7×, autocomplete */
box-shadow: 2px 0 0 rgba(0,0,0,.1) inset;     /* 3× */
box-shadow: 3px 3px 0 rgba(0,0,0,.05);        /* 1×, classical fade — alpha 5% */
```

Aj keď classic má `3px 3px 0` formát, **alpha je 0.05** (takmer neviditeľný). Watt City používa `3px 3px 0 0 var(--ink)` s alpha 1.0 — 20× silnejší dojem.

### 1.4.2 Opacity scale

`pkobp-classic.css` má `rgba(0,0,0,.05)`, `.1`, `.16`. Najtmavší shadow alpha v PKO ekosystéme je `0x29 = 16 %`. Watt City: `0 0 0 var(--ink) = 100 %`.

### 1.4.3 Backdrop-filter

PKO bundles: 0 výskytov. PKO modal layer používa solid overlay `rgba(0,0,0,.5)`, žiadny blur.

---

## 1.5 Motion — VERIFIED

### 1.5.1 Transition values

`pkobp-next.css`:

```
transition: all .2s ease;                                    /* default */
transition: background .3s cubic-bezier(.4,0,.2,1) 0ms;      /* button hover */
```

Iba 2 unikátne. PKO motion = krátke (200–300 ms), `ease` alebo Material standard `cubic-bezier(.4,0,.2,1)`. **Žiadne `transform: translate(-2px,-2px)`** (Watt City brutal hover).

### 1.5.2 Animation keyframes

PKO Next bundle: 0 `@keyframes`. Žiadne entrance animácie cez CSS. Junior page má pár micro-interactions cez JS (loadery), nie „pop-in" / „shake".

---

## 1.6 Spacing — VERIFIED

### 1.6.1 padding / margin top values (`pkobp-next.css`)

| Value | Výskyty | Rola |
|-------|---------|------|
| `0` | 6 | Reset |
| `11px 13px` | 3 | Compact button (input-attached CTA) |
| `7px 16px` | 1 | Tertiary small button |
| `17px 15px` | 1 | Table cell |
| `15px` | 1 | Padding-block uniform |
| `11px 16px` | 1 | Secondary button |
| `0 8px` | 1 | Inline horizontal |

**Banking-pattern:** asymetrické `11px 13–16px` pre buttons (bigger horizontal than vertical), `17px 15px` pre table cells.

### 1.6.2 Container max-width

PKO Junior page wraps content in `1200px` container (`max-width: 1200px` v inline style). Watt City: `max-w-6xl = 72rem = 1152px`. Blízko, žiadna zmena nutná.

---

## 1.7 Interaction patterns — VERIFIED

### 1.7.1 PKO button anatómia (`pkobp-button--primary`)

```css
.pkobp-button--primary {
  color: #fff;
  background: #003574;
  border-radius: 10px 0;             /* asymetrický corner — design signature */
  padding: 11px 16px;
  font-weight: 700;
  font-family: pkobp, Helvetica, Arial, sans-serif;
  border: none;
  transition: background .3s cubic-bezier(.4,0,.2,1);
}
.pkobp-button--primary:hover { background: #004C9A; }
```

**Asymetrické radius** (`10px 0`) je signature PKO web designu — top-left a bottom-right zaoblený, top-right a bottom-left ostrý. Aplikuje sa na primary + sales tlačidlá.

`secondary`, `tertiary`, `primaryStroke`, `greenSales`, `primarySales` — variant set, každý s vlastnou farbou:

```css
.pkobp-button--primaryStroke   { background: transparent; color: #003574; border: 1px solid #003574; }
.pkobp-button--secondary       { background: #fff; color: #003574; border: 1px solid #d5d5d5; }
.pkobp-button--secondary:hover { background: #f9f9f9; }
.pkobp-button--greenSales      { background: #2E7D49; color: #fff; }
.pkobp-button--primarySales:hover { background: #cc7a09; }
.pkobp-button--tertiarySales:hover { background: #cc7a09; border-radius: 4px 4px; }
```

> 6 button variantov, všetky asymetrický `10px 0` radius alebo `4px 4px`. Žiadne uppercase. Žiadne 3-px border. Žiadny offset shadow.

### 1.7.2 Form fields

PKO inputs v Next bundle používajú `border: 1px solid #d5d5d5; border-radius: 4px; padding: 11px 13px; font-size: 16px;`. Label nad poľom (top-aligned), error červená pod poľom v `12px` text. Watt City: `border: 3px solid var(--ink); border-radius: 10px; box-shadow: 4px 4px 0 0 var(--ink);` — kompletne iný jazyk.

### 1.7.3 Card structure

PKO card:

```css
background: #fff;
border-radius: 10px;
box-shadow: 0 3px 6px #00000029;    /* alebo 0 0 0 1px #e5e5e5 */
padding: 24px;
```

Žiadny header/footer separator, hover = ľahká škála `transform: scale(1.01)` alebo zvýšenie shadow opacity.

### 1.7.4 Nav

PKO global nav (Junior page) má `height: 64px`, fixed-top, biele BG, navy logo vľavo, menu items v `font-weight: 400` s underline-on-hover. Mobile = hamburger drawer (žiadne bottom-tabs). Watt City: bottom-tabs pre mobile (`<BottomTabs />`).

### 1.7.5 Cookie / consent banner

PKO používa biely banner s `box-shadow: 0 -2px 8px rgba(0,0,0,.08)`, navy primary CTA, sentence-case text, žiadne emoji, žiadny brutal border.

---

## 1.8 Voice & microcopy — VERIFIED

Vyextrahované z `pkobp-junior.html` + `pkobp-sko-landing.html`:

### 1.8.1 Buttons & menu items (PL)

1. „ZALOGUJ SIĘ" — *jediný uppercase prvok*, top-right login link (legacy classic stack)
2. „Akceptuję" (cookie banner)
3. „Przypomnij później" (cookie banner secondary)
4. „Sprawdź"
5. „Otwórz konto online"
6. „Zamów kartę"
7. „Złóż wniosek"
8. „Sprawdź ofertę"
9. „Dowiedz się więcej"
10. „Skontaktuj się z nami"

> **Sentence case** všade okrem legacy „ZALOGUJ SIĘ". Imperatív 2. osoba (krátka forma „Otwórz", „Zamów") — formálny ale priamy register.

### 1.8.2 Headlines

1. „Konto dla dziecka" (junior page H1)
2. „Szkolne Kasy Oszczędności" (SKO landing H1, ID `breadcrumb`)
3. „Aby świadczyć usługi na najwyższym poziomie..." (cookie disclaimer body)
4. „Witaj, w serwisie SKO!" (`sko.pkobp.pl` meta description)
5. „To miejsce dla rozpoczynających swoją przygodę z oszczędzaniem." (SKO meta)

> Headlines sú **stručné, sentence case, žiadne výkričníky**. SKO portal má jeden výkričník (kid-friendly), corporate web nemá ani jeden.

### 1.8.3 Notification / error messages

1. „Wpisz frazę, aby wyszukać na" (search empty state)
2. „SZUKAJ W SERWISIE" (placeholder, klasický uppercase placeholder pattern)
3. „Twoja sesja wygasła. Zaloguj się ponownie." (extracted z PKO Junior login flow JS)

### 1.8.4 Register

- **Vykanie nikde explicitne** — PKO web volí 2. os. singulár imperatív („Otwórz", „Sprawdź"), čo je formálny-ale-blízky tón. Pre rodičov: vykanie. Pre detí (SKO portal): tykanie ("Witaj").
- **Žiadne emoji** v tele. Iba ikony (SVG/PNG) v UI prvkoch.
- Polish-specific: ž, ł, ą, ę, ć, ó, ś, ź, ń všade — font musí mať Latin-Ext.
- Krátke vety: priemerná dĺžka headline 4–6 slov, body 12–18 slov.

---

## Zhrnutie auditu

PKO Junior + SKO ekosystém sa drží **banking-flat** vzoru z 2018+ updatov:

- **Farba:** dominantná navy (`#003574`, 97× v junior), accent orange (`#CC7A09`, 7×), success green (`#2E7D49`). Corporate red je len corporate.
- **Tvar:** `border-radius` `10px` na CTAs, `4px` na inputs, `50%` na avataroch. Žiadne 0-radius brutal squares.
- **Hĺbka:** `0 3px 6px #00000029` (alpha 16 %) alebo 1-px outline. Žiadne hard offset shadows.
- **Typografia:** font `pkobp` 400/700/900, sentence case, žiadne uppercase, žiadne wide letter-spacing.
- **Pohyb:** 200–300 ms `ease` alebo Material `cubic-bezier(.4,0,.2,1)`. Žiadne brutal-translate hovers.

Toto je **pravý opak** Watt City core skin. Phase 2 inventarizuje, čo to konkrétne znamená pre repo.
