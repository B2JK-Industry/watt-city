# Prompt pre AI agenta — hĺbková vizuálna identita PKO pre Watt City

**Účel:** Nahradiť plytkú prácu predošlého promptu (`PKO-BRAND-MANUAL-PROMPT.md`). Tento prompt nútí AI agenta **skutočne navštíviť pkobp.pl**, extrahovať reálny dizajnový jazyk banky, a vyprodukovať **executable design system** — nie brand-manual pdf.

**Kritický rozdiel proti predošlému:** Tento prompt **zakazuje** len-farebný rebrand. Output musí riešiť neo-brutalism → banking-clean shift na úrovni tvarov, typografie, tiene, kompozície, interakcie — nie len paletového swapu. Výstup musia byť **súbory priamo copy-paste-ready** do repa, nie abstraktné tabuľky.

---

## PROMPT (skopíruj celé nižšie do AI agenta s file-write tool-om)

````
# ROLA

Si senior product designer + design-system architekt s 15-ročnou praxou
pre retail banking (Revolut, N26, mBank, PKO Junior) a detský edu-tech
(Kahoot, Duolingo for Kids, Khan Academy Kids). Rozumieš:
- Poľskému finančnému trhu a PKO BP brand culture
- Rozdielu medzi gaming UI (neo-brutalism, chunky shadows, uppercase)
  a banking UI (flat fills, subtle shadows, sentence case, whitespace)
- GDPR-K compliance pre <16 r.
- Skutočnosti, že paletový swap NIE je rebranding

# KRITICKÉ PRAVIDLÁ

1. **NEBUDEŠ mechanicky hádať farby ani hodnoty.** Najprv stiahneš
   pkobp.pl HTML + CSS bundle curl-om. Až potom navrhuješ tokeny.

2. **NESMIEŠ produkovať "brand manual" PDF-štýl.** Output sú
   **kódovo aplikovateľné súbory**:
   - `globals-pko.css` — ready-to-import CSS override
   - `tokens.json` — design tokens v Style Dictionary formáte
   - `components-spec.md` — anatomy + CSS per komponent
   - `execution-plan.md` — file:line zmeny v repe
   Žiadny z týchto NEbude genericky — každý artefakt musí byť
   použiteľný bez ďalšieho prepisovania.

3. **NESMIEŠ riešiť len farby.** Neo-brutalism v Watt City je
   definovaný shadow-offsets, thick borders (3px), uppercase
   typography, neon tags, capsule-shape buttons. Tvoj output
   MUSÍ tieto atribúty explicitne prepísať alebo disable-núť,
   inak pilot zase padne.

4. **NEPÍŠ filler.** Žiadne úvody typu "v dnešnom rýchlo
   meniacom sa digitálnom priestore…". Každá veta má niesť
   design rozhodnutie alebo konkrétnu hodnotu.

# FÁZA 1 — HĹBKOVÝ AUDIT pkobp.pl

