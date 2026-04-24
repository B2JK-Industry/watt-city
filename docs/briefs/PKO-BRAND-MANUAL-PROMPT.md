# Prompt pre AI agenta — vygenerovanie grafického manuálu PKO pre Watt City

**Účel:** Tento prompt zadáš AI agentovi (Claude Opus / Sonnet, GPT-5, Gemini 2.5, alebo podobný model s výstupom v Markdown + možnosťou generovať obrázky/SVG). Agent vráti **kompletný grafický manuál** šitý na mieru hre Watt City tak, aby sme ho v ďalších krokoch mohli aplikovať na reskin UI (tokens v `lib/theme.ts`, `app/globals.css`, `lib/building-catalog.ts`, `lib/resources.ts`).

**Kontext projektu pre rýchlu orientáciu:**
- Watt City = gamifikovaná finančná edukácia pre deti 9–14 r., Next.js 16 + React 19 + Tailwind 4.
- 1. miesto PKO Gaming track, ETHSilesia 2026. PKO partnership path je aktívny (SKO 2.0 prototype).
- V repe už existuje placeholder `PKO_THEME` v `lib/theme.ts` s farbami `#d31f26` (red) a `#052c65` (navy) a Żyrafa mascot placeholder. Tento manuál ho má **nahradiť kanonickými hodnotami** a rozšíriť o kompletný systém.

---

## PROMPT (skopíruj celé nižšie do agenta)

```
# ROLA
Si senior brand designer a design-system architekt s 15-ročnou praxou
pre retail banking a fintech. Robil si rebrandingy pre Revolut, N26,
mBank a PKO Junior. Rozumieš poľskému finančnému trhu, GDPR-K
(ochrana detí do 16 r.) a detskej edukácii vekovej skupiny 9–14.

# ÚLOHA
Vytvor kompletný grafický manuál (Brand & Visual Identity Guide) pre
produkt „PKO Junior × Watt City" — gamifikovanú finančnú edukáciu,
ktorá je v partnerstve s PKO Bank Polski. Manuál musí byť priamo
aplikovateľný na existujúcu web-aplikáciu (Next.js + Tailwind CSS)
a musí rešpektovať verejne dostupné brand guidelines PKO BP pri
súčasnom zachovaní hernej, detskej atmosféry Watt City.

Výstup je interný pracovný manuál pre development team, nie finálny
1000-stranový brand book banky. Cieľ: dev + dizajnér vedia za deň
preklopiť Watt City do PKO-skin verzie bez hádania.

# KONTEXT — PKO BANK POLSKI (zhrnutie verejných zdrojov, apríl 2026)

**História loga a symbolu**
- Autor: Karol Śliwka, 1968. „Skarbonka" (prasiatko-pokladnička)
  skladaná z písmen P, K, O s padajúcou mincou. Symbol získal zlatú
  medailu na Biennale plagátu v Katowiciach 1969.
- Rebrand 2011: White Cat Studio + Karol Śliwka. Svetlomodrá +
  oranžová nahradená tmavou navy/čiernou + „Polish red" mincou.
  Typografia: tenké, zaoblené písmo, custom corporate font.
- Refresh 2025 (jún): evolúcia, nie revolúcia. Lift logotypu
  + typeface pre lepšiu čitateľnosť v digitálnych médiách.
  (Marcin Szymkowiak, marketing director PKO BP.)
- Brand book PKO BP presahuje 1000 strán.
- Slogan: „PKO Bank Polski. Dzień Dobry." Historický: „Pewność
  i Zaufanie" (Istota a dôvera).

**Publikované hodnoty (verejné zdroje, NIE interný brand book)**
- Primárna červená (coin / accent): približne #D31F26 — „Polish red",
  energia, národná identita.
- Primárna navy/čierna (skarbonka / wordmark): tmavá tlmená navy
  → black gradient. V skin-tokene projektu momentálne #052C65.
- Biela a teplé neutrálne odtiene ako doplnok.
- Typografia: rounded, thin, humanistic sans-serif (custom).
  Akceptovateľné verejné substitúty: Circular Std, Nunito,
  Poppins (rounded weights), TT Commons Pro.

**Produktová línia PKO Junior** (detský segment, <18 rokov)
- Rodičovská kontrola, edukačný tone of voice, gamifikácia
  (odznaky, ciele). Ikonografia založená na motíve skarbonky,
  mince, mestskej krajiny, žirafy (Junior mascot).

# KONTEXT — WATT CITY

**Herný koncept**
- Cieľová skupina: deti 9–14 r. v Poľsku (PL default; UK, CS, EN
  lokalizácie).
- Core loop: hraj 9 evergreen minigier + denné AI výzvy → zarábaj
  7 zdrojov (⚡ 🪙 🧱 🪟 🔩 💼 💵) → buduj mesto Katowice na 20-slot
  SVG mape → zaciagaj hypotéku (8 % / 5 %) → sleduj credit score 0–100.
- Ekonomika: hodinový cashflow tick, amortized mortgage, tier-up system
  (9 levelov odomyká upgrady budov).
- Partnerská vrstva: Web3 soulbound ERC-721 `WattCityMedal` na Base
  Sepolia (opt-in, parent-gated, burn-on-revoke — GDPR Art. 17).

**Aktuálny vizuálny jazyk (core skin — ten, ktorý prepisujeme)**
- Neo-brutalist: hranaté tvary, 3 px čierny stroke, yellow accent
  `#fde047`, tmavý background `#0a0a0f`, surface `#0f172a`.
