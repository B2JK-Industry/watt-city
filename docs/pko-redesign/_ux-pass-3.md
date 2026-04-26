# PKO Redesign — UX Pass 3 (Senior produkt review)

**Reviewer:** Senior produkt vizionár
**Dátum:** 2026-04-26
**Východisko:** Stav po PR-A (af36950, contrast sweep), PR-B (6847628, border sweep), PR-C (a8ab6a6, brutalism kill), SS1–SS12 (d2aaeca), Round-2 polish (70047b9). Default skin `pko`, light navy + warm orange.
**Metóda:** Playwright walkthrough 28 routes × 2 viewporty (1440 desktop / 390 mobile) = 56 screenshotov + 56 axe-core scans + console/page-error capture. Plus statický audit kľúčových komponentov (`site-nav`, `site-footer`, `resource-bar`, `dashboard`, `globals.css`, `lib/resources.ts`).
**Artefakty:** `tmp/walkthrough-shots/*.png`, `tmp/walkthrough-shots/_findings.json` (machine), `e2e/walkthrough.spec.ts` (reproducibilný).

---

## TL;DR pre product owner

**Zelené pre PKO showcase, ALE traja blokeri:**

1. 🚨 **ResourceBar v navigácii má neon `color: #fde047` text na bielom = contrast 1.6:1** — globálny axe-serious fail na **18 logged-in routes**. Single-fix hot zone.
2. 🚨 **„Noc nad Katowicami" tmavý SVG hero** sa zobrazuje na 3 hlavných stránkach (`/`, `/`-loggedin, `/games`) a vizuálne narúša pko biely-light brand. Vyzerá ako arcade hra na bankovom webe.
3. 🚨 **`/dla-szkol`** — najdôležitejšia akquizičná stránka pre školy — má **„Jak to działa — 4 kroki"** sekciu s 4 prázdnymi číslami v krúžkoch a „Jak wygląda produkt" s **3× „PREVIEW · SOON" placeholder framemi**. School director uvidí „nie sú dotiahnutí".

Po týchto troch fixoch je produkt v stave, kde sa s ním dá ísť k partnerovi. Zvyšok (12 ďalších findings) je incremental polish.

**Severities:**

| Severity | Počet | Akcia |
|---|---|---|
| CRITICAL (P0) | 3 | Pred PKO partner showcase |
| MAJOR (P1) | 8 | Sprint 1 |
| MINOR (P2) | 4 | Backlog |
| POLISH (P3) | 3 | Nice-to-have |
| **Spolu** | **18** | |

---

## Top-3 red-flag témy

### 🚨 RF-1 · Neon farby ostali v dátovom modeli (`lib/resources.ts`)
Aj po troch PR-kách, ktoré vymetli `text-zinc-*`, `text-amber-*`, `text-emerald-*` z JSX, **`RESOURCE_DEFS.color`** v `lib/resources.ts:84-195` ostali tmavomódové neon hex (`#fde047`, `#f59e0b`, `#22d3ee`, `#22c55e`). ResourceBar ich konzumuje cez `style={{ color: def.color }}` — `style=` win nad CSS shieldom (špecificita inline > selector). Toto je **dátový model leak** — sweepy v JSX ho nezachytili. Treba pretiahnúť `lightColor` field do `RESOURCE_DEFS` (alebo vrátiť všetky farby na palette tokens) a refactornúť ResourceBar.

### 🚨 RF-2 · CityScene „nightmare on white"
`globals.css:216` aplikuje `filter: saturate(0.5) brightness(1) contrast(1.04)` na `.city-scene-root` ako stopgap, ale: (a) filter je príliš slabý — výsledok ostáva tmavomodro-fialový, nie denný; (b) `city-skyline-hero.tsx` (samostatný komponent na landingu) **nie je pod selector** `.city-scene-root` a filter ho nezasiahne. Zaberá veľký vizuálny priestor a kreuje „banking site má arcade vnútri" disonanciu. Toto je epic E4 v backlogu — potrebuje vyriešiť, lebo blokuje brand discipline.

### 🚨 RF-3 · `/dla-szkol` má **dva placeholder slabé miesta** uprostred konverzného flow
„Jak to działa — 4 kroki" = iba čísla bez popisov. „Jak wygląda produkt" = 3 prázdne PREVIEW · SOON frame mockupy. Toto sú dve hlavné dôveryhodné sekcie pre school decision makera **a obe vyzerajú nedotiahnuté**. School director už nepôjde pod ne na compliance sekciu — odíde.

---

## Findings — detail

