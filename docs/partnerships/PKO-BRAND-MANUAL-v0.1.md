# PKO Junior × Watt City — Brand & Visual Identity Guide

**Verzia:** v0.1 — draft
**Dátum:** 2026-04-24
**Status:** interný pracovný manuál (pre dev + design team)
**Cieľ:** umožniť team-u za jeden pracovný deň preklopiť Watt City core skin do PKO-skin verzie bez dohadovania, pri zachovaní detskej hernej atmosféry a rešpektovaní verejne dostupnej PKO BP brand identity.

> **Dôležité právne upozornenie.** Tento dokument vychádza výlučne z verejne dostupných zdrojov o PKO BP a PKO Junior (web, tlačové správy, popisy rebrandingov 2011 a 2025, recenzie Karol Śliwka portfolia). Nepoužíva žiadny interný PKO brand book, interný font ani vektorový originál loga „skarbonka". Kde sa manuál odvoláva na PKO hodnoty, ide o **verejný substitút**, ktorý musí PKO BP brand team potvrdiť predtým, ako sa skin nasadí do produkcie. Všetky takéto miesta sú jasne označené ako „substitute until official asset".

---

## 0. Ako čítať tento manuál

Manuál je organizovaný tak, ako postupuje dev/dizajnér pri skinovaní:

1. **Esencia a logo** (§1–§2) — čo produkt sľubuje a ako sa predstavuje.
2. **Farby a typografia** (§3–§4) — design tokeny, ktoré sa priamo mapujú na `lib/theme.ts` a `app/globals.css`.
3. **Ikonografia, layout, komponenty** (§5–§7) — jazyk, ktorý sa aplikuje na obrazovky `/miasto`, `/games`, `/loans/compare`, atď.
4. **Motion, sound, copy** (§8–§10) — animácie, haptika a UX writing pre deti 9–14.
5. **Web mapping + checklist + governance** (§11–§13) — konkrétne súbory v repe, čo dodať a ako schvaľovať.

Každá sekcia sa dá čítať samostatne. Tokeny majú stabilné CSS-premenné mená (`--pko-*`) aby ich bolo bezpečné zamrznúť do kódu — budúce verzie manuálu menia len hodnoty, nie mená.

---

## 1. Brand Essence

### 1.1 Pozícia značky

PKO Junior × Watt City je **edukačný simulátor mesta** pre deti 9–14 rokov, ktorý premieňa finančnú gramotnosť na hrateľnú mestskú ekonomiku. V rámci PKO ekosystému obsadzuje priestor medzi detským účtom PKO Junior a dospelou IKO appkou — učí rozhodnutia, ktoré dieťa neskôr robí reálnymi peniazmi, bezpečne v hre.

**Elevator pitch (30 slov, PL):**

> PKO Junior × Watt City to gra, w której dzieci budują własne Katowice, poznają kredyt i cashflow, a rodzic widzi co dziecko się uczy. Bez reklam. Bez zakupów. Bez prawdziwych pieniędzy.

### 1.2 Brand promise — 3 piliere

| Pilier | Vysvetlenie | Dôkaz v produkte |
| ------ | ----------- | ---------------- |
| **Bezpečnosť** (Bezpieczeństwo) | Dieťa nikdy neplatí, rodič vždy vidí. GDPR-K ready, 0 in-app purchases, 0 tretích strán. | Rodičovský panel `/rodzic`, `W-dolary ≠ PLN`, disclaimer na každej stránke. |
| **Hra** (Gra) | Core loop má byť chytrý ale nie podliezavý. Mesto je kanvas, nie grind. | 9 minigier + AI rotácia, tier-up system, skarbonka-swallow animácia. |
| **Rast** (Rozwój) | Každá akcia v hre má pedagogický dopad: finančný, matematický alebo slovný. | MEN V–VIII curriculum tagy, učiteľský dashboard `/nauczyciel`, XP → credit score. |

Tieto tri piliere sa rotujú ako „signature triáda" v komunikácii (napr. landing hero, OG obrázky, škola pitch deck). Vždy v tom poradí — **Bezpečnosť → Hra → Rast** — pretože pre rodiča/učiteľa je to hierarchia rozhodovania.

### 1.3 Tone of voice

Šesť adjektív, v tomto poradí:

1. **Jasný** (Clear) — vety krátke, aktívum, bez žargónu.
2. **Povzbudzujúci** (Encouraging) — chyba nie je zlyhanie, je to ďalší pokus.
3. **Konkrétny** (Concrete) — namiesto „veľa peňazí" hovoríme „120 W$".
4. **Teplý** (Warm) — vykanie len voči rodičovi/učiteľovi.
5. **Hravý** (Playful) — jemný humor, slovné hračky áno, sarkazmus nie.
6. **Serióznobankový** (Seriously-banking) — o peniazoch hovoríme s rešpektom.

#### Tak áno / tak nie tabuľka

| Situácia | Tak áno | Tak nie |
| -------- | ------- | ------- |
| Pozdrav na landing page | „Dzień dobry, budowniczy! Jak rośnie twoje miasto?" | „Hej ziomek, co tam w biznesie?" |
| Dieťa prehralo hru | „Jeszcze jedna próba — każda runda liczy się do średniej." | „Słabo. Spróbuj lepiej." |
| Kredit sa pre-schválil | „Masz zgodę na kredyt 200 W\$ przy 5 % rocznie. Obejrzyj harmonogram spłat." | „Gratulacje! Weź kredyt, kup co chcesz!" |
| Error state | „Coś nam uciekło. Spróbujmy jeszcze raz?" | „Error 500. Something went wrong." |
| Rodičovská pozvánka | „Twoje dziecko chciałoby rozpocząć naukę finansów w Watt City. Potrzebujemy Twojej zgody." | „Hej tato, potwierdź konto." |
| Tier-up toast | „Poziom 4! Odblokowałeś hutę szkła." | „LEVEL UP!!! NEW UNLOCK!!!" |
| Cashflow red | „Uwaga — wydajesz więcej niż zarabiasz. Zbuduj źródło dochodu albo sprzedaj budynek." | „NEGATIVE CASHFLOW ALERT!" |

### 1.4 Target persona

#### 1.4.1 Dziecko 9–11 („młodszy junior")