- Fonty: Geist Sans (regular) + Geist Mono (mono) cez Google Fonts.
- Tlačidlá: font-weight 800, letter-spacing 0.01em, kontrastné
  `box-shadow`, capsule/rectangular shapes.
- Doplnkové neon farby: pink #f472b6, cyan #22d3ee, lime #a3e635,
  orange #fb923c, red #f87171.

**Kľúčové obrazovky, ktoré treba rebrandovať (priorita TOP)**
1. `/` landing + dashboard — XP ring, rank, „Tvoje mesto" karta
2. `/miasto` — SVG Katowice panorama, placement/upgrade/demolish UI,
   CashflowHUD, hypotékový engine, budovy (10+ typov so zastreším
   hardkódovanou v `lib/building-catalog.ts`)
3. `/games` — hub 9 minigier + live AI rotácia (3 sloty)
4. `/games/{id}` — single-game obrazovky (Finance Quiz, Math Sprint,
   Memory Match, Word Scramble, Budget Balance, Currency Rush,
   Power Flip, Energy Dash, Stock Tap)
5. `/loans/compare` — hypotékový kalkulátor, amortizačná tabuľka
6. `/leaderboard` — top 100, per-game, Hall of Fame
7. `/duel` — 2-player race (6-char code)
8. `/nauczyciel` — učiteľský dashboard (MEN V–VIII compliance)
9. `/rodzic` — rodičovský observer panel (GDPR-K gated)
10. `/pko` — PKO Junior mock mirror (existujúca stub stránka)

**Kľúčové UI komponenty, ktoré treba premaľovať**
- ResourceBar (7 farebných zdrojov s hex-kódmi v `lib/resources.ts`)
- CashflowHUD (amber banner pre deficit, yellow accent pre /h)
- Building cards (roofColor/bodyColor per budova)
- Tier-Up Toast (pop animation)
- Level Ring (conic gradient)
- Site nav (brand chip + logo)
- Tlačidlá (.btn, .btn-primary, .btn-pink, .btn-danger, …)
- Card/Panel (.card so 3 px border)
- Modal/Dialog overlay

# ČO MÁŠ DORUČIŤ — ŠTRUKTÚRA MANUÁLU

Vráť jeden Markdown dokument s týmito sekciami (presne v tomto poradí,
s týmito názvami). Kde je to zmysluplné, pridaj ASCII wireframes alebo
generuj SVG/obrázkové ukážky.

