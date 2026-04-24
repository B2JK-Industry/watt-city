# Implementačný backlog — PKO-style redesign

**Pre koho:** FE vývojár preberá celý balík. PM môže priamo rezať tikety do Jira/Linear.

**Čo nie je v backlogu:** žiadne BE zmeny, žiadne dátové modely, žiadna herná logika, žiadny nový routing, žiadne API. **Iba vizuál.**

**Pravidlá testov:**
- Vitest (635 testov) — musí zostať zelené po každom tikete
- Playwright (13 specs, ~600 assertions) — musí zostať zelené
- Axe-core scan (`scanSeriousA11y`) — 0 serious findings
- Žiadne nové testy **nepridávať** pokiaľ tiket explicitne nehovorí jinak

**Odhady:** S = ≤ 2 h, M = 0.5–1 d, L = 1–2 d, XL = 3+ d.

---

## Prehľad epicov

| Epic | Názov | Cieľ | Závislosti | Paralelizovateľné? |
|---|---|---|---|---|
| **E0** | Foundation — tokens | Nové CSS premenné, Inter font, aktualizácia theme.ts | — | Musí byť PRVÝ |
| **E1** | Foundation — primitívy | Prepísať `.card`, `.btn`, `.input`, `.chip`, tiene, radius | E0 | — |
| **E2** | Brutalism removal v JSX | Mazať `border-[3px]`, `shadow-[...]`, `uppercase` zo zdroja | E0, E1 | Áno (po komponente) |
| **E3** | Key surfaces redesign | Nav, Footer, Landing, Auth, Cookie | E1, E2 | Áno |
| **E4** | CityScene color refactor | SVG farby na navy-teplo paletu | E0 | Paralelne s E3 |
| **E5** | Hromadný games & ostatné | 24 game-client komponentov, toasty, widgety | E1, E2 | Áno (po komponente) |
| **E6** | Final polish | Motion, a11y re-scan, screenshots, QA | vše | Na konci |

---

## Epic E0 — Foundation / Tokens

### E0-01 — Rozšíriť `ThemeTokens` typ v `lib/theme.ts` `[S]`

**Cieľ:** Pridať polia `accentHover`, `sales`, `salesHover`, `salesInk`, `surfaceAlt`, `inkMuted`, `inkSubtle`, `line`, `success`, `danger` do `colors` objektu (pozri `02-DESIGN-TOKENS.md` §3).

**Súbory:**
- `lib/theme.ts`

**Akceptačné kritériá:**
- [ ] Oba `CORE_THEME` a `PKO_THEME` majú kompletný objekt colors bez ts-ignore
- [ ] `CORE_THEME` si zachová súčasné farby ale rozšírené o nové polia (môžu dočasne duplikovať existujúce hodnoty — dôležité je zachovať typovú kompatibilitu)
- [ ] `PKO_THEME` má hodnoty z `02-DESIGN-TOKENS.md` §3
- [ ] `pnpm tsc --noEmit` prechádza
- [ ] `pnpm test lib/pko-skin.test.ts` prechádza (testy aktualizované v E0-04)

**Závislosti:** žiadne

---

### E0-02 — Default skin → `pko`, mascot → null `[S]`

**Cieľ:**
1. `currentSkin()` vráti `"pko"` pokiaľ env nie je explicitne `"core"`
2. `PKO_THEME.mascot = null` (odstrániť placeholder zobrazenie)

**Súbory:**
- `lib/theme.ts`

**Akceptačné kritériá:**
- [ ] `currentSkin()` default → `"pko"`; iba `SKIN=core` alebo `NEXT_PUBLIC_SKIN=core` prepne na core
- [ ] `PKO_THEME.mascot === null`
- [ ] `ZYRAFA_PLACEHOLDER_SVG` konštanta zostáva (nechcem unused warning) ale nikde sa nepoužíva

**Závislosti:** E0-01

---

### E0-03 — Nahradiť `app/globals.css` `:root` blok `[M]`

**Cieľ:** Implementovať plný token systém podľa `02-DESIGN-TOKENS.md` §1.

**Súbory:**
- `app/globals.css` (riadky 116–149 + nový obsah za nimi)

