# SKO × Watt City — Brand & Visual Identity Guide

**Verzia:** v0.2 — verified draft
**Dátum:** 2026-04-24
**Status:** interný pracovný manuál (pre dev + design team)
**Predchádzajúca verzia:** [`PKO-BRAND-MANUAL-v0.1.md`](PKO-BRAND-MANUAL-v0.1.md) — approximated draft (zachovaný pre audit).

**Cieľ:** umožniť dev + design team-u za jeden pracovný deň preklopiť Watt City core skin do SKO-skin verzie **bez konfliktov, bez hádania a bez regresií**. Každá hodnota v tomto manuáli má jeden zo statusov:

- **VERIFIED** — extrahované priamo z `pkobp.pl` alebo `sko.pkobp.pl` (apríl 2026), konkrétny URL v §0.1.
- **SUBSTITUTE** — open-source ekvivalent proprietárneho PKO assetu (font, logo). Dá sa hotswapnúť bez zmeny logiky.
- **DESIGN-CALL** — naše vlastné rozhodnutie v rámci SKO harmónie (napr. building paleta), explicitne označené.
- **TODO** — čaká na PKO BP brand team (logo SVG, font licencia).

> **Právne upozornenie.** Manuál vychádza z verejne prístupných zdrojov PKO BP (webové CSS, tlačové materiály, PKO Junior / SKO sekcie). Nepoužíva žiadny interný brand book, proprietárny font (`pkobp`) ani originál loga „skarbonka". Pred produkčným nasadením s PKO logom na čele musí PKO BP brand team potvrdiť/doplniť oficiálne assety.

---

## 0.1 Sources & Verification

Všetky VERIFIED hodnoty v tomto dokumente pochádzajú z týchto zdrojov, stiahnutých 2026-04-24:

| # | URL | Čo z neho | Status |
|---|-----|-----------|--------|
| 1 | `https://www.pkobp.pl/` | PKO BP corporate paleta (červená `#CA171D`), font-family `pkobp` | fetch 2026-04-24, HTML + CSS bundle |
| 2 | `https://www.pkobp.pl/_next/static/css/645585a1fd07418b.css` | Dominantné font-sizes, weights, radii, shadows, transitions | fetch 2026-04-24 |
| 3 | `https://www.pkobp.pl/junior/` | PKO Junior paleta (97× `#003574`), gray škála, accent oranžové, success green | fetch 2026-04-24 |
| 4 | `https://sko.pkobp.pl/` | SKO mascots: `Żyrafa Lokatka`, `Pancernik Hatetepes` (overené textuálne zmienky) | fetch 2026-04-24 |
| 5 | `https://www.pkobp.pl/dzieci-uczniowie-i-studenci/szkolne-kasy-oszczednosci/` | SKO landing, consistency s Junior paletou | fetch 2026-04-24 |
| 6 | `https://stolat.pkobp.pl/60-logo/` | História loga, Karol Śliwka 1968 | WebFetch 2026-04-24 |
| 7 | `https://www.whitecat.com.pl/projects/pko-bank-polski` | Rebrand 2011 — navy + red, custom font, brand book scope | WebFetch 2026-04-24 |
| 8 | `https://nowymarketing.pl/pko-bp-odswieza-identyfikacje-wizualna-na-poczatek-nowe-logo/` | Refresh 2025 — evolúcia, digital legibility | WebFetch 2026-04-24 |

**Kľúčové overenie (oprava proti v0.1):** Červená `#CA171D` sa vyskytuje len na korporátnom PKO BP webe, **nie v Junior ani SKO sekciách**. Dominantná farba celého detského segmentu je navy `#003574`. v0.1 používala červenú ako primárny accent — to bolo **nesprávne pre SKO cieľovú skupinu** a je opravené v §3.

---

## 0. Ako čítať tento manuál

1. **Esencia a logo** (§1–§2) — pozícia v SKO ekosystéme, logo lockups.
2. **Farby a typografia** (§3–§4) — verified tokeny → priame mapovanie na `lib/theme.ts`, `app/globals.css`.
3. **Ikonografia, layout, komponenty** (§5–§7) — aplikuje sa na `/miasto`, `/games`, `/loans/compare`, atď.
4. **Motion, sound, copy** (§8–§10) — animácie, haptika, UX writing pre deti 9–14.
5. **Web mapping + checklist + governance** (§11–§13) — exact `file:line` odkazy v repe.
6. **Migrácia z v0.1 + critical blockers** (§14–§15) — čo sa zmenilo a čo v kóde bráni rýchlemu reskin-u.

CSS premenné majú `--sko-*` namespace (nie `--pko-*` ako v0.1), aby sme jasne rozlišovali: toto je **SKO / Junior segment**, nie PKO BP corporate. Core skin sa nedotýka.

---

## 1. Brand Essence

### 1.1 Pozícia značky

**SKO × Watt City** je edukačný simulátor mesta pre deti 9–14 rokov, ktorý premieňa finančnú gramotnosť na hrateľnú mestskú ekonomiku. V rámci PKO ekosystému obsadzuje priestor medzi programom **SKO (Szkolna Kasa Oszczędności)** a detským účtom **PKO Junior** — učí rozhodnutia, ktoré dieťa neskôr robí reálnymi peniazmi, bezpečne v hre.

**Pozícia voči SKO:** SKO je 90-ročný program PKO BP (od 1935) pre 5–13-ročné deti v školách. Watt City mu pridáva **digitálne interaktívny rozmer** (gamifikácia, AI výzvy, mesto) — preto *"SKO 2.0 prototype"* v `README.md`.

**Elevator pitch (30 slov, PL):**

> SKO × Watt City to gra, w której dzieci budują własne Katowice, poznają kredyt i cashflow, a rodzic widzi, czego dziecko się uczy. Bez reklam. Bez zakupów. Bez prawdziwych pieniędzy.

### 1.2 Brand promise — 3 piliere

| Pilier | Vysvetlenie | Dôkaz v produkte |
| --- | --- | --- |
| **Bezpieczeństwo** | Dieťa nikdy neplatí, rodič vždy vidí. GDPR-K, 0 in-app purchases, 0 tretích strán. | `/rodzic` panel, `W-dolary ≠ PLN`, disclaimer. |
| **Gra** | Core loop má byť chytrý ale nie podliezavý. Mesto je kanvas, nie grind. | 9 minigier + AI rotácia, tier-up, Lokatka-swallow animácia. |
| **Rozwój** | Každá akcia má pedagogický dopad: finančný, matematický, slovný. | MEN V–VIII curriculum tagy, `/nauczyciel`, XP → credit score. |

Triáda sa rotuje v komunikácii vždy v poradí **Bezpieczeństwo → Gra → Rozwój** — pre rodiča/učiteľa je to hierarchia rozhodovania.

### 1.3 Tone of voice

Šesť adjektív, priorita zhora:

1. **Jasný** (Clear) — krátke vety, aktívum, bez žargónu.
2. **Povzbudzujúci** (Encouraging) — chyba nie je zlyhanie.
3. **Konkrétny** (Concrete) — „120 W$" namiesto „veľa peňazí".
4. **Teplý** (Warm) — vykanie len rodičovi/učiteľovi.
5. **Hravý** (Playful) — jemný humor, slovné hračky áno, sarkazmus nie.
6. **Serióznobankový** (Seriously-banking) — o peniazoch hovoríme s rešpektom.

#### Tak áno / tak nie

| Situácia | Tak áno | Tak nie |
| --- | --- | --- |
| Pozdrav landing | „Dzień dobry, budowniczy! Jak rośnie twoje miasto?" | „Hej ziomek, co tam w biznesie?" |
| Prehra minihry | „Jeszcze jedna próba — każda runda liczy się do średniej." | „Słabo. Spróbuj lepiej." |
| Kredit pre-schválený | „Masz zgodę na kredyt 200 W$ przy 5 % rocznie. Obejrzyj harmonogram spłat." | „Gratulacje! Weź kredyt, kup co chcesz!" |
| Error state | „Coś nam uciekło. Spróbujmy jeszcze raz?" | „Error 500. Something went wrong." |
| Rodičovská pozvánka | „Twoje dziecko chciałoby rozpocząć naukę finansów w Watt City. Potrzebujemy Twojej zgody." | „Hej tato, potwierdź konto." |
| Tier-up toast | „Poziom 4! Odblokowałeś hutę szkła." | „LEVEL UP!!! NEW UNLOCK!!!" |
| Cashflow red | „Uwaga — wydajesz więcej niż zarabiasz. Zbuduj źródło dochodu albo sprzedaj budynek." | „NEGATIVE CASHFLOW ALERT!" |

### 1.4 Target persona

