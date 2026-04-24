# Grafický manuál — Watt City v štýle PKO BP

Senior-level brand + UI manuál. Prečítať raz pred začatím práce, potom sa vracať pre DO/DON'T.

---

## 1. Esencia

pkobp.pl nie je „moderný dizajn". Je to **pracovný povrch 200-ročnej banky**: informačne hustý, emocionálne chladný, vizuálne disciplinovaný. Nesnaží sa zaujať — snaží sa neprekážať. Toto je archetyp, ktorý preberáme.

### Jedno-vetová definícia

> Biely povrch, navy modrá typografia, teplá oranžová pre jeden jediný akčný krok, jemný 1 px šedý detail — nič navyše.

### Tri princípy

1. **Žiadny neon.** Saturácia v paletách nesmie prekročiť ~70 %. Každá farba má funkciu (text / povrch / akcia / line / feedback). Žiadne „dekoratívne" farby.
2. **Hierarchiu robí typografia, nie farba.** Nadpisy sú veľké, čierne, bez uppercase. Sekcie sa oddeľujú prázdnym priestorom a jemnou 1 px čiarou `#e5e5e5`, nie farebným pozadím.
3. **Akcia je jediná.** Na jednu obrazovku 1 primárny CTA. Všetko ostatné je secondary (outline) alebo text-link.

---

## 2. Tonalita a vizuálny jazyk