**Akceptačné kritériá:**
- [ ] `:root` default obsahuje **pko** tokeny (light, navy, orange)
- [ ] `:root[data-skin="core"]` obsahuje legacy dark tokens (presun zo súčasného `:root`)
- [ ] `@theme inline` blok rozšírený o nové sémantické farby (`--color-sales`, `--color-ink-muted`, atď.)
- [ ] `body { background, color, font-family }` aktualizovaný pre light-mode default
- [ ] **Odstrániť** radiálne gradient bodky z `body::before` (riadky 153–156)
- [ ] `pnpm dev` beží bez CSS chýb
- [ ] Default landing zobrazí biele pozadie (nie bodkovanú tmavú)

**Závislosti:** E0-01

---

### E0-04 — Aktualizovať `lib/pko-skin.test.ts` `[S]`

**Cieľ:** Testy očakávajú konkrétne stringy. Aktualizovať na novú schému tokenov.

**Súbory:**
- `lib/pko-skin.test.ts`

**Akceptačné kritériá:**
- [ ] Testy očakávajú nové kľúče v `theme.colors` (accentHover, sales, ink-muted, …)
- [ ] Testy overujú `theme.mascot === null` pre pko skin
- [ ] `theme.colors.background === "#ffffff"` pre pko
- [ ] `pnpm test lib/pko-skin.test.ts` — všetky passes

**Závislosti:** E0-01, E0-02

---

### E0-05 — Inter font loader `[S]`

**Cieľ:** Pridať Inter ako primárny sans-serif pre pko skin.

**Súbory:**
- `app/layout.tsx` (riadky 29–37)
- `app/globals.css` (@theme inline blok)

**Akceptačné kritériá:**
- [ ] Import `Inter` z `next/font/google` s `subsets: ["latin", "latin-ext"]`, `weight: ["400","500","600","700"]`
- [ ] CSS premenná `--font-inter` injektovaná cez className
- [ ] `--font-sans` v `@theme inline` = `var(--font-inter), system-ui, sans-serif`
- [ ] `pnpm build` nepridal hydration warning
- [ ] Reálne vo viewporte `body` má `font-family: "Inter", …`

**Závislosti:** E0-03

---

### E0-06 — Export `tokens.json` (W3C DTCG formát) `[S]`

**Cieľ:** Vytvoriť strojovo-čitateľný token export pre Figma / handoff.

**Súbory:**
- `docs/pko-redesign/tokens.json` (nový)

**Akceptačné kritériá:**
- [ ] Obsah podľa `02-DESIGN-TOKENS.md` §11
- [ ] `cat docs/pko-redesign/tokens.json | jq .` (valid JSON)
- [ ] Schéma `$type` zodpovedá W3C DTCG (color, dimension, shadow)

**Závislosti:** E0-01

---

### E0-07 — Skin injection v `app/layout.tsx` `[M]`

**Cieľ:** Rozšíriť `skinVars` objekt o nové premenné.

**Súbory:**
- `app/layout.tsx` (riadky 128–146)

**Akceptačné kritériá:**
- [ ] `skinVars` obsahuje všetky nové CSS premenné z `02-DESIGN-TOKENS.md` §4
- [ ] `<html data-skin={theme.id} style={skinVars}>` stále funguje
- [ ] Inšpekcia devtools: `<html>` má všetky `--accent-hover`, `--sales`, `--ink-muted`, atď.
- [ ] Default render (bez override env) má `data-skin="pko"`

**Závislosti:** E0-02, E0-03

---

## Epic E1 — Primitívy prepis

### E1-01 — `.btn` + varianty `[M]`

**Cieľ:** Prepísať `.btn` od základu na light-mode navy primary + outline secondary + orange sales, bez hard-offset shadow.

**Súbory:**
- `app/globals.css` (riadky 176–218)