Stiahni nasledujúce URL cez curl (so User-Agent:
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"):

| URL | Čo z neho extrahovať |
|-----|---------------------|
| `https://www.pkobp.pl/` | Hlavná corporate stránka — PKO BP brand layer |
| `https://www.pkobp.pl/junior/` | PKO Junior (deti 0–12) — najbližšie k Watt City audiencii |
| `https://sko.pkobp.pl/` | SKO portál (5–13 r. v školách) — priama cieľová skupina |
| `https://www.pkobp.pl/dzieci-uczniowie-i-studenci/szkolne-kasy-oszczednosci/` | SKO landing |
| `https://www.pkobp.pl/_next/static/css/*.css` | Hlavný CSS bundle (nájdi presné meno v HTML) |

Pre KAŽDÝ zdrojový súbor extrahuj:

### 1.1 Color system (reálne hex)
- Top 20 hex hodnôt s počtom výskytov
- Pomenuj role (primary, accent, text, background, border, …)
- Identifikuj ramp-y (navy 900 → 300, gray 900 → 100)

### 1.2 Typography
- `font-family` declarations (vrátane custom PKO fontov ako `pkobp`)
- Všetky unique `font-size`, `font-weight`, `line-height`, `letter-spacing`
- Koľko z nich je v 4/8 px gride, koľko odchýliek

### 1.3 Shapes
- Všetky `border-radius` hodnoty (identifikuj dominantnú)
- Všetky `border-width` (ak PKO používa hrubé bordery, vedz to)
- Corner-style rozhodnutie (plný rounded vs. sharp vs. mixed)

### 1.4 Depth & elevation
- Všetky `box-shadow` hodnoty
- Opacity škála (keď semi-transparent overlay-s)
- Backdrop-filter (blur pre modaly?)

### 1.5 Motion
- Všetky `transition` hodnoty (duration + easing)
- Animation keyframes
- Koľko elementov má interakčný transition vs. žiadny

### 1.6 Spacing
- Top 15 `padding` a `margin` hodnôt (indikátor spacing scale)
- Grid/flex gap hodnoty
- Container max-width

### 1.7 Interakčné patterny
- Prezri HTML štruktúru buttons — aký je klasický PKO button
  (flat fill? ghost? icon+label?)
- Prezri form field štruktúru — label position, error state
- Prezri card štruktúru — header/body/footer, hover state
- Prezri nav — top bar layout, mobile bottom tabs?

### 1.8 Voice & microcopy
- Zoberíš 10 labelov z buttonov a menu items
- Zoberíš 5 hlavičiek z landing / junior pages
- Zoberíš 3 error alebo notification messages ak sú visible
- Určíš register (formálny/neformálny, tykanie/vykanie, dĺžka)

**Output FÁZY 1:** interný Markdown dokument
`docs/partnerships/PKO-AUDIT-RAW.md` s every hodnotou odkazovanou
na konkrétny zdroj (URL + riadok v stiahnutom HTML/CSS). Žiadne
"približne" — ak hodnota nebola nájdená, napíš to.

# FÁZA 2 — AUDIT Watt City kódu (neo-brutalism inventár)

Prejdi nasledujúce súbory a extrahuj **všetko neo-brutalist**:

```
app/globals.css              — .btn, .card, .brutal-*, neon palette
app/layout.tsx               — footer chip štýly, brutal-tag
components/site-nav.tsx      — brand chip, nav styling
components/cashflow-hud.tsx  — HUD štýl
components/resource-bar.tsx  — chipy
components/tier-up-toast.tsx — pop animácia
components/city-scene.tsx    — 167 hardcoded hex (mapované v §15.1
                               manuálu v0.2)
components/city-skyline-hero.tsx
```

Pre každý súbor zaznamenaj:
- Konkrétne riadky s `box-shadow`, `border-[Npx]`, `uppercase`,
  `font-weight: 8xx-9xx`, `letter-spacing > 0.01em`
- Classy ktoré sú "gaming" (brutal-*, neo-*) vs. neutrálne
- Farby ktoré sú hardkódované mimo theme token-ov

**Output FÁZY 2:** Markdown tabuľka
`docs/partnerships/WATT-CITY-BRUTALISM-INVENTORY.md` —
čo je brutalist, kde je to, kategorizované "must-remove-for-pko",
"can-soften", "neutral (keep)".

# FÁZA 3 — GAP ANALYSIS: PKO vs. Watt City

Pre každú dimenziu zo FÁZY 1 (colors, typography, shapes, depth,
motion, spacing, interakcie, voice) spravíš tabuľku:

| Dimenzia | PKO pattern | Watt City current | Gap (redesign action) |
|----------|-------------|-------------------|----------------------|
| Border-radius buttons | 10 px (verified) | 0 px (brutal square) | Prepísať `.btn` |
| Button shadow | 0 3px 6px rgba(0,0,0,0.16) | 3px 3px 0 0 var(--ink) | Prepísať `.btn` shadow |
| Headings weight | 700 | 900 | Znížiť font-weight |
| Headings case | Sentence | UPPERCASE | Remove `text-transform: uppercase` |
| Tags | Malé navy-fill chipy | Neon yellow/pink/cyan chipy | Prepísať `.brutal-tag` |
| Font | pkobp (custom) / Inter fallback | Geist | Swapnúť `--font-sans` |
| Nav bottom | 1 px solid gray | 3 px solid black | Prepísať site-nav border |
| ... | ... | ... | ... |

Minimum 15 riadkov tabuľky. Nepokračuj ďalej kým nie je kompletná.

**Output FÁZY 3:** `docs/partnerships/PKO-VS-WATT-CITY-GAP.md`.

# FÁZA 4 — DESIGN SYSTEM SPEC (produkt)

Teraz (a NIE skôr) navrhni komplet design system pre SKO skin.
Každý artefakt MUSÍ byť copy-paste-ready:

### 4.1 `globals-pko.css` — ready CSS override

Štruktúrovaný ako:
```css
/* SKO × Watt City — PKO-inspired design layer.
 * Mounts via <html data-skin="pko">.
 * Overrides Watt City neo-brutalism for banking-clean aesthetic.
 * Source: pkobp.pl + pkobp.pl/junior (verified YYYY-MM-DD) */

:root[data-skin="pko"] {
  /* === Colors === */
  --sko-navy-900: #001E4B;  /* verified pkobp.pl/junior (2x) */
  --sko-navy-700: #003574;  /* verified (97x primary) */
  /* ... kompletný token set ... */

  /* === Shape tokens === */
  --sko-radius-sm: 4px;
  --sko-radius-md: 10px;    /* dominantné, verified */
  --sko-radius-lg: 16px;

  /* === Depth === */
  --sko-shadow-card: 0 3px 6px rgba(0, 0, 0, 0.16);
  --sko-shadow-lg:   0 8px 24px rgba(0, 30, 75, 0.18);

  /* === Motion === */
  --sko-ease:         ease;
  --sko-ease-material: cubic-bezier(.4, 0, .2, 1);
  --sko-dur-short:    200ms;  /* verified PKO default */

  /* === Typography === */
  --sko-font-sans: var(--font-sko-sans), "Helvetica Neue", Helvetica, Arial, sans-serif;

  /* === Remap existing tokens === */
  --background: var(--sko-navy-900);
  --accent: var(--sko-navy-700);
  /* atd. */
}

/* === Component overrides === */

:root[data-skin="pko"] .btn {
  /* explicit override of neo-brutalism */
  border: none;
  border-radius: var(--sko-radius-md);
  box-shadow: var(--sko-shadow-card);
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  padding: 11px 20px;  /* verified pattern z pkobp.pl */
  font-family: var(--sko-font-sans);
  transition: all 0.2s ease;
}
:root[data-skin="pko"] .btn:hover {
  transform: none;  /* disable brutal push */
  box-shadow: var(--sko-shadow-lg);
}

:root[data-skin="pko"] .btn-primary {
  background: var(--sko-navy-700);
  color: #fff;
}
/* ... atd. pre .btn-secondary, .btn-ghost, .btn-danger */

:root[data-skin="pko"] .card {
  border: 1px solid var(--sko-border);  /* nie 3px thick */
  border-radius: var(--sko-radius-md);
  box-shadow: var(--sko-shadow-card);
  background: #fff;  /* alebo navy-500 na navy BG */
}

:root[data-skin="pko"] .brutal-heading {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

:root[data-skin="pko"] .brutal-tag {
  background: var(--sko-navy-500);
  color: #fff;
  border: none;
  border-radius: 9999px;  /* pill */
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  text-transform: none;
  letter-spacing: 0.02em;
}

/* ... úplný rewrite všetkých classes, ktoré FÁZA 2 identifikovala
   ako brutalist ... */
```

**Rule:** tento súbor musí byť **KOMPLETNÝ** — po jeho importe
a po data-skin="pko" na <html> musí appka vyzerať ako banking
produkt, nie navy brutalism.

### 4.2 `tokens.json` — Style Dictionary format

Pre budúce exporty do Figma / iOS / Android. Nie striktne nutné
pre webový reskin, ale artefakt brand teamu:

```json
{
  "color": {
    "brand": {
      "navy": {
        "900": { "value": "#001E4B", "source": "pkobp.pl/junior", "verified": "2026-04-24" },
        "700": { "value": "#003574", "source": "pkobp.pl/junior (97 occurrences)", "verified": "2026-04-24" }
      }
    }
  },
  "radius": {
    "md": { "value": "10px", "source": "pkobp.pl CSS bundle dominant" }
  }
}
```

### 4.3 `components-spec.md` — anatomy + interaction per komponent

Minimum komponenty:
- Button (6 variantov: primary, secondary, ghost, danger, icon-only, cta-hero)
- Card / Panel (5 variantov)
- Input field (3 stavy)
- Modal / Dialog
- Toast / Notification (5 variantov)
- Top nav (desktop + mobile)
- Bottom tabs (mobile only)
- ResourceBar chip
- Progress / Level ring
- Building card (pre /miasto)
- CashflowHUD
- Leaderboard row
- Mortgage calculator
- AI chat bubble
- Brutal-tag → SKO chip (explicit replacement)

Pre KAŽDÝ:
- ASCII anatomy diagram
- Popis účelu
- Stavy (default/hover/focus/active/disabled/error)
- Design tokens ktoré používa
- 20-50 riadkov CSS (copy-paste-ready)
- Konkrétna "breaking change" poznámka ak mení chovanie

### 4.4 `execution-plan.md` — file:line zmeny v repe

Konkrétny checklist pre dev-a. Každá položka:
- Súbor
- Riadky (line range)
- Čo zmeniť (before / after snippety)
- Effort v hodinách
- Testy na spustenie
- Rollback plán

Minimum 30 položiek pokrývajúcich:
- `lib/theme.ts` (PKO_THEME tokens)
- `lib/pko-skin.test.ts` (test updates)
- `app/globals.css` (mount point pre import globals-pko.css)
- `app/layout.tsx` (font swap, data-skin attribute, footer chip cleanup, remove ETHSilesia pitch-decor pri PKO skine)
- `components/site-nav.tsx` (border-b, brand chip, nav spacing)
- `components/cashflow-hud.tsx`
- `components/resource-bar.tsx`
- `components/tier-up-toast.tsx`
- `components/city-scene.tsx` (najväčší blocker — 167 hex, plán na refaktor)
- `components/city-skyline-hero.tsx`
- `public/manifest.webmanifest` → migrate to `app/manifest.ts`
- `public/icons/*.svg` (SKO variants)
- `lib/building-catalog.ts` (skin-aware palette)
- `lib/resources.ts` (skin-aware resource colors)
- `lib/pdf-report.tsx`, `lib/pitch-pdf.tsx` (PDF font + layout)

Effort totals na konci: "SKO skin reskin: X–Y hod, rozložené do 3
PRs (tokens + components + city-scene refaktor)".

### 4.5 `landing-hero-redesign.md` — layout spec pre /

Samostatný artefakt, lebo landing je signature. Nie len "zmeň farby"
ale kompletný layout redesign:
- Hero copy (PL) — kratšia, banking-priateľská
- Hero CTA štýl (flat navy fill, nie brutal yellow)
- Sekundárna CTA (ghost white outline)
- Removal "Content Machine Phase 2" dev banner pri PKO skine
- Reorganizácia hero karty na pravej strane (TOP 3 RANKING) — menej
  brutal, viac banking
- Removal neon brutal-tag chips z footer-u pri PKO skine (PKO XP,
  ETHSilesia, Katowice — to sú pitch artefakty)
- Substitúcia za čistý footer s brand, disclaimer, linky

### 4.6 `city-scene-refactor-plan.md` — najväčší blocker

167 hex hodnôt v SVG panoráme. Tri cesty:
- A. **Rýchly hack:** CSS filter `hue-rotate() saturate()`.
  Effort 1 h. Estetika: zlá.
- B. **Semantic role extraction:** 6 CSS premenných
  (`--scene-sky-top`, `--scene-sky-bottom`, `--scene-ground`,
  `--scene-building-primary`, `--scene-building-secondary`,
  `--scene-window-lit`). Efforts 8–16 h.
- C. **Nový SVG:** ilustrátor kreslí verziu v PKO palete.
  Effort 2–3 dni práca ilustrátora + 2 h integrácia.

Odporuč B ako default, s explicit mapping z 73 unikátnych hex
hodnôt do 6 rolí.

### 4.7 `voice-and-copy-pl.md` — kompletný copy deck

- 20 kľúčových tlačidiel (button labels PL)
- 10 error messages PL
- 5 empty states PL
- 5 tier-up / achievement copy
- 3 onboarding screens copy (rodič + dieťa 9–11 + dieťa 12–14)
- Brand voice rules (formálny voči rodičovi/učiteľovi,
  tykanie voči dieťaťu, sentence case, žiadny sarkazmus,
  žiadne emoji ako brand-prvok)

# FÁZA 5 — SELF-VALIDATION

Pred odovzdaním vygeneruj `validation-report.md` obsahujúci:

1. **Evidence checklist:** pre každú VERIFIED hodnotu cituj URL
   + riadok v zdrojovom HTML/CSS. Ak to nemáš, označ SUBSTITUTE
   a uveď dôvod.

2. **Brutalism sweep:** vymenuj 15+ neo-brutalist vlastností
   pôvodného Watt City, ktoré tvoj design system explicitne
   prepisuje. Pre každú ukáž "before CSS" → "after CSS".

3. **Rizikové body:** 5–10 miest, kde výstup nevieš potvrdiť
   bez buď (a) signed PKO partnership (licencia pkobp fontu,
   oficiálne logo SVG, Żyrafa Lokatka pose library), alebo
   (b) A/B testu s target audience.

4. **Effort tabuľka:** rozpočet v hodinách rozdelený na:
   - Token update (lib/theme.ts, globals.css): ___ h
   - Component overrides (globals-pko.css + test): ___ h
   - Layout rewrites (site-nav, hero, footer, PDF): ___ h
   - city-scene.tsx refaktor: ___ h
   - Asset creation (icons, OG image, mascot hotswap): ___ h
   - QA (Playwright golden path, mobile, a11y): ___ h
   - Total: ___ h, rozložené do X PRs

# FORMÁT ODOVZDANIA

Zapíš všetky artefakty do priečinka
`/Users/danielbabjak/Desktop/watt-city-ethsilesia2026/docs/partnerships/pko-visual-system-v1/`:

```
pko-visual-system-v1/
├── 00-INDEX.md                         — vysvetlenie štruktúry
├── 01-PKO-AUDIT-RAW.md                 — FÁZA 1 output
├── 02-WATT-CITY-BRUTALISM-INVENTORY.md — FÁZA 2 output
├── 03-PKO-VS-WATT-CITY-GAP.md          — FÁZA 3 output
├── 04-DESIGN-TOKENS.json               — FÁZA 4.2
├── 04-GLOBALS-PKO.css                  — FÁZA 4.1 (produkčný
│                                         CSS, žiadne placeholders!)
├── 05-COMPONENTS-SPEC.md               — FÁZA 4.3
├── 06-EXECUTION-PLAN.md                — FÁZA 4.4
├── 07-LANDING-HERO-REDESIGN.md         — FÁZA 4.5
├── 08-CITY-SCENE-REFACTOR-PLAN.md      — FÁZA 4.6
├── 09-VOICE-AND-COPY-PL.md             — FÁZA 4.7
└── 10-VALIDATION-REPORT.md             — FÁZA 5
```

Keď odovzdávaš, vráť v odpovedi:

1. **Potvrdenie zápisu:** zoznam všetkých 11 súborov + ich veľkosti.
2. **Top-level executive summary:** 10 najdôležitejších designových
   rozhodnutí s dôvodmi (pod 300 slov).
3. **Effort estimate:** celkové hodiny do produkčne schváleného
   SKO reskinu, rozdelené do troch PRs.
4. **Otvorené otázky:** 5 vecí, ktoré designer needs z produktu
   (napr. má sa Gimnazjum sportowe aj v SKO skine volať rovnako?
    Existuje interná PKO brand book k fontu `pkobp`?).

# QUALITY BAR

**Zamietnem tvoj output ak:**

- Nepoužívaš real hex hodnoty z curl-nutého pkobp.pl HTML/CSS.
- Tvoj `globals-pko.css` nevypína neo-brutalism (3px bordery,
  uppercase brutal-heading, capsule brutal buttons s 3px offset
  shadow, neon brutal-tag chipy).
- Tvoj execution-plan nemá konkrétne file:line s before/after.
- Pridávaš emoji do brand identity.
- Nevynecháš crypto/Web3 messaging z defaultného SKO skinu.
- Vydávaš proprietárny PKO font, logo alebo Żyrafa Lokatka
  vektor za voľne použiteľné.
- Output je "brand manuál" a nie executable design system.
- Redukuješ tvar na farbu ("pilot v0.2 error" — nesmie sa
  opakovať).

# ČO NEROBIŤ

- Nepíš žiadne "v rýchlo sa meniacom svete…" úvody.
- Neprekladaj značky ("skarbonka", "Lokatka", "Dzień Dobry")
  — ponechaj po poľsky.
- Nevyrábaj nové SVG pre logo / mascot ak nie si illustrátor
  — iba detailný brief pre illustratora.
- Nepoužívaj abstraktné metafory pre design ("dynamická
  harmónia", "moderný ale dôveryhodný") — píš konkrétne,
  merateľné, aplikovateľné.

ZAČNI FÁZOU 1.
````

---

## Ako tento prompt použiť

1. Otvor Claude Opus 4.7 (alebo Sonnet 4.6) s file-write a bash tool-om.
2. Skopíruj blok vyššie.
3. Agent urobí 5 fáz, ktoré trvajú 15–30 min (kompletný audit + gap + spec + validation).
4. Skontroluj `10-VALIDATION-REPORT.md` — ak má self-signalled risks, vráť agentovi aby ich riešil.
5. Ak je v poriadku, aplikuj `04-GLOBALS-PKO.css` + riaď sa `06-EXECUTION-PLAN.md`.

## Prečo je to iné než predošlý prompt

| Predošlý prompt | Tento prompt |
|---|---|
| Abstraktný brand manuál | Executable design system |
| Agent hádal farby zo search outputov | Agent musí curl-núť pkobp.pl |
| Riešil len tokeny | Rieši tvary, tiene, typografiu, compozíciu |
| §11 Web Mapping ako sekundárny appendix | `execution-plan.md` ako headline artifact |
| "Pilot = zmeň farby" | "Pilot = prepíš neo-brutalism kompletne" |
| Žiadna quality gate | Quality bar s 8 explicit rejection criteria |

## Príprava pred spustením

Pred tým, než prompt odovzdáš agentovi, urob tieto prípravné kroky (raz):

1. Over, že `docs/partnerships/pko-visual-system-v1/` priečinok neexistuje (agent ho vytvorí).
2. Maj handy v0.2 manuál a pilot branch `pilot/sko-skin-v0.2` — agent môže z nich čerpať.
3. Rozhodni sa, či chceš nechať agentovi plnú voľnosť v design rozhodnutiach, alebo máš constraint (napr. "musí si zachovať skarbonku", "hra sa nesmie cítiť ako bankové PDF"). Vložíš do prompt-u pred „ZAČNI FÁZOU 1".

## Keď agent skončí

Overovací checklist pred tým, ako to aplikuješ do produkcie:

- [ ] `10-VALIDATION-REPORT.md` má nula 🔴 risks
- [ ] `04-GLOBALS-PKO.css` **nepoužíva** `.brutal-*` classes ani neo-yellow neon
- [ ] `06-EXECUTION-PLAN.md` má effort total pod 40 h (ak > 40, buď to zle, alebo to vyžaduje multi-sprint)
- [ ] `05-COMPONENTS-SPEC.md` má všetkých 15 komponentov
- [ ] `08-CITY-SCENE-REFACTOR-PLAN.md` má konkrétnu B-option mapu 73 hex → 6 rolí

Ak niečo nesedí, **pošli agentovi priamo konkrétny feedback** cez SendMessage tool, nie nový prompt — ušetrí to context + ceny.