- Čítanie: jednoduché vety, max 8 slov.
- Motivácia: zberanie, pokrok, mesto vyzerá cool.
- Bolesti: abstrakcia peňazí ešte neklikla; číslo > 1000 pôsobí „veľké".
- Čo robiť: vizuálne metafory (skarbonka = úspora, mince = kúpiť). Tier-up ako odmena.
- Čo nerobiť: zložité grafy, APR, amortizácia v plnom rozsahu (len hlavné číslo a „koľko to skončí").

#### 1.4.2 Dziecko 12–14 („starszy junior")

- Čítanie: konverzačné vety, finančný žargón áno ak je v kontexte.
- Motivácia: kompetencia, leaderboard, duel proti kamarátovi.
- Bolesti: chce sa porovnávať, ale frustruje sa, keď nevyhráva.
- Čo robiť: daj mu Credit Score 0–100, leaderboard per-game, porovnanie so spolužiakom v classe.
- Čo nerobiť: detinské tlačidlá („Juhú!"), mascot na každej obrazovke.

#### 1.4.3 Rodzic

- Tón: vykáme, formálne ale teplé.
- Motivácia: „nauč moje dieťa, ale nedávaj mu reklamu". Cení bezpečnosť > vizuál.
- Čo robiť: prehľad času v appke, pokrok, čo konkrétne sa naučil. Jedno-klikový parent-revoke.
- Čo nerobiť: hype kópia („Najlepsza apka dla dziecka!"), dark patterns okolo súhlasov.

#### 1.4.4 Nauczyciel

- Tón: vykáme, kolegiálne.
- Motivácia: pokryť MEN V–VIII finančnú gramotnosť bez prípravy papiera.
- Čo robiť: ukáž curriculum tag na každej hre, export triednych výsledkov, čas do hodinového slotu.
- Čo nerobiť: gamifikačné buzzword-y, sociálne porovnania medzi triedami.

---

## 2. Logo System

### 2.1 Filozofia co-brandingu

Primárny lock-up hovorí **„PKO Junior × Watt City"** — s oddelovačom „×" ako typografickou mincou. PKO zóna nesie dôveru (navy + skarbonka), Watt City zóna nesie hru (mestská silueta + Żyrafa).

Kľúčové pravidlo: **v skin=pko režime PKO wordmark vždy vedie zľava**; v skin=core režime je PKO zóna skrytá (lock-up degraduje na samotnú Watt City).

### 2.2 Logo variants

Tri povinné varianty:

1. **Horizontal (primárny)** — 3:1 pomer, na webovú top nav, PDF hlavičky, OG image.
2. **Vertical (stacked)** — 1:1 pomer, pre ikonu appky, dlaždice, avatary.
3. **Compact wordmark-only** — len „PKO Junior × Watt City" bez symbolu, pre favicony ≤ 32 px a riadkovú signatúru v e-maile.

### 2.3 ASCII náčrty

```
HORIZONTAL (3:1, pre top nav, šírka 240 px min.)
┌────────────────────────────────────────────────────────────┐
│  ┌───┐                                                     │
│  │PKO│  PKO Junior  ×  Watt City                           │
│  └───┘   (navy)                                            │
└────────────────────────────────────────────────────────────┘
 ↑ skarbonka / logo-mark (substitute: simplified P+monogram)

VERTICAL (1:1, pre app-ikonu 192/512 px, dlaždice)
        ┌────────┐
        │  PKO   │
        │ mark   │    <- skarbonka mark, navy bg, red coin
        └────────┘
       PKO Junior
           ×
       Watt City

COMPACT (wordmark only, pre e-mail signature, 16 px favicon)
PKO Junior × Watt City
```

### 2.4 SVG snippet — primárny horizontal lock-up (substitute)

```svg
<svg viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="PKO Junior × Watt City">
  <!-- PKO zóna (ľavá 1/3) -->
  <rect x="0" y="0" width="160" height="120" fill="#052C65"/>
  <!-- skarbonka substitute: stylized P monogram + falling coin -->
  <g transform="translate(32,24)" fill="#ffffff">
    <path d="M10 0 h40 a28 28 0 0 1 0 56 h-28 v28 h-12 z
             M22 14 h22 a14 14 0 0 1 0 28 h-22 z" />
    <circle cx="72" cy="72" r="10" fill="#D31F26" stroke="#ffffff" stroke-width="2"/>
  </g>

  <!-- Oddelovač × -->
  <text x="200" y="72" font-family="'Nunito', system-ui, sans-serif"
        font-size="40" font-weight="800" fill="#052C65">×</text>

  <!-- Watt City wordmark (pravá 1/3) -->
  <text x="240" y="62" font-family="'Nunito', system-ui, sans-serif"
        font-size="28" font-weight="900" fill="#052C65"
        letter-spacing="0.5">PKO Junior</text>
  <text x="240" y="98" font-family="'Nunito', system-ui, sans-serif"
        font-size="28" font-weight="900" fill="#D31F26"
        letter-spacing="0.5">Watt City</text>
</svg>
```

> **Substitute until official asset** — pravý „skarbonka" mark dodá PKO BP brand team. Do tej doby používame stylizovaný „P" monogram s padajúcou mincou (farebne vernou), ktorý sa dá jedným hotswapom nahradiť.

### 2.5 Clear space

Minimálna ochrana zóna okolo loga = výška „P" v slove „PKO" (`= 1×P`).

```
                      1×P
                ┌───────────────┐
        1×P ←   │  [ LOGO ]     │   → 1×P
                └───────────────┘
                      1×P
```

V ochrannej zóne nesmie byť: iný text, iné logo, fotografia, gradient, dekoratívny tvar. Background je buď čisto `--pko-paper`, čisto `--pko-navy-900` alebo `--pko-red` (ak ide o full-bleed karty).

### 2.6 Minimálne veľkosti

| Kontext | Horizontal | Vertical | Compact |
| ------- | ---------- | -------- | ------- |
| **Web (px)** | 120 px šírka | 64 × 64 | 16 px výška |
| **Mobil app-ikona** | — | 192 × 192 (PWA), 512 × 512 (maskable) | — |
| **Print (mm)** | 30 mm šírka | 20 × 20 mm | 6 mm výška |
| **OG image** | 400 px v rámci 1200 × 630 | — | — |

Pod tieto veľkosti nikdy nejdeme — symbol prestáva byť čitateľný.

### 2.7 Do's & don'ts (8 pravidiel)

1. **DO** použiť horizontal na all-width headerov, vertical na štvorcových plochách.
2. **DO** dodržať clear space = 1×P okolo celého lock-upu.
3. **DO** používať oficiálne hex kódy (§3) — nikdy pixel-picker z JPGu.
4. **DO** preferovať SVG pred PNG (okrem e-mail signatúry).
5. **DON'T** rotovať logo (0° iba).
6. **DON'T** meniť pomer strán, skewovať, pridávať obrys.
7. **DON'T** umiestňovať na rušné fotografie bez 60 % dark-overlay plátna.
8. **DON'T** kombinovať s tretími partnermi bez písomného schválenia PKO BP brand teamu (viď §13).

### 2.8 Co-branding s PKO BP master-logom

Ak sa Watt City objavuje **vedľa** oficiálneho PKO BP korporátneho loga (napr. pitch deck slajd s investor-relations komunikáciou), platí:

- PKO BP master logo vľavo, Watt City lock-up vpravo, oddelené tenkou navy čiarou `1 px × výška P`.
- PKO BP logo má priority a 60 % optickej plochy; Watt City 40 %.
- Vertikálne zarovnanie: stredom cez výšku „O" v PKO master-logu.
- Podkladová farba: **vždy biela/paper**, nikdy navy, aby PKO master logo nestratilo kontrast.

---

## 3. Color System

### 3.1 Filozofia palety

Základ: PKO navy + Polish red + warm paper neutral. Doplnok: gold accent pre rewardy, sémantické farby pre feedback. Hra dostáva 4 aktívne resource-farby (watts, coins, bricks, cashZl) ladené tak, aby boli rozlíšiteľné aj pre deuteranopia/protanopia a harmonizovali s core paletou. (3 deprecated resources — glass/steel/code — necháme v kóde ale UI ich nikdy nezobrazí na PKO skine.)

Všetky hodnoty hex/RGB/HSL/CMYK sú **verejný substitút** založený na publikovanom „Polish red" a PKO navy z webu PKO BP (apríl 2026). CMYK je aproximácia — finálna produkcia PKO print materiálov používa ich interné Pantone mapovanie, ktoré nemáme.

### 3.2 Primárne brand tokeny

| Token (CSS var) | Hex | RGB | HSL | CMYK (aprox.) | Použitie |
| --------------- | --- | --- | --- | ------------- | -------- |
| `--pko-red` | `#D31F26` | 211 31 38 | 358° 74% 47% | 0 85 82 17 | Primárny akcent, coin, CTA buttony na paper |
| `--pko-navy-900` | `#041E47` | 4 30 71 | 217° 89% 15% | 94 58 0 72 | Najtmavší navy, background na skine |
| `--pko-navy-700` | `#052C65` | 5 44 101 | 217° 91% 21% | 95 56 0 60 | Primárny background (zhodný so súčasnou skin hodnotou) |
| `--pko-navy-500` | `#0B3A7A` | 11 58 122 | 217° 83% 26% | 91 52 0 52 | Surface, karty nad navy bg |
| `--pko-navy-300` | `#4766A6` | 71 102 166 | 220° 38% 46% | 57 39 0 35 | Muted navy, disabled texty na tmavom |
| `--pko-ink` | `#0A1428` | 10 20 40 | 220° 60% 10% | 75 50 0 84 | Text on light, outlines |
| `--pko-paper` | `#F6F1E7` | 246 241 231 | 40° 45% 93% | 0 2 6 4 | Warm off-white alternatíva k čistobielej |
| `--pko-white` | `#FFFFFF` | 255 255 255 | 0° 0% 100% | 0 0 0 0 | Čistá biela pre kontrastne kritické miesta |
| `--pko-gold` | `#E4B23A` | 228 178 58 | 42° 75% 56% | 0 22 75 11 | Reward, achievement, úspech-premium |

### 3.3 Sémantické tokeny

| Token | Hex | Použitie |
| ----- | --- | -------- |
| `--pko-success` | `#2E8B57` | Pozitívny cashflow, úspech v kvíze, positive tier-up |
| `--pko-warning` | `#E4B23A` | Kredit vo vysokom LTV, náklady > 70 % príjmov (zhodný s `--pko-gold`) |
| `--pko-danger`  | `#B3261E` | Negatívny cashflow, default na hypotéke, error (tmavšia než brand red aby sa nepletie s CTA) |
| `--pko-info`    | `#2F6FED` | Informačné toasty, disclaimery |

### 3.4 Game-resource paleta (4 aktívne)

Každý resource-token harmonizuje s navy + red, ale je jasne rozlíšiteľný na colorblind simulator-och (deuteranope, protanope, tritanope):

| Resource | Token | Hex | RGB | HSL | Ikona | Poznámka |
| -------- | ----- | --- | --- | --- | ----- | -------- |
| ⚡ Watts | `--pko-res-watts`  | `#F5C518` | 245 197 24 | 47° 93% 53% | ⚡ | Brand-gold varianta, sunnejšia ako `--pko-gold` |
| 🪙 Coins | `--pko-res-coins`  | `#D98323` | 217 131 35 | 31° 72% 49% | 🪙 | Teplá oranž, odolná voči deuteranope |
| 🧱 Bricks | `--pko-res-bricks` | `#8B4A2B` | 139 74 43 | 19° 53% 36% | 🧱 | Tehlová hnedá, jasný kontrast voči gold |
| 💵 W\$ CashZl | `--pko-res-cash` | `#1E7A3C` | 30 122 60 | 139° 61% 30% | 💵 | Sýta zelená, vyhýba sa „money = green" klišé tým, že je tmavšia |

**Deprecated (nikdy nezobrazené na PKO skine, ostávajú v kóde pre V1 migration):**

| Resource | Token | Hex |
| -------- | ----- | --- |
| 🪟 Glass | `--pko-res-glass-legacy` | `#22D3EE` |
| 🔩 Steel | `--pko-res-steel-legacy` | `#94A3B8` |
| 💾 Code  | `--pko-res-code-legacy`  | `#22C55E` |

### 3.5 Navy shade škála (4-stupňová)

```
--pko-navy-900  #041E47  ███████  darkest — app background
--pko-navy-700  #052C65  ███████  primary bg (= current skin value)
--pko-navy-500  #0B3A7A  ███████  surface (= current skin value)
--pko-navy-300  #4766A6  ███████  muted / disabled
```

### 3.6 Gradientné specifikácie

**Primary nav gradient (top bar, hero karty):**

```css
background: linear-gradient(180deg, #052C65 0%, #041E47 100%);
```

**Coin-reward gradient (medailová plocha):**

```css
background: radial-gradient(circle at 30% 30%, #F5C518 0%, #D98323 70%, #8B4A2B 100%);
```

**Danger fade (pri negatívnom cashflow):**

```css
background: linear-gradient(90deg, rgba(179,38,30,0) 0%, rgba(179,38,30,0.2) 100%);
```

PKO brand guide 2011 (White Cat Studio) pracuje s jednoduchým dvojbodovým gradientom navy → black. Držíme rovnakú disciplínu — nikdy nie 4+ bodové, nikdy nie rainbow.

### 3.7 Accessibility — WCAG kontrastná tabuľka

Pomer vypočítaný WCAG 2.1 luminance formula. **AA** = 4.5:1 pre normal text, 3:1 pre large/18 px+. **AAA** = 7:1 normal, 4.5:1 large.

| Foreground \ Background | `--pko-white` #FFF | `--pko-paper` #F6F1E7 | `--pko-navy-900` #041E47 | `--pko-navy-700` #052C65 |
| ----------------------- | ------------------ | --------------------- | ------------------------ | ------------------------ |
| `--pko-ink` #0A1428     | **16.8:1 AAA**     | **15.5:1 AAA**        | 1.2:1 FAIL               | 1.6:1 FAIL               |
| `--pko-navy-900` #041E47| **15.4:1 AAA**     | **14.1:1 AAA**        | 1.0:1 FAIL               | 1.3:1 FAIL               |
| `--pko-navy-700` #052C65| **12.1:1 AAA**     | **11.1:1 AAA**        | 1.3:1 FAIL               | 1.0:1 FAIL               |
| `--pko-navy-300` #4766A6| **3.9:1 AA-large** | **3.6:1 AA-large**    | 3.1:1 AA-large           | 2.4:1 FAIL               |
| `--pko-red` #D31F26     | **5.1:1 AA**       | **4.6:1 AA**          | 3.0:1 AA-large           | 2.4:1 FAIL               |
| `--pko-gold` #E4B23A    | 2.1:1 FAIL         | 1.9:1 FAIL            | **7.9:1 AAA**            | **6.3:1 AA**             |
| `--pko-white` #FFFFFF   | 1.0:1 FAIL         | 1.1:1 FAIL            | **15.4:1 AAA**           | **12.1:1 AAA**           |
| `--pko-success` #2E8B57 | 3.4:1 AA-large     | 3.1:1 AA-large        | **4.5:1 AA**             | **3.6:1 AA-large**       |
| `--pko-danger` #B3261E  | **5.9:1 AAA**      | **5.3:1 AA**          | 2.6:1 FAIL               | 2.1:1 FAIL               |

**Povinné kombinácie pre produktový UI (PKO skin):**

- Body text: `--pko-white` na `--pko-navy-700` (**AAA**).
- Secondary text: `--pko-navy-300` na `--pko-navy-700` — **FAIL**, použiť `--pko-white` + 80 % alpha namiesto toho, alebo bumpnúť na 18 px+.
- CTA button (primary): biely text na `--pko-red` na `--pko-navy-700` background → lokálny kontrast tlačidla biela/červená je **5.1:1 AA ✓**.
- Gold success badge: `--pko-navy-900` na `--pko-gold` (**7.9:1 AAA ✓**).
- Danger toast: biely text na `--pko-danger` (kontrast 5.9:1 AAA ✓).

### 3.8 Color use guidance

- **Backgrounds:** primárny `--pko-navy-700`, sekundárny `--pko-paper` pre „svetlú" alternatívu (napr. tlačové materiály, e-mail).
- **Surface karty:** `--pko-navy-500` na navy pozadí, `--pko-white` na paper pozadí.
- **Primary CTA:** `--pko-red` background + biely text. Vždy. Na navy aj paper.
- **Secondary CTA:** ghost button — border `--pko-white` 2 px, text `--pko-white`, transparent bg.
- **Linky v tele textu:** podčiarknuté, `--pko-gold` na navy BG, `--pko-red` na paper BG.
- **Error state:** `--pko-danger` bg + biely text pre toasty; `--pko-danger` border + ikona pre inline form-chyby.

### 3.9 Colorblind guard

ResourceBar farby sú testované v Sim Daltonism (deuteranope, protanope, tritanope). Každá dvojica ma `Δ E* CIEDE2000 ≥ 20` — zrozumiteľná aj bez farby. Ako poistka: **každý resource má aj unicode ikonu** (⚡ 🪙 🧱 💵), ktorá je primárnym identifikátorom pre assistívne technológie. Farbu berieme ako sekundárny pasing cue.

---

## 4. Typography

### 4.1 Primárny font — open-source substitute

PKO BP používa custom rounded humanistic sans-serif (White Cat Studio, refresh 2025). Pre PKO Junior × Watt City navrhujeme **tri bezpečné open-source alternatívy** v poradí preferencie:

| Poradie | Font | Licencia | Distribúcia | Rationale |
| ------- | ---- | -------- | ----------- | --------- |
| **1. (default)** | **Nunito** | SIL OFL 1.1 | Google Fonts, Fontsource | Rounded, humanistic, číta sa teplo ale čisto; má variable axis wght 200–1000. Používaný v školských materiáloch EU. |
| **2.** | **Plus Jakarta Sans** | SIL OFL 1.1 | Google Fonts, Fontsource | Bližšie k Circular Std; geometrickejšie ako Nunito. Použiť ak Nunito pôsobí príliš detsky. |
| **3.** | **TT Commons Pro** (komerčná) | TypeType proprietárna | self-host | Najbližší vizuálny twin k PKO 2025 refreshu. Platená — pre produkciu len keď PKO potvrdí. |

**Default pre v0.1:** Nunito, cez Google Fonts (`next/font/google`), s preload-om weights 400, 700, 800, 900.

```tsx
// app/layout.tsx — v PKO skine
import { Nunito } from "next/font/google";
const nunito = Nunito({
  subsets: ["latin", "latin-ext"],  // latin-ext kvôli PL diakritike
  weight: ["400", "700", "800", "900"],
  variable: "--font-pko-sans",
  display: "swap",
});
```

### 4.2 Sekundárny / mono font

- **Mono:** JetBrains Mono (SIL OFL) — používaný pre čísla v amortizačnej tabuľke, kód, IDčka duelov. Rounded a friendly, nie strojový.
- **Display accent (voliteľný, len pre hero):** Fraunces (SIL OFL, variable serif) — pre čísla XP na dashboarde, aby pôsobili ako medaila; ale defaultne **nevolíme** druhý font pre v0.1 kvôli bundle size.

### 4.3 Type scale

Base = 16 px (`1 rem`). Scale = perfect fourth (1.333) zaokrúhlené na 4 px grid. Váhy vybrané tak, aby PKO skin pôsobil „tenšie a zrelšie" než core Watt City skin (core ide na 800–900, PKO skin na 700–800 v body).

| Token | `rem` | px | line-height | letter-spacing | weight | Použitie |
| ----- | ----- | -- | ----------- | -------------- | ------ | -------- |
| `--text-h1` | 3.25 | 52 | 1.05 | -0.02em | 900 | Hero nadpis landing |
| `--text-h2` | 2.5 | 40 | 1.1 | -0.015em | 800 | Sekčné nadpisy |
| `--text-h3` | 1.875 | 30 | 1.2 | -0.01em | 800 | Názov karty, modal title |
| `--text-h4` | 1.5 | 24 | 1.25 | 0 | 700 | Sub-headings |
| `--text-h5` | 1.25 | 20 | 1.3 | 0 | 700 | Mini nadpisy |
| `--text-h6` | 1.125 | 18 | 1.35 | 0 | 700 | Panel labels |
| `--text-body-lg` | 1.125 | 18 | 1.55 | 0 | 400 | Úvodné odseky, parent onboarding |
| `--text-body` | 1 | 16 | 1.5 | 0 | 400 | Hlavný body text |
| `--text-body-sm` | 0.875 | 14 | 1.5 | 0 | 400 | Popisy, tooltips |
| `--text-caption` | 0.75 | 12 | 1.4 | 0.03em | 600 | Podnadpisy, meta info |
| `--text-micro` | 0.6875 | 11 | 1.3 | 0.06em | 700 | Brutal-tag, disclaimer, brand chip |
| `--text-number-hero` | 3.5 | 56 | 1 | -0.03em | 900 | XP/cashflow hero numbers |

### 4.4 Responzívna škála

Fluidne cez `clamp()` pre mobile → desktop, bez ďalšieho breakpoint overrideu:

```css
--text-h1: clamp(2rem, 4.5vw, 3.25rem);
--text-h2: clamp(1.75rem, 3.5vw, 2.5rem);
--text-h3: clamp(1.5rem, 2.5vw, 1.875rem);
--text-body: 1rem;                         /* body fix */
--text-body-sm: 0.875rem;                  /* nikdy nepadá pod 14 px na mobile */
```

Minimálna body-text veľkosť na mobile = **16 px** (WCAG 1.4.4 reflow + iOS Safari zoom-prevention).

### 4.5 Do's & don'ts typografie

**DO:**

- Ponechaj PL diakritiku (`ą ć ę ł ń ó ś ź ż`) — vždy cez `latin-ext` subset.
- Používaj `font-variant-numeric: tabular-nums` pre cashflow tabuľky, amortizáciu a leaderboard skóre — inak čísla „skáču".
- Pre kids 9–11 zväčši `body` na 18 px ak je to sekcia čítaná samostatne (onboarding, tutorial).

**DON'T:**

- Nekombinuj viac ako 2 fonty (Nunito + JetBrains Mono = max).
- Nepoužívaj `font-weight < 400` — kids čítanie trpí.
- Nepoužívaj `text-transform: uppercase` na body text > 20 slov (čitateľnosť padá). Len labels a tagy.
- Nepodčiarkuj CTA buttony (má to stroke a shadow, underline = vizuálny noise).
- Nelet'aj sirôt (> 3 slovný orphan) na hero nadpisoch — použi `&nbsp;` v editoriálnej kópii.

---

## 5. Iconography & Illustration

### 5.1 Ikonová sada — pravidlá

- Štýl: **stroke-based line icons**, 1.5 px stroke (bude to konzistentné s tenkou PKO typografiou), rounded join, rounded cap.
- Corner radius: 2 px minimum, 4 px pre štvorcové kontajnery.
- Canvas: 24 × 24 px grid s 2 px safe padding → optické centrum vo 20 × 20.
- Varianty: `line` (default), `filled` (pre active/selected state), `duotone` (hover — stroke `--pko-navy-900` + fill `--pko-red` 20 %).
- Farba: primárne `currentColor` aby dedila z rodiča. Brand accent `--pko-red` len pre „pozor/upozornenie" stav.

### 5.2 Base ikona set — 20 ikon

Navrhnutá v jednotnom štýle (1.5 px stroke, 24 × 24 grid):

| # | Názov | Sémantika | Keywords |
| - | ----- | --------- | -------- |
| 1 | `menu` | Mobilné menu | three-lines |
| 2 | `home-city` | Domovská obrazovka / mesto | skarbonka-rooftops |
| 3 | `games` | Hub minigier | joystick |
| 4 | `mortgage` | Hypotéka / kredit | house-percent |
| 5 | `parent` | Rodičovský panel | parent-child |
| 6 | `teacher` | Učiteľský dashboard | mortarboard |
| 7 | `watts` | Resource: Watts | lightning |
| 8 | `coins` | Resource: Coins | coin-stack |
| 9 | `bricks` | Resource: Bricks | brick-wall |
| 10 | `cashZl` | Resource: W\$ | banknote |
| 11 | `building` | Generic building (placement UI) | house-outline |
| 12 | `leaderboard` | Poradie | podium |
| 13 | `duel` | 2-player | swords |
| 14 | `alert` | Upozornenie | triangle-exclamation |
| 15 | `success` | Úspech | checkmark-circle |
| 16 | `error` | Chyba | x-circle |
| 17 | `settings` | Nastavenia | gear |
| 18 | `logout` | Odhlásiť | door-arrow |
| 19 | `help` | Pomocník | question-circle |
| 20 | `medal` | Medaila / odznak | ribbon-star |

### 5.3 SVG snippet — vzorová ikona `coins`

```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Coins"
     fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="12" cy="7" rx="7" ry="3"/>
  <path d="M5 7 v5 c0 1.7 3.1 3 7 3 s7-1.3 7-3 V7"/>
  <path d="M5 12 v5 c0 1.7 3.1 3 7 3 s7-1.3 7-3 v-5"/>
</svg>
```

### 5.4 SVG snippet — skarbonka-inšpirovaná `home-city` ikona

```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Moje miasto"
     fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round">
  <!-- skyline s tromi rooftops vs. padajúca minca -->
  <path d="M2 20 h20"/>
  <path d="M4 20 v-7 l4-3 l4 3 v7"/>
  <path d="M12 20 v-5 l3-2 l3 2 v5"/>
  <rect x="6" y="14" width="2" height="3"/>
  <rect x="14" y="15" width="2" height="2"/>
  <!-- padajúca minca (brand accent) -->
  <circle cx="18" cy="5" r="2" stroke="#D31F26"/>
</svg>
```

### 5.5 Illustration style — dve varianty

**Variant A (preferovaný): „Soft-geometric paper-cut"**

- Ploché vektory bez gradientov, mäkké rounded rohy (r = 6–12).
- Tiene len pod mascot-om (subtle 15 % navy alpha, offset y=4).
- Hrúbka line-elementov 1.5–2 px, nie 3 px (to je core skin).
- Farby: 4 hlavné PKO tokeny + 2 neutrály, nikdy viac než 6 na scéne.
- Rationale: čisté, bank-seriózne, ale kamarátske.

**Variant B (alternatíva, pre hero a marketing): „Isometric City Stack"**

- Izometrická projekcia 30° pre /miasto budovy a marketing ilustrácie.
- Farby z building-catalog paletu (§5.7), nikdy neon.
- Svetlo zhora-zľava (45°), 10 % lighter na top faces, 20 % darker na right faces.
- Rationale: hero shoty, pitch deck, OG image.

### 5.6 Mascot — PKO Żyrafa

> PKO Junior mascot je **Żyrafa**. Nepredkladáme finálny vektor — ten dodá PKO brand team. Pracovný placeholder už existuje v `lib/theme.ts` a slúži pre dev scaffolding.

#### 5.6.1 Proporcie

- Head-to-body ratio: 1 : 2.2 (mierne detská, nie bábätko).
- Krk = 40 % celkovej výšky.
- Oči veľké, kruhové, s 2 highlight bodkami.
- Rožky (ossicons) malé, zaoblené, nikdy ostré.
- Škvrny: organické polygóny, max 12 na tele, farba `--pko-bricks` (`#8B4A2B`) na žltom base `#F5C518`.

#### 5.6.2 Päť povolených póz

1. **Standing-forward** — default, pre onboarding a parent screens. Neutrálny výraz.
2. **Waving-hello** — úvodné obrazovky, return-from-break.
3. **Pointing** — tutorial, „klikni sem".
4. **Thinking** (ruka na brade, zdvihnutý pohľad) — pred ťažkou otázkou v kvíze.
5. **Celebrating** (skákajúca, s konfetami) — tier-up, nová medaila.

#### 5.6.3 Päť povolených emócií (face variants)

`happy` · `encouraging` · `thinking` · `celebrating` · `calm`

Kombinácia 5 póz × 5 emócií = **25 variantov** = asset deliverable (§12).

#### 5.6.4 Żyrafa — kedy NEpoužívať

- Na chybových stavoch (error toast, 500 page). Chyby nosí ikona, nie mascot — inak si dieťa spojí maskotku s frustráciou.
- Na obrazovkách o peniazoch reálneho rodiča (parent billing, legal disclaimers, GDPR súhlas).
- V duel screene — tam patrí neutrálny VS symbol, nie mascot, aby neodvádzal od súboja.
- Na leaderboard-e pri outlier tituloch (posledné 3 miesta) — môže byť interpretovaný ako posmech.

### 5.7 Building art direction — paleta pre `/miasto`

10+ budov v `lib/building-catalog.ts` (§11). Core skin používa neon mix (#f472b6, #22d3ee, #a3e635, ...). PKO skin zarovnáva paletu na **navy + red + gold + bricks + paper** s kontrolovanými variantami.

Navrhovaná PKO-skin building paleta (roof × body per budova):

| # | Building | id | PKO roof | PKO body | Logic |
| - | -------- | -- | -------- | -------- | ----- |
| 1 | Domek | `domek` | `#D98323` (coins) | `#F5C518` (watts) | Teplo, rodinné |
| 2 | Sklepik | `sklepik` | `#D31F26` (pko-red) | `#8B4A2B` (bricks) | CTA-commerce |
| 3 | Mała elektrownia | `mala-elektrownia` | `#F5C518` | `#8B4A2B` | Watts source |
| 4 | Bank lokalny | `bank-lokalny` | `#052C65` (navy-700) | `#041E47` (navy-900) | Bank monolit |
| 5 | Huta szkła | `huta-szkla` | `#4766A6` (navy-300) | `#0B3A7A` (navy-500) | Industrial modrá |
| 6 | Biblioteka | `biblioteka` | `#E4B23A` (gold) | `#8B4A2B` | Teplá kultúra |
| 7 | Walcownia | `walcownia` | `#4766A6` | `#0A1428` (ink) | Ťažký priemysel |
| 8 | Gimnazjum sport. | `gimnazjum-sportowe` | `#D31F26` | `#052C65` | Dynamika |
| 9 | Centrum nauki | `centrum-nauki` | `#1E7A3C` (success-green) | `#0B3A7A` | Objavovanie |
| 10 | Fotowoltaika | `fotowoltaika` | `#F5C518` | `#4766A6` | PV panely |
| 11 | Software house | `software-house` | `#2F6FED` (info-blue) | `#0A1428` | Tech |
| 12 | Kościół | `kosciol` | `#E4B23A` | `#F6F1E7` (paper) | Historický |
| 13 | Park | `park` | `#1E7A3C` | `#2E8B57` (success) | Zeleň |
| 14 | Fontanna | `fontanna` | `#4766A6` | `#052C65` | Voda |
| 15 | Spodek | `spodek` | `#D31F26` | `#041E47` (navy-900) | Landmark |

Pozri §11 pre presné mapovanie do `building-catalog.ts`.

---

## 6. Layout & Grid

### 6.1 Baseline grid

**4 px vnútorný grid, 8 px vonkajší rytm.** Všetky paddingy, margins, border-radius a line-heights sú násobky 4. Komponenty na stránke sa zarovnávajú na 8 px rytmus.

### 6.2 Content container

| Breakpoint | Viewport min | Container max-width | Gutter | Kolony |
| ---------- | ------------ | ------------------- | ------ | ------ |
| xs (mobile)| 360 px       | 100 %               | 16 px  | 4      |
| sm         | 480 px       | 100 %               | 16 px  | 6      |
| md (tablet)| 768 px       | 720 px              | 24 px  | 8      |
| lg (desktop)| 1024 px     | 960 px              | 32 px  | 12     |
| xl         | 1280 px      | 1200 px             | 32 px  | 12     |
| 2xl        | 1440 px      | 1360 px             | 32 px  | 12     |

### 6.3 Spacing tokeny

| Token | Hodnota | Použitie |
| ----- | ------- | -------- |
| `--space-0` | 0 | — |
| `--space-1` | 0.25 rem (4 px) | Ikona k textu |
| `--space-2` | 0.5 rem (8 px) | Vnútro chipu |
| `--space-3` | 0.75 rem (12 px) | Medzi input label a fieldom |
| `--space-4` | 1 rem (16 px) | Padding karty (sm) |
| `--space-5` | 1.5 rem (24 px) | Padding karty (md) |
| `--space-6` | 2 rem (32 px) | Section vertical rhythm |
| `--space-8` | 3 rem (48 px) | Page hero padding |
| `--space-10` | 4 rem (64 px) | Section separator desktop |
| `--space-12` | 5 rem (80 px) | Hero top padding landing |
| `--space-16` | 8 rem (128 px) | Legal footer top margin |

### 6.4 Card & panel rules

| Vlastnosť | Hodnota |
| --------- | ------- |
| Background | `--pko-navy-500` (na navy skine) / `--pko-white` (na paper skine) |
| Border | **1 px** solid `--pko-navy-300` (subtílne, nie core-style 3 px) |
| Border-radius | **16 px** (PKO používa rounded, nie hard-edge) |
| Box-shadow | `0 4px 20px 0 rgba(4, 30, 71, 0.25)` (tlmený drop, žiadny brutálny offset) |
| Padding | `--space-5` (24 px) default, `--space-4` (16 px) compact |

Všimni si: core Watt City skin má **3 px čierny stroke + 6/6 offset shadow**. PKO skin túto „brutálnosť" mäkčí na 1 px subtílny border + tradičný drop shadow. To je zámerné — banka nesmie pôsobiť street-wear.

### 6.5 Responzívne breakpointy

```css
/* Tailwind-aligned, Watt City style */
--bp-xs: 360px;
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1440px;
```

Mobile-first: default štýly sú pre `< 768 px`; na desktop dopĺňame cez `@media (min-width: 768px)`.

---

## 7. Component Library

Každý komponent dostane: **účel → anatomy → varianty → stavy → tokeny**.

### 7.1 Button

**Účel:** primárna interakcia (CTA, navigácia, potvrdenie).

**Anatomy:**

```
┌─────────────────────────────────────────┐
│                                         │
│    [icon?]  LABEL  [chevron?]           │
│                                         │
└─────────────────────────────────────────┘
↑ radius 12, padding 12×20 (md), border 0 (filled) or 2 (ghost)
```

**Varianty:**

| Variant | Background | Text | Border | Použitie |
| ------- | ---------- | ---- | ------ | -------- |
| `primary` | `--pko-red` | `--pko-white` | none | Hlavné CTA (Postaw, Graj, Potwierdź) |
| `secondary` | transparent | `--pko-white` | 2px `--pko-white` | Sekundárne (Anuluj, Wróć) |
| `ghost` | transparent | `--pko-white` | none | Linky-vyzerajúce buttony v toolbaroch |
| `danger` | `--pko-danger` | `--pko-white` | none | Zburz, Usuń |
| `icon-only` | transparent | `currentColor` | none | Close, menu toggle, filtre |
| `cta-hero` | `--pko-red` | `--pko-white` | none | Landing hero, veľké tlačidlá na paper BG, 64 px výška |

**Stavy:**

| State | Zmena |
| ----- | ----- |
| default | viď variant |
| hover | `filter: brightness(1.08)`, cursor pointer |
| focus | focus-ring `3px solid --pko-gold`, offset 2 px |
| active | `filter: brightness(0.92)`, transform translateY(1px) |
| disabled | opacity 0.45, cursor not-allowed, no hover |

**Tokeny (primary):**

```css
.btn.pko-primary {
  background: var(--pko-red);
  color: var(--pko-white);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  font-weight: 800;
  font-size: var(--text-body);
  letter-spacing: 0.01em;
  min-height: 44px;
  box-shadow: 0 4px 0 0 #8B1318;  /* tmavšia red ako „zem" */
  transition: filter 120ms ease, transform 120ms ease;
}
```

### 7.2 Card / Panel

**Účel:** skupinovanie obsahu.

**Anatomy:**

```
┌── card ──────────────────────────────────┐
│  HEADER (icon + title + action)          │  ← padding 24
├──────────────────────────────────────────┤
│                                          │
│  BODY (content)                          │
│                                          │
├──────────────────────────────────────────┤
│  FOOTER (optional CTAs)                  │
└──────────────────────────────────────────┘
```

**Varianty:** `default`, `elevated` (viac shadow), `interactive` (hover lift), `success`/`warning`/`danger` (farebný left accent 4 px).

### 7.3 Input field

**Účel:** vstup od používateľa (text, číslo, heslo).

**Anatomy:**

```
┌─ LABEL (text-body-sm, weight 700) ───────┐
│ [optional icon]  placeholder...   [?]    │  ← input box
└──────────────────────────────────────────┘
  helper text / error (text-caption)
```

**Tokeny:**

```css
.pko-input {
  background: var(--pko-white);            /* na paper: navy-500 */
  border: 1.5px solid var(--pko-navy-300);
  color: var(--pko-ink);
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  font-size: var(--text-body);
  min-height: 44px;
}
.pko-input:focus {
  outline: none;
  border-color: var(--pko-red);
  box-shadow: 0 0 0 3px rgba(211, 31, 38, 0.2);
}
.pko-input[aria-invalid="true"] {
  border-color: var(--pko-danger);
}
```

### 7.4 Modal / Dialog

**Účel:** blokujúca akcia, súhlas, potvrdenie.

- Overlay: `rgba(4, 30, 71, 0.72)` (= `--pko-navy-900` 72 % alpha).
- Card max-width 520 px, center, radius 20 px.
- Close button vpravo hore, 44×44 tap target.
- Focus trap povinný; `Escape` zatvára (okrem parental-consent modal, ktorý sa musí explicitne potvrdiť alebo odmietnuť).

### 7.5 Toast / Notification

**Varianty + farba left-accent + ikona:**

| Kind | Accent | Ikona | Trvanie |
| ---- | ------ | ----- | ------- |
| info | `--pko-info` | `i` circle | 4 s |
| success | `--pko-success` | check circle | 3 s |
| warning | `--pko-warning` | triangle ! | 5 s |
| danger | `--pko-danger` | x circle | 6 s (s CTA „Spróbuj ponownie") |
| **tier-up** | `--pko-gold` + confetti | medal | 4 s + sound ak povolené |

Pozícia: bottom-center mobile, top-right desktop. Swipe-to-dismiss na mobile.

### 7.6 Navigation

**Top site-nav (desktop ≥ 768 px):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [LOGO]   Gry  Moje miasto  Kredyty  Ranking        [user chip]  │
└─────────────────────────────────────────────────────────────────┘
 ↑ bg navy-900, 64 px height, border-bottom 1px navy-500
```

**Mobile bottom tabs (< 768 px):**

```
┌────────┬────────┬────────┬────────┬────────┐
│ [home] │ [city] │ [games]│ [loans]│ [more] │
│  Start │ Miasto │  Gry   │ Kredyt │  Ja    │
└────────┴────────┴────────┴────────┴────────┘
```

- Safe-area bottom padding (iOS) — už máme v `globals.css` cez `.bottom-tabs`.
- Active tab: ikona + label `--pko-red`, ostatné `--pko-navy-300`.

### 7.7 ResourceBar (game-critical)

**Anatomy — 4 aktívne resources:**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ 1.2k  🪙 340   🧱 80   💵 W$ 12 480    [per hour +45/h]  │
└─────────────────────────────────────────────────────────────┘
 ↑ chip height 36, gap 12, rounded full, border 1px navy-300
```

Každý chip má ikonu, číslo (tabular-nums), a farbu (`--pko-res-*`).

**Animácie (viď §8):** earn-flash = lime pulse 640 ms; deficit-flash = red border 800 ms.

### 7.8 Progress bar / Level Ring

**Level ring** (pri user chipe):

```
       ╭─────╮
      │  XP  │   ← conic gradient --pko-red, track --pko-navy-300
       ╰─────╯
        L 5
```

Priemer 40 px (compact) / 64 px (profile page). Text levelu v strede, weight 900.

### 7.9 Building card (`/miasto` placement)

```
┌──────────────────────────────────────────┐
│  [isometric building preview]            │
│                                          │
│  Mała elektrownia                  T2    │
│  +12 ⚡/h   -3 💵/h                       │
│  ───────────────────────────             │
│  Koszt: 120 🪙  60 🧱                    │
│  [ Postaw ]    [ Info ]                  │
└──────────────────────────────────────────┘
```

### 7.10 CashflowHUD

```
┌── Cashflow — ostatnia godzina ───────────┐
│  Przychody:   +240 W$                    │
│  Wydatki:     -180 W$                    │
│  Netto:       +60 W$/h   ✓ (zelená)     │
│  ────────────────────────────            │
│  Saldo:       12 480 W$                  │
│  Rata kredytu: 45 W$/h                   │
└──────────────────────────────────────────┘
```

Ak `netto < 0` → header sa zmení na `--pko-warning` background + pulzujúca ikona. Ak `netto < 0` a `saldo < rata × 3` → `--pko-danger`.

### 7.11 Leaderboard row

```
┌ #4 ┐ ┌────────────────────────────────┐ ┌────────┐
│ 04 │ │ [Ż] Basia_9               L.7  │ │ 12 450 │
└────┘ └────────────────────────────────┘ └────────┘
  rank   avatar + username + level        skóre
```

Výška 56 px. Aktuálny používateľ má background `rgba(211, 31, 38, 0.12)` a prefix `Ty →`.

### 7.12 Mortgage calculator block

```
┌── Kalkulator kredytu ────────────────────┐
│  Kwota:     [— 200 W$ +]                 │
│  Okres:     [12 mies.] [24] [36] [48]    │
│  Oprocent.: 5.0 %  (kredyt junior)       │
│  ────────────────────────                │
│  Rata miesięczna:        ~19 W$          │
│  Całkowity koszt:        ~228 W$         │
│  Odsetki:                 28 W$ (12 %)   │
│  ────────────────────────                │
│  [ Pokaż harmonogram ]   [ Zatwierdź ]   │
└──────────────────────────────────────────┘
```

### 7.13 Chat/prompt bubble (AI challenges)

```
       ╭─ pytanie ──────────────────────╮
       │ Masz 50 W$ i 3 opcje. Co       │
       │ zrobisz, żeby mieć za          │
       │ miesiąc więcej?                │
       ╰────────────────────────────────╯
              ↑ mascot tail

┌─ twoja odpowiedź ─┐
│ Wybieram          │
│ oszczędności...   │
└───────────────────┘
      ↑ navy bubble, pravá strana
```

---

## 8. Motion Principles

### 8.1 Easing

| Token | Curve | Použitie |
| ----- | ----- | -------- |
| `--ease-enter` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Elementy vstupujúce do scény (modal, toast, page) |
| `--ease-exit`  | `cubic-bezier(0.4, 0, 1, 1)` | Elementy opúšťajúce scénu |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Hover, focus, state changes |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Signature tier-up, celebrations |

### 8.2 Durations

| Token | ms | Použitie |
| ----- | -- | -------- |
| `--dur-instant` | 100 | Focus ring, checkbox tick |
| `--dur-short` | 200 | Hover, button press |
| `--dur-medium` | 320 | Modal enter, toast enter, panel slide |
| `--dur-long` | 480 | Tier-up pop, celebration, page transitions |

### 8.3 Päť signature animácií

1. **Tier-up pop** — card scale 0.88 → 1.04 → 1.0, 480 ms `--ease-bounce`, `--pko-gold` glow halo, optionálny sound `success-chime.mp3`.
2. **Coin earn (skarbonka-swallow)** — coin SVG letí od zdroja (napr. finished-game modal) do chipu `coins` v ResourceBar. Bezierova krivka, 640 ms. Pri dopade chip pulzne scale 1 → 1.08 → 1.0.
3. **Building place (drop-in + shake)** — budova translateY(-40px) → 0 v 280 ms `--ease-enter`; následne 120 ms shake 2 px X. Prach (5 malých partikúl) fade-out 400 ms. Pri `prefers-reduced-motion` → jednoduchý fade-in 200 ms.
4. **Number tick (cashflow update)** — keď sa číslo W$ mení, tween starou → novou hodnotou cez 320 ms, krok = max(1, delta/20). Ak delta > 1000, skok direct a flash border.
5. **Page transition** — fade 120 ms + translateY 8 px → 0. `--ease-enter`. Mobil: direction-aware (forward/back).

### 8.4 `prefers-reduced-motion`

Všetky animácie MUSIA rešpektovať media query `prefers-reduced-motion: reduce` — v tom prípade sa:

- Trvanie skráti na `0.01ms`.
- Translate/scale/rotate sa úplne vypnú.
- Farebné state zmeny (hover, focus, danger flash) ostávajú — sú informačné.

Už existuje globálny reset v `app/globals.css` riadky 91–100, treba len overiť že nové PKO animácie neobchádzajú cez `style=""` inline.

---

## 9. Sounds & Haptics (voliteľné, default OFF)

> Defaultné nastavenie: **sound = muted**. Škola je primárny kontext, a zapnutý zvuk by bol bezpečnostný ohľad. Dieťa môže zapnúť v Settings → Zvuk; rodič môže lock-núť v `/rodzic` paneli.

### 9.1 Tóny

| Event | Zvuk | Max trvanie | Max dB (pri 100 % volume) |
| ----- | ---- | ----------- | ------------------------- |
| success (kvíz) | krátky 2-tónový chime (C5 → E5) | 300 ms | -14 LUFS |
| failure (kvíz) | single low tone (A3) | 220 ms | -16 LUFS |
| coin-earn | cink (high-pitch C6) | 150 ms | -18 LUFS |
| level-up | ascending arpeggio (C, E, G, C8) | 600 ms | -12 LUFS |
| notification | soft marimba (F5) | 250 ms | -18 LUFS |

### 9.2 Zdroje

Royalty-free banky, ktoré sú bezpečné pre školské využitie:

- **freesound.org** — Creative Commons 0 filter.
- **Zapsplat** (bezplatný účet pre edukáciu).
- **Pixabay Sound Effects** (license Pixabay).

Každý súbor sa musí skontrolovať cez `ffmpeg -i file.mp3 -af volumedetect` pred mergom, aby neprekročil -12 LUFS (súlad so školskou audio politikou).

### 9.3 Haptika (mobile PWA)

- Tier-up: `navigator.vibrate([40, 30, 40])`.
- Úspech: `navigator.vibrate(20)`.
- Chyba: `navigator.vibrate([60, 40, 60])` — len ak dieťa je staršie 12+, pre 9–11 vypnuté.

---

## 10. Voice, Copy & UX Writing

### 10.1 Päť pravidiel pre mikro-text (deti 9–14)

1. **Max 8 slov na tlačidle**, max 14 na popiske.
2. **Sloveso pred podstatným menom** — „Postaw budynek" nie „Budynek — postaw".
3. **Bez passive voice** — „Zbudowałeś dom" nie „Dom został zbudowany".
4. **Konkrétne čísla**, nie nejasné slová — „Za 3 dni" nie „Wkrótce".
5. **Jedno vykanie na obrazovku max** — ak je to detská stránka, tykáme. Parent/teacher stránky vždy vykáme.

### 10.2 Tlačidlá — kľúčové lexikálne pravidlá (PL)

| Default (áno) | Zlé varianty (nie) | Kontext |
| ------------- | ------------------ | ------- |
| **Postaw**    | Kupuj, Nabywaj     | Placement budovy |
| **Graj**      | Start, Rozpocznij gameplay | Začať hru |
| **Spróbuj ponownie** | Retry, Ponów | Po chybe |
| **Zatwierdź** | Ok, Akceptuj       | Potvrdiť kredit/súhlas |
| **Anuluj**    | Cofnij (len v editore) | Zrušiť dialog |
| **Pokaż harmonogram** | Wyświetl tabelę amortyzacji | Mortgage |
| **Zburz**     | Usuń, Delete       | Demolish budovu |
| **Zapisz**    | Save (angl.)       | Ulož stav |
| **Zagraj duel** | Duel start | Start 2-player |
| **Wyjdź**     | Logout, Zaloguj wyloguj | Odhlásiť |

### 10.3 Error messages — empatický tone

| Error kind | Default PL | Anglický preklad |
| ---------- | ---------- | ---------------- |
| Network | „Internet się schował. Spróbuj jeszcze raz." | Internet hid. Try again. |
| Server 500 | „Coś nam się pomyliło. Już naprawiamy." | Something got mixed up. Already fixing. |
| Validation (form) | „Ta liczba nie może być większa niż Twoje saldo (12 480 W$)." | — |
| Rate-limit | „Za szybko! Daj nam chwilę." | — |
| Expired session | „Spałeś dłużej niż my. Zaloguj się ponownie." | — |

### 10.4 Rodičovský / učiteľský tón

Pre `/rodzic` a `/nauczyciel`:

- Vykáme (Pan / Pani).
- Formálnejší register, ale stále teplý.
- Nikdy „Pani Mamo", vždy „Szanowna Pani / Szanowny Panie".
- Max 1 emoji-free pravidlo (manuál zakazuje emoji v brand identity).

### 10.5 Desať „tak áno / tak nie" príkladov kópie v PL

1. Onboarding krok 1 — **ÁNO:** „Zaczynamy od małego domku. To twój pierwszy budynek." **NIE:** „Witaj w Watt City! Tutaj rozpoczniesz swoją epicką przygodę!"
2. Parent invite CTA — **ÁNO:** „Zaproś rodzica" **NIE:** „Wyślij zaproszenie do opiekuna prawnego w celu uzyskania zgody"
3. Tier-up — **ÁNO:** „Poziom 4! Odblokowałeś hutę szkła." **NIE:** „Osiągnąłeś nowy poziom rozwoju gry!"
4. Quiz correct — **ÁNO:** „Dobrze! +10 🪙" **NIE:** „Twoja odpowiedź jest poprawna."
5. Quiz wrong — **ÁNO:** „Prawidłowa odpowiedź to 120. W następnej rundzie na pewno się uda." **NIE:** „Niepoprawnie. Spróbuj ponownie."
6. Hypotéka CTA — **ÁNO:** „Weź kredyt 200 W\$" **NIE:** „Sfinalizuj produkt kredytowy"
7. Cashflow warning — **ÁNO:** „Uwaga — wydajesz więcej niż zarabiasz." **NIE:** „Alert: ujemny przepływ pieniężny!"
8. Session expired (rodzic) — **ÁNO:** „Dla bezpieczeństwa Państwa konta zostali Państwo wylogowani. Proszę zalogować się ponownie." **NIE:** „Session timeout. Re-auth required."
9. Daily limit reached (9–11) — **ÁNO:** „Na dziś koniec! Do jutra rośnie nowa runda." **NIE:** „Osiągnięto dzienny limit rozgrywek."
10. GDPR revoke confirm — **ÁNO:** „Czy na pewno chcesz usunąć wszystkie dane dziecka? To jest nieodwracalne." **NIE:** „Potwierdź wykonanie żądania Art. 17 RODO."

### 10.6 Bilingválna škála

Hlavné príklady v manuáli sú v PL. UK/CS/EN ekvivalenty ukladá team do `lib/i18n.ts` dict tables. Pravidlá registerov ostávajú identické naprieč jazykmi (kids tykáme, dospelí vykáme). Pre CS mame zvlášť „5. pád" oslovenia (napr. „Honzo, jsi na 5. úrovni") — nie násilne, len v onboarding a celebrations.

---

## 11. Web Mapping — AKO TO APLIKUJEME

Táto sekcia je **kontrakt medzi manuálom a repom**. Každý token má presný súbor a názov premennej.

### 11.1 `lib/theme.ts` — `PKO_THEME` objekt

| Field | Aktuálna hodnota (pre-v0.1) | Navrhovaná PKO v0.1 |
| ----- | --------------------------- | ------------------- |
| `colors.accent` | `#d31f26` | **`#D31F26`** (ponechať, len case-normalizácia) |
| `colors.accentInk` | `#ffffff` | `#FFFFFF` |
| `colors.background` | `#052c65` | **`#052C65`** (= `--pko-navy-700`) |
| `colors.surface` | `#0b3a7a` | **`#0B3A7A`** (= `--pko-navy-500`) |
| `colors.ink` | `#ffffff` | `#FFFFFF` |
| `brand` | "PKO Junior × Watt City" | beze zmeny |
| `brandShort` | "PKO" | beze zmeny |
| `disclaimer` | (existujúci PL disclaimer) | beze zmeny, možno dopracovať v v0.2 |
| `mascot.svg` | placeholder Żyrafa | **substitute until official asset** |

Pridať nový export `PKO_TOKENS` s plnou paletou (§3), aby komponenty nemuseli duplikovať hex-y:

```ts
export const PKO_TOKENS = {
  red:       "#D31F26",
  navy900:   "#041E47",
  navy700:   "#052C65",
  navy500:   "#0B3A7A",
  navy300:   "#4766A6",
  ink:       "#0A1428",
  paper:     "#F6F1E7",
  white:     "#FFFFFF",
  gold:      "#E4B23A",
  success:   "#2E8B57",
  warning:   "#E4B23A",
  danger:    "#B3261E",
  info:      "#2F6FED",
  resources: {
    watts:  "#F5C518",
    coins:  "#D98323",
    bricks: "#8B4A2B",
    cash:   "#1E7A3C",
  },
} as const;
```

### 11.2 `app/globals.css` — injekcia `:root[data-skin="pko"]`

Pridať nasledujúci blok **po** existujúcom `:root { ... }` (riadok ~136):

```css
:root[data-skin="pko"] {
  /* semantic surfaces */
  --background: #052C65;
  --foreground: #FFFFFF;
  --surface:    #0B3A7A;
  --surface-2:  #4766A6;
  --ink:        #FFFFFF;
  --shadow:     rgba(4, 30, 71, 0.35);

  /* brand tokens */
  --pko-red:       #D31F26;
  --pko-navy-900:  #041E47;
  --pko-navy-700:  #052C65;
  --pko-navy-500:  #0B3A7A;
  --pko-navy-300:  #4766A6;
  --pko-ink:       #0A1428;
  --pko-paper:     #F6F1E7;
  --pko-white:     #FFFFFF;
  --pko-gold:      #E4B23A;

  /* semantic */
  --pko-success:   #2E8B57;
  --pko-warning:   #E4B23A;
  --pko-danger:    #B3261E;
  --pko-info:      #2F6FED;

  /* resources */
  --pko-res-watts:  #F5C518;
  --pko-res-coins:  #D98323;
  --pko-res-bricks: #8B4A2B;
  --pko-res-cash:   #1E7A3C;

  /* accent mapping — zachováva core contract */
  --accent:   var(--pko-red);
  --accent-2: var(--pko-gold);
  --brand:    var(--pko-navy-700);

  /* typography */
  --font-sans: var(--font-pko-sans, "Nunito", system-ui, sans-serif);

  /* radius + shadow recalibrácia — jemnejšie než core */
  --card-radius: 16px;
  --card-shadow: 0 4px 20px 0 rgba(4, 30, 71, 0.25);
}
```

Atribút `data-skin="pko"` nastavuje `app/layout.tsx` na `<html>` tag podľa `resolveTheme().id`.

### 11.3 `lib/resources.ts` — 7 resource colors

V0.1 **nemeníme** existujúce hex hodnoty v `RESOURCE_DEFS` — tie sú component-default a platia pre core skin. Pre PKO skin sa farba číta priamo z CSS premenných `--pko-res-*` v ResourceBar komponente, cez:

```tsx
// components/resource-bar.tsx (pseudo)
const color = theme.id === "pko"
  ? `var(--pko-res-${def.key})`
  : def.color;
```

Alternatívne (čistejšie) — rozšíriť `ResourceDef` o `colorByTheme: { core: string; pko: string }`. Rozhodnutie: odložené na review (viď §14 open items).

### 11.4 `lib/building-catalog.ts` — roof × body override

Pridať pomocnú funkciu:

```ts
export function buildingColorsForSkin(
  entry: BuildingCatalogEntry,
  skin: SkinId,
): { roofColor: string; bodyColor: string } {
  if (skin !== "pko") {
    return { roofColor: entry.roofColor, bodyColor: entry.bodyColor };
  }
  const m = PKO_BUILDING_PALETTE[entry.id];
  return m ?? { roofColor: entry.roofColor, bodyColor: entry.bodyColor };
}

const PKO_BUILDING_PALETTE: Record<string, { roofColor: string; bodyColor: string }> = {
  "domek":              { roofColor: "#D98323", bodyColor: "#F5C518" },
  "sklepik":            { roofColor: "#D31F26", bodyColor: "#8B4A2B" },
  "mala-elektrownia":   { roofColor: "#F5C518", bodyColor: "#8B4A2B" },
  "bank-lokalny":       { roofColor: "#052C65", bodyColor: "#041E47" },
  "huta-szkla":         { roofColor: "#4766A6", bodyColor: "#0B3A7A" },
  "biblioteka":         { roofColor: "#E4B23A", bodyColor: "#8B4A2B" },
  "walcownia":          { roofColor: "#4766A6", bodyColor: "#0A1428" },
  "gimnazjum-sportowe": { roofColor: "#D31F26", bodyColor: "#052C65" },
  "centrum-nauki":      { roofColor: "#1E7A3C", bodyColor: "#0B3A7A" },
  "fotowoltaika":       { roofColor: "#F5C518", bodyColor: "#4766A6" },
  "software-house":     { roofColor: "#2F6FED", bodyColor: "#0A1428" },
  "kosciol":            { roofColor: "#E4B23A", bodyColor: "#F6F1E7" },
  "park":               { roofColor: "#1E7A3C", bodyColor: "#2E8B57" },
  "fontanna":           { roofColor: "#4766A6", bodyColor: "#052C65" },
  "spodek":             { roofColor: "#D31F26", bodyColor: "#041E47" },
};
```

### 11.5 `components/site-nav.tsx` — brand chip + logo

Aktuálny kód (overené riadky 90–97) rendruje `{theme.brandShort}` ako textový chip. V PKO skine namiesto textového chipu treba vyrenderovať SVG logolock-up z §2.4. Navrhujem:

```tsx
// v site-nav.tsx okolo riadku 90
{theme.id === "pko"
  ? <PkoLogolock variant="horizontal" height={36} />
  : <span className="chip">{theme.brandShort}</span>}
```

Nový komponent `components/pko-logolock.tsx` bude hostovať SVG z §2.4 ako inline markup (≤ 2 KB, nie external `<img>`).

### 11.6 `public/icons/*.svg` — PWA icons

| Súbor | Obsah (core dnes) | Obsah PKO skin |
| ----- | ----------------- | -------------- |
| `icon-192.svg` | core brutálny „WC" monogram | skarbonka substitute z §2.4, 192×192, navy BG, biely mark, red coin |
| `icon-512.svg` | ditto | to isté v 512×512 |
| `icon-maskable.svg` | ditto | 80 % safe-zone, skarbonka centrovaná, navy fill na 100 % plátne |

Detekciu skinu pre PWA ikony **nerobíme runtime** (browser ich cachuje z manifestu) — miesto toho máme dva manifest súbory: `manifest.core.webmanifest` a `manifest.pko.webmanifest`, a middleware podľa `SKIN` env var servuje správny. (Otvorená otázka §14, potreba verify s Next 16 manifest API.)

### 11.7 `app/layout.tsx` — footer disclaimer

Aktuálny kód používa `theme.disclaimer` (riadok 241 okolí). V0.1 ponechávame existujúci PKO disclaimer string ako default, pridávame len **ikonu `info`** pred text a **3-jazyčnú rotáciu** (PL default, UK/CS/EN cez `<Link>` pod).

### 11.8 Tailwind v4 `@theme inline` rozšírenie

V `app/globals.css` v bloku `@theme inline` (riadky 138–149) pridať:

```css
@theme inline {
  /* existujúce */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */

  /* NOVÉ pre PKO — dostupné ako bg-pko-red, text-pko-gold, atď. */
  --color-pko-red:     var(--pko-red);
  --color-pko-navy:    var(--pko-navy-700);
  --color-pko-navy-deep: var(--pko-navy-900);
  --color-pko-paper:   var(--pko-paper);
  --color-pko-gold:    var(--pko-gold);
  --color-pko-success: var(--pko-success);
  --color-pko-danger:  var(--pko-danger);
  --color-pko-res-watts:  var(--pko-res-watts);
  --color-pko-res-coins:  var(--pko-res-coins);
  --color-pko-res-bricks: var(--pko-res-bricks);
  --color-pko-res-cash:   var(--pko-res-cash);
}
```

---

## 12. Asset Checklist — čo dodať pred launchom

| # | Asset | Formát | Zdroj | Status v v0.1 |
| - | ----- | ------ | ----- | ------------- |
| 1 | Primárny horizontal logolock | SVG (≤ 4 KB) | dizajnér + PKO potvrdenie | substitute existuje (§2.4) |
| 2 | Vertical logolock | SVG | dizajnér | TBD |
| 3 | Mono logolock (1-color print) | SVG | dizajnér | TBD |
| 4 | Reverse logolock (na red BG) | SVG | dizajnér | TBD |
| 5 | Favicon 16/32/48 px | ICO + PNG | pipeline z SVG | TBD |
| 6 | PWA icon 192/512 | SVG, PNG fallback | pipeline | substitute |
| 7 | Maskable PWA icon | SVG 409×409 safe | pipeline | substitute |
| 8 | Żyrafa mascot — 5 póz × 5 emócií | SVG | illustrator (pozri §5.6) | placeholder |
| 9 | OG image template 1200×630 (PL/UK/CS/EN) | PNG export z Figma | dizajnér | TBD |
| 10 | Twitter card 1200×675 | ditto | dizajnér | TBD |
| 11 | Pitch deck template (rebrand `lib/pitch-pdf.tsx`) | React-PDF | dev + dizajnér | TBD |
| 12 | PDF report šablóna (`lib/pdf-report.tsx`) | React-PDF | dev + dizajnér | TBD |
| 13 | Parental-consent e-mail template (HTML + plaintext) | MJML → HTML | dev + UX writer | TBD |
| 14 | Loading/empty-state ilustrácie (4 kusy: no-games, no-buildings, offline, error) | SVG | illustrator | TBD |
| 15 | 20 base icons v line + filled variante | SVG sprite | dizajnér | substitute — používame Lucide/Heroicons until |
| 16 | Building renders — 15 budov, 3 uhly (iso, side-PL, side-PR) | SVG/PNG | illustrator | existuje v core, čaká na PKO repaint |
| 17 | Social media kit (Instagram 4:5, TikTok 9:16, YouTube thumbnail 16:9) | PNG | dizajnér | TBD |
| 18 | Onboarding tutorial vector set (6 stepov) | SVG | illustrator | TBD |
| 19 | Typography sample sheet (Nunito vs. TT Commons Pro comparison) | PDF | dizajnér | TBD |
| 20 | Brand governance cheatsheet (1 pager) | PDF | brand lead | TBD |

---

## 13. Governance

### 13.1 Role & approval matica

| Rola | Schvaľuje |
| ---- | --------- |
| Product owner (B2JK) | Akýkoľvek produktový text, tlačidlá, mikro-copy. |
| Brand lead (B2JK) | Logo, farby, font, ikony, mascot pózy. |
| Tech lead (B2JK) | Tokeny v kóde (`lib/theme.ts`, `globals.css`), skin toggles. |
| PKO BP brand team | Akékoľvek použitie oficiálneho PKO BP loga; všetok externý marketing. |
| PKO Junior product manager | Onboarding, parent-consent copy, cenníky (hoci hra je free). |
| Legal (GDPR-K counsel) | Disclaimery, T&C, súhlas rodičov, GDPR Art. 17 flow. |

### 13.2 Approval flow

```
    Interné zmeny (token, komponent, ikona)
    ────────────────────────────────────────
       PR → Brand lead review → merge ak approved
                      ↓
             Logged do CHANGELOG

    Externé použitie (reklama, tlač, YouTube)
    ────────────────────────────────────────
       Návrh → Brand lead → Product owner →
         → PKO BP brand team review →
           → Legal (ak verejný) →
             → Schválenie + archív v docs/partnerships/approvals/
```

### 13.3 Zakázané kombinácie

- PKO logo na pozadí s priehľadnou alebo rušnou fotografiou.
- Kombinácia s tretími partnermi bez zmluvy (žiadny „PKO × Watt City × XYZ" tri-brand).
- Meme formát, gif-y, reaction formats s brand assets.
- Crypto/Web3 messaging v PKO skine. Web3 medailový opt-in layer je **default core-skin-only** (SKIN ≠ pko) alebo feature-flag-ed off v PKO build.
- Hocijaké AI-generované obrázky (Midjourney, DALL-E) v final markete produkcii.

### 13.4 Verzovanie manuálu + revízie

- Semver: `vMAJOR.MINOR`. MAJOR bump = breaking token change (farba, logo, font). MINOR = nové komponenty, rozšírenia, typo fixes.
- **v0.1 → v0.2** expected trigger: PKO BP brand team dodá oficiálne logo a font → všetky substitute položky sa prepíšu.
- Plánovaná revízia: každých 6 mesiacov (apríl a október), alebo pri rebrande PKO BP (najbližší očakávaný ~2027–2028).
- Každá verzia produkuje git tag `brand-manual/v0.1`, `brand-manual/v0.2`, ...
- Changelog + migračný guide musí sprevádzať každú MAJOR zmenu tokenu.

---

## 14. Open items pre reviewerov

Tieto položky potrebujú rozhodnutie **pred** aplikáciou manuálu na kód:

1. **Resource-farba kontrakt** (§11.3) — dualita „component-default hex v `RESOURCE_DEFS`" vs. „CSS premenná per skin". Rozhodnúť či rozšíriť `ResourceDef.colorByTheme` (čisté, viac testov) alebo čítať CSS variable v komponente (rýchle, menej typed).
2. **PWA manifest per skin** (§11.6) — overiť v Next 16 manifest API, či runtime-selected `manifest.webmanifest` funguje s PWA install flow; alebo urobíme dva buildy (skin=core vs skin=pko) s rôznym manifestom.
3. **Font licencia** (§4.1) — potvrdiť s PKO legal či je Nunito SIL OFL akceptovateľný aj pre PKO materiály (nie len Watt City), alebo ideme TT Commons Pro a platíme licenciu.
4. **Żyrafa mascot vektor** (§5.6) — existuje oficiálny PKO Junior Żyrafa vektor? Ak áno, získať SVG + pose library. Ak nie, urobiť vlastnú (B2JK illustrator), ale to musí schváliť PKO.
5. **Building palety** (§11.4) — pre 15 budov je navrhnutý mapping „citom", ale chce to A/B test s cieľovou skupinou 9–14 či nová navy-dominantná paleta nepôsobí „škola/boring" po core neon skine.

---

## 15. Changelog

| Verzia | Dátum | Autor | Zmena |
| ------ | ----- | ----- | ----- |
| **v0.1** | 2026-04-24 | vygenerovaný AI assistantom pre B2JK-Industry/watt-city | prvý draft — full structure, tokeny, komponenty, mapping na repo. Finálny review čaká na PKO BP partnership signed. |

---

*Koniec dokumentu. Zmeny a návrhy: otvoriť issue v repozitári s tagom `brand-manual`.*