### F-NEW-01 · 🚨 CRITICAL · ResourceBar neon farby (color-contrast fail na 18 routes)

> **STATUS: FIXED in PR-D** — `ResourceDef.lightColor` field added, `resource-bar.tsx` + `parent/[username]/page.tsx` consume it. WCAG-AA contrast guard in `lib/resources-contrast.test.ts` (9 cases, all green).


**Kde:** `components/resource-bar.tsx:46`, `lib/resources.ts:84,102,138,176`
**Ako reprodukovať:** Prihlásiť sa, otvoriť ľubovoľnú logged-in stránku, pozrieť top resource chips. Spustiť `pnpm exec playwright test walkthrough` → `_findings.json` → `id: "color-contrast"` na 18 routes.
**Čo vidím:** žltá `0`, oranžová `50`, hnedá `50`, zelená `0` — všetky `font-bold` text vo farbe zo `RESOURCE_DEFS.color`.
**Kontrast:**
- Watts `#fde047` na `#ffffff` ≈ **1.62:1** ❌
- Coins `#f59e0b` na `#ffffff` ≈ **2.43:1** ❌
- Glass `#22d3ee` na `#ffffff` ≈ **1.71:1** ❌
- Cash `#22c55e` na `#ffffff` ≈ **2.04:1** ❌
- (Iba bricks `#a16207` má 5.6:1 ✅)
**Spec:** `01-BRAND-MANUAL.md` §12 — body text ≥ 4.5:1.
**Root cause:** dátový model `RESOURCE_DEFS` ostal z core (dark) skinu. JSX sweepy ho nezachytili lebo farba prechádza cez `style={{color}}` inline.
**Návrh fixu:**
1. Pridať do `ResourceDef` typ `lightColor: string` a do každej entry kontrastný variant: `watts: { color: "#fde047", lightColor: "#a16207" }`, atď. Použiť `lightColor` v `resource-bar.tsx:46`.
2. Alebo lepšie: ResourceBar nemusí farbiť **text** — môže farbiť iba **ikonu / accent border**, kým hodnota ostane `var(--foreground)`. Vizuálne čistejšie + pasuje k pko discipline.
3. Vitest test na kontrast (per `_ux-pass-2.md` návrh O — token guard).

---

### F-NEW-02 · 🚨 CRITICAL · „Noc nad Katowicami" tmavý SVG hero leak (3 stránky)

> **STATUS: FIXED in PR-E** — pko `.city-scene-root` filter strengthened to `saturate(.35) brightness(1.55) contrast(.92)`, sky gradient stops + ground pattern overridden via attribute selectors, `CitySkylineHero` opted into `.city-scene-root`, dark `bg-black/40` empty-state overlay swapped for skin-aware `.city-skyline-empty-overlay`. Drive-by a11y fixes (drawer `inert` when closed, marketplace progressbar aria-label, /loans/compare badge text → accent, /games/budget-balance + /parent input aria labels) take walkthrough a11ySerious findings from 31 → 0.