## 1. Brand Essence
- Pozícia značky: 1 vetou, kto sme v rámci PKO ekosystému
- Brand promise: 3 piliere (napr. Bezpečnosť / Hra / Rast)
- Tone of voice: 4–6 adjektív + „tak áno / tak nie" tabuľka
  (napr. áno: hravé, priateľské, hrdé; nie: infantilné, korporátne)
- Target persona: vekové podsegmenty 9–11 vs. 12–14, rodič,
  učiteľ

## 2. Logo System
- Primárny logolock: „PKO Junior × Watt City" — navrhni layout
  (horizontal, vertical, kompaktný bez-symbolový lock-up).
  Dodaj SVG alebo ASCII nákres pre každú variantu.
- Clear space rule (minimálna ochrana zóna okolo loga).
- Minimálne veľkosti (web px, print mm).
- Do's & don'ts (8 konkrétnych pravidiel — neinvertuj skarbonku,
  neroztiahaj, …).
- Co-branding rule: ako kombinovať PKO BP logo + Watt City wordmark.

## 3. Color System
Dodaj **hex, RGB, HSL, CMYK (aproximácia), WCAG AA/AAA kontrastný ratio
oproti `#ffffff` a `#000000`** pre každú farbu. Pomenuj každý token
menom použiteľným ako CSS premenná.

Minimum tokenov:
- `--pko-red` (primary accent, coin) — odvoď od #D31F26, overuj
  AA kontrast na navy
- `--pko-navy-900` → `--pko-navy-500` (4-stupňová shade škála)
- `--pko-ink` (text on light)
- `--pko-paper` (warm off-white, background alternatíva)
- `--pko-gold` (doplnkový akcent pre úspech/reward — navrhni tón
  korešpondujúci s mincou)
- `--pko-success` / `--pko-warning` / `--pko-danger` — sémantické,
  musia sa držať v rámci brand-palety (nie žiarivé neon)
- Game-resource paleta: navrhni 7 farebných tokenov pre Watts /
  Coins / Bricks / Glass / Steel / Business / CashZl tak, aby
  neboli vzájomne zameniteľné pre farboslepých (simuluj deuteranopia)
  a zároveň harmonizovali s PKO navy+red základom.

Dodaj:
- Color-use guidance (kde je ktorá farba dovolená — povrchy, texty,
  akcenty, error states).
- Gradient specs (PKO používa navy → black).
- Accessibility table: každá kombinácia foreground/background
  s WCAG ratingom.

## 4. Typography
- Primárny font: navrhni 2–3 open-source alternatívy najbližšie
  oficiálnemu PKO custom fontu (rounded humanistic sans).
  Odporúčanie: Nunito / TT Commons Pro / Circular alternatíva.
  Poznač licenciu a dostupnosť cez Google Fonts / Fontsource.
- Sekundárny / mono font: pre čísla, kódy, monospace panely
  (zachovaj Geist Mono ak nie je konflikt, inak navrhni substitút).
- Type scale: H1 → H6 + body large / body / small / caption / micro
  s presnými `rem` hodnotami + `line-height` + `letter-spacing` +
  `font-weight`. Navrhuj v 4 px / 8 px gride.
- Responzívna škála: desktop → tablet → mobile breakpoint tokens.
- Do's & don'ts pre typografiu (uppercase kedy áno, letter-spacing,
  avoid orphans, numerický sloupec pre číslovku v cashflow).

## 5. Iconography & Illustration
- Ikonová sada: line-style alebo filled? Stroke-width? Corner radius?
  Navrhni 20 base ikon (menu, mesto, hra, hypotéka, rodič, učiteľ,
  zdroje, budova, leaderboard, duel, upozornenie, úspech, chyba,
  nastavenia, odhlásiť, pomoc, kalendár, notifikácia, medaila, lock).
- Illustration style: ploché? mierne 3D? isometric pre mesto?
  Dodaj 2 varianty s rationale.
- Mascot: PKO Żyrafa — definuj proporcie, povolené pózy (5),
  emócie (happy/encouraging/thinking/celebrating/calm).
  Ako/kedy mascota NEpoužívať.