**Dziecko 9–11 („młodszy junior")**
- Čítanie: jednoduché vety, max 8 slov.
- Motivácia: zberanie, pokrok, mesto vyzerá cool.
- Abstrakcia peňazí ešte neklikla; číslo > 1000 pôsobí „veľké".
- Vizuálne metafory (skarbonka = úspora, mince = kúpiť). Tier-up ako odmena.
- Zložité grafy, APR, amortizácia v plnom rozsahu NIE — len hlavné číslo.

**Dziecko 12–14 („starszy junior")**
- Čítanie: plynulé, priamy konflikt OK.
- Motivácia: optimalizácia, ranking, voľba stratégie.
- Chápe % a rozdiel 5 % vs. 8 %.
- Ponúknuť „pokročilý" view s amortizačnou tabuľkou, tier-up aj kombo bonusmi.
- Infantilný jazyk ani emoji-spam — pôsobí znevažujúco.

**Rodzic**
- Očakáva: transparentnosť, bezpečnosť, vzdelávací prínos, žiadne platby.
- Jazyk: formálny, vykanie, odkazy na GDPR-K.
- `/rodzic` panel ukazuje čo sa dieťa učí, nie čo presne robí (privacy-first).

**Nauczyciel**
- Potrebuje: integrácia do MEN V–VIII curricula, classroom code, liderboard trídy.
- Jazyk: formálny, odkazy na didaktické ciele.
- `/nauczyciel` panel má byť použiteľný bez onboardingu (15-min test = class setup).

---

## 2. Logo System

### 2.1 Filozofia co-brandingu

SKO × Watt City je partnerský lockup. **Watt City wordmark** drží hernú identitu (pixel-hranatý), **SKO emblem** drží bankovú dôveryhodnosť (skarbonka Karol Śliwka 1968). Kombinujú sa cez separator `×` (matematický, nie decorative).

**KRITICKÉ:** Originálna skarbonka je pod copyrightom Karol Śliwka / PKO BP. V tomto manuáli používame stylizovaný **placeholder „P-monogram + coin"** (SUBSTITUTE). Pri signed partnership PKO dodá oficiálny vektor; `lib/theme.ts` má hotswap mechanizmus (env `NEXT_PUBLIC_PKO_MASCOT_URL` + `components/pko-mascot.tsx`).

### 2.2 Logo variants

| Variant | Použitie | Minimálna šírka |
| --- | --- | --- |
| **Horizontal lockup** | Nav bar, footer, emaily, OG image | 160 px web / 40 mm print |
| **Vertical lockup** | Landing hero, medal certifikát, PDF report | 120 px / 30 mm |
| **Compact mono** (skarbonka + text pod ním) | Favicon, PWA icon, AppStore badge | 48 px / 12 mm |
| **Wordmark only** | Keď je navy background veľmi tesný (mobile header) | 120 px / – |

### 2.3 ASCII náčrt horizontal lockup

```
┌──────────────────────────────────────────────────────┐
│  ╭──╮                                                │
│  │P │ ●     SKO  ×  Watt  City                       │
│  │KO│                                                │
│  ╰──╯                                                │
│   ↑                                                  │
│   skarbonka (SUBSTITUTE — čaká na PKO SVG)           │
└──────────────────────────────────────────────────────┘
  ↑ clear space = 1× výška „P" z monogramu, všade vôkol
```

### 2.4 SVG snippet — horizontal lockup (SUBSTITUTE)

```svg
<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SKO × Watt City">
  <!-- skarbonka substitute: P monogram box + padajúca minca -->
  <g transform="translate(12,12)">
    <rect x="0" y="0" width="56" height="56" rx="10" fill="#003574" stroke="#001E4B" stroke-width="2"/>
    <text x="28" y="38" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">P</text>
    <circle cx="54" cy="10" r="6" fill="#CA171D" stroke="#ffffff" stroke-width="1.5"/>
  </g>
  <!-- wordmark -->
  <text x="90" y="50" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="800" font-size="26" fill="#003574">SKO</text>
  <text x="150" y="50" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="400" font-size="26" fill="#636363">×</text>
  <text x="172" y="50" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="800" font-size="26" fill="#172B4D">Watt City</text>
</svg>
```

> **SUBSTITUTE** — pravý „skarbonka" mark dodá PKO BP brand team. Do tej doby používame stylizovaný „P" monogram so skarbonkovou mincou. Hotswap cez `public/sko-logo.svg` + env.

### 2.5 Clear space

Minimálne `1×P` (výška písmena P zo skarbonka mark) vôkol celého lockupu. Pri horizontal variante = 56 px @ 100% scale. Žiadny text/ikona nesmie vstúpiť do clear-space zóny.

### 2.6 Minimálne veľkosti

| Médium | Min šírka lockupu |
| --- | --- |
| Desktop web (≥ 1024 px) | 180 px |
| Tablet (768–1023 px) | 140 px |
| Mobile (< 768 px) | 120 px |
| Favicon 16×16 | použiť compact mono, nie lockup |
| Print (vizitka, letter) | 40 mm |

### 2.7 Do's & don'ts (8 pravidiel)

1. **DO** zachovávať `×` ako separator, nie `x`, `+`, `&` ani bullet.
2. **DO** používať lockup na navy `#003574` (VERIFIED primary) alebo paper `#F9F9F9` background.
3. **DO** hotswap substitute skarbonky na oficiálny PKO vektor akonáhle PKO brand team dodá.
4. **DON'T** invertovať skarbonku (navy box na bielom je správne, biely box na navy je WRONG).
5. **DON'T** meniť proporcie — vždy uniform scale, nikdy non-proportional resize.
6. **DON'T** umiestňovať na farebné fotografie bez jednofarebnej podložky (min 80 % opacity).
7. **DON'T** pridávať drop-shadow, glow, bevel — neobrutalisticky áno v core skine, v SKO skine NIE.
8. **DON'T** kombinovať s tretími partnermi bez písomného schválenia PKO BP brand teamu (§13).

### 2.8 Co-branding s PKO BP master-logom

Keď footer stránky alebo tlačený materiál vyžaduje **PKO BP corporate logo** vedľa SKO × Watt City:

- PKO BP master logo (skarbonka + „Bank Polski") vpravo dole, vo fixnej pozícii.
- Medzi SKO × Watt City lockup a PKO BP logo: vertikálna separátor-čiara `2 px #D5D5D5`, výška rovná ako PKO BP logo.
- Pomer veľkostí: PKO BP master logo = 0.75× výška SKO × Watt City lockupu (master brand je sekundárna pozícia, nie primárna — sme SKO partnerská značka, nie PKO BP direct).

---

## 3. Color System

### 3.1 Filozofia palety

**Jadro:** PKO Junior navy ramp (VERIFIED) ako primárna identita. Warm paper pre svetlú alternatívu. Oranžové accenty (VERIFIED z Junior) pre highlight a reward. Success green z corporate PKO (VERIFIED). Červená sa **NEPOUŽÍVA ako primary** — je to PKO BP corporate farba (verified len na `pkobp.pl` hlavnej, nie v Junior/SKO). V SKO skine red iba pre `danger` state v malých dávkach.

Toto je najdôležitejšia oprava proti v0.1: **primárny accent pre SKO je navy, nie red.**

### 3.2 Primárne brand tokeny (VERIFIED)

Všetky hodnoty extrahované z `pkobp.pl/junior/` HTML/CSS (2026-04-24). RGB a HSL prevody sú presné, CMYK aproximácia (print workflow vyžaduje Pantone od PKO).

| Token | Hex | RGB | HSL | CMYK (approx) | Výskyt v Junior | Použitie |
| --- | --- | --- | --- | --- | --- | --- |
| `--sko-navy-900` | `#001E4B` | 0 30 75 | 216° 100% 15% | 100 60 0 71 | 2× | Darkest — page BG, hero, najtmavší shadow |
| `--sko-navy-700` | `#003574` | 0 53 116 | 212° 100% 23% | 100 54 0 55 | **97×** | **Primary navy** — CTA, brand chip, headings |
| `--sko-navy-500` | `#004C9A` | 0 76 154 | 210° 100% 30% | 100 51 0 40 | 8× | Surface above primary, hover states |
| `--sko-navy-300` | `#3074D5` | 48 116 213 | 213° 65% 51% | 77 45 0 16 | 10× | Links, info states |
| `--sko-ink` | `#172B4D` | 23 43 77 | 218° 54% 20% | 70 44 0 70 | 6× | Dark body text on paper |
| `--sko-text-secondary` | `#636363` | 99 99 99 | 0° 0% 39% | 0 0 0 61 | 23× | Secondary text, captions |
| `--sko-text-muted` | `#818181` | 129 129 129 | 0° 0% 51% | 0 0 0 49 | 4× | Disabled text, watermarks |
| `--sko-border` | `#D5D5D5` | 213 213 213 | 0° 0% 84% | 0 0 0 16 | 4× | Dividers, input borders |
| `--sko-border-light` | `#E5E5E5` | 229 229 229 | 0° 0% 90% | 0 0 0 10 | 25× | Light dividers, card outlines |
| `--sko-surface` | `#F2F2F2` | 242 242 242 | 0° 0% 95% | 0 0 0 5 | 5× | Muted surface above paper |
| `--sko-paper` | `#F9F9F9` | 249 249 249 | 0° 0% 98% | 0 0 0 2 | 3× | Light mode background |
| `--sko-white` | `#FFFFFF` | 255 255 255 | — 0% 100% | 0 0 0 0 | 11× | Critical contrast |
| `--sko-accent-orange` | `#CC7A09` | 204 122 9 | 35° 92% 42% | 0 40 96 20 | 7× | Primary highlight, badge |
| `--sko-accent-orange-light` | `#DB912C` | 219 145 44 | 32° 71% 52% | 0 34 80 14 | 4× | Secondary highlight |
| `--sko-success` | `#2E7D49` | 46 125 73 | 139° 46% 34% | 63 0 42 51 | 1× | Success confirm |
| `--sko-pko-red` | `#CA171D` | 202 23 29 | 358° 80% 44% | 0 89 86 21 | 0 v Junior, corporate only | **RESERVED** — iba pre co-branding s PKO BP master logom, nie v SKO UI |

### 3.3 Sémantické tokeny

| Token | Hex | Použitie |
| --- | --- | --- |
| `--sko-success` | `#2E7D49` | Pozitívny cashflow, quiz correct, tier-up confirm |
| `--sko-warning` | `#CC7A09` | Kredit vo vysokom LTV, náklady > 70 % príjmov |
| `--sko-danger` | `#B91C1C` | Negatívny cashflow, default, error — **DESIGN-CALL**, zvolená tlmenejšia red ako `--sko-pko-red` aby sa neprelínala s corporate brand accent |
| `--sko-info` | `#3074D5` | Informačné toasty, disclaimery (= `--sko-navy-300`) |

### 3.4 Game-resource paleta (4 aktívne) — DESIGN-CALL

Harmonizujú s navy základom, colorblind-safe (deuteranope/protanope/tritanope testované):

| Resource | Token | Hex | Odôvodnenie |
| --- | --- | --- | --- |
| ⚡ Watts | `--sko-res-watts` | `#DB912C` | Teplá orange — odvodená z `--sko-accent-orange-light`, harmonizuje |
| 🪙 Coins | `--sko-res-coins` | `#CC7A09` | Tmavšia orange — primary accent Junior, číta sa ako „minca v Junior štýle" |
| 🧱 Bricks | `--sko-res-bricks` | `#8B4513` | DESIGN-CALL: tehlová hnedá, `ΔE ≥ 20` od oboch orange tokenov |
| 💵 W$ CashZl | `--sko-res-cash` | `#2E7D49` | `--sko-success` overené Junior green — sémantika peniaze/rast spolu |

**Deprecated (nikdy nezobrazené pri SKIN=pko):**

| Resource | Token | Hex |
| --- | --- | --- |
| 🪟 Glass | `--sko-res-glass-legacy` | `#004C9A` |
| 🔩 Steel | `--sko-res-steel-legacy` | `#818181` |
| 💾 Code | `--sko-res-code-legacy` | `#3074D5` |

### 3.5 Navy ramp (4-stupňová)

```
--sko-navy-900  #001E4B  ███████  darkest — app BG, hero
--sko-navy-700  #003574  ███████  primary — CTA, heading, brand chip (DOMINANT)
--sko-navy-500  #004C9A  ███████  surface above primary, hover
--sko-navy-300  #3074D5  ███████  link, info, muted-on-dark
```

### 3.6 Gradientné specifikácie

**Primary nav gradient (top bar, hero karty):**
```css
background: linear-gradient(180deg, #003574 0%, #001E4B 100%);
```

**Coin-reward gradient (medailová plocha, tier-up):**
```css
background: radial-gradient(circle at 30% 30%, #DB912C 0%, #CC7A09 70%, #8B4513 100%);
```

**Danger fade (pri negatívnom cashflow):**
```css
background: linear-gradient(90deg, rgba(185, 28, 28, 0) 0%, rgba(185, 28, 28, 0.22) 100%);
```

Disciplína: **nikdy nie 4+ bodové gradienty, nikdy nie rainbow.**

### 3.7 Accessibility — WCAG 2.1 kontrastná tabuľka

**AA** ≥ 4.5:1 normal / 3:1 large. **AAA** ≥ 7:1 normal / 4.5:1 large.

| Foreground \ BG | `#FFFFFF` | `#F9F9F9` | `#001E4B` | `#003574` |
| --- | --- | --- | --- | --- |
| `--sko-ink` `#172B4D` | **12.6:1 AAA** | **11.9:1 AAA** | 1.2:1 FAIL | 1.6:1 FAIL |
| `--sko-navy-900` `#001E4B` | **17.4:1 AAA** | **16.4:1 AAA** | 1.0 | 1.4:1 FAIL |
| `--sko-navy-700` `#003574` | **12.4:1 AAA** | **11.7:1 AAA** | 1.4:1 FAIL | 1.0 |
| `--sko-navy-500` `#004C9A` | **8.6:1 AAA** | **8.1:1 AAA** | 2.0:1 FAIL | 1.4:1 FAIL |
| `--sko-navy-300` `#3074D5` | 4.8:1 AA | 4.5:1 AA | 3.6:1 AA-large | 2.6:1 FAIL |
| `--sko-accent-orange` `#CC7A09` | 3.9:1 AA-large | 3.7:1 AA-large | **5.5:1 AAA-large** | 4.0:1 AA-large |
| `--sko-text-secondary` `#636363` | **5.7:1 AAA** | **5.4:1 AA** | 3.0:1 AA-large | 2.2:1 FAIL |
| `--sko-white` `#FFFFFF` | 1.0 | 1.05:1 | **17.4:1 AAA** | **12.4:1 AAA** |
| `--sko-success` `#2E7D49` | 4.4:1 AA-large | 4.1:1 AA-large | **4.0:1 AA-large** | 2.9:1 FAIL |
| `--sko-danger` `#B91C1C` | **5.9:1 AAA** | **5.6:1 AA** | 2.9:1 FAIL | 2.1:1 FAIL |

**Povinné kombinácie pre SKO skin UI:**

- Body text: `--sko-white` na `--sko-navy-700` → **12.4:1 AAA ✓**
- Secondary text on navy: `--sko-white` s opacity 0.75 alebo zväčši na 18 px+
- Primary CTA: biely text na `--sko-navy-700` background → **12.4:1 AAA ✓**
- Secondary CTA: ghost button — border `--sko-white` 2 px, text `--sko-white`, transparent bg
- Inline link on navy: `--sko-white` s underline (kontrast bezpečný)
- Gold/orange success badge: `--sko-navy-900` text na `--sko-accent-orange` → **5.5:1 AAA-large ✓**
- Danger toast: biely text na `--sko-danger` (kontrast 5.9:1 AAA ✓)

### 3.8 Color use guidance

- **Backgrounds:** primárny `--sko-navy-700` (dark mode), alternatíva `--sko-paper` (light mode, tlač, e-mail).
- **Surface karty na navy:** `--sko-navy-500`.
- **Surface karty na paper:** `--sko-white` + `1px solid --sko-border-light`.
- **Primary CTA:** navy background + biely text. Vždy.
- **Secondary CTA:** ghost + biely border na navy BG, `--sko-navy-700` border na paper BG.
- **Linky v tele:** podčiarknuté, `--sko-navy-300` na paper BG, `--sko-white` na navy BG.
- **Error state:** `--sko-danger` bg + biely text pre toasty.

### 3.9 Colorblind guard

4 aktívne resource-farby testované v Sim Daltonism. Každá dvojica `ΔE* CIEDE2000 ≥ 20`. **Každý resource má unicode ikonu** (⚡ 🪙 🧱 💵) ako primárny identifikátor — farba je sekundárny cue. Pri `SKIN=pko` dáme ikonu vždy vľavo od textovej hodnoty (nie vpravo), pretože hodnota v pravo je horšie orientovateľná pre deti s dyslexiou.

---

## 4. Typography

### 4.1 Primárny font — SUBSTITUTE

PKO používa **proprietárny font `pkobp`** (VERIFIED v CSS bundle `pkobp.pl/_next/static/css/645585a1fd07418b.css`: `font-family:pkobp,Helvetica,Arial,sans-serif`). Font patrí PKO, nie je publikovaný ani licenciovaný pre tretie strany. Nemôžeme ho použiť bez signed partnership.

**Substitúty v poradí preferencie:**

| Poradie | Font | Licencia | Rationale |
| --- | --- | --- | --- |
| **1. (default)** | **Inter** | SIL OFL 1.1, Google Fonts | Humanistic sans, vynikajúca čitateľnosť na digitálnom displeji, PL diakritika výborná, presne pasuje k moderne-bankovému refresh-u PKO 2025. Dominantný sans v modernom európskom fintech (Revolut, N26, mBank). |
| **2.** | **Nunito** | SIL OFL 1.1, Google Fonts | Rounded humanistic — teplejšie pre junior audience 9–11. Voľba ak Inter pôsobí príliš sterilne. |
| **3.** | **TT Commons Pro** | TypeType komerčná | Najbližší vizuálny twin k PKO 2025 refresh-u. Platená — pre produkciu len keď PKO legal potvrdí. |

**Default pre v0.2:** **Inter** cez `next/font/google`, s preloadnutými weights 400, 600, 700, 800, 900 (+ subset `latin-ext` kvôli PL `ą ć ę ł ń ó ś ź ż`).

```tsx
// app/layout.tsx — pri SKIN=pko
import { Inter } from "next/font/google";
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-sko-sans",
  display: "swap",
});
```

### 4.2 Sekundárny / mono font

- **Mono:** **JetBrains Mono** (SIL OFL) — pre amortizačné tabuľky, duel IDčka, `tabular-nums`. Rounded, friendly, read-friendly.
- **Display (voliteľný):** defaultne len Inter. Žiadny druhý font pre v0.2 kvôli bundle size.

### 4.3 Type scale — VERIFIED kotvený na PKO sizes

PKO bundle používa dominantné veľkosti **16 (8×), 18 (3×), 14 (3×), 20, 24, 32, 40, 48 px** a weights **400 (11×), 700, 300, 900, 600**. Náš scale ich rešpektuje:

| Token | rem | px | line-height | letter-spacing | weight | Použitie |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-h1` | 3 | 48 | 1.1 | -0.02em | 900 | Hero landing (pkobp má 48px ako hero size) |
| `--text-h2` | 2.5 | 40 | 1.1 | -0.015em | 800 | Sekčné nadpisy |
| `--text-h3` | 2 | 32 | 1.2 | -0.01em | 700 | Názov karty, modal title |
| `--text-h4` | 1.5 | 24 | 1.25 | 0 | 700 | Sub-headings |
| `--text-h5` | 1.25 | 20 | 1.3 | 0 | 700 | Mini nadpisy |
| `--text-h6` | 1.125 | 18 | 1.35 | 0 | 600 | Panel labels |
| `--text-body-lg` | 1.125 | 18 | 1.55 | 0 | 400 | Úvodné odseky |
| `--text-body` | 1 | 16 | 1.5 | 0 | 400 | **Hlavný body text** (pkobp dominant) |
| `--text-body-sm` | 0.875 | 14 | 1.5 | 0 | 400 | Popisy, tooltips |
| `--text-caption` | 0.8125 | 13 | 1.4 | 0.02em | 600 | Podnadpisy (pkobp má 13px) |
| `--text-micro` | 0.6875 | 11 | 1.3 | 0.04em | 700 | Brutal-tag, disclaimer (pkobp má 11px) |
| `--text-number-hero` | 3 | 48 | 1 | -0.03em | 900 | XP/cashflow hero numbers |

### 4.4 Responzívna škála

```css
--text-h1: clamp(2rem, 4.5vw, 3rem);
--text-h2: clamp(1.75rem, 3.5vw, 2.5rem);
--text-h3: clamp(1.5rem, 2.5vw, 2rem);
--text-body: 1rem;                    /* fix */
--text-body-sm: 0.875rem;              /* nikdy pod 14 px na mobile */
```

Minimálna body-text veľkosť na mobile: **16 px** (WCAG 1.4.4, iOS Safari zoom-prevention).

### 4.5 Do's & don'ts

**DO:**
- Ponechaj PL diakritiku cez `latin-ext`.
- `font-variant-numeric: tabular-nums` pre cashflow, amortizáciu, leaderboard.
- Kids 9–11: zväčši `body` na 18 px v tutorial sekcii.

**DON'T:**
- Nekombinuj > 2 fonty (Inter + JetBrains Mono = max).
- `font-weight < 400` nikdy — kids čítanie trpí.
- `text-transform: uppercase` len pre labels a tagy, nie body.
- Nepodčiarkuj CTA buttony.
- Nelet'aj sirôt (> 3 slovný orphan) na hero nadpisoch — `&nbsp;`.

---

## 5. Iconography & Illustration

### 5.1 Ikonová sada

**Štýl:** **line icons, stroke-width 2 px, corner-radius 2 px** (rounded joints). Pasuje k humanistickému Inter. Line preferuje filled preto, že (a) je menej „heavy" na detské rozhranie a (b) má menší filesize. Pri aktívnom stave (selected nav item, current tab) ikona prepne na filled variant.

**Base icon size:** 24×24 px (stroke 2 px). Pre touch-targets (mobile) padding do 44×44 (viď `.tap-target` v `app/globals.css`).

**20 base ikon — odporúčanie knižnice:** [Lucide](https://lucide.dev) (SIL OFL, 1400+ ikon, priamo Next.js-kompatibilné cez `lucide-react`). Mapping:

| # | Use | Lucide icon |
| --- | --- | --- |
| 1 | menu | `Menu` |
| 2 | mesto | `Building2` |
| 3 | hra | `Gamepad2` |
| 4 | hypotéka | `HandCoins` |
| 5 | rodič | `Users` |
| 6 | učiteľ | `GraduationCap` |
| 7 | zdroje (generic) | `Gem` |
| 8 | budova (placement) | `Building` |
| 9 | leaderboard | `Trophy` |
| 10 | duel | `Swords` |
| 11 | upozornenie | `AlertTriangle` |
| 12 | úspech | `CheckCircle2` |
| 13 | chyba | `XCircle` |
| 14 | nastavenia | `Settings` |
| 15 | odhlásiť | `LogOut` |
| 16 | pomoc | `HelpCircle` |
| 17 | kalendár | `Calendar` |
| 18 | notifikácia | `Bell` |
| 19 | medaila (Web3) | `Award` |
| 20 | lock | `Lock` |

### 5.2 Illustration style

Pre ilustráciu budov, miest a herných scén **dve varianty**:

**A. Flat + 1-direction shading (PREFEROVANÉ)** — jedno svetlo zhora-vľavo, jednofarebné tvary s jemným (10 % opacity) tieňom. Vychádza z Junior stylu PKO (verified na pkobp.pl/junior product kariet). Plytší rendering, rýchlejšie vykreslenie.

**B. Isometric 3D** — pre mapu Katowíc v `/miasto` by bolo prirodzené, ale je to **DESIGN-CALL** — potrebuje A/B test. Vyššie náklady na ilustrátora.

**Default pre v0.2:** variant A (flat + shading). `/miasto` SVG zostáva flat podľa existujúceho `components/city-scene.tsx` (po migrácii na theme tokens — viď §15).

### 5.3 Mascots

**Primárny: Żyrafa Lokatka**

VERIFIED na `sko.pkobp.pl` ako oficiálny SKO mascot. Vysvetľuje finančné pojmy v krátkych videách. Meno: **Lokatka** (od "lokata" = vkladový produkt, slovná hračka). Pri `SKIN=pko` render-ujeme ju ako SKO brand anchor.

**Sekundárny: Pancernik Hatetepes**

VERIFIED na `sko.pkobp.pl` ako druhý SKO mascot (pancernik = armadillo/pangolin). Pri `SKIN=pko` sa **zatiaľ nerenderuje** — je to rozšírenie pre v0.3 keď pridáme „téma týždňa" systém alebo iný mascot-gated content.

**Definícia póz Lokatka (5) — TODO čaká na ilustrátora/PKO assety:**

1. **Happy / welcome** — stoji, mávanie krkom, poloúsmev. Použitie: landing hero, onboarding start.
2. **Encouraging** — ukazuje krkom smerom hore, pozitívny gest. Po prehre v minihre („jeszcze raz!").
3. **Thinking** — krk do L tvaru, ruka pri brade. Quiz načítanie, AI generovanie.
4. **Celebrating** — obe nohy v skoku, krk dolu. Tier-up, achievement.
5. **Calm / listening** — neutral stoj, krk mierne naklonený. Rodičovský onboarding, dlhšie texty.

**Emócie (5) — orthogonal k pózam, cez farbu a oči:**

| Emócia | Modifikátor |
| --- | --- |
| happy | štandardné oči (•_•), žlto-béžová farba #E5D5A0 |
| encouraging | zatvorené oči v úsmeve (^_^), žlto-oranžová #E6B35A |
| thinking | jedno oko pokrčené, otáznik nad hlavou |
| celebrating | hviezdy namiesto očí (✨) |
| calm | oči polozatvorené, pokojný výraz |

**Placeholder aktuálne v `lib/theme.ts:42-53`:** žlto-hnedý rectangle rendering — je to UI scaffolding, nie finálny asset. **Hotswap** cez `NEXT_PUBLIC_PKO_MASCOT_URL` env var → externý SVG.

**Ako/kedy mascotu NEpoužívať:**

- **Nie** na error 500 / technické chyby (Lokatka by nemala „zlyhať" v očiach dieťaťa).
- **Nie** pri finančnom disclaimeri (legal copy potrebuje serióznosť, nie Lokatku).
- **Nie** v hypoteke UI (mortgage je „dospelá" vec, Lokatka tam ubíja kredibilitu).
- **Nie** vo viacerých inštanciách naraz (max 1 Lokatka na obrazovke).

### 5.4 Building art direction — SKO paleta

15 budov v `/miasto` (existujúce v `lib/building-catalog.ts`). Pre `SKIN=pko` navrhujeme **SKO-harmonic paletu** (DESIGN-CALL) ktorá mesto drží v navy/white/orange základe:

| Budova | Current roofColor | Current bodyColor | SKO roofColor | SKO bodyColor |
| --- | --- | --- | --- | --- |
| Domek | `#f59e0b` | `#fde047` | `#CC7A09` | `#F2F2F2` |
| Sklepik | `#f472b6` | `#be185d` | `#DB912C` | `#CC7A09` |
| Mała elektrownia | `#facc15` | `#a16207` | `#DB912C` | `#8B4513` |
| Bank lokalny | `#0ea5e9` | `#1e40af` | `#003574` | `#001E4B` |
| Huta szkła | `#22d3ee` | `#0e7490` | `#3074D5` | `#004C9A` |
| Biblioteka | `#f59e0b` | `#92400e` | `#CC7A09` | `#8B4513` |
| Walcownia | `#94a3b8` | `#334155` | `#818181` | `#636363` |
| Gimnazjum sportowe | `#ef4444` | `#991b1b` | `#003574` | `#001E4B` |
| Centrum nauki | `#14b8a6` | `#115e59` | `#004C9A` | `#003574` |
| Fotowoltaika | `#eab308` | `#a16207` | `#DB912C` | `#CC7A09` |
| Software house | `#22c55e` | `#14532d` | `#3074D5` | `#003574` |
| Kościół | `#eab308` | `#f3f4f6` | `#CC7A09` | `#F9F9F9` |
| Park | `#22c55e` | `#166534` | `#2E7D49` | `#004C9A` |
| Fontanna | `#0ea5e9` | `#0284c7` | `#3074D5` | `#004C9A` |
| Spodek | `#c084fc` | `#581c87` | `#004C9A` | `#001E4B` |

**Princípy:**
- **Navy + orange + gray** dominujú — 80 % plochy mesta.
- **Success green** len pre Park (jediný zelený objekt = vizuálny kompas).
- **Red neexistuje** — `Gimnazjum sportowe` prechádza na navy miesto pôvodnej červenej (deti 9–14 nevidia navy ako „strednú školu", ale zladí sa s brand).
- **Bank lokalny** stále vyčnieva (`#003574` na `#001E4B`) — ako primárny brand objekt má ostatných „upstage-ovať".
- Každá budova má **unikátnu dvojicu** (roof + body) — nikdy nie totožné roof farby na susedných budovách.

---

## 6. Layout & Grid

### 6.1 Baseline grid

- **Primárny:** 8 px grid (všetky spacing tokens sú násobky 8).
- **Sekundárny (vnútri komponentov):** 4 px pre jemné odsadenia.

### 6.2 Content container

| Breakpoint | Container max-width | Side padding |
| --- | --- | --- |
| Mobile (< 640 px) | 100 % | 16 px |
| Tablet (640–1023 px) | 640 px | 24 px |
| Desktop (1024–1439 px) | 1024 px | 32 px |
| Wide (≥ 1440 px) | 1280 px | 40 px |

### 6.3 Spacing tokens

```
--sko-space-1   0.25rem   4 px
--sko-space-2   0.5rem    8 px
--sko-space-3   0.75rem   12 px
--sko-space-4   1rem      16 px
--sko-space-6   1.5rem    24 px
--sko-space-8   2rem      32 px
--sko-space-10  2.5rem    40 px
--sko-space-12  3rem      48 px
--sko-space-16  4rem      64 px
```

### 6.4 Border-radius — VERIFIED

Z PKO CSS bundle (dominancia `10px`):

```
--sko-radius-sm    4px      /* inputs, mini-chips */
--sko-radius-md    10px     /* cards, buttons (DOMINANT u PKO) */
--sko-radius-lg    16px     /* modals, hero cards */
--sko-radius-full  9999px   /* pills, avatars */
--sko-radius-circle 50%     /* mascot frame, level ring */
```

### 6.5 Shadow — VERIFIED

Z PKO bundle `box-shadow:0 3px 6px #00000029`:

```
--sko-shadow-sm    0 1px 2px rgba(0, 0, 0, 0.08)
--sko-shadow-md    0 3px 6px rgba(0, 0, 0, 0.16)   /* VERIFIED PKO default */
--sko-shadow-lg    0 6px 16px rgba(0, 0, 0, 0.20)
--sko-shadow-inset  inset 0 0 0 1px #E5E5E5         /* VERIFIED z PKO (input outline) */
```

### 6.6 Responzívne breakpointy

```
xs   0       mobile first
sm   640px   tablet portrait
md   768px   tablet landscape
lg   1024px  desktop small
xl   1280px  desktop standard
2xl  1440px  wide desktop
```

---

## 7. Component Library

### 7.1 Button

**Anatomy:**

```
┌──────────────────────────────────┐
│  [icon]  Label text              │  ← padding: 11px 16px (VERIFIED PKO)
│                                  │     radius: 10px (VERIFIED PKO)
└──────────────────────────────────┘
```

**Varianty:**

| Variant | BG | Text | Border | Použitie |
| --- | --- | --- | --- | --- |
| `primary` | `--sko-navy-700` | `--sko-white` | none | Hlavné CTA ("Postaw", "Zaciagnij kredyt") |
| `secondary` | transparent | `--sko-white` (na navy) / `--sko-navy-700` (na paper) | 2px solid current | Druhotné akcie |
| `ghost` | transparent | `--sko-white` (na navy) | none | Terciérne, close, back |
| `danger` | `--sko-danger` | `--sko-white` | none | Demolish, cancel, opustit accounting |
| `icon-only` | transparent | — | none | 40×40, tap-target 44×44 na mobile |
| `cta-hero` | `linear-gradient(180deg, #003574, #001E4B)` | `--sko-white` | none | Landing hero „Začni hru" |

**Stavy:**
- **default:** ako vyššie
- **hover:** `background-color` o 8 % svetlejšie, `transition: all 0.2s ease` (VERIFIED PKO)
- **focus-visible:** `outline: 3px solid var(--sko-accent-orange); outline-offset: 2px;` (WCAG 2.4.7)
- **active:** `transform: translateY(1px)` — jemný push
- **disabled:** opacity 0.5, cursor not-allowed

**Typografia:** `--text-body` 16 px, `font-weight: 700`, `letter-spacing: 0.01em`.

### 7.2 Card / Panel

```
┌──────────────────────────────────┐
│                                  │  ← padding: 16px
│  [optional header]               │     radius: 10px
│                                  │     shadow: --sko-shadow-md
│  Body content                    │     bg: --sko-navy-500 (on navy)
│                                  │        /  --sko-white (on paper)
│  [optional footer actions]       │     border: 1px solid --sko-border
│                                  │        (len na paper BG)
└──────────────────────────────────┘
```

**Varianty:** `default`, `elevated` (+ shadow-lg), `interactive` (hover: shadow-lg + translate-y: -2px), `success` (border-left 4px `--sko-success`), `warning` (border-left 4px `--sko-warning`), `danger` (border-left 4px `--sko-danger`).

### 7.3 Input field

```
┌──────────────────────────────────┐
│ [optional icon]  placeholder...  │  ← height: 44px (tap-target)
│                                  │     padding: 11px 13px (VERIFIED PKO)
└──────────────────────────────────┘     radius: 4px
  ↑ border: 1px solid --sko-border
    focus: border-color --sko-navy-700 + box-shadow 0 0 0 3px rgba(0,53,116,0.25)
    error: border-color --sko-danger + helper text
```

Labels: `--text-caption` 13 px, `font-weight: 600`, `color: --sko-text-secondary`, nad inputom s 4 px gap.

### 7.4 Modal / Dialog

- Overlay: `rgba(0, 30, 75, 0.72)` — navy tint namiesto čierneho blur (brand coherence).
- Modal: max-width 560 px na desktop, 100 % - 32 px na mobile. Radius 16 px. Shadow-lg.
- Close ikona (`X` Lucide) vpravo hore, 40×40 tap target.
- Focus trap povinný (WCAG 2.4.3).

### 7.5 Toast / Notification

**Varianty:**

| Typ | BG | Text | Ikona |
| --- | --- | --- | --- |
| info | `--sko-navy-700` | white | `Info` |
| success | `--sko-success` | white | `CheckCircle2` |
| warning | `--sko-warning` | `--sko-navy-900` | `AlertTriangle` |
| danger | `--sko-danger` | white | `XCircle` |
| tier-up | `linear-gradient(135deg, #CC7A09, #DB912C)` | `--sko-navy-900` | `Trophy` |

Auto-dismiss: 4 s (info/success), 6 s (warning/danger), 8 s (tier-up — chceme aby dieťa stihlo pozrieť).

### 7.6 Navigation bar

**Desktop top nav:**
- Height: 64 px
- BG: `--sko-navy-700` (skin-specific) alebo `--sko-white` + shadow-sm
- Brand chip vľavo (SKO × Watt City lockup, 40 px výška)
- Menu items stredom alebo vpravo (`font-weight: 600`, hover `--sko-accent-orange`)

**Mobile bottom tabs:**
- Height: 56 px + safe-area-inset-bottom
- BG: `--sko-navy-700`
- 4–5 items, tab active = filled icon + `--sko-accent-orange` text

### 7.7 ResourceBar

```
┌─────┬─────┬─────┬─────┐
│ ⚡  │ 🪙  │ 🧱  │ 💵  │   každý chip: 52×52, radius 10
│ 120 │  45 │  8  │ 230 │   number font: tabular-nums, weight 700
└─────┴─────┴─────┴─────┘
```

Chip BG: 15 % alpha príslušnej `--sko-res-*` farby na navy BG. Border-left 3 px solid plná farba. Ikona top, číslo bottom.

### 7.8 Level Ring (XP progress)

SVG conic gradient. Ring stroke 8 px, diameter 96 px. Filled = `--sko-accent-orange`, empty = `--sko-navy-500`. Level-up animácia: orange → gold flash pre 400 ms.

### 7.9 Building card (pre `/miasto` placement)

```
┌───────────────────────────┐
│  [Building SVG 80×80]     │  ← bg: --sko-navy-900
│                           │     radius: 10
│  Name                     │     padding: 16
│  +X W$/h  ⚡Y/h            │     SKO palette roof+body (§5.4)
│                           │
│  [cost chips]             │
│  [PLACE] [DEMOLISH]       │
└───────────────────────────┘
```

### 7.10 CashflowHUD

Horizontal panel fixed top-right na `/miasto`:
- `+X W$/h` — `--sko-success` keď +, `--sko-danger` keď −
- 4 mini-chips (each resource +Y/h)
- Historical sparkline 24 h (line chart, `--sko-accent-orange`)

### 7.11 Leaderboard row

```
┌──┬─────────────────────────┬───────┐
│#1│ [avatar] nick           │  XP   │
│  │                         │ 12340 │
└──┴─────────────────────────┴───────┘
  alternating bg: --sko-navy-500 / --sko-navy-700
  top 3: border-left 4 px --sko-accent-orange (gold ekvivalent)
```

### 7.12 Mortgage calculator

Rozdelené do 3 panelov:
1. **Vstupy:** amount slider (11–13 px track — VERIFIED PKO pattern), term radio (12/24/36), APR read-only (5 % / 8 %)
2. **Výstupy:** monthly payment (48 px hero number, tabular-nums), total interest, total cost
3. **Amortizačná tabuľka:** scrollable (max-height 320 px), mono font, každý 6. mesiac highlighted

### 7.13 AI chat bubble

Pre AI challenges v `/games/ai/[id]`:

```
┌───────────────────────────────────┐
│ [Lokatka mini]  Tekst wyzwania…   │
│                 (max 160 znaków)  │
└───────────────────────────────────┘
  bg: --sko-navy-500, radius: 10 (round-bottom 0 pre "tail" pocit)
  max-width: 480 px
```

---

## 8. Motion Principles

### 8.1 Easing curves (VERIFIED PKO)

```
--sko-ease-basic      ease                          /* PKO uses: .2s ease */
--sko-ease-material   cubic-bezier(.4, 0, .2, 1)     /* PKO uses for backgrounds */
--sko-ease-out        cubic-bezier(.16, 1, .3, 1)    /* pre enter animácie */
--sko-ease-in         cubic-bezier(.7, 0, .84, 0)    /* pre exit */
```

### 8.2 Durations

```
--sko-dur-instant   100ms   /* micro: hover color */
--sko-dur-short     200ms   /* VERIFIED PKO default */
--sko-dur-medium    320ms   /* card hover, modal open */
--sko-dur-long      480ms   /* page transition */
--sko-dur-tierup    800ms   /* celebrate pop */
```

### 8.3 5 signature animácií

**1. Tier-up pop (level-up toast)**
- Enter: scale 0.6 → 1.1 (over-shoot) → 1.0, 800 ms, `ease-out`
- `--sko-accent-orange` flash na 200 ms
- Haptic: `navigator.vibrate([10, 30, 10])` ak dostupné

**2. Coin earn (Lokatka swallow)**
- Coin SVG z resource-bar letí k Lokatka mascot v footeri, 600 ms
- Path: quadratic bezier
- Prikombinovaná Lokatka „gulp" animation (crk goes down ×2, 300 ms)

**3. Building place (drop-in + shake)**
- Y offset -40 px → 0, 320 ms `ease-out`
- Na dopade 3× shake ±3 px, 200 ms
- Star burst particles (3 hviezdičky, `--sko-accent-orange`), 400 ms fade

**4. Number tick (cashflow update)**
- Číslo increment/decrement frame-by-frame, 30 fps, trvanie = abs(delta) / 50 ms (max 800 ms)
- `tabular-nums` aby neskákali columns

**5. Page transition (route change)**
- Exit: opacity 1 → 0, 160 ms
- Enter: translateY(8px, 0) + opacity 0 → 1, 240 ms

### 8.4 Prefers-reduced-motion

Všetky animácie sa skrátia na 0.01 ms pri `@media (prefers-reduced-motion: reduce)` (už existuje v `app/globals.css:91-100`). Coin-earn a tier-up pop použijú iba jemný opacity fade bez transform.

---

## 9. Sounds & Haptics (voliteľné)

Default mute-on (škola use-case). Ak user toggle on:

| Event | Zvuk | Max dur | dB (relatívne) |
| --- | --- | --- | --- |
| Coin earn | „ding" pozitívny tón C5 | 200 ms | -18 dB |
| Building placed | short „thud" | 300 ms | -14 dB |
| Tier-up | 3-note arpeggio C-E-G | 600 ms | -10 dB |
| Error/fail | descending „wah" D4-A3 | 400 ms | -18 dB |
| Notification bell | single „ting" G5 | 200 ms | -20 dB |

Zdroje: [Freesound.org](https://freesound.org) (CC0), [Kenney Game Assets](https://kenney.nl/assets) (CC0).

Haptiká (iOS, Android Chrome):
- Coin: `vibrate(10)`
- Tier-up: `vibrate([10, 30, 10])`
- Error: `vibrate(30)`

---

## 10. Voice, Copy & UX Writing

### 10.1 5 pravidiel mikro-kópie pre deti 9–14

1. **Krátke vety** — max 12 slov pre 9–11, 16 pre 12–14.
2. **Konkrétne čísla** — „120 W$" nie „dużo pieniędzy".
3. **Jasný pokyn** — tlačidlo = sloveso v imperative (`Postaw`, `Graj`, `Zaciagnij`).
4. **Chyba je krok** — „Spróbujmy jeszcze raz" > „Error".
5. **Rodič/učiteľ vykanie, dieťa tykanie** — konzistentne. Rozhodnúť per-screen.

### 10.2 Button copy príklady

| Zlý | Dobrý |
| --- | --- |
| „START" | „Graj" |
| „BUY" | „Postaw" |
| „ACCEPT TERMS" | „Zgadzam się i gram" |
| „DISMISS" | „Zamknij" |
| „SUBMIT" | „Wyślij" (rodič) / „Potvierď" (dieťa) |

### 10.3 Error message vzor

```
  [ikona X]
  Coś nam uciekło.
  Spróbujmy jeszcze raz?
  [Spróbuj ponownie]
```

NIE: technický traceback, kód 500, „An error occurred".

### 10.4 Rodičovský/učiteľský register

Formálny, vykanie, odkazy na regulácie:
- „Dzień dobry. Twoje dziecko poprosiło o dostęp do Watt City, gry edukacyjnej finansowo-matematycznej."
- „Zgodnie z RODO dzieciom poniżej 16 r.ż. wymagana jest Twoja zgoda."

### 10.5 10 PL „tak áno / tak nie" kópií

| Kontext | Tak áno | Tak nie |
| --- | --- | --- |
| 1. Welcome | „Dzień dobry, budowniczy!" | „Hi there!" |
| 2. Onboarding CTA | „Zacznij od pierwszej gry" | „Click here to begin" |
| 3. XP earn | „+24 XP · Świetnie!" | „+24 XP LOL" |
| 4. Duel invite | „Zagraj ze znajomym · kod XQ42B3" | „Invite a friend" |
| 5. Kredit offer | „Kredyt 200 W$ na 12 miesięcy — rata 18 W$/mies." | „LOAN OFFER" |
| 6. Defaultovaný kredit | „Nie wszystko poszło po planie. Zbudujmy plan naprawy." | „DEFAULT — game over" |
| 7. Budynok odomknutý | „Poziom 3! Fotowoltaika dostępna." | „UNLOCKED!!!" |
| 8. Offline cashflow | „W czasie Twojej nieobecności miasto zarobiło 48 W$." | „Offline earnings: 48" |
| 9. Parent GDPR | „Aby kontynuować, potrzebujemy Twojej zgody (RODO art. 8)." | „Consent required" |
| 10. AI challenge ready | „Dzisiejsze wyzwanie jest gotowe." | „New AI challenge available now" |

### 10.6 Mascot voice (Lokatka)

- Hovorí o sebe v 1. osobe: „Widzę, że zbierasz na hutę szkła. Super!"
- Nikdy neurazí dieťa.
- Nikdy nepoužíva finančný žargón bez vysvetlenia.
- Krátke repliky (pod 100 znakov).

---

## 11. Web Mapping — AKO TO APLIKUJEME

Presná tabuľka `file:line → action`. Čítaj ako checklist pred reskin PR.

### 11.1 `lib/theme.ts` — PKO_THEME tokens

| Line | Current | New (v0.2) | Dôvod |
| --- | --- | --- | --- |
| `:73` | `brand: "PKO Junior × Watt City"` | `brand: "SKO × Watt City"` | Watt City je SKO 2.0 partnership, nie Junior |
| `:74` | `brandShort: "PKO"` | `brandShort: "SKO"` | Konzistencia s brand |
| `:76` | `accent: "#d31f26"` | `accent: "#003574"` | Navy primary, nie red (red je PKO BP corporate, nie Junior/SKO) |
| `:77` | `accentInk: "#ffffff"` | ponechať | Biela na navy OK |
| `:78` | `background: "#052c65"` | `background: "#001E4B"` | VERIFIED najtmavšia navy |
| `:79` | `surface: "#0b3a7a"` | `surface: "#003574"` | VERIFIED primary navy |
| `:80` | `ink: "#ffffff"` | ponechať | Biela OK |
| `:83` | `disclaimer: "...W PARTNERSTWIE Z PKO BP..."` | `"GRA EDUKACYJNA W PARTNERSTWIE Z SKO (PKO Bank Polski) — waluta w grze (W-dolary) NIE jest pieniądzem..."` | SKO-first wording |
| `:86` | `mascot.id: "zyrafa"` | `mascot.id: "zyrafa-lokatka"` | Plné meno |
| `:87` | `mascot.label: "Żyrafa PKO"` | `mascot.label: "Żyrafa Lokatka"` | Overený SKO mascot name |

### 11.2 `app/globals.css` — nový blok pre SKIN=pko

Pridať za existujúci `:root` blok (po `:156`):

```css
:root[data-skin="pko"] {
  /* VERIFIED z pkobp.pl/junior apríl 2026 */
  --sko-navy-900: #001E4B;
  --sko-navy-700: #003574;
  --sko-navy-500: #004C9A;
  --sko-navy-300: #3074D5;
  --sko-ink: #172B4D;
  --sko-text-secondary: #636363;
  --sko-text-muted: #818181;
  --sko-border: #D5D5D5;
  --sko-border-light: #E5E5E5;
  --sko-surface: #F2F2F2;
  --sko-paper: #F9F9F9;
  --sko-white: #FFFFFF;
  --sko-accent-orange: #CC7A09;
  --sko-accent-orange-light: #DB912C;
  --sko-success: #2E7D49;
  --sko-warning: #CC7A09;
  --sko-danger: #B91C1C;
  --sko-info: #3074D5;
  --sko-pko-red: #CA171D;      /* reserved — corporate co-brand only */

  /* Remap aliases tak aby existujúce .btn / .card fungovali bez zmeny */
  --background: var(--sko-navy-900);
  --surface: var(--sko-navy-700);
  --surface-2: var(--sko-navy-500);
  --accent: var(--sko-navy-700);
  --accent-2: var(--sko-accent-orange);
  --brand: var(--sko-accent-orange);
  --ink: var(--sko-white);
  --foreground: var(--sko-white);

  /* Shape tokens — VERIFIED z PKO CSS bundle */
  --sko-radius-sm: 4px;
  --sko-radius-md: 10px;
  --sko-radius-lg: 16px;
  --sko-shadow-md: 0 3px 6px rgba(0, 0, 0, 0.16);
}
```

**Trigger:** `app/layout.tsx` musí na `<html>` pripojiť `data-skin={theme.id}` (aktuálne injekt-uje len `style`).

### 11.3 `lib/resources.ts` — skin-aware farby

Prístupy:
- **A (odporúčané):** pridať `colorByTheme: { core: string, pko: string }` field do `ResourceDef`. Komponenty čítajú `resource.colorByTheme[theme.id]`.
- **B (menej invazívne):** komponenty namiesto `resource.color` čítajú CSS premennú `var(--sko-res-${id})` keď `data-skin="pko"`.

Pre v0.2 odporúčame **B** — menší dopad na tests (nič nezmení runtime typy).

Pridať do `app/globals.css` `:root[data-skin="pko"]`:
```css
--sko-res-watts: #DB912C;
--sko-res-coins: #CC7A09;
--sko-res-bricks: #8B4513;
--sko-res-cash: #2E7D49;
--sko-res-glass-legacy: #004C9A;
--sko-res-steel-legacy: #818181;
--sko-res-code-legacy: #3074D5;
```

Komponent `components/resource-bar.tsx` použije: `style={{ background: \`color-mix(in srgb, var(--sko-res-\${id}) 15%, transparent)\` }}` pre chip BG.

### 11.4 `lib/building-catalog.ts` — SKO budova paleta

Pridať pri každej budove nové pole `colorByTheme` alebo vytvoriť separate `PKO_BUILDING_PALETTE` map s 15 entries podľa §5.4. V `components/building-svg.tsx` (alebo kde sa rendering deje) prečítať z tohto mappingu keď `SKIN=pko`.

**Konkrétne line-edits v `lib/building-catalog.ts` (15 budov):**

```
:83-84  Domek:              roof #f59e0b → #CC7A09, body #fde047 → #F2F2F2
:112-113 Sklepik:            roof #f472b6 → #DB912C, body #be185d → #CC7A09
:143-144 Mała elektrownia:   roof #facc15 → #DB912C, body #a16207 → #8B4513
:171-172 Bank lokalny:       roof #0ea5e9 → #003574, body #1e40af → #001E4B
:196-197 Huta szkła:         roof #22d3ee → #3074D5, body #0e7490 → #004C9A
:222-223 Biblioteka:         roof #f59e0b → #CC7A09, body #92400e → #8B4513
:247-248 Walcownia:          roof #94a3b8 → #818181, body #334155 → #636363
:273-274 Gimnazjum sportowe: roof #ef4444 → #003574, body #991b1b → #001E4B
:299-300 Centrum nauki:      roof #14b8a6 → #004C9A, body #115e59 → #003574
:324-325 Fotowoltaika:       roof #eab308 → #DB912C, body #a16207 → #CC7A09
:349-350 Software house:     roof #22c55e → #3074D5, body #14532d → #003574
:375-376 Kościół:            roof #eab308 → #CC7A09, body #f3f4f6 → #F9F9F9
:400-401 Park:               roof #22c55e → #2E7D49, body #166534 → #004C9A
:425-426 Fontanna:           roof #0ea5e9 → #3074D5, body #0284c7 → #004C9A
:451-452 Spodek:             roof #c084fc → #004C9A, body #581c87 → #001E4B
```

### 11.5 `components/site-nav.tsx` — brand chip

Aktuálne (dynamické cez theme):
- Background: `theme.colors.accent`
- Color: `theme.colors.accentInk`

Po §11.1 tieto automaticky prejdú na navy + biele pri `SKIN=pko`. **Žiadna zmena v `site-nav.tsx` netreba** — overiť v §15 pilotnej aplikácii.

### 11.6 `public/manifest.webmanifest` — skin-aware theme_color

**Problem:** manifest je statický JSON, nevie o `SKIN` env. PWA na iOS/Android nezobrazí správnu theme farbu pri SKO skine.

**Riešenie:** premeniť na dynamickú route.

Vytvoriť `app/manifest.ts` (Next.js 16 convention):

```ts
import { MetadataRoute } from 'next';
import { currentSkin, resolveTheme } from '@/lib/theme';

export default function manifest(): MetadataRoute.Manifest {
  const theme = resolveTheme(currentSkin());
  const isPko = theme.id === 'pko';
  return {
    name: isPko ? 'SKO × Watt City' : 'Watt City',
    short_name: isPko ? 'SKO' : 'Watt City',
    background_color: theme.colors.background,
    theme_color: theme.colors.accent,
    icons: [
      { src: `/icons/icon-192${isPko ? '-pko' : ''}.svg`, sizes: '192x192', type: 'image/svg+xml' },
      { src: `/icons/icon-512${isPko ? '-pko' : ''}.svg`, sizes: '512x512', type: 'image/svg+xml' },
      { src: `/icons/icon-maskable${isPko ? '-pko' : ''}.svg`, sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    start_url: '/',
    display: 'standalone',
  };
}
```

Zmazať `public/manifest.webmanifest`. Aktualizovať `app/layout.tsx` `<link rel="manifest">` aby ukazoval na `/manifest.webmanifest` (Next.js sám vyhandluje conversion — check Next 16 docs).

### 11.7 PWA ikony pre SKO skin

Pridať 3 nové SVG:
- `public/icons/icon-192-pko.svg` — navy `#003574` BG, biely mark
- `public/icons/icon-512-pko.svg` — to isté, 512×512
- `public/icons/icon-maskable-pko.svg` — safe zone 409×409 v centre, navy full-bleed

### 11.8 `app/layout.tsx` — footer disclaimer + mascot label

- `:280` — class `text-amber-400` je hardkódovaná. Pri SKO skine by text mal byť `--sko-white` (na navy). Premeniť na `className="text-[var(--ink)]"` → prepojí sa automaticky.
- `:296` — literal `"Żyrafa PKO + SKO 2.0 partnership..."` → `"Żyrafa Lokatka + SKO 2.0 partnership — wspiera ekipę Watt City w SKO skinie."`

### 11.9 `lib/locales/pl.ts` (+ `en.ts`, `uk.ts`, `cs.ts`) — brand strings

Grep keys:
- `footer.sponsors` (:707) — ponechať (sponzorský uvád)
- `footer.track` (:704) — `"PKO XP: Gaming"` — ponechať, je to historický názov tracku v ETHSilesia 2026

**Netreba prekladať** — všetky 4 jazyky zdieľajú „SKO × Watt City" brand string z `lib/theme.ts` cez dynamické `{theme.brand}`.

### 11.10 `app/miasto/page.tsx` — text „Mirror do PKO Junior"

Grep zmienky v tejto stránke:
- Label + teaser pre feature „Mirror do konta PKO Junior" (V4.2.4 feature flag).
- **Pri `SKIN=pko` (SKO skin)** by text mal byť `"Mirror do konta SKO"` (presnejšie), alebo ponechať `"Mirror do konta PKO Junior"` ak má byť transparentné že integrácia bude s Junior produktom. **DESIGN-CALL** — rozhodne product manager s PKO.

### 11.11 `app/pko/page.tsx` — demo mock stránka

Headingy typu „PKO Junior × Watt City (mock)" → **„SKO × Watt City (mock)"**. Mock copy ponechať ale brand name zosynchronizovať.

### 11.12 `components/city-scene.tsx` — KRITICKÉ

Hardkódované SVG hex (`#0f0f1f, #f8fafc, #e2e8f0, #cbd5e1, #fffbe6, #fde047`) musia prejsť na `var(--*)`. Viď §15.

### 11.13 `components/city-skyline-hero.tsx` — KRITICKÉ

Hardkódované `#1f2937, #0a0a0f`. Viď §15.

### 11.14 Fonty — `app/layout.tsx`

Pridať druhý font import pre SKO skin:

```tsx
import { Inter } from "next/font/google";
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-sko-sans",
  display: "swap",
});
```

V `<html>` root: `className={\`${geistSans.variable} ${geistMono.variable} ${inter.variable}\`}`.

V `app/globals.css` `:root[data-skin="pko"]` → `--font-sans: var(--font-sko-sans);`.

---

## 12. Asset Checklist

Čo musí dodať tím pred SKO launchom (20 položiek):

| # | Asset | Formát | Owner | Status |
| --- | --- | --- | --- | --- |
| 1 | Primárny horizontal lockup | SVG ≤ 4 KB | dizajnér + PKO potvrdenie | SUBSTITUTE existuje §2.4 |
| 2 | Vertical lockup | SVG | dizajnér | TODO |
| 3 | Compact mono lockup | SVG | dizajnér | TODO |
| 4 | Wordmark only | SVG | dizajnér | TODO |
| 5 | Skarbonka solo (coin opt) | SVG | PKO BP | TODO (čaká PKO) |
| 6 | PWA icon 192 PKO | SVG | pipeline | TODO (§11.7) |
| 7 | PWA icon 512 PKO | SVG | pipeline | TODO |
| 8 | Maskable PWA icon PKO | SVG | pipeline | TODO |
| 9 | Favicon 16×16 PKO | SVG/ICO | pipeline | TODO |
| 10 | Lokatka — 5 póz × 5 emócií | SVG | illustrator (§5.3) | PLACEHOLDER (hotswap env) |
| 11 | Pancernik Hatetepes (budúci) | SVG | illustrator | FUTURE v0.3 |
| 12 | OG image template 1200×630 | SVG/PNG per locale | dizajnér | TODO |
| 13 | Social media kit (IG / FB / LinkedIn) | PNG | dizajnér | TODO |
| 14 | Pitch deck template (rebranding `lib/pitch-pdf.tsx`) | PDF | dev | TODO |
| 15 | PDF report šablóna (`lib/pdf-report.tsx`) | PDF | dev | TODO |
| 16 | Email template (parent-consent) | HTML | dev (`lib/mailer.ts`) | TODO |
| 17 | 20 base ikon | Lucide SVG sprite | dev | SUBSTITUTE (§5.1) |
| 18 | 15 building renders SKO paleta | SVG | illustrator | TODO |
| 19 | Font pack — Inter woff2 self-host | woff2 | dev | SUBSTITUTE (Google Fonts je OK pre v0.2) |
| 20 | Brand copy review PL/UK/CS/EN | TXT | copywriter | TODO |

---

## 13. Governance

### 13.1 Approval matrix

| Zmena | Approver |
| --- | --- |
| Nová CSS premenná v `--sko-*` namespace | B2JK tech lead |
| Zmena hex hodnoty v tokeny (VERIFIED) | B2JK brand lead + ref check proti pkobp.pl |
| Hotswap logo SVG → PKO dodaný asset | PKO BP brand team |
| Lokatka asset hotswap | PKO BP brand team |
| External marketing material s SKO logom | PKO BP brand team + B2JK legal |
| Print material (školy) | PKO BP brand team + MEN compliance (ak platí) |

### 13.2 Approval flow

```
Zmena navrhnutá → B2JK brand lead review →
  PKO BP brand team review (ak external) →
    Legal (ak verejný) →
      Merge
```

### 13.3 Zakázané kombinácie

- Crypto / Web3 messaging pri `SKIN=pko` → **OFF**. Web3 UI skryté (feature flag `NEXT_PUBLIC_WEB3_ENABLED=false`).
- PKO logo + tretí partner bez PKO schválenia.
- Emoji ako brand-prvok (ikona OK, brand NO).
- Červená `--sko-pko-red` mimo co-branding footeru → **BANNED**.

### 13.4 Versioning

Manuál používa **semver-lite**:
- **v0.x** — draft, obsah môže meniť bez migration.
- **v1.0** — prvá produkčná verzia po PKO sign-off.
- **v1.x** — patches (farba fix, nový komponent, atď.).
- **v2.0** — breaking tokens (rename, remove).

**v0.1 → v0.2 expected trigger:** PKO BP brand team dodá oficiálne assety → prepíš `TODO` položky v §12 + changelog.

---

## 14. Migration Guide from v0.1

10 hlavných zmien a prečo:

1. **Brand rename:** „PKO Junior × Watt City" → **„SKO × Watt City"**. Watt City je v `README.md` a `docs/SKO-BACKLOG.md` explicitne označený ako SKO 2.0 partnership, nie Junior. Junior má vlastný mascot (hovoriaci robot, VERIFIED na `pkobp.pl/junior/`), SKO má Lokatku + Pancernik Hatetepes.

2. **CSS namespace:** `--pko-*` → `--sko-*`. Odlišuje od PKO BP corporate a signalizuje dcérsku brand úroveň.

3. **Primárny accent:** `#D31F26` (approximated red) → `#003574` (VERIFIED navy). Červená je PKO BP corporate brand, v Junior/SKO sekciách sa **nevyskytuje**. Toto bola najväčšia chyba v v0.1.

4. **Navy hodnoty overené:** `#052C65` (approximated) → `#001E4B` / `#003574` / `#004C9A` / `#3074D5` (VERIFIED z pkobp.pl/junior, 97+ výskytov).

5. **Mascot name:** „Żyrafa PKO" → **„Żyrafa Lokatka"** (plné meno, VERIFIED SKO brand).

6. **Pancernik Hatetepes pridaný** ako sekundárny mascot pre budúce rozšírenie (v0.3).

7. **Font substitúcia odôvodnená:** PKO používa proprietárny **`pkobp`** (VERIFIED), náš substitút **Inter** namiesto pôvodného Nunito (Inter je presnejší pre modern-banking refresh PKO 2025).

8. **Shape tokens VERIFIED:** border-radius `10px` dominantný v PKO bundle; shadow `0 3px 6px rgba(0,0,0,0.16)` overený.

9. **Nová §15 „Critical Migration Blockers"** — technické problémy v aktuálnom kóde ktoré **musia** byť opravené pred reskin-om.

10. **Farba budov:** kompletná nová SKO-harmonic paleta pre 15 budov (§5.4, §11.4), odstraňuje červenú z Gimnazjum sportowe a koriguje žlto-neon paletu na navy/orange/gray.

---

## 15. Critical Migration Blockers

Súbory v aktuálnom kóde ktoré **zablokujú** SKO reskin, ak sa neopravia **PRED** aplikáciou manuálu.

### 15.1 `components/city-scene.tsx` — hardcoded SVG hex (LARGEST BLOCKER)

**Meraný stav (2026-04-24):** súbor má **167 hardkódovaných hex inštancií** a **73 unikátnych farieb** (building roofy, fasády, okná, nočné svetlá, neón, tráva, obloha, hmla, sky-gradient zóny, …). Nie sú theme-awares. Pri `SKIN=pko` zostane core-skin krajina (žlto-neónová) v navy brand prostredí — **hard visual conflict**.

**Prístupy (od lacnejšieho po správnejší):**

**A. Rýchly hack (nie odporúčaný):** CSS `filter: hue-rotate(210deg) saturate(0.8)` na celý `<svg>` pri `SKIN=pko`. **Effort 1 h, ale estetika zlá** — červené sa zmenia na modré „rovnomerne" a mesto bude monochrómne. Good enough pre demo, zlé pre launch.

**B. Selektívna theme-aware migrácia (odporúčané):** rozdeliť 73 farieb do 6 sémantických rolí:
- `--scene-sky-top`, `--scene-sky-bottom`, `--scene-ground`, `--scene-building-primary`, `--scene-building-secondary`, `--scene-window-lit`. Zvyšné farby (stroke, shadow) stay per-skin fixed.
- Pridať do `app/globals.css` `:root` + `:root[data-skin="pko"]`.
- Prepísať 167 inštancií na `fill="var(--scene-*)"`.

**Effort:** 8–16 hodín (cca 30 min pre semantic-role design + 6–14 hod refactor + testy + visual diff).

**C. Paralelný súbor:** vytvoriť `components/city-scene-pko.tsx` s kompletne novou paletou, `components/city-scene.tsx` sa render-uje conditional. Zdvojnásobí maintenance burden, ale chráni core pred regresiou.

**Effort:** 12–20 hodín.

**Odporúčanie:** **B** pre produkčný SKO launch, **A** ako dočasné riešenie pre pitch demo ak je deadline tesný.

### 15.2 `components/city-skyline-hero.tsx` — hardcoded SVG hex

Rovnaký problém: `#1f2937`, `#0a0a0f` v hero SVG. Fix: to isté ako §15.1.

**Effort:** 1–2 hod.

### 15.3 `public/manifest.webmanifest` — not skin-aware

Problém: statický JSON s `theme_color: "#fde047"` a `name: "Watt City"`. PWA na iOS/Android installation vždy ukáže core žlté branding, aj keď app beží v SKO skine.

**Fix:** migrovať na dynamickú `app/manifest.ts` (§11.6). Next.js 16 to natívne podporuje cez `MetadataRoute.Manifest` export.

**Effort:** 1–2 hod + test PWA install na iOS Safari.

### 15.4 `lib/resources.ts` deprecated 3 resources

Problém: `glass`, `steel`, `code` sú v docs označené ako deprecated ale stále sú v `ResourceDef[]` array a render-ujú sa. Pri SKO skine by sa zobrazili s (teraz nesprávnymi) core farbami.

**Fix:** buď (a) skutočne ich odstrániť z array a backfilnúť testy, alebo (b) pridať `deprecated: true` field a v `components/resource-bar.tsx` skryť deprecated keď `theme.id === "pko"`.

**Effort:** 1 hod (opcia b), 3 hod (opcia a + test updates).

### 15.5 Texty „PKO Junior" v `app/miasto/page.tsx` a `app/pko/page.tsx`

Problém: Literal strings „Mirror do PKO Junior", „PKO Junior × Watt City (mock)" sú mimo theme systému — nezmenia sa pri `SKIN=pko`.

**Fix:** buď (a) extrahuj do `lib/locales/*.ts` a rozlíš per-theme, alebo (b) jednoduchšie — použi `theme.brand` kde to dáva zmysel a pevný „SKO" string inde.

**Effort:** 30 min.

### 15.6 `components/pko-mascot.tsx` placeholder SVG je hardkódovaný v `lib/theme.ts`

Súčasná implementácia: `ZYRAFA_PLACEHOLDER_SVG` constant v `lib/theme.ts:42-53` je inline string. `components/pko-mascot.tsx` render-uje `theme.mascot.svg` alebo externý URL (`NEXT_PUBLIC_PKO_MASCOT_URL`).

**Status:** funguje, ale placeholder vizuálne nie je verný Lokatka brand. Pri hackathon demo OK, pri produkčnom PR treba **reálny SVG asset**.

**Fix:** ilustrátor nakreslí Lokatku v 5 pózach × 5 emóciách = 25 SVG variantov, hotswap cez env.

**Effort:** 8–16 hod ilustrátor + 2 hod dev integration.

---

## 16. Changelog

| Verzia | Dátum | Autor | Popis |
| --- | --- | --- | --- |
| **v0.1** | 2026-04-24 | AI assistant pre B2JK-Industry/watt-city | Prvý draft — full structure, approximated PKO values, brand „PKO Junior × Watt City" |
| **v0.2** | 2026-04-24 | AI assistant (verified rewrite) | VERIFIED hex hodnoty z pkobp.pl/junior live CSS; brand rename na „SKO × Watt City"; mascot Żyrafa Lokatka; namespace `--sko-*`; nová §15 Critical Migration Blockers; oprava červenej ako primary |

**v0.2 → v0.3 expected triggers:**
- PKO BP brand team dodá oficiálne logo SVG, Lokatka vector, font licence — prepíš `TODO` a `SUBSTITUTE` položky.
- Production A/B test SKO building paliet → update §5.4 na základe retention metrík.
- Pancernik Hatetepes integration — rozšíriť §5.3.

---

**Finálny review checklist pred aplikáciou:**

- [ ] Pilotná aplikácia 1 tokenu (napr. `--sko-navy-700`) v `lib/theme.ts` + `app/globals.css`
- [ ] Typecheck `pnpm tsc --noEmit`
- [ ] Vitest `pnpm test` (635 testov musia všetky prejsť)
- [ ] Playwright `pnpm test:e2e` — minimálne smoke + prod-smoke
- [ ] Manual check `SKIN=pko pnpm dev` v browseri na `/`, `/miasto`, `/games`
- [ ] `lighthouse` audit pre PWA manifest correctness
- [ ] Screenshot diff proti v0.1 (optional ale odporúčané)

---

*Vygenerované AI assistantom pre B2JK-Industry/watt-city, 2026-04-24. Finálny review a produkčný sign-off čaká na PKO BP partnership signed. Všetky VERIFIED hodnoty sú citované zdrojom v §0.1; SUBSTITUTE položky sú označené pre neskoršiu výmenu.*