**Kde:**
- `/` (anonymous landing) — pod hero CTA (`components/city-skyline-hero.tsx`)
- `/` (logged-in dashboard, sekcia „Twój dom") — `components/city-skyline-hero.tsx`
- `/games` (anon + logged-in, „Twoje Katowice") — `components/city-scene.tsx`
**Čo vidím:** tmavá noc-modrá obloha, mesiac, neon-yellow okná, čierne siluety budov — zaberá ~360×180 (desktop) / 390×140 (mobile) v centre rozloženia.
**Spec:** `01-BRAND-MANUAL.md` §1 — biely povrch, navy text, jeden warm-orange CTA. **Žiadny dark hero v light layoute.**
**Root cause:**
1. `globals.css:216` má filter `saturate(0.5) brightness(1)` — slabé, výsledok ostáva tmavý.
2. `city-skyline-hero.tsx` má vlastný render mimo `.city-scene-root` selector — globálny filter ho nezasiahne.
**Návrh fixu (krátkodobý — pred PKO showcase):**
1. Audit `city-skyline-hero.tsx` — pridať CSS class `city-scene-root` na root SVG element, aby zdedil pko filter.
2. V `globals.css:216` zvýšiť na `filter: saturate(0.3) brightness(1.4) contrast(0.95)` → svetlé denné mesto.
3. Override sky color: `:where([data-skin="pko"]) .city-scene-root [fill="#0f172a"], [fill="#1e1b4b"] { fill: var(--sc-sky); }` (#e8f0f9).
**Návrh fixu (dlhodobý):** epic E4 v `04-BACKLOG.md` — full 8-bucket SVG refactor.
**Acceptance:** Side-by-side screenshot core vs. pko. Pko mesto musí pôsobiť ako „súmrak v slnečnom dni", nie noc.

---

### F-NEW-03 · 🚨 CRITICAL · `/dla-szkol` „Jak to działa — 4 kroki" iba čísla bez popisov

> **STATUS: FIXED in PR-F** — added `schoolSteps: [{title, body} × 4]` to inline `Copy` for all 4 locales (PL/UK/CS/EN); rendering swapped to title + body cards (`md:grid-cols-2 lg:grid-cols-4`). `/o-platforme` already used title+body via the `aboutPage.howSteps` dict, so no change there. Old `howStep1..4` keys retained for back-compat per scope-fence rule.


**Kde:** `app/dla-szkol/page.tsx` (sekcia „Jak to działa")
**Čo vidím:** 4 navy číslované krúžky (1, 2, 3, 4) v rade, **bez nadpisu pod nimi, bez popisu, bez ikony**. Mobile: krúžky stacknuté pod sebou, rovnaké prázdno.
**Impact:** Pre school director, ktorý je tu prvýkrát hľadá „ako produkt funguje", strata informácie. Toto je primárna onboarding sekcia. Obdobne na `/o-platforme` (rovnaký pattern).
**Návrh fixu:** Pre každý krok pridať title + 2-3 riadky popisu. Návrh obsahu (PL):
1. **Załóż konto nauczyciela** — Wpisz imię, szkołę i ustaw hasło. Zajmuje 30 sekund.
2. **Stwórz klasę i pobierz kody** — Generujemy 30 jednorazowych kodów do rozdania uczniom.
3. **Uczniowie grają** — Logują się kodem, grają minigry, budują swoje miasto Watt City.
4. **Sledujesz postępy** — Tygodniowy raport PDF, panel klasy, wybór tematu na kolejny tydzień.
**Acceptance:** Screen test pred/po — sekcia má clear narratívu, nie „4 prázdne krúžky".

---

### F-NEW-04 · 🚨 CRITICAL · `/dla-szkol` „Jak wygląda produkt" — 3× PREVIEW · SOON placeholder

> **STATUS: FIXED in PR-F (via Round 2.5 content cards)** — the 3 striped "PREVIEW · SOON" placeholders were replaced with content-rich JSX preview cards (mock class roster top-5, weekly PDF stat summary, student dashboard cashflow strip + city emoji row), all locale-aware via the `screen{1,2,3}` captions. Acceptance criterion (`0 výskytov stringu „PREVIEW · SOON"`) met — covered by `e2e/ux-fixes.spec.ts`.
>
> **Headless `scripts/take-school-shots.ts` pipeline: STATUS — OUT-OF-SCOPE (Voľba A defaulted in PR-H · H-05).** Inline content cards stay; no real-screenshot rendering layer is added. Decision recorded in `_ux-pass-4.md` Časť 3 W-05.


**Kde:** `app/dla-szkol/page.tsx` (sekcia „Jak wygląda produkt")
**Čo vidím:** 3 browser-frame mockupy s textom „PREVIEW · SOON" + popisok pod nimi (Panel klasy, Tygodniowy raport, Dashboard ucznia). Žiadny obsah v ráme.
**Impact:** School director vidí: „developmenta beta, nemajú produkt". Stratí sa konverzia.
**Návrh fixu:**
- Headless screenshot pipeline (`scripts/take-school-shots.ts`) ktorý spustí Playwright, prihlási sa ako demo teacher, navštívi `/klasa/[demo-id]`, `/api/dla-szkol/pitch?locale=pl`, demo-kid dashboard. Zachytí 3 PNG do `public/dla-szkol/preview-{1,2,3}.png`.
- Dla-szkol page tieto screenshoty embeduje namiesto PREVIEW frame.
- Pridať `alt` text pre a11y.
**Acceptance:** 0 výskytov stringu „PREVIEW · SOON" v JSX.

---

### F-NEW-05 · MAJOR · `/o-platforme` chýba sticky TOC na ~3000px stránke

> **STATUS: FIXED in PR-I** — `lg:grid-cols-[200px_1fr]` wrap with a sticky `<aside>` carrying 10 anchor links (one per section). Each `<section>` has an `id` + `scroll-mt-24` so a click jumps to the heading without it sliding under the sticky nav. Mobile read top-to-bottom (aside is `lg:` only). Active-state highlight via `IntersectionObserver` deferred (would require client component) — the visible nav is already a meaningful win.


**Kde:** `app/o-platforme/page.tsx`
**Čo vidím:** 7+ sekcií (Idea, Nauka o nawykiem, Jak to działa, Pipeline AI, Sieň najlepších budynků, Stack, Sponsorzy, Web3, Roadmap, Zespol). Jeden veľký scroll. Hľadanie konkrétnej témy = roll-up/down.
**Spec:** `_ux-pass-2.md` návrh F.
**Návrh fixu:**
- Desktop ≥ lg: sticky vertikálny TOC vľavo (`<aside>` v gride `[240px_1fr]`). Anchor links na `#idea`, `#nauka`, `#pipeline`, atď.
- Mobile: top sticky chip-row s tými istými anchormi (horizontal scroll).
- ID tagy doplniť do každého `<h2>`/`<h3>`.
- Highlight aktívnej sekcie pomocou IntersectionObserver.
**Acceptance:** Click na TOC link skrolne na sekciu. Mobile scroll updatuje active chip.

---

### F-NEW-06 · MAJOR · Empty states sú text-only across the app

**Kde:**
- `/leaderboard` — „Jeszcze nikt nie zdobyl punktow. Bądź pierwszy!"
- `/friends` — „Jeszcze nikogo tu nie ma."
- `/profile` — 8 achievement kariet „Zablokowane"
- `/marketplace` — „Giełda aktywna od Tier 7"
- `/parent` — Polacz disabled po pristúpení
- Dashboard „Top Silesia" empty
**Spec:** `_ux-pass-2.md` návrh C.
**Návrh fixu:** šablóna `EmptyState` komponentu:
```
icon (48×48, navy outline)
heading (t-h4)
body (t-body, ink-muted)
primary CTA (.btn)
```
Aplikovať vo všetkých 6 miestach. Príklady:
- Leaderboard: 🏆 „Buď první!" → „Zahrej minihru" (`/games`)
- Friends: 👥 „Pozvi prvního" → „Skopírovať odkaz"
- Achievements: 🎖 „Tvoj prvý medal čaká" → „Zahraj quiz"
**Acceptance:** Žiadny empty state bez ikony + CTA.

---

### F-NEW-07 · MAJOR · `/marketplace` tier-gate bez progress baru

**Kde:** `components/marketplace-client.tsx`
**Čo vidím:** Iba ikona zámku + sentence „Giełda aktywna od Tier 7 (odblokujesz budując Stację kolejową)". Nikde nie je vizuálny indikátor kde je user (Tier 1) a koľko mu chýba.
**Spec:** `_ux-pass-2.md` návrh M.
**Návrh fixu:**
```jsx
<div className="card flex flex-col gap-4">
  <h2 className="t-h3">🔒 Giełda miejska</h2>
  <p className="t-body">{tierGateCopy}</p>
  <div>
    <div className="flex justify-between t-body-sm text-[var(--ink-muted)]">
      <span>Tier {currentTier}</span>
      <span>Tier 7 · {buildingsToGo} budynków</span>
    </div>
    <div className="h-2 bg-[var(--surface-2)] rounded-full mt-2">
      <div className="h-full bg-[var(--accent)] rounded-full" style={{width: `${pct}%`}} />
    </div>
  </div>
  <Link href="/miasto" className="btn btn-secondary">Pokračuj v budowie</Link>
</div>
```
**Acceptance:** Stránka má clear „path to unlock" namiesto plain lock message.

---

### F-NEW-08 · MAJOR · Cookie banner = 2-button agree-only dark pattern

**Kde:** `components/cookie-consent.tsx`
**Čo vidím:** Sticky bottom bar s textom „Stosujemy tylko pliki niezbędne... Brak trackerów, brak reklam." + 2 buttons („Więcej" text-link, „Rozumiem" navy primary).
**Spec:** `01-BRAND-MANUAL.md` §13 + `_ux-pass-2.md` návrh H — 3 buttons rovnakej váhy alebo zvýrazniť „no tracking" subtitle.
**Návrh fixu (light-touch, žiadne nové cookies):**
- Pridať podheading hneď pod titulok: **„✓ Brak trackerów, ✓ Brak analityky, ✓ Brak reklam."** (3 chips alebo line s checkmarkami).
- „Rozumiem" zmeniť na secondary outline (lebo nie je nič na čo súhlasiť — je to iba potvrdenie že user prečítal).
- „Więcej" → link na `/ochrana-sukromia`.
- Auto-dismiss po 30 sec scrolle.
**Acceptance:** Banner nepôsobí ako klasický „accept-only" cookie wall.

---

### F-NEW-09 · MAJOR · `/loans/compare` chýba interactive sliders pre kvotu/term

**Kde:** `components/loan-comparison.tsx`
**Čo vidím:** Tabuľka s **fixným** „Kwota: 3000 W$ · Okres (msc): 12". Žiadny slider, žiadny number input. **Tabuľka je read-only.**
**Spec:** `03-COMPONENTS.md` §form widgets — slider primitive + `01-BRAND-MANUAL.md` finančný edukačný účel = manipulovať s parametrami.
**Návrh fixu:**
1. Overiť — možno screenshot zachytil scroll position. Otvoriť stránku ručne, ak je tam slider hore.
2. Ak naozaj chýba — pridať dva sliders: principal (1000–10000 W$, step 500), term (6/12/24/36 mes, segmented).
3. Tabuľka recalcuje on-change.
**Acceptance:** User môže experimentovať s parametrami bez page reloadu.

---

### F-NEW-10 · MAJOR · Onboarding modal sa otvára na úvod dashboardu

**Kde:** `components/onboarding-tour.tsx`
**Čo vidím:** Po prihlásení (nový kid) sa **modal blokuje celý dashboard** s textom „Witaj w Watt City! Gra w energii — zarabiaj surowce — buduj miasto..." + Dalej button. Modal má 6+ krokov. User nevidí stránku kým ho neodklikne.
**Možná regresia:** Per commit `2026-04-22 ux-fixes-batch.md` to malo byť opravené (`keepalive` + localStorage nech sa neresetuje). Ale prvý-pristup user ho stále uvidí. Otázka: je dĺžka modal flow primeraná?
**Návrh fixu:**
- Skrátiť na max 3 kroky (Watt = energia, Buduj v meste, Zlož kredyt = bonus).
- Skip linky na každom kroku, nie iba na poslednom.
- „Skip onboarding" link v nav profile dropdown — ak ho user pôvodne odklikol Skip-om, môže sa znova spustiť.
**Acceptance:** Onboarding < 30 sec, nie blokuje dashboard exploration.

---

### F-NEW-11 · MAJOR · Anonymous landing — „Content Machine Phase 2 · Q3 2026" červený banner vyzerá ako error

**Kde:** `app/page.tsx` (anonymný hero, top notification stripe)
**Čo vidím:** Bordovo-červeno-rámcovaný strip s X ikonou + textom „Content Machine Phase 2 · Q3 2026 — gry rotujne, niez ujme tematicze, AI..."
**Problém:** Červený border + dismiss X = výzov error/varovanie. Toto je marketingová roadmap-info (positive content), nie chyba. Vizuálne posiela zlú správu.
**Návrh fixu:**
- Border: `var(--line)` (svetlá šedá), background `var(--surface-2)` (off-white).
- Ikona: namiesto X červeného → 🗓 alebo ✨ (positive marker).
- Pridať „Wkrótce" prefix chip (orange) ako positive teaser.
**Acceptance:** Banner vyzerá ako roadmap teaser, nie error.

---

### F-NEW-12 · MAJOR · `/parent` Polacz button visually disabled even when no input given

**Kde:** `components/parent-client.tsx`
**Čo vidím:** „Dolacz jako rodzic po kodzie" — pekný input + button „Polacz" napravo. Button má bledo-šedú farbu (looks disabled), aj keď používateľ ešte nič nevpísal — ale aj **bez aria-disabled**.
**Problém:** UX vyzerá ako broken button. User nevie, či button funguje, alebo je vypnutý.
**Návrh fixu:**
- Default state: secondary outline (`btn btn-secondary`) — vyzerá clickable.
- Po `value.length === 6` zmeniť na `btn btn-primary` (navy fill).
- Pridať helper text pod input: „Wpisz 6-znakový kód, ktorý dostal Tvoje dieťa pri rejestracji."
**Acceptance:** Pri prvom príchode user vidí jasnú „input → action" cestu.

---

### F-NEW-13 · MINOR · `font-mono` v ResourceBar leak

> **STATUS: FIXED in PR-I** — `font-mono` removed from `components/resource-bar.tsx`. `tabular-nums` retained so digits still align in the chip row.


**Kde:** `components/resource-bar.tsx:29` `text-xs font-mono tabular-nums`
**Čo vidím:** Hodnoty v resource chips sú mono-spaced (Geist Mono). Vizuálne pôsobí „technické monitoring widget", nie banking UI.
**Spec:** `02-DESIGN-TOKENS.md` typografia — Inter sans všade, mono iba pre code blocks.
**Návrh fixu:** Drop `font-mono`, ponechať `tabular-nums` (čísla zarovnané) na font-sans.
**Acceptance:** ResourceBar pôsobí ako súčasť bank UI, nie dev stack.

---

### F-NEW-14 · MINOR · Cookie banner overlap — `/dla-szkol` final CTA prekrytá

> **STATUS: FIXED in PR-I** — `body { padding-bottom: var(--cc-h, 0px) }` reserves the sticky bar's footprint. `<CookieConsent>` writes `--cc-h: calc(64px + safe-area-inset-bottom)` on `documentElement` while visible, clears it on dismiss. /dla-szkol final CTA now sits above the bar at first paint.


**Kde:** `components/cookie-consent.tsx` + `app/dla-szkol/page.tsx`
**Čo vidím:** Sticky cookie bar zaberá ~50px na dole. Na `/dla-szkol` je dôležitá final CTA „Wypróbuj demo / Zapisz się jako nauczyciel" — pri prvom pristúpení je čiastočne prekrytá cookie bannerom.
**Návrh fixu:**
- Layout fix: `body` má `padding-bottom: var(--cookie-bar-height)` kým je banner viditeľný (CSS variable nastavená v `cookie-consent.tsx`).
- Alebo — banner ako modal po 30 sec čítania, nie sticky stripe.
**Acceptance:** Žiadne CTA nie je v žiadnom moment prekryté cookie bannerom.

---

### F-NEW-15 · MINOR · Default username ostáva `wt_xxxxxxxxxx` v navigácii

> **STATUS: FIXED in PR-I** — `<Dashboard>` renders an `<aside>` nudge above CityLevelCard whenever `username.match(/^wt_/i)`. Card has ✨ + `t-h5` "Daj sobie imię" + `t-body-sm` reasoning + secondary CTA → /profile, in PL/UK/CS/EN.


**Kde:** Site-nav, dashboard hero
**Čo vidím:** Po registrácii sa ukáže `wt_tupttseyrj` ako display name v navigácii a hero. User si môže zmeniť `displayName` v `/profile` ale to nie je nikde explicitne pripomenuté.
**Návrh fixu:**
- Po prvej hre toast s CTA: „Vyber si svoje meno → /profile".
- Dashboard CTA pasik (pod CityLevelCard) ak `displayName === username`: „Daj si meno, ktoré uvidia spolužiaci →".
**Acceptance:** User je nudgeovaný na customizáciu identity v prvý play session.

---

### F-NEW-16 · MINOR · Achievement grid pre nového usera = 8 zámkov

> **STATUS: FIXED in PR-I** — `/profile` swaps the 8-locked-tile grid for an `EmptyState` (icon 🎖, title + body + sales CTA → /games) when `status.every(a => !a.owned)`. Once any badge is owned, the grid renders normally.


**Kde:** `app/profile/page.tsx`
**Čo vidím:** Hneď na začiatku (po regstrácii) `/profile` ukazuje grid 8 prázdnych „Zablokowane" achievement kariet. Vyzerá ako „nemáš nič".
**Spec:** F-NEW-06 (empty state pattern).
**Návrh fixu:**
- Pre nového usera (0 achievements) **skryť celý grid** a zobraziť: „🎖 Zahraj prvú hru a získaj svoj prvý medal." + CTA → `/games`.
- Po prvom achievemente: zobraziť získané + 3 najbližšie ďalšie (s progress: „2/5 hier do médailu").
**Acceptance:** Empty profile pôsobí ako začiatok cesty, nie zoznam zlyhaní.

---

### F-NEW-17 · POLISH · Help / FAQ link nie je v navigácii

> **STATUS: PARTIALLY FIXED in PR-I (truncated scope per pass-5 H-XX)** — `OpenTutorialButton` (existing client component) is now mounted in the desktop right cluster + the mobile drawer footer. FAQ link + Kontakt link **deferred** — they need product copy decision (FAQ has no content, Kontakt is "wkrótce"). The replay tutorial lever is the safe shipping subset; FAQ can ship later without churning the nav layout.


**Kde:** `components/site-nav.tsx`
**Čo vidím:** Nav má 4 linky (Miasteczko, Gry, Liga, O platformie) + role-aware piaty (Dla szkól / Moje klasy / Dziecko). Help/FAQ nikde.
**Spec:** `_ux-pass-2.md` návrh N. Footer má „Help" stĺpec (Compare loans, FAQ — wkrótce, Kontakt — wkrótce) ale ako primary discovery vehicle to nestačí.
**Návrh fixu:**
- V site-nav, vedľa NotificationBell, pridať otázniková ikona „?" (Lucide HelpCircle) → otvára dropdown s 3 položkami: „Tutorial znova", „FAQ", „Kontakt".
- Tutorial znova spustí `OpenTutorialButton` (existujúci komponent v `/o-platforme`).
**Acceptance:** Užívateľ má vždy 1-click prístup k pomoci.

---

### F-NEW-18 · POLISH · Avatar persóna nie je konzistentne použitá v UI

> **STATUS: PARTIALLY FIXED in PR-I** — Dashboard hero now renders the user's picked avatar (48 × 48 tile, `avatarFor(playerState.profile?.avatar)`). Leaderboard rows + friends list still use initials — the `LeaderboardEntry` API doesn't carry avatar; per spec fallback this is flagged `F-NEW-18-leaderboard` for a follow-up that requires either an API extension or a per-row avatar look-up.


**Kde:** Dashboard hero, leaderboard, friends list
**Čo vidím:** `/profile` má pekný avatar emoji selector (8 mož). Ale dashboard hero pre logged-in usera nemá avatar — iba username text. Leaderboard rows nemajú avatar. Friends list (keď bude obsadený) bude ukazovať iba username.
**Spec:** `_ux-pass-2.md` návrh G — avatarFor() všade.
**Návrh fixu:**
- Dashboard hero: navy ring 48×48 s avatar emoji vľavo od „Welcome, {name}".
- Leaderboard rows: 24×24 avatar pred username.
- Friends list (po fixe F-NEW-06 empty state) zobrazia avatar.
**Acceptance:** Avatar emoji sa konzistentne ukáže všade kde je user identifikovaný.

---

## Pozitívne nálezy (čo držať)

- ✅ **Login + Register** stránky sú kvalitne zarovnané s pko brandingom (navy H1, compliance trust strip, jeden primary CTA, čistá karta).
- ✅ **`/games/finance-quiz`** game UX je v dobrej kondícii — clean Q&A layout, jasné A/B/C/D, žiadny brand leak.
- ✅ **`/loans/compare`** KNF disclaimer panel je dobre spravený (žltá warning ikona, červený border ALE iba na warning pruhu, nie všeobecne).
- ✅ **`/sin-slavy`** Hall of Fame má pekné medal grid layout, podium variant.
- ✅ **`/leaderboard` chips filter** — emoji-led, clean pko look.
- ✅ **`/miasto`** city tile design (4 coming-soon credit cards) je clean a clickable, dobré informačné hierarchy.
- ✅ **Site footer** 3-vrstvový (brand+tagline / link columns / legal) je clean a fits pko spec — zámerný odklon od bank-specific 4-vrstvy je doložený v komentároch.
- ✅ **Site nav** role-aware (anon/kid/teacher/parent) + height 56/72 + responsive drawer správne implementované.
- ✅ **Compliance trust strip** (GDPR-K · KNF/UOKiK · EU-hosted) je elegantný — ostať.
- ✅ **0 console errors / 0 page errors** naprieč 56 navigationmi. Aplikácia je technicky stabilná.

---

## Návrh kadencie ďalších iterácií

### Sprint A — „Pre PKO showcase" (1-2 dni, 1 FE)
**Goal:** Produkt vyzerá completed pre stakeholder demo.

| Task | Súbor | Severity |
|---|---|---|
| **A1** F-NEW-01 — ResourceBar lightColor | `lib/resources.ts`, `components/resource-bar.tsx` | CRITICAL |
| **A2** F-NEW-02 — CityScene filter intensify + city-skyline-hero include | `globals.css`, `components/city-skyline-hero.tsx` | CRITICAL |
| **A3** F-NEW-03 — `/dla-szkol` 4 kroki popisy | `app/dla-szkol/page.tsx` + i18n | CRITICAL |
| **A4** F-NEW-04 — `/dla-szkol` real screenshots | nový `scripts/take-school-shots.ts`, `public/dla-szkol/*` | CRITICAL |

### Sprint B — „User journey polish" (3-5 dní, 1 FE)
**Goal:** Empty states, kalkulačka, banners, parent flow.

| Task | Súbor | Severity |
|---|---|---|
| **B1** F-NEW-06 — Empty state komponent + 6 použití | nový `components/empty-state.tsx` | MAJOR |
| **B2** F-NEW-07 — Marketplace progress bar | `components/marketplace-client.tsx` | MAJOR |
| **B3** F-NEW-09 — Loan calculator sliders (verify/fix) | `components/loan-comparison.tsx` | MAJOR |
| **B4** F-NEW-11 — Roadmap banner restyle | `app/page.tsx` | MAJOR |
| **B5** F-NEW-12 — Parent Polacz button visual states | `components/parent-client.tsx` | MAJOR |
| **B6** F-NEW-08 — Cookie banner copy + visual rebalance | `components/cookie-consent.tsx` | MAJOR |
| **B7** F-NEW-05 — `/o-platforme` TOC | `app/o-platforme/page.tsx` | MAJOR |
| **B8** F-NEW-10 — Onboarding skip + skratenie | `components/onboarding-tour.tsx` | MAJOR |

### Sprint C — „Polish backlog" (2-3 dni)
**Goal:** Konsistencia, malé wins.

| Task | Súbor | Severity |
|---|---|---|
| **C1** F-NEW-13 — Drop font-mono v ResourceBar | `components/resource-bar.tsx` | MINOR |
| **C2** F-NEW-14 — Cookie banner padding-bottom | `components/cookie-consent.tsx` + `globals.css` | MINOR |
| **C3** F-NEW-15 — DisplayName nudge | dashboard | MINOR |
| **C4** F-NEW-16 — Achievement empty state | `app/profile/page.tsx` | MINOR |
| **C5** F-NEW-17 — Help/FAQ v navigácii | `components/site-nav.tsx` | POLISH |
| **C6** F-NEW-18 — Avatar konsistencia | dashboard, leaderboard, friends | POLISH |

### Backlog — „Veľké" (po Sprintoch A–C)
- Epic E4 (city-scene 8-bucket SVG refactor) — `04-BACKLOG.md` E4-01..05.
- Headless screenshot pipeline (CI integration) — pre F-NEW-04 fix + automated visual regression.
- Brand discipline lint rule (per `_ux-pass-2.md` návrh P) — fail PR ak `border-[Npx≥2]`, `shadow-[hard-offset]`, alebo viac ako 1× `.btn-sales` na route.

---

## Reproducibilita

```bash
# Spustiť rovnaký walkthrough proti ľubovoľnej build:
pnpm exec playwright test --project=chromium walkthrough.spec.ts

# Output:
#   tmp/walkthrough-shots/{desktop,mobile}__NN-route.png  (56 PNG)
#   tmp/walkthrough-shots/_findings.json                  (machine-readable)

# Proti production:
PLAYWRIGHT_BASE_URL=https://watt-city.vercel.app PLAYWRIGHT_WEBSERVER=0 \
  pnpm exec playwright test walkthrough.spec.ts
```

Spec sám seba sa registruje + seedne XP, takže nepotrebuje seed dáta. Mazanie test účtov: `scripts/purge-e2e-accounts.sh --commit` (`wt_*` accounts).

---

## Otvorené otázky pre product

1. **F-NEW-04 screenshots:** Chceme reálne screenshoty z aplikácie (musí byť seedovaný demo class s aktivitou), alebo statické komponentové mockupy? Reálne sú pravdivejšie ale potrebujú maintenance pri každom UI change.
2. **F-NEW-08 cookie banner:** Je to OK že máme „accept-only" pattern (lebo nie sú tracking cookies), alebo treba dodať explicitne 3-button voľbu pre AKO IF cookies? Decision drives copy.
3. **F-NEW-10 onboarding tour:** Je 6-step joyride product-required, alebo sme ochotní ho skrátiť na 3 step + „pozri tutorial znova" v menu? Trade-off: kompletnosť vs. friction.
4. **F-NEW-17 Help/FAQ:** FAQ obsah neexistuje (footer hovorí „wkrótce"). Buď naplniť, alebo dropnúť pripomienky a nechať Help iba ako tutorial-replay.

---

## Súbory dotknuté review

- **Read:** `app/globals.css`, `lib/resources.ts`, `components/{site-nav,site-footer,resource-bar,dashboard,city-skyline-hero}.tsx`, `docs/pko-redesign/{00..06}-*.md`, `_ux-findings.md`, `_ux-pass-2.md`, `_fe-fix-prompt.md`, `e2e/_helpers.ts`, `e2e/golden-paths.spec.ts`, `e2e/walkthrough.spec.ts` (vytvorený).
- **Created:** `e2e/walkthrough.spec.ts`, `tmp/walkthrough-shots/*.png` (56 ks), `tmp/walkthrough-shots/_findings.json`, tento dokument.
- **Žiadne JSX zmeny** — to je úloha pre FE v Sprint A/B/C.