**Akceptačné kritériá:**
- [ ] Podľa `03-COMPONENTS.md` §1
- [ ] Varianty: `.btn` (primary navy), `.btn-sales`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`
- [ ] Size modifiers: `.btn-sm`, `.btn-lg` (default = md = 44 px height)
- [ ] Hover, focus-visible, active, disabled, loading stavy implementované
- [ ] **Staré farebné varianty** (`.btn-pink`, `.btn-cyan`, `.btn-lime`) zachované pod `[data-skin="core"]`, pre `[data-skin="pko"]` neapplikujú
- [ ] Visual parity s pkobp.pl tlačidlami
- [ ] Playwright smoke test zelený

**Závislosti:** E0-03

---

### E1-02 — `.card` redesign `[S]`

**Cieľ:** Tenký 1 px border, radius 10 px, žiadny hard-offset shadow. Interactive hover stav.

**Súbory:**
- `app/globals.css` (riadky 164–174)

**Akceptačné kritériá:**
- [ ] Podľa `03-COMPONENTS.md` §2
- [ ] Varianty: `.card`, `.card--interactive`, `.card--elevated`, `.card--sales`
- [ ] Default padding 24 px
- [ ] `.card--interactive` má focus-visible ring + hover border farbu `var(--accent)`
- [ ] Bez shadow na default, shadow na elevated + hover interactive

**Závislosti:** E0-03

---

### E1-03 — `.input` redesign `[S]`

**Cieľ:** Ostré rohy, 1 px border, bez hard-offset shadow, focus navy outline.

**Súbory:**
- `app/globals.css` (riadky 220–235)

**Akceptačné kritériá:**
- [ ] Podľa `03-COMPONENTS.md` §3
- [ ] `border-radius: 0` (ostré, ako pkobp.pl)
- [ ] Focus state: border `var(--accent)` + `box-shadow: 0 0 0 1px var(--accent)`
- [ ] `aria-invalid="true"` → červený border
- [ ] Placeholder farba `var(--ink-subtle)`
- [ ] Min-height 44 px

**Závislosti:** E0-03

---

### E1-04 — `.chip` redesign + `.brutal-tag` scope `[S]`

**Cieľ:** Pill chip bez brutalism shadow. `.brutal-tag` scoped len pod `[data-skin="core"]`.

**Súbory:**
- `app/globals.css` (riadky 237–249, 532–543)

**Akceptačné kritériá:**
- [ ] `.chip` default = light-mode pill podľa `03-COMPONENTS.md` §4
- [ ] `.brutal-tag` pravidlá zabalené do `:where([data-skin="core"]) .brutal-tag { ... }` — nikde inde neapplikujú

**Závislosti:** E0-03

---

### E1-05 — Section heading primitív `[S]`

**Cieľ:** Zaviesť `.section-heading` (nahrádza `.brutal-heading` v pko skine).

**Súbory:**
- `app/globals.css`

**Akceptačné kritériá:**
- [ ] `.section-heading` podľa `03-COMPONENTS.md` §20
- [ ] `.brutal-heading` scoped `[data-skin="core"]` only

**Závislosti:** E0-03

---

### E1-06 — Typo utility classes `[S]`

**Cieľ:** Pridať `.t-display`, `.t-h1`–`.t-h5`, `.t-body-lg`, `.t-body`, `.t-body-sm`, `.t-caption`, `.t-micro`, `.t-overline`.

**Súbory:**
- `app/globals.css` (nový `@layer utilities` blok)

**Akceptačné kritériá:**
- [ ] Všetky triedy zo `02-DESIGN-TOKENS.md` §5 implementované
- [ ] Aplikovateľné aj v core skine (typografická škála je skin-agnostic)

**Závislosti:** E0-03

---

### E1-07 — Elevation utilities + section-y `[S]`

**Cieľ:** `.elev-line`, `.elev-soft`, `.elev-soft-lg`, `.section-y`, `.section-y-sm`.

**Súbory:**
- `app/globals.css`

**Akceptačné kritériá:**
- [ ] Všetky utility triedy podľa `02-DESIGN-TOKENS.md` §6 a §8

**Závislosti:** E0-03

---

### E1-08 — Focus ring refactor `[S]`

**Cieľ:** Zmeniť globálny `:focus-visible` z `var(--neo-yellow)` na `var(--focus-ring)` = `var(--accent)`.

**Súbory:**
- `app/globals.css` (riadky 64–68)

**Akceptačné kritériá:**
- [ ] `:focus-visible` outline farba `var(--focus-ring)` (v pko = navy, v core stále yellow — lebo `core` override tokenu)
- [ ] Axe scan 0 serious

**Závislosti:** E0-03

---

### E1-09 — Odstrániť radial gradient background z `body` `[S]`

**Cieľ:** Minimalistické biele pozadie v pko. Pattern zachovať iba v core.

**Súbory:**
- `app/globals.css` (riadky 151–160)

**Akceptačné kritériá:**
- [ ] `body { background-image: none; }` pre `[data-skin="pko"]`
- [ ] `body { background-image: radial-gradient(…) }` zabalené do `:where([data-skin="core"]) body { … }`

**Závislosti:** E0-03

---

## Epic E2 — Brutalism removal v JSX (najväčší epic)

> **Hlavná lekcia SKO reverte:** CSS shield cez `:root[data-skin="pko"]` **nedokáže** prebiť Tailwind arbitrary utilities. Musíme ich fyzicky mazať zo zdrojových súborov.
>
> **Modus operandi:** V každom komponente nahradiť `border-[3px]` → `border` (= 1 px), `shadow-[6px_6px_0_0_var(--ink)]` → (zmazať alebo `shadow-soft`), `uppercase` → (zmazať, iba na chipoch zachovať), `font-[800|900]` → `font-semibold` (600), `rounded-[14px]` → `rounded-md` (= 10 px).

### E2-01 — Grep-audit celého projektu `[S]`

**Cieľ:** Vytvoriť úplný zoznam výskytov brutalism patternov do jedného .md súboru.

**Súbory:**
- `docs/pko-redesign/_audit.md` (nový, temporary — zmazať po E2)

**Akceptačné kritériá:**
- [ ] Grep `border-\[[1-9]+px` → výpis všetkých výskytov (súbor:riadok + context)
- [ ] Grep `shadow-\[[0-9]+px` → výpis
- [ ] Grep `uppercase` v `.tsx` → výpis
- [ ] Grep `font-\[?(800|900|black|extrabold)` → výpis
- [ ] Grep `rounded-\[` → výpis
- [ ] Súhrn: počet výskytov per komponent
- [ ] `_audit.md` je commitnutý v PR E2-01 a slúži ako TODO list pre E2-02 až E2-20

**Závislosti:** žiadne

---

### E2-02 až E2-20 — Refactor per komponent

Každý z týchto tiketov je rovnaká štruktúra:

**Cieľ:** Odstrániť brutalism classes zo súboru X, zachovať funkčnosť.

**Akceptačné kritériá pre KAŽDÝ tiket E2-0X:**
- [ ] V súbore 0 výskytov `border-[Npx]` s N ≥ 2
- [ ] 0 výskytov `shadow-[...]` hard-offset
- [ ] 0 výskytov `uppercase` (výnimka: `.t-overline` trieda alebo chip tag)
- [ ] 0 výskytov `font-black`, `font-extrabold`, `font-[8|9]00`
- [ ] `rounded-[Npx]` iba z povolenej sady {0, 4, 10, 16} — nahradiť `rounded-md` atď.
- [ ] Visual: komponent zodpovedá `03-COMPONENTS.md` spec
- [ ] Všetky testy zelené (unit + e2e smoke)
- [ ] Komponent funkčný v core aj pko skin

| ID | Súbor | Odhad | Poznámky |
|---|---|---|---|
| E2-02 | `components/site-nav.tsx` | M | Kritický — nav na každej stránke |
| E2-03 | `components/bottom-tabs.tsx` | S | Mobile |
| E2-04 | `components/dashboard.tsx` | L | 320 riadkov, veľa tilov |
| E2-05 | `components/cashflow-hud.tsx` | M | 341 riadkov |
| E2-06 | `components/loan-comparison.tsx` | M | Tabuľka redesign |
| E2-07 | `components/loan-schedule.tsx` | S | Amortization table |
| E2-08 | `components/auth-form.tsx` | S | Login + register |
| E2-09 | `components/onboarding-tour.tsx` | M | Joyride custom styling |
| E2-10 | `components/teacher-onboarding-tour.tsx` | S | |
| E2-11 | `components/cookie-consent.tsx` | S | |
| E2-12 | `components/tier-up-toast.tsx` | S | |
| E2-13 | `components/new-game-toast.tsx` | S | |
| E2-14 | `components/notification-bell.tsx` | S | |
| E2-15 | `components/class-client.tsx` + `class-dashboard.tsx` | M | Teacher surface |
| E2-16 | `components/parent-client.tsx` | S | |
| E2-17 | `components/friends-client.tsx` | S | |
| E2-18 | `components/marketplace-client.tsx` | M | |
| E2-19 | `components/profile-edit.tsx` + `delete-account-button.tsx` | S | |
| E2-20 | `components/watt-deficit-panel.tsx` + `curriculum-chart.tsx` + zvyšok | M | Catch-all |

---

## Epic E3 — Key surfaces redesign

### E3-01 — Landing (`app/page.tsx`) redesign `[L]`

**Cieľ:** Anonymná landing v štýle pkobp.pl — sekcie zhora nadol podľa `03-COMPONENTS.md` §7.

**Súbory:**
- `app/page.tsx`

**Akceptačné kritériá:**
- [ ] Hero sekcia: H1 `t-display` v navy, podtitulok `t-body-lg`, primary + secondary CTA
- [ ] Produktový grid 4 karty (`.card--interactive`)
- [ ] Kalkulačka section (používa existujúcu loan comparison logic, len vizuál)
- [ ] App promo section (dvoj-stĺpcový)
- [ ] News section (3 karty)
- [ ] City-scene preview (existujúci `<CityScene interactive={false} compact>`)
- [ ] Footer zapojený (E3-04)
- [ ] Žiadne brutalism classes
- [ ] Mobile responzívny (4 stĺpce → 2 → 1)
- [ ] Smoke test prechádza

**Závislosti:** E1, E2-02 (nav)

---

### E3-02 — `site-nav.tsx` vizuálny redesign `[L]`

**Cieľ:** Horizontálny nav v pkobp.pl štýle, mega-menu, mobile drawer.

**Súbory:**
- `components/site-nav.tsx`

**Akceptačné kritériá:**
- [ ] Height 72 desktop / 56 mobile
- [ ] `bg-surface`, `border-bottom 1px var(--line)`
- [ ] Primary nav: linky s hover `text-accent`
- [ ] Aktívna položka: navy text + 2 px spodná čiara
- [ ] Login button outline navy, Register button filled sales orange (primary CTA na pkobp.pl = "Otwórz konto" orange)
- [ ] Mega-menu dropdown pod `Klient indywidualny`
- [ ] Mobile hamburger → full-screen slide-in drawer
- [ ] Zachovať role-aware link logiku (anon/kid/teacher/parent)
- [ ] Zachovať jazyk switcher

**Závislosti:** E1, E2-02

---

### E3-03 — Bottom tabs redesign `[S]`

**Cieľ:** Minimalistický mobile tab bar.

**Súbory:**
- `components/bottom-tabs.tsx`

**Akceptačné kritériá:**
- [ ] Biele pozadie, 1 px top border
- [ ] 4 taby, aktívny navy, inactive muted
- [ ] Žiadny hard-offset shadow
- [ ] Safe-area inset zachovaný

**Závislosti:** E1, E2-03

---

### E3-04 — Nový `site-footer.tsx` `[L]`

**Cieľ:** Vytvoriť samostatný footer komponent s 4 vrstvami podľa `03-COMPONENTS.md` §8.

**Súbory:**
- `components/site-footer.tsx` (nový)
- `app/layout.tsx` alebo `app/page.tsx` (použitie)

**Akceptačné kritériá:**
- [ ] Action bar (4 pill tlačidlá)
- [ ] Kurzy tabuľka (statická, hardcoded hodnoty — nie real-time API)
- [ ] Link columns (5 stĺpcov)
- [ ] Legal bar s social icons
- [ ] Zachovať existujúce linky ak nejaké sú (`o-platformě`, disclaimer)
- [ ] Vykresluje sa pod footerom landing + logged-in dashboardu
- [ ] Nie je duplikovaný na úzkych content stránkach (e.g. game detail)

**Závislosti:** E1

---

### E3-05 — `auth-form.tsx` redesign `[M]`

**Cieľ:** Forma v pkobp.pl štýle — biele pozadie, label nad input, primary CTA navy.

**Súbory:**
- `components/auth-form.tsx`

**Akceptačné kritériá:**
- [ ] Labels nad inputmi (nie placeholder-only)
- [ ] Helper text + error state
- [ ] Primary button full-width na mobile
- [ ] Link do toggle login↔register (t-body-sm, text-accent)
- [ ] Žiadne brutalism classes

**Závislosti:** E1, E2-08

---

### E3-06 — `cookie-consent.tsx` redesign `[S]`

**Súbory:**
- `components/cookie-consent.tsx`

**Akceptačné kritériá:**
- [ ] Podľa `03-COMPONENTS.md` §13
- [ ] 3 tlačidlá rovnakej váhy (no dark pattern)

**Závislosti:** E1, E2-11

---

### E3-07 — `pko-mascot.tsx` early-return null `[S]`

**Súbory:**
- `components/pko-mascot.tsx`

**Akceptačné kritériá:**
- [ ] Guard `if (!theme.mascot) return null;`
- [ ] V `PKO_THEME` z E0-02 má `mascot === null`
- [ ] V core skine fallback správanie zachované (žiadny mascot = žiadny render)

**Závislosti:** E0-02

---

### E3-08 — Section heading aplikácia `[S]`

**Cieľ:** Nahradiť `.brutal-heading` za `.section-heading` na všetkých miestach použitia v JSX.

**Súbory:** grep `brutal-heading` v `**/*.tsx`

**Akceptačné kritériá:**
- [ ] Všetky výskyty v JSX nahradené za `section-heading`
- [ ] Vizuálne konzistentné v pko skine

**Závislosti:** E1-05

---

## Epic E4 — CityScene color refactor

> Toto je najnáročnejší epic. SVG má 73+ hardcoded hex values a 1679 riadkov. Už sa to raz skúšalo (SKO PR-3) a skončilo neon-saturated disaster. **Kľúč: pracovať cez 8 sémantických bucketov, nie cez neon palette.**

### E4-01 — Extrakcia farieb do bucketov `[M]`

**Cieľ:** Zinventarizovať všetky farby v city-scene SVG a priradiť ich do 8 bucketov.

**Súbory:**
- `docs/pko-redesign/_city-scene-palette.md` (temp)
- `components/city-scene.tsx` (len read)

**Akceptačné kritériá:**
- [ ] `_city-scene-palette.md` obsahuje tabuľku: `pôvodný_hex | count | bucket`
- [ ] 8 bucketov: sky, building-primary, building-secondary, roof, window, road, detail-warm, detail-cool

**Závislosti:** E0

---

### E4-02 — Zaviesť CSS premenné pre city-scene `[M]`

**Cieľ:** Definovať premenné `--sc-*` na root `<svg>` elemente v city-scene.

**Súbory:**
- `components/city-scene.tsx`
- `app/globals.css` (prípadne `[data-skin] .city-scene { --sc-*: … }` pravidlá)

**Akceptačné kritériá:**
- [ ] `[data-skin="pko"] .city-scene { --sc-sky, --sc-building-*, … }` definované podľa `03-COMPONENTS.md` §11
- [ ] `[data-skin="core"] .city-scene { --sc-* }` zachováva pôvodné neon hodnoty

**Závislosti:** E4-01

---

### E4-03 — Nahradenie hardcoded hex za `var(--sc-*)` `[XL]`

**Cieľ:** V city-scene SVG JSX nahradiť všetky `fill="#xxx"` / `stroke="#xxx"` za `fill="var(--sc-*)"`.

**Súbory:**
- `components/city-scene.tsx`

**Akceptačné kritériá:**
- [ ] Grep `fill="#` v súbore → max 5 výskytov (povolené iba pre čierne obrysy alebo transparentné)
- [ ] Grep `stroke="#` → max 5
- [ ] V pko skine vyzerá city-scene kalmovo (navy/grey tone, jemné teplé detaily)
- [ ] V core skine zostáva pôvodný vzhľad
- [ ] Playwright smoke test zelený
- [ ] Axe scan 0 serious

**Závislosti:** E4-02

---

### E4-04 — `city-skyline-hero.tsx` farebná úprava `[M]`

**Cieľ:** Obdobne ako E4-03 pre menší hero komponent (203 riadkov).

**Súbory:**
- `components/city-skyline-hero.tsx`

**Akceptačné kritériá:**
- [ ] Farby cez `--sc-*` premenné
- [ ] V pko skine minimalistický navy/sivý panoramic look

**Závislosti:** E4-02

---

### E4-05 — `city-level-card.tsx` + `city-preview.tsx` `[S]`

**Cieľ:** Dokončiť zvyšok city-* komponentov.

**Súbory:**
- `components/city-level-card.tsx`
- `components/city-preview.tsx`

**Akceptačné kritériá:**
- [ ] Žiadne hardcoded hex
- [ ] Vizuálne konzistentné s city-scene

**Závislosti:** E4-02

---

## Epic E5 — Hromadný redesign ostatných komponent

### E5-01 až E5-24 — Refactor 24 game client komponentov `[S každý]`

**Zdroj:** `components/games/*.tsx` (24 súborov)

**Cieľ:** V každom: odstrániť brutalism, použiť nové primitives.

Rovnaké akceptačné kritériá ako E2-0X.

Navrhované dávky:

| Dávka | Tikety | Poznámky |
|---|---|---|
| E5-A | `ai-price-guess-client`, `ai-calc-sprint-client`, `ai-budget-allocate-client`, `ai-diversify-client` | AI games dávka 1 |
| E5-B | `ai-reverse-compound-client`, `ai-spot-fee-client`, `ai-fx-map-client`, `ai-credit-limit-client` | AI games dávka 2 |
| E5-C | `ai-risk-on-off-client`, `ai-apr-vs-apy-client`, `ai-annuity-client`, `ai-duration-client` | AI games dávka 3 |
| E5-D | `ai-sharpe-client`, `ai-correlation-client` | AI games zvyšok |
| E5-E | `word-scramble-client`, `math-sprint-client`, `memory-match-client` | Evergreen 1 |
| E5-F | `trivia-client`, `stock-picker-client`, `budget-tetris-client` | Evergreen 2 |
| E5-G | `round-result-client`, `post-game-breakdown`, `game-comments`, `round-comments-mount` | Post-game UI |

---

### E5-25 — Widgety + ostatné `[M]`

**Súbory:**
- `components/live-countdown.tsx`
- `components/count-up.tsx`
- `components/confetti.tsx`
- `components/resource-bar.tsx`
- `components/resource-flash-chip.tsx`
- `components/swipe-to-dismiss.tsx`
- `components/language-switcher.tsx`
- `components/knf-disclaimer.tsx`
- `components/coming-soon-banner.tsx`
- `components/consent-client.tsx`
- `components/logout-button.tsx`
- `components/csrf-bootstrap.tsx`

**Akceptačné kritériá:** rovnaké ako E2-0X.

---

## Epic E6 — Final polish

### E6-01 — Playwright full regression `[M]`

**Cieľ:** Spustiť všetky 13 Playwright specs a ubezpečit sa že zelené.

**Akceptačné kritériá:**
- [ ] `pnpm test:e2e` — všetky passes
- [ ] Žiadne nové flaky
- [ ] Mobile viewport (`smoke.mobile.spec.ts`) zelený

---

### E6-02 — Vitest full regression `[S]`

**Cieľ:** `pnpm test` — 635 testov zelených.

**Akceptačné kritériá:**
- [ ] All passes
- [ ] `pko-skin.test.ts` zvláštne pozorovanie

---

### E6-03 — Axe-core a11y scan `[S]`

**Cieľ:** Automatizovaný a11y audit na kľúčových stránkach.

**Akceptačné kritériá:**
- [ ] `/` (anon + logged-in) — 0 serious
- [ ] `/register`, `/login` — 0 serious
- [ ] `/město` (logged-in) — 0 serious
- [ ] `/games` — 0 serious
- [ ] Kontrast: navy-on-white ≥ 4.5:1; orange-on-white na large text only

---

### E6-04 — Lighthouse `[S]`

**Cieľ:** Perf + a11y + best-practices score.

**Akceptačné kritériá:**
- [ ] Performance ≥ 90
- [ ] Accessibility ≥ 95
- [ ] Best practices ≥ 95
- [ ] SEO ≥ 90

---

### E6-05 — Screenshot matrix (pred/po) `[M]`

**Cieľ:** Dokumentácia zmeny pre PR reviewerov.

**Akceptačné kritériá:**
- [ ] `docs/pko-redesign/screenshots/` obsahuje `before/` a `after/` priečinky
- [ ] Pokryté: landing anon, landing logged-in, město, games hub, game detail, leaderboard, register, login, settings, město (mobile), friends, marketplace
- [ ] Desktop (1440) + mobile (390) varianty

---

### E6-06 — Zmazať SKO-related docs cleanup `[S]`

**Cieľ:** Ak existujú `docs/SKO-*.md` alebo `docs/pko-*.md` staré, zmazať alebo presunúť do archívu.

**Súbory:** grep `docs/SKO-` a `docs/partnerships/pko-*`

**Akceptačné kritériá:**
- [ ] Iba `docs/pko-redesign/` obsahuje PKO-related dokumentáciu
- [ ] Žiadne stale `SKO-BACKLOG.md`, `SKO-VISION.md` (ak ešte existujú)

---

### E6-07 — Update CLAUDE.md + README `[S]`

**Cieľ:** Informovať budúcich prispievateľov.

**Súbory:**
- `AGENTS.md` alebo `CLAUDE.md`
- `README.md`

**Akceptačné kritériá:**
- [ ] Pridaná note: „Default skin is `pko` (light-mode navy primary). Viz `docs/pko-redesign/`."
- [ ] Pridaná inštrukcia: „Žiadne `border-[Npx]`, `shadow-[...]` arbitrary utility classes. Použiť existujúce primitives + token triedy."

---

### E6-08 — QA walkthrough session `[M]`

**Cieľ:** Spolu s PM/stakeholder preklikať všetky hlavné flows v pko skine.

**Checklist:**
- [ ] Anon landing → register → onboarding → dashboard
- [ ] Hra: select → play → výsledok → leaderboard
- [ ] Město: build → yield → loan
- [ ] Teacher flow: class → curriculum
- [ ] Mobile: bottom tabs, drawer, cookie consent
- [ ] Skin toggle (ak implementovaný) core ↔ pko funguje

---

## Zhrnutie taskov

| Epic | Počet tiketov | Odhad spolu |
|---|---|---|
| E0 | 7 | 1–2 d |
| E1 | 9 | 1–2 d |
| E2 | 20 | 3–5 d |
| E3 | 8 | 3–4 d |
| E4 | 5 | 3–4 d |
| E5 | 25 | 3–5 d |
| E6 | 8 | 1–2 d |
| **Spolu** | **~82** | **15–24 dní pre 1 FE seniora** |

Pri 2 FE parallel pracujúcich môže byť hotovo za **8–12 dní** (E4 paralelne s E3, E5 dávky paralelne s E2).

---

## Dôležité poznámky

1. **Tikety E0 sú blokujúce.** Kým nie je tokenový systém hotový, ostatné sa nedá robiť.
2. **E1 musí byť hotové pred E2–E5.** Primitívy sú fundament.
3. **E2-01 (audit grep)** musí prebehnúť PRED konkrétnymi per-komponentovými tiketmi E2-02+, inak nevieme rozsah.
4. **E4 (city-scene)** je izolovaný a môže ísť paralelne.
5. **Skin toggle UI** (cookie `xp_skin` + `/api/skin` route) **NIE je v backlogu** — revertnutá infraštruktúra sa nevracia. Default skin sa mení cez env var alebo hardcoded `currentSkin()`. Ak chce biznis UI toggle neskôr, samostatný follow-up.
6. **Žiadne testy nepridávame.** Existujúci pokryv (vitest 635 + Playwright 13) overuje chovanie, nie vzhľad. Vizuálnu regresiu riešime screenshot matricou v E6-05.