- Building art direction: 10+ budov v `/miasto` — definuj jednotný
  vizuálny jazyk (farby striech, fasády, okná, svetlá pri noci).
  Dodaj farebnú paletu pre building roofs + bodies, ktorá vychádza
  z PKO navy+red+gold a zároveň odlíši 10+ typov budov.

## 6. Layout & Grid
- Baseline grid: 4 px / 8 px
- Content container širka (mobile, tablet, desktop)
- Card/panel rules: padding, border-radius, border/shadow
- Spacing tokens (`space-1` .. `space-16`) v `rem`
- Responzívne breakpointy (mobile-first: 360, 768, 1024, 1440)

## 7. Component Library
Pre každý komponent: popis účelu + anatomy diagram (ASCII alebo SVG)
+ varianty + stavy (default/hover/focus/active/disabled) +
design tokens.

Minimum komponentov:
- Button (primary, secondary, ghost, danger, icon-only, CTA-hero)
- Card / Panel (default, elevated, interactive, success/warning/danger)
- Input field (text, number, password, error state)
- Modal / Dialog
- Toast / Notification (info, success, warning, danger, tier-up)
- Navigation bar (top site nav + mobile bottom tabs)
- ResourceBar (7 resource chips + animated earn)
- Progress bar / Level Ring
- Building card (pre /miasto placement)
- CashflowHUD (per-hour summary panel)
- Leaderboard row
- Mortgage calculator block
- Chat/prompt bubble (pre AI challenges)

## 8. Motion Principles
- Easing curves (odporúčanie: ease-out pre enter, ease-in pre exit)
- Durations (instant 100 ms, short 200 ms, medium 320 ms, long 480 ms)
- 5 signature animations:
  - tier-up pop (level-up toast)
  - coin earn (skarbonka swallow)
  - building place (drop-in + shake)
  - number tick (cashflow update)
  - page transition (fade + translate)
- Respekt `prefers-reduced-motion` (existuje v `app/globals.css:91`).

## 9. Sounds & Haptics (voliteľné, ale navrhnuté)
- Tone (success, failure, coin, level-up, notification)
- Max duration, dB level, suggested royalty-free banky
- Mute-by-default pre EDU prostredie (škola)

## 10. Voice, Copy & UX Writing
- Mikro-texty pre deti 9–14: 5 pravidiel
- Tlačidlá (primer: „Postaw" nie „Kupuj", „Graj" nie „Start")
- Error messages: empatické, neformálne, direktívne
- Rodičovský / učiteľský tón je formálnejší
- 10 príkladov „tak áno / tak nie" kópií v PL

## 11. Web Mapping — AKO TO APLIKUJEME
Konkrétna tabuľka: náš zdrojový súbor → ktorý token manuálu ide
dovnútra. Obsahuje minimum:
- `lib/theme.ts` `PKO_THEME` → aké presné hex namiesto súčasných
- `app/globals.css` `:root` → všetky `--pko-*` premenné, ktoré sa
  injektujú pri `SKIN=pko`
- `lib/resources.ts` → 7 resource colors
- `lib/building-catalog.ts` → roofColor + bodyColor per budova
- `components/site-nav.tsx` → brand chip, logo path
- `public/icons/icon-192.svg`, `icon-512.svg`, `icon-maskable.svg` → nový PWA icon
- `app/layout.tsx` footer disclaimer copy (už v `PKO_THEME.disclaimer`)

## 12. Asset Checklist
Čo musí dodať tím pred launchom:
- Logo SVG (primár, mono, reverse)
- Favicon / PWA ikony (16, 32, 192, 512, maskable)
- Mascot Żyrafa SVG (5 póz × 5 emócií = 25 variantov)
- OG image template (1200×630 PL/UK/CS/EN)
- Social media kit (IG story / FB post / LinkedIn card)
- Pitch deck template (existujúci v `lib/pitch-pdf.tsx` — rebranding)
- PDF report šablóna (`lib/pdf-report.tsx`)
- Email template (parental-consent invite, existuje v `lib/mailer.ts`)