| Atribút | Hodnota |
|---|---|
| Archetyp | Spoľahlivý sprievodca — seriózny, ale dostupný |
| Emočný register | Pokojný, prehľadný, mierne teplý (oranžové accenty) |
| Hlas v UI | 2. osoba, imperatív na CTA (`Zobacz`, `Zaloguj się`), žiadne marketingové frázy |
| Formálnosť | Stredná — `ty`, nie `Vy`; ale bez slangu |
| Vizuálna denzita | **Vysoká**. Pomer obsah:whitespace je cca 60:40 (nie 30:70 ako u „airy" produktov) |

### Čo sa NIKDY nesmie objaviť

- ❌ Gradienty (lineárne, radiálne, mesh — žiadne)
- ❌ Glassmorphism, blur, backdrop-filter
- ❌ Hard-offset tiene (`6px 6px 0 0`, neo-brutalism)
- ❌ Hrubé bordery > 2 px
- ❌ Uppercase na nadpisoch (OK iba na drobných overline/chip tagoch)
- ❌ Font weights 800/900 na body textoch (max 700)
- ❌ Bodkované / čiarkované pozadia (repeating patterns)
- ❌ Neónové farby (#fde047, #22d3ee, #f472b6 — **všetky tri musia preč**)
- ❌ Dark-mode ako default (môže existovať ako separate toggle, ale default = light)
- ❌ Maskot-placeholder (radšej prázdne miesto než žltý obdĺžnik)

### Čo je vítané

- ✅ Veľa prázdneho priestoru **medzi sekciami** (80–120 px vertikálny gap)
- ✅ Tabuľky s tabular-nums, pravostranným zarovnaním čísiel
- ✅ Ostré rohy (0 px) na informačne hustých povrchoch (inputy, tabuľky)
- ✅ Zaoblené (10 px) na akčných povrchoch (tlačidlá, karty)
- ✅ Fotografia reálnych situácií (nie ilustrácia, nie stock-smiles)
- ✅ 1.5px stroke ikony v jednom sete
- ✅ Focus ring 2 px navy outline s 2 px offset

---

## 3. Logo a signatúra

- **Watt City logo** zostáva ako brand core. Ak existuje PKO co-brand variant, použije sa iba na partnerskej landing page (pokiaľ je partnerstvo živé).
- **Žyrafa placeholder SVG** v `lib/theme.ts` (riadky 42–53) sa **nezobrazuje** — ani v `pko` skine. Až do dodania skutočného assetu z PKO strany má `mascot` hodnotu `null`.
- Safe-area okolo loga: minimálne 1.5× výška písmena "W" na každej strane.

---

## 4. Paleta — vizuálny referenčný diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ████ #003574  Navy Primary        Headings, links, CTA    │
│   ████ #004c9a  Navy Hover          Link:hover               │
│   ████ #001e4b  Navy Deep           Rare emphasis           │
│                                                             │
│   ████ #db912c  Orange Sales        Primary sales CTA        │
│   ████ #cc7a09  Orange Hover        Sales CTA:hover          │
│                                                             │
│   ████ #2e7d49  Green               Success, positive delta  │
│                                                             │
│   ████ #000000  Ink                 Body text default        │
│   ████ #636363  Ink Muted           Secondary text           │
│   ████ #b7b7b7  Ink Subtle          Disabled, placeholder    │
│                                                             │
│   ████ #e5e5e5  Line                Dividers, 1px borders    │
│   ████ #f9f9f9  Surface Alt         Hover bg, zebra rows     │
│   ████ #ffffff  Surface             Primary bg, cards        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

 Accent pomer na obrazovke:  biela 70% | navy 20% | ink 8% | orange 2%
```

**Pravidlo:** oranžová je „na stole iba raz". Ak je na obrazovke primary sales CTA, žiadny ďalší oranžový prvok.

Presné token hodnoty a CSS premenné: `02-DESIGN-TOKENS.md`.

---

## 5. Typografia — hierarchická kostra

Font `pkobp` (webfont banky) je proprietárny a pre Watt City **nie je licencovateľný**. Používame **Inter** — otvorený humanistický sans s podobnými proporciami a x-height.

```
Display  ——————————————————  48 / 56    weight 700   (rare — len hero)
H1       ——————————————————  40 / 48    weight 700
H2       ——————————————————  32 / 40    weight 700
H3       ——————————————————  24 / 32    weight 600
H4       ——————————————————  20 / 28    weight 600
H5       ——————————————————  18 / 26    weight 600
Body L   ——————————————————  18 / 28    weight 400   (intro odseky)
Body     ——————————————————  16 / 24    weight 400   (default)
Body S   ——————————————————  14 / 20    weight 400   (metadata)
Caption  ——————————————————  13 / 18    weight 400   (legal, RRSO)
Micro    ——————————————————  11 / 14    weight 400   (copyright, tiny labels)
Overline ——————————————————  12 / 16    weight 600   + uppercase + tracking 1.65px
```

### Pravidlá

- Nadpisy **vždy** `#003574` (navy), nie čierna.
- Body text `#000000`, muted `#636363`.
- Line-height na nadpisoch: **1.2** (H1–H3), **1.3** (H4–H5).
- Line-height na body: **1.5**.
- Max line-length: **72 znakov** (používať `max-w-[72ch]` na odsekoch).
- Žiadne justify zarovnanie.
- Tabulárne čísla v tabuľkách: `font-variant-numeric: tabular-nums`.

---

## 6. Mriežka, layout, whitespace

### Breakpointy (zachovať zo súčasného Tailwind v4 setupu)

```
sm 640   md 768   lg 1024   xl 1280   2xl 1536
```

### Kontajner

- Max-width stránky: **1280 px**
- Safe padding: 32 px desktop, 16 px mobile
- Grid: 12 stĺpcov desktop, 8 tablet, 4 mobile; gutter 24 / 16 / 16

### Vertikálny rytmus

- **Medzi sekciami:** 96 px desktop, 64 px mobile
- **Medzi blokmi v sekcii:** 48 px / 32 px
- **Medzi kartami v gride:** 24 px
- **Vo vnútri karty:** 24 px padding
- **Medzi nadpisom a prvým odsekom:** 16 px

---

## 7. Tvar, hrany, hĺbka

### Border-radius

| Prvok | Radius |
|---|---|
| Tlačidlo | **10 px** |
| Karta | **10 px** |
| Input | **0 px** (ostré, ako pkobp.pl) |
| Tabuľka | **0 px** |
| Avatar, badge-pill | **999 px** (pill) |
| Modal / sheet | 16 px |
| Chip | 4 px |

### Tiene (presne dva)

```
--shadow-line: 0 0 0 1px #e5e5e5;     /* 1 px „outline" namiesto border */
--shadow-soft: 0 3px 6px #00000029;   /* mäkký drop pre dropdown, modal, elevated card */
```

**Žiadne ďalšie tiene.** Žiadne farebné glow, žiadne multi-layer shadow stacks.

### Bordery

- Default line: `1px solid #e5e5e5`
- Emphasized: `1px solid #003574` (focus state, vybraný tab)
- **Maximum 1 px.** Žiadne 2 px, 3 px, 4 px bordery.

---

## 8. Ikonografia

- **Štýl:** outline, 1.5 px stroke, round cap/join
- **Viewport:** 24×24 (štandardne), 20×20 (kompaktné), 16×16 (inline v texte)
- **Knižnica:** [Lucide](https://lucide.dev/) (MIT, tree-shakeable). Jedna sada, žiadne miešanie.
- **Farba:** dedí `currentColor` — aby sa automaticky zladila s okolitým textom.
- **Filled verzia** iba pre social icons v pätičke, inak nikdy.

---

## 9. Obrazový jazyk

### Fotografia

- Reálne situácie, reálni ľudia. Žiadny stock-smile s headsetom.
- Tónovanie: mierne teplé, nízko-saturované.
- Pomery: hero 16:9, produktová karta 4:3, avatar 1:1.
- Formáty: AVIF s WebP fallback, `<Image>` z `next/image`.

### Ilustrácia

- Minimálna. Keď sa použije — 2-farebná (navy + 1 accent), plochá, bez gradientov.
- City-scene SVG (1679 riadkov) je výnimka: zostáva, ale **farby sa rekalibrujú** na jemnú navy/sivú paletu (E4 v backlogu).

### Icons v bannery

Použiť namiesto ilustrácie — decorative outline icons 48×48 px v navy, v ľavom hornom rohu karty.

---

## 10. Akcia vs. pasivita — hierarchia tlačidiel

```
PRIMARY              — navy vyplnené, biely text                — 1× na obrazovku
PRIMARY SALES        — oranžové vyplnené, biely text             — iba produktová ponuka s cenou
SECONDARY            — biele pozadie, navy 1px outline + text    — bez limitu
TEXT LINK            — navy text, underline on hover, žiadne bg  — inline v texte
```

Destructive = text color `#c0342b`, border červený — iba pre mazanie účtu a pod.

Detail: `03-COMPONENTS.md` → `Button`.

---

## 11. Motion

| Token | Trvanie | Easing | Použitie |
|---|---|---|---|
| `fast` | 120 ms | `ease-out` | hover color, focus |
| `base` | 200 ms | `cubic-bezier(.4,0,.2,1)` | dropdown, tab switch |
| `slow` | 300 ms | `cubic-bezier(.4,0,.2,1)` | modal, drawer |

**Žiadne bounce, žiadne spring, žiadne parallax.** Všetko lineárne alebo material-ease.

`prefers-reduced-motion: reduce` — duration 0.01 ms, žiadne iterácie (už implementované v `globals.css`, zachovať).

---

## 12. Prístupnosť — non-negotiables

- **Kontrast:** body text ≥ 4.5:1 proti pozadiu; large text ≥ 3:1.
  - Navy `#003574` na bielej = **10.2:1** ✅
  - Muted `#636363` na bielej = **5.7:1** ✅
  - Orange `#db912c` na bielej = **3.1:1** — iba pre large text / ikony
- **Focus ring:** 2 px solid navy `#003574`, offset 2 px, border-radius dedí z prvku.
- **Hit area:** minimálne 44×44 px (zachovať `.tap-target` utility).
- **Formuláre:** error nikdy iba farbou — vždy text + ikona.
- **Motion:** všetky animácie rešpektujú `prefers-reduced-motion`.
- **Testy:** axe-core scan (`scanSeriousA11y` helper) musí zostať bez nálezov.

---

## 13. Content rules (mikrocopy)

| Pravidlo | Príklad |
|---|---|
| CTA = sloveso v imperatíve, max 3 slová | `Otwórz konto`, `Zobacz ofertę` |
| Čísla PLN | `1 234,56 zł` (NBSP tisícové, čiarka desatinná) |
| Dátum | `24.04.2026` alebo `24 kwietnia 2026` |
| Negácia | Pozitívne preformulovať: nie „Bez zbędnych formalności", ale „Szybko i prosto" |
| Disclaimer | Vždy pri finančnom produkte, `caption`, `#636363` |
| Error message | Čo sa stalo + čo urobiť: „Nieprawidłowy PESEL. Sprawdź 11 cyfr." |

---

## 14. Odovzdávanie — kontrolný check

Pri každom PR, ktorý mení vizuál:

- [ ] Žiadne nové hex hodnoty mimo palety z `02-DESIGN-TOKENS.md`
- [ ] Žiadne `border-[Npx]` s N ≥ 2
- [ ] Žiadne `shadow-[Npx...]` s hard-offset
- [ ] Žiadne `uppercase` na nadpisoch
- [ ] Žiadne `font-weight: 800|900` mimo `overline` alebo `brand`
- [ ] Kontrast axe-core scan: 0 serious findings
- [ ] Screenshot pred/po priložený v PR