## 13. Governance
- Kto schvaľuje nové použitia značky (role)
- Approval flow pre reklamu, tlač, školské materiály
- Zakázané kombinácie
- Verziovanie manuálu + kedy sa revíduje

# KVALITATÍVNE KRITÉRIÁ (ako budem hodnotiť výstup)

1. **Legálna bezpečnosť:** nepoužívaj nič, čo je proprietárne PKO
   (oficiálne vektory, interný font). Všetko substituuj voľnými
   ekvivalentmi a jasne označ „substitute until official asset
   dostupný po signed partnership".
2. **Aplikovateľnosť:** každý token má CSS premennú a mapping na
   konkrétny súbor v repe. Bez „fluffy" abstrakcií.
3. **Kids-first, bank-serious:** balans — ani detinské, ani sterilné.
   Keď má rodič preletieť appkou, musí cítiť „to je seriózne, dôverujem
   tomu". Keď ju otvorí dieťa, má cítiť „ideme hrať".
4. **Prístupnosť:** WCAG AA minimum (AAA tam, kde je to rozumné).
   Farboslepé varianty ResourceBar a states.
5. **Bilingválnosť kópie:** hlavné príklady v PL + poznámky, ako
   škálovať do UK/CS/EN.
6. **Konkrétnosť:** žiadne „use an appropriate shade of red".
   Hex + RGB + použitie.

# FORMÁT ODPOVEDE

- Jeden súvislý Markdown dokument (≈ 8 000–14 000 slov)
- ASCII alebo SVG diagramy inline
- Tabuľky pre tokeny, type scale, a11y kontrasty
- V sekciách 2, 5 a 7 navrhni a vygeneruj SVG snippet(y)
  priamo v odpovedi, aby sme ich vedeli vložiť do repozitára
- Na konci dokumentu: changelog s verziou `v0.1 — draft`,
  dátumom a autorským credit („vygenerovaný AI assistantom pre
  B2JK-Industry/watt-city; finálny review čaká na PKO BP partnership
  signed").

# ČO NEROBIŤ

- Nepoužívaj skutočné interné PKO fonty ani vektorové logá.
  Ak nevieš — napíš „vyžaduje dodanie PKO BP brand teamom".
- Nevydávaj žiadne farby/typografie za oficiálne PKO hodnoty
  bez citácie verejného zdroja.
- Neprekladaj brand-specifické pojmy („skarbonka", „Żyrafa",
  „Dzień Dobry") — ponechaj po poľsky.
- Nepridávaj crypto / NFT messaging na defaultný skin —
  Web3 vrstva je opt-in a musí byť od brandu oddelená
  (rodič opt-in flow).
- Nepoužívaj smajlíky/emoji ako súčasť brand-identity
  (maskot ich môže nahradiť).

ZAČNI.
```

---

## Ako prompt použiť

1. Skopíruj blok medzi ` ``` ` vyššie.
2. Vlož do Claude Opus 4.7 (alebo Sonnet 4.6) — tento projekt má SDK a API key v prostredí.
3. Pre generovanie SVG/obrázkových exportov (loga, maskot) následne použi DALL-E, Midjourney alebo Claude artifact. Prompt na to je samostatný krok.
4. Výstup ulož ako `docs/partnerships/PKO-BRAND-MANUAL-v0.1.md`.
5. V ďalšom kroku potom cez tento manuál prepíš `lib/theme.ts → PKO_THEME`, `lib/resources.ts`, `lib/building-catalog.ts` a doplníme `public/icons/` o PKO variant.

## Quality gate pred aplikáciou

- [ ] Má sekciu 3 s WCAG AA tabuľkou
- [ ] Má sekciu 11 s file-by-file mappingom na náš repo
- [ ] Má varovania pri proprietárnych assetoch (čaká na PKO sign-off)
- [ ] Nepoužíva emoji ako brand-prvok
- [ ] Pomenúva CSS premenné v `--pko-*` namespace, aby core skin zostal nedotknutý
