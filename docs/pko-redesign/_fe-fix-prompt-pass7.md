# Sprint D — vizuálne ladenie (Pass-7)

**Vstup:** product visionar review nasadenej main vetvy (post PR-I + pass-6 fixes), 4 user-screenshoty.
**Cieľ:** opraviť 4 vizuálne incidenty (R-01 nav, R-02 city widget) + dotiahnuť 2 produktové bridge-up (R-03 LoanComparison flow, R-04 podium redesign).
**Skin:** `pko` (default). Core skin neukazuje regresiu — všetky overrides musia ostať scope-fenced cez `:where([data-skin="pko"])` alebo `:where([data-skin="core"])`.
**Reviewer:** product visionar (ja). Schválim PR-J keď walkthrough screenshoty pre 4 fixed routes prejdú vizuálnym diff a 0 axe-core findings.

> **Branding pravidlá** (AGENTS.md, reviewers reject PRs):
> - **No** `border-[Npx]` s N≥2, žiadne `border-2..9`
> - **No** hard-offset `shadow-[Npx_Npx_0_0_...]`
> - **No** `uppercase` na heading, `font-black`/`font-extrabold`/`font-[800|900]`
> - **No** `rounded-[Npx]` arbitrary — len `rounded-{none,sm,md,lg,full}`
> - **No** nové hex mimo `docs/pko-redesign/02-DESIGN-TOKENS.md`
> - Použiť primitives `.btn`, `.btn-sales`, `.btn-secondary`, `.btn-ghost`, `.card`, `.chip`, `.section-heading`, `.t-*`

---

## 0 · Pre-flight

Pred prvým commitom spusti diagnostiku (zaznamená baseline):

```bash
git status                                # musí byť clean
git log --oneline -5                      # potvrď že posledný commit je 501c488 (pass-6)
pnpm install --frozen-lockfile            # 1850300 už refreshol pnpm-lock
pnpm typecheck                            # baseline (musí byť 0 errors)
pnpm lint                                 # baseline
pnpm test                                 # baseline (635 vitest)
WALKTHROUGH_LABEL=pre-pr-j pnpm test:walk # baseline screenshoty pre vizuálny diff
```

Po každom R-XX commits znovu spusti `pnpm test:walk` a porovnaj cez `pnpm test:walk:diff` → musí buď:
- a) ukázať očakávanú zmenu (R-01 → /landing /dashboard /miasto, R-02 → /miasto /dashboard, R-04 → /leaderboard) **s 0 axe-core findings**, alebo
- b) zaznamenať NO change (regresia by neprešla).

---

## R-01 · Top menu rozbité (CRITICAL)

**Čo užívateľ vidí** (Screenshot 17.23.57, viewport ~1280-1450 desktop):
- Logo "Watt City BY PKO" má výrazný **navy outline rectangle** okolo seba (vyzerá ako focus state ale je perzistentný)
- Nav linky `Městečko / Hry / Liga / O platformě` sú **vertikálne misaligned** — `O platformě` wrapuje na 2 riadky
- CTA `▶ Spustit tutoriál znovu` v pravom clusteri tiež **wrapuje na 2 riadky**
- `asadsa Level 1 · 0/h` username card má 2-riadkový stack ktorý vyzerá ako "kontainer overflow"
- Celkový dojem: nav je "preplnené tlakom", layout sa rozpadá pri demo viewport (Brave so sidebar)

**Súbory:**
- `components/site-nav.tsx` (104 — header, 108-125 — logo, 174-178 — tutoriál btn, 153-160 — username card)
- `components/nav-link.tsx` (49-58 — desktop variant, riadok 53 `tap-target h-full inline-flex items-center border-b-2`)
- `components/onboarding-tour.tsx` (`OpenTutorialButton` — labely v 4 jazykoch)
- `app/globals.css` (342-344 — `:focus-visible` outline-offset, 440+ — `.btn`/`.btn-sm`/`.btn-ghost`)

### R-01-A: Logo focus outline ringuje celý brand block

**Root cause:** `Link` v site-nav:108 obaľuje `<span class="w-9 h-9 rounded-md">` (ikon WC) + `<span>Watt City</span>` + `<span class="t-overline">by PKO</span>`. Pri `:focus-visible` aplikuje globals.css:342-344 `outline: 2px solid var(--focus-ring); outline-offset: 2px;` na celý Link → vznikne pravouhlý rectangle okolo všetkých 3 prvkov, čo užívateľ číta ako "rozbitý box".

**Fix:**
1. V `site-nav.tsx:108` pridať `rounded-md` na `Link` — outline pôjde do zaoblených rohov, nepôsobí ako "frame".
2. V `globals.css:342-344` zúžiť `outline-offset` z `2px` na `3px` (jemnejší dýchací priestor) **a** doplniť `border-radius: inherit` (pre Tailwind kompozíciu) — týmto sa focus ring obtočí podľa zaoblenia parent prvku, nie ako pravouhlý box.

```tsx
// site-nav.tsx:108
<Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-offset-4">
```

```css
/* globals.css:342-344 */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
  border-radius: inherit; /* match parent rounding when chained */
}
```

**Quality gate:** screenshoot landing s focused logo nesmie pôsobiť ako "frame around brand". Ringuje len lokálne, jemne, zaoblený.

### R-01-B: `OpenTutorialButton` wrapuje na 2 riadky

**Root cause:** Label `"Spustit tutoriál znovu"` (cs) má 22 znakov; `.btn` v globals.css:440+ **nemá `white-space: nowrap`**. Pri tlaku v `lg+` flex-row sa label wrapuje. Plus button je v hlavnom desktop clusteri kde dôjde k 9-elementovému tlaku (logo · 4 navlinks · level ring · xp chip · username · bell · **tutoriál** · lang · logout).

**Fix:**
1. **Skrátiť labely** v `components/onboarding-tour.tsx` `OpenTutorialButton` (alebo kde sú definované), používa kratšie cs/uk/en/pl variants:
   - cs: `"▶ Tutoriál"` (10 znakov)
   - pl: `"▶ Samouczek"` (12)
   - uk: `"▶ Туторіал"` (10)
   - en: `"▶ Tutorial"` (10)
2. Pridať `whitespace-nowrap` na `OpenTutorialButton` className (alebo na `.btn` v globals.css:440+ ako baseline guarantee — bezpečnejšie globálne).
3. **Posunúť breakpoint pre tutoriál btn** z `lg:inline-flex` na `xl:inline-flex` v `site-nav.tsx:173-178` — pri `lg-xl` (1024-1280) sa tutoriál otvára z drawer-u (kde už je v `MobileNavDrawer.footer`).

```tsx
// site-nav.tsx:173-178
<span className="hidden xl:inline-flex">
  <OpenTutorialButton lang={lang} className="btn btn-ghost btn-sm whitespace-nowrap" />
</span>
```

```css
/* globals.css:440 .btn — pridať */
.btn {
  /* … existing rules … */
  white-space: nowrap;
}
```

**Quality gate:** Pri viewport 1280-1440 sa tutoriál btn zobrazí len ak `xl+` (≥1280). Pri `lg-xl` ostáva v drawer-i. Tutoriál btn nesmie wrapovať NIKDY.

### R-01-C: Nav linky misaligned + `O platformě` wrap

**Root cause:** `NavLink` v `nav-link.tsx:53` má `tap-target h-full inline-flex items-center border-b-2`. `tap-target` má `min-height: 44px` (a11y standard), takže každý nav link je 44px tall, ale containerí parent v site-nav:126 je `flex items-stretch self-stretch` — linky sa stretch-vať ale `border-b-2` aplikuje aktívnemu linku 2px stripe na bottom, neaktívne majú `border-transparent`. Výška je rovnaká **vizuálne ALE** ak text wrapuje (1 riadok v stredných linkoch, 2 riadky v `O platformě`), labely sa nezarovná baseline.

**Fix:**
1. Pridať `whitespace-nowrap` na `NavLink` desktop variant — labely nesmú wrapovať.
2. V site-nav:126 zmeniť `gap-5` na `gap-4` aby boli linky tesnejšie + nemali tlak na wrap.

```tsx
// nav-link.tsx:53
className={`tap-target h-full inline-flex items-center border-b-2 whitespace-nowrap transition-colors ${
  active ? "text-[var(--accent)] border-[var(--accent)]"
         : "text-[var(--ink-muted)] border-transparent hover:text-[var(--accent)]"
}`}
```

```tsx
// site-nav.tsx:126 — gap-5 → gap-4 (pri lg+)
<div className="hidden lg:flex items-stretch self-stretch gap-4 text-sm">
```

**Quality gate:** Žiadny nav link nesmie wrapovať pri viewport ≥1024px. Vizuálny diff `01-landing.png` ukáže linky v jednej línii.

### R-01-D: Username card 2-riadkový stack

**Root cause:** `site-nav.tsx:153-160` má `<span className="hidden lg:flex flex-col leading-tight">` ktoré stack-uje username + title vertikálne. To je by design (username + Level chip), ale problém je že **`Level 1 · 0/h` text** v screenshote je súčasťou `chip` (riadok 147-152) ktorý zobrazuje `xp.toLocaleString` + `· #${rank}`. V screenshote vidím `0 W asadsa Level 1 · 0/h` zoradené nesprávne.

**Fix:**
1. Zachovať existujúcu štruktúru (level-ring · chip · username-stack).
2. Pridať na chip + username-stack `flex-shrink-0` aby pri tlaku nedali deformovať.
3. Pri `lg-xl` viewporte presunúť chip + level-ring do drawer-a (tak ako tutoriál btn), zachovať len bell + username + logout v desktop clusteri.

```tsx
// site-nav.tsx:140-152 — zmeniť hidden lg:inline-flex → hidden xl:inline-flex
<span className="level-ring hidden xl:inline-flex flex-shrink-0" ...>...</span>
<span className="chip hidden xl:inline-flex flex-shrink-0">...</span>
<span className="hidden xl:flex flex-col leading-tight flex-shrink-0">...</span>
```

**Quality gate:** Pri viewport 1024-1280 sa zobrazí len `bell + lang + logout + drawer-trigger` (lean). Nad 1280 sa pridá level + xp + username + tutoriál btn.

---

## R-02 · Mestečko (city widget) vyzerá zle (CRITICAL)

**Čo užívateľ vidí** (Screenshot 17.24.21, dashboard "Tvé město" sekcia):
- 9 evergreen budov sa renderuje ako **takmer čierne silhouettes** s nečitateľnými neon-yellow tags labelmi ("Biblioteka Śląska", "PKO Tower", "Muzeum Śląskie", "Silesia Solar Farm", "Kantor Rynek", "PKO Oddział", "Drukarnia")
- Jedna budova v strede ("PKO Branch" / Inštitút Matematiky) je **fialová** — outlier
- 3 AI sloty vpravo majú LIVE/MEDIUM/SLOW chips čitateľné
- Pozadie je svetlo modré (sky retint OK), ale celý ground + budovy nie sú readable
- Heading "Tvé město" je v poriadku, "Otevřít městečko →" je v poriadku
- Celkový dojem: city scene je stále "noc nad Katowicami" pod len mierne osvetleným filtrom — **nedáva to dojem PKO live light** skin

**Súbory:**
- `components/city-scene.tsx` (1693 riadkov, **inline `style={{ background: "#07071a" }}` na riadku 119** ⚠️)
- `app/globals.css` (212-316 — pko skin overrides; 305-314 broaden block z PR-G G-01)
- `components/dashboard.tsx:476` (renderuje `<CityScene compact aiGames>` pre dashboard "Tvé město" widget)

### R-02-A: Hardcoded inline `background: #07071a` ne-overridujú CSS

**Root cause:** `city-scene.tsx:119` má `<div className="city-scene-root..." style={{ background: "#07071a", ... }}>`. Inline `style` má specificity (1,0,0,0) — vyšší ako attribute selector (0,0,2,1) v globals.css. Filter `saturate(0.35) brightness(1.55)` aplikuje sa, ale **nezmení inline background** lebo filter pôsobí na PIXEL hodnoty (po renderingu) — výsledný čierny background sa zobrazí ako tmavošedý #2a2a3a (po brightness 1.55 z #07071a). To je stále **tmavé pozadie**, na ktorom budovy s tmavými body fillmi splynú.

**Fix:**
1. **Odstrániť hardcoded `background: "#07071a"` z inline style** v `city-scene.tsx:119`. Nahradiť className `bg-[var(--surface-2)]` (light grey #f3f4f7) alebo `bg-[var(--surface)]` (white).
2. Pre core skin (legacy brutalism) pridať CSS rule v globals.css:
   ```css
   :where([data-skin="core"]) .city-scene-root {
     background: #07071a; /* legacy night */
   }
   ```

```tsx
// city-scene.tsx:115-123
<div
  className="city-scene-root relative w-full rounded-lg border border-[var(--line)] overflow-hidden bg-[var(--surface-2)]"
  style={{
    aspectRatio: `${VB_W} / ${VB_H}`,
    maxHeight: compact ? 360 : 560,
  }}
>
```

```css
/* globals.css — pridať pri pko city-scene-root rules */
:where([data-skin="core"]) .city-scene-root {
  background: #07071a;
}
```

**Quality gate:** Vizuálny diff `20-dashboard.png` (alebo /games hub-screenshot) ukáže city widget na svetlom pozadí. Walkthrough musí mať 0 axe-core color-contrast findings na tomto SVG.

### R-02-B: Building bodies zostávajú dark — broaden raw-fill override

**Root cause:** `BUILDING_PLAN` v city-scene.tsx používa raw hex: `Tower body=#fde047`, `Library body=#f59e0b`, `Museum body=#0f172a` (in override ✅), `Institute body=#818cf8`, `SolarFarm body=#10b981`, `LEDHouse body=#a3e635`, `ExchangeBooth body=#f59e0b`, `BankBranch body=#67e8f9` (in override ✅), `Printshop body=#c026d3`. Plus pôvodný roof, pillars, glass, doors atď. Override block na riadkoch 305-314 zachytáva len `#0f172a, #1e293b, #111827, #0a0a0f, #020617, #000, #000000, #111` — **väčšina building bodies sa nezachytí** a po `saturate(0.35) brightness(1.55)` ostávajú stredne tmavé desaturated farby.

**Fix:**
1. **Rozšíriť override block** v `globals.css` aby zachytil VŠETKY raw building body/roof hexes na pko-friendly palette tokens. Pridať pod existujúci block 305-316:

```css
/* R-02-B: Sprint D · broaden building-body overrides — every raw hex
 * used in BUILDING_PLAN draws (Tower yellow, Library amber, Institute
 * indigo, SolarFarm emerald, LEDHouse lime, ExchangeBooth amber,
 * Printshop fuchsia, plus inner pillars/roofs/glass) maps to the
 * skin-light palette (--sc-building-primary/secondary/--sc-roof). 
 * The retint preserves the per-building silhouette identity 
 * (different roof shapes still readable) but kills neon brutalism. */
:where([data-skin="pko"]) .city-scene-root [fill="#fde047"],
:where([data-skin="pko"]) .city-scene-root [fill="#facc15"],
:where([data-skin="pko"]) .city-scene-root [fill="#fbbf24"],
:where([data-skin="pko"]) .city-scene-root [fill="#f59e0b"] {
  fill: var(--sc-window); /* warm yellow — used by BodyColor + Window highlights */
}
:where([data-skin="pko"]) .city-scene-root [fill="#d97706"],
:where([data-skin="pko"]) .city-scene-root [fill="#b45309"],
:where([data-skin="pko"]) .city-scene-root [fill="#92400e"],
:where([data-skin="pko"]) .city-scene-root [fill="#854d0e"],
:where([data-skin="pko"]) .city-scene-root [fill="#78350f"] {
  fill: var(--sc-roof); /* amber-brown roof variants → cool light grey */
}
:where([data-skin="pko"]) .city-scene-root [fill="#818cf8"],
:where([data-skin="pko"]) .city-scene-root [fill="#6366f1"],
:where([data-skin="pko"]) .city-scene-root [fill="#4338ca"],
:where([data-skin="pko"]) .city-scene-root [fill="#312e81"] {
  fill: var(--sc-detail-cool); /* indigo → navy */
}
:where([data-skin="pko"]) .city-scene-root [fill="#10b981"],
:where([data-skin="pko"]) .city-scene-root [fill="#064e3b"],
:where([data-skin="pko"]) .city-scene-root [fill="#365314"],
:where([data-skin="pko"]) .city-scene-root [fill="#a3e635"],
:where([data-skin="pko"]) .city-scene-root [fill="#65a30d"],
:where([data-skin="pko"]) .city-scene-root [fill="#22c55e"],
:where([data-skin="pko"]) .city-scene-root [fill="#4ade80"] {
  fill: var(--sc-building-secondary); /* emerald/lime → cool light grey */
}
:where([data-skin="pko"]) .city-scene-root [fill="#67e8f9"],
:where([data-skin="pko"]) .city-scene-root [fill="#0ea5e9"],
:where([data-skin="pko"]) .city-scene-root [fill="#38bdf8"],
:where([data-skin="pko"]) .city-scene-root [fill="#0c4a6e"],
:where([data-skin="pko"]) .city-scene-root [fill="#155e75"],
:where([data-skin="pko"]) .city-scene-root [fill="#083344"] {
  fill: var(--sc-detail-cool); /* cyan accent → navy */
}
:where([data-skin="pko"]) .city-scene-root [fill="#c026d3"],
:where([data-skin="pko"]) .city-scene-root [fill="#a21caf"] {
  fill: var(--sc-roof); /* fuchsia → light grey */
}
:where([data-skin="pko"]) .city-scene-root [fill="#06b6d4"] {
  fill: var(--sc-detail-cool);
}
/* Pattern + ground accents */
:where([data-skin="pko"]) .city-scene-root [fill="#1a1a2e"],
:where([data-skin="pko"]) .city-scene-root [fill="#0f0f1f"],
:where([data-skin="pko"]) .city-scene-root [stroke="#222"],
:where([data-skin="pko"]) .city-scene-root [stroke="#3f3f5a"] {
  fill: var(--sc-road);
  stroke: var(--sc-road);
}
/* Window night-fills (lit/unlit) → light pko window token */
:where([data-skin="pko"]) .city-scene-root [fill="#1e1b4b"],
:where([data-skin="pko"]) .city-scene-root [fill="#0c1229"],
:where([data-skin="pko"]) .city-scene-root [fill="#1f1b0b"],
:where([data-skin="pko"]) .city-scene-root [fill="#1a2e05"],
:where([data-skin="pko"]) .city-scene-root [fill="#0f2e1d"],
:where([data-skin="pko"]) .city-scene-root [fill="#2a0a2e"] {
  fill: var(--surface-2);
}
```

2. **Ground stroke** (city-scene.tsx riadok 226-228 dashed yellow road line) — pridať override:
```css
:where([data-skin="pko"]) .city-scene-root [stroke="#fde047"] {
  stroke: var(--sc-detail-warm); /* yellow road dash → orange */
}
```

3. **Po implementácii preverte vizuálnym diffom** screenshot `dashboard__compact-city.png` že už nie je dark.

**Quality gate:** Žiadna budova v pko skin nesmie zostať čierna/temne tmavá. Vizuálny dojem: light cream/grey budovy s warm yellow window glow + navy strokes.

### R-02-C: Skyline-hero (CitySkylineHero) na /miasto

**Pripomenutie:** `components/city-skyline-hero.tsx` má rovnaký `city-scene-root` className. PR-E filter sa aplikuje aj tam, ALE catalog body/roof colors sú už pko-friendly (#f59e0b, #be185d, #1e40af, #22d3ee...) → PO desaturate vyzerajú **bledo**. **Ak R-02-A a R-02-B správne fungujú**, hero by mal vyzerať čisto. Po fix-e znova diff `04-miasto.png` aby si overil že hero nie je over-desaturated.

**Ak zostane fade:** v `city-skyline-hero.tsx:64` zmeniť className zo `city-scene-root card relative...` na `city-skyline-hero-root card relative...` a pridať dedikovaný (mier­nejší) filter:

```css
/* globals.css — alternatíva ak hero stále vyzerá fade */
:where([data-skin="pko"]) .city-skyline-hero-root {
  /* žiadny filter — catalog už používa pko-friendly farby */
}
```

---

## R-03 · LoanComparison flow chýba mimo tutoriál (MAJOR)

**Čo užívateľ povedal:** "porovnanie uverov je len v tutoriale ... bolo by fajn aby to porovnanie bolo aj v sekcii ako si berieme hypoteku ... len vytvorit okolo toho nejaku logiku aby to bolo lepšie"

**Súčasný stav:**
- `app/loans/compare/page.tsx` rendre samostatnú stránku s `LoanComparison` (slider, segmented term, table mortgage vs kredyt_konsumencki, "Vzít" CTA per row).
- Tutorial step 4 (`components/onboarding-tour.tsx`) má CTA `"Porovnat úvěry" → /loans/compare`.
- **Chýba:** v hlavnom user flow (`/miasto` building shop → mortgage panel) sa zobrazuje **iba 1 produkt** (mortgage). User nevidí porovnanie pred tým, ako "vezme úver". Navyše site-nav nemá odkaz na `/loans/compare` (žiadny entry point mimo tutoriálu).

### R-03-A: Pridať "Půjčky" link do site-nav (entry point)

**Fix:**
V `components/site-nav.tsx:89-94` pridať pod existujúce navLinks novú entry. Je to globálny PKO produkt (porovnávačka pôžičiek = signature feature pre PKO partnership) → patrí do hlavnej navigácie:

```tsx
// site-nav.tsx:89-94
const navLinks: Array<{ href: string; label: string }> = [
  { href: "/miasto", label: t.city },
  { href: "/games", label: t.games },
  { href: "/leaderboard", label: t.league },
  { href: "/loans/compare", label: t.loans }, // NEW
  { href: "/o-platforme", label: t.about },
];
```

V `lib/i18n.ts` (alebo dict location) pridať key `nav.loans` × 4 jazyky:
- pl: `"Pożyczki"`
- uk: `"Кредити"`
- cs: `"Půjčky"`
- en: `"Loans"`

**Quality gate:** Walkthrough screenshoty `01-landing` (anonymous), `20-dashboard` (kid) musia mať nový nav link "Půjčky" → klik vedie na /loans/compare. 0 axe-core findings.

### R-03-B: Pridať mini-`LoanComparison` do `/miasto` mortgage panelu

**Cieľ:** Keď user otvorí "kúpiť hypotéku" panel v Watt City buildingoch, namiesto zobrazenia LEN mortgage offer ukázať **side-by-side compact table** všetkých eligible produktov + zvýrazniť najlacnejší (`mortgage`) zelene.

**Súbory:**
- `components/watt-city/watt-city-client.tsx` (klient component pre /miasto canvas, obsahuje mortgage panel)
- `app/miasto/page.tsx:1-80` (pre dictionary kontext)
- `lib/loans.ts` (`compareLoans(principal, termMonths, state)`)

**Implementačný plán:**
1. Identifikovať mortgage panel v `watt-city-client.tsx` (search `mortgageTitle` / `mortgageBody`).
2. Pred existujúcim "Vzít hypotéku" tlačidlom vložiť **collapsible** sekciu `<details>` `<summary>Porovnaj s ostatnými</summary>` ktorá rozbalí compact 3-column tabuľku (Produkt · Měsíčně · RRSO · Vzít) — bez sliderov (preset z mortgage-panel principal/term).
3. Compact varianta `<LoanComparisonCompact rows={...} principal={...} termMonths={...} />` — vytvoriť novú primitívu (alebo reusovať `LoanComparison` s prop `variant="inline"` ktorá schová slider + segments).
4. Po `Vzít` v compact panel buď redirect na `/loans/compare?principal=X&term=Y&action=take` alebo POST priamo na `/api/loans/take-generic`.

**Pre rýchly fix (Pass-7 scope):** stačí krok 1-3 + button "Otevřít plnou porovnávačku" → href `/loans/compare?principal=${principal}&term=${term}`. Kľúčové je že **user vidí porovnanie vo flow**, nie len v tutoriáli.

```tsx
// components/loan-comparison.tsx — pridať variant
type Props = {
  rows: LoanComparisonRow[];
  lang: Lang;
  principal: number;
  termMonths: number;
  variant?: "full" | "inline"; // "inline" hides slider + segments
};

export function LoanComparison({ rows, lang, principal, termMonths, variant = "full" }: Props) {
  // ...
  return (
    <section className="card p-4 sm:p-6 flex flex-col gap-4">
      <h2 className="section-heading text-xl sm:text-2xl">{t.heading}</h2>
      {variant === "full" && (
        <div className="flex flex-col gap-3">
          {/* slider + segmented control */}
        </div>
      )}
      {/* table — vždy */}
    </section>
  );
}
```

**Quality gate:** 
- Walkthrough screenshot `04-miasto.png` musí ukázať mortgage panel s collapsible "Porovnaj s ostatnými" sekciou.
- Klik rozbalí compact tabuľku s aspoň 2 riadkami (mortgage cheapest badge + alternativa s warning).
- Vitest test pridaný pre `compareLoans` ktorý sa volá s mortgage-panel principal/term defaultom (3000 W$ / 12 mo).
- 0 axe-core findings.

### R-03-C: Tutorial step 4 (onboarding) bridge-up

V `components/onboarding-tour.tsx` pridať na koniec body štep-4 vetu:
- pl: `"Pożyczki znajdziesz też w nawigacji u góry."`
- cs: `"Půjčky najdeš taky v navigaci nahoře."`
- uk: `"Кредити знайдеш у навігації вгорі."`
- en: `"You'll also find loans in the top nav."`

To zafixuje user complaint "len v tutoriale" — tutoriál sám hovorí kam ďalej.

---

## R-04 · Stupne víťazov (podium) — vizuálne prerobiť (MAJOR)

**Čo užívateľ vidí** (Screenshot 17.25.56, /leaderboard):
- 3 farebne odlíšené **takmer rovnako vysoké** obdĺžniky (1st orange, 2nd grey, 3rd light-grey)
- Rozdiel výšok je len ~32px medzi 1st a 2nd, ~16px medzi 2nd a 3rd → vyzerá ako "3 boxy", nie ako stupne
- Medaila emoji je v strede každého boxu, no avatar
- Username + watts pod boxmi
- 1st `bg-[var(--sales)]` orange dominantný, ale **flat** (žiadny stepped/3D/podium illusion)

**Súbory:**
- `app/leaderboard/page.tsx:112-137, 229-273` (PodiumCard komponent)
- `app/globals.css:724-734` (.podium-tile styles)

### R-04 redesign — proper stepped podium

**Cieľ:** vizuálne komunikovať "1st > 2nd > 3rd" stupne, dať dôraz na #1, pridať avatar slot.

**Layout zmeny:**
1. **Výškový kontrast vyšší:** 1st=`h-44` (176px), 2nd=`h-32` (128px), 3rd=`h-24` (96px). Pomer 1.0 / 0.73 / 0.55 — výrazne vidno stupňovanie.
2. **Avatar circle** (40-48px) **nad** každým boxom (centered horizontally) — placeholder "WC" iniciály ak nie je avatar URL.
3. **Username + watts INSIDE the box** (bottom 12px from base), nie pod.
4. **Medaila emoji** v top-right corner boxu (24px) — nie centered (kvôli avatarom).
5. **Step base** — pod každým podium-tile pridať decorative `<div class="podium-base">` (h-3, full width, var(--surface-2) background, rounded-b-md) — vytvára pocit fyzickej platformy.
6. **Stage (ground line)** — under all 3 podium-tiles + bases, pridať shared horizontal `border-b border-[var(--line)]` element ako "podlaha".
7. **1st place ribbon** — drobný "#1" chip overlay v top-left corner gold (var --sales) badge.

**Code blueprint:**

```tsx
// app/leaderboard/page.tsx:112-137 — replace podium block
{podium.length === 3 && (
  <div className="podium-stage relative">
    <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
      <PodiumCard
        entry={podium[1]}
        rank={2}
        height="h-32"
        bg="bg-[var(--ink-subtle)]"
        isMe={podium[1].username === session?.username}
      />
      <PodiumCard
        entry={podium[0]}
        rank={1}
        height="h-44"
        bg="bg-[var(--sales)]"
        isMe={podium[0].username === session?.username}
        crown
      />
      <PodiumCard
        entry={podium[2]}
        rank={3}
        height="h-24"
        bg="bg-[var(--surface-2)]"
        isMe={podium[2].username === session?.username}
      />
    </div>
    {/* podium ground line */}
    <div className="podium-ground border-b border-[var(--line)] mt-1" />
  </div>
)}
```

```tsx
// PodiumCard — redesigned
function PodiumCard({
  entry, rank, height, bg, isMe, crown,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  height: string;
  bg: string;
  isMe: boolean;
  crown?: boolean;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const initials = entry.username.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar above the box */}
      <div className="podium-avatar w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center font-semibold text-sm">
        {initials}
      </div>
      {/* Tile + step base */}
      <div className="w-full flex flex-col">
        <div
          data-rank={rank}
          className={`podium-tile relative w-full ${height} ${bg} flex flex-col items-center justify-end p-3 ${
            crown ? "animate-[glow-ring_2.4s_ease-in-out_infinite]" : ""
          } ${isMe ? "ring-1 ring-[var(--accent)]" : ""}`}
        >
          {/* rank chip top-left */}
          <span className="absolute top-2 left-2 chip text-[10px] tabular-nums">
            #{rank}
          </span>
          {/* medal top-right */}
          <span className="absolute top-2 right-2 text-2xl" aria-hidden>
            {medal}
          </span>
          {/* username + watts inside box bottom */}
          <div className="text-center w-full mt-auto">
            <div
              data-testid="podium-name"
              className="text-sm font-semibold truncate max-w-full text-[var(--accent-ink)]"
            >
              {entry.username}
              {isMe && <span className="ml-1 text-xs">(ty)</span>}
            </div>
            <div className="text-xs tabular-nums text-[var(--accent-ink)] opacity-90">
              {entry.xp.toLocaleString("pl-PL")} W
            </div>
          </div>
        </div>
        {/* step base — fyzická "platforma" pod tile */}
        <div className={`podium-base h-3 ${bg} opacity-50 rounded-b-md`} />
      </div>
    </div>
  );
}
```

```css
/* app/globals.css:724+ — extend .podium-tile */
.podium-tile {
  border: 1px solid var(--line);
  border-radius: var(--radius-md) var(--radius-md) 0 0; /* flat bottom — base behind */
  box-shadow: var(--shadow-line);
  position: relative;
  overflow: hidden;
}

.podium-tile[data-rank="1"] {
  /* gold accent — subtle ring, žiadne neon */
  outline: 1px solid color-mix(in oklab, var(--sales), white 40%);
  outline-offset: -1px;
}

.podium-tile[data-rank="1"] .text-xs,
.podium-tile[data-rank="1"] .text-sm {
  color: white;
}
.podium-tile[data-rank="2"] .text-xs,
.podium-tile[data-rank="2"] .text-sm {
  color: var(--ink);
}
.podium-tile[data-rank="3"] .text-xs,
.podium-tile[data-rank="3"] .text-sm {
  color: var(--ink);
}

.podium-base {
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.podium-ground {
  height: 1px; /* shared baseline */
}

:where([data-skin="core"]) .podium-tile {
  border: 3px solid var(--ink);
  border-radius: 12px 12px 0 0;
  box-shadow: 6px 6px 0 0 var(--ink);
}
:where([data-skin="core"]) .podium-base {
  border: 3px solid var(--ink);
  border-top: none;
}
```

**Color contrast guard:** 
- 1st orange `var(--sales)` background s white text by mal mať contrast ≥4.5:1. Test cez axe-core.
- Ak white text na orange fail-ne (orange #db912c contrast s white je ~3.0 — fail), použiť `text-[var(--ink)]` (navy) — prošlo by ~7.0.
- 2nd grey `var(--ink-subtle)` (light grey) s navy text → safe.
- 3rd `var(--surface-2)` (very light) s navy text → safe.

**Quality gate:**
- Walkthrough screenshot `15-leaderboard.png` ukáže stepped podium s vizuálnymi výškovými rozdielmi (1.0 / 0.73 / 0.55).
- 0 axe-core color-contrast findings.
- `lib/podium-color-contrast.test.ts` test (vitest) overuje contrast medal-text na pozadí: rank 1 ≥4.5:1, rank 2/3 ≥4.5:1.
- Vizuálne porovnanie: pre/post screenshot vedľa seba musí ukázať podstatne výraznejší stepped feel.

---

## 1 · Acceptance gate (musí prejsť pred PR-J merge)

```bash
# 1. Static checks
pnpm typecheck         # 0 errors
pnpm lint              # 0 errors
pnpm test              # 635 tests pass + new podium-contrast test

# 2. Walkthrough — pre/post diff
WALKTHROUGH_LABEL=post-pr-j pnpm test:walk
pnpm test:walk:diff    # report changes between pre-pr-j ↔ post-pr-j

# 3. Manual smoke (dev server)
pnpm dev
# Navigate (in this order):
# - / (anonymous landing) — nav linkov 5 (vrátane Půjčky), žiadny wrap
# - /login → /dashboard — nav lean (lg-xl ostáva username/level/tutoriál v drawer)
# - /miasto — city widget light, čitateľné labely; mortgage panel obsahuje "Porovnaj s ostatnými" collapse
# - /games — CityScene compact light, žiadny tmavý background
# - /leaderboard — stepped podium, výrazné výškové rozdiely, avatari nad boxmi
# - /loans/compare — porovnávačka funguje (slider, segments, take CTA)

# 4. Visual diff — open all 4 fixed routes pre/post v 2 tabs
# - 01-landing.png
# - 04-miasto.png
# - 15-leaderboard.png
# - 20-dashboard.png
```

**Acceptance test musí ukázať:**
| Route | Before | After |
|-------|--------|-------|
| 01-landing (anon) | nav má 4 linky, focus outline ringuje brand box | nav má 5 linkov (+Půjčky), focus outline jemný okolo logo Linku |
| 04-miasto | dark city silhouettes, mortgage panel ukazuje 1 produkt | light city, mortgage panel má collapsible compare |
| 15-leaderboard | 3 boxy podobnej výšky | stepped podium 1.0/0.73/0.55 ratio + avatari |
| 20-dashboard | dark city widget "Tvé město" | light, čitateľné budovy |

---

## 2 · Order of operations (jeden PR-J s 4 commitmi)

Konvencia z PR-D...PR-I: jeden PR-J, jeden commit per R-XX issue. To umožní bisect ak sa počas QA niečo zlomí.

1. **Commit 1: R-01 site-nav** (logo focus, tutoriál btn whitespace + xl breakpoint, navlinks whitespace, username card xl breakpoint).
   Files: `components/site-nav.tsx`, `components/nav-link.tsx`, `components/onboarding-tour.tsx`, `app/globals.css`.
2. **Commit 2: R-02 city-scene** (remove inline dark bg, broaden raw-fill override, ground/road retint).
   Files: `components/city-scene.tsx`, `app/globals.css`.
3. **Commit 3: R-03 LoanComparison flow** (nav link Půjčky, LoanComparison variant inline, mortgage panel integration, tutorial step copy).
   Files: `components/site-nav.tsx`, `lib/i18n.ts`, `components/loan-comparison.tsx`, `components/watt-city/watt-city-client.tsx`, `components/onboarding-tour.tsx`.
4. **Commit 4: R-04 podium redesign** (PodiumCard restructure, .podium-tile/.podium-base CSS, contrast test, glow-ring animation guard).
   Files: `app/leaderboard/page.tsx`, `app/globals.css`, `lib/podium-color-contrast.test.ts` (new).

Po všetkých 4 commitoch spusti acceptance gate (sekcia 1).

---

## 3 · Reproducer (pre QA verification)

```bash
git checkout -b sprint-d-pr-j
# implementuj commits 1-4 podľa hierarchie vyššie
WALKTHROUGH_LABEL=post-pr-j pnpm test:walk

# Diff baseline ↔ now
diff -r tmp/walkthrough-shots/pre-pr-j tmp/walkthrough-shots/post-pr-j | head -50

# axe-core findings count
jq '.[] | select(.violations | length > 0) | {url, count: (.violations | length)}' \
  tmp/walkthrough-shots/post-pr-j/_findings.json | head -20
# expected: empty (0 findings)
```

---

## 4 · Edge cases / known unknowns

- **Catalog body color extension:** Niektoré buildings (`PlayerBuilding`, `ConstructionSite`) používajú farby ktoré v override list nemusí byť (napr. `#44403c`, `#1c1917`, `#3f3f46`). Po implementácii spusti walkthrough pri všetkých 9 buildings unlocked → ak nejaký zostane tmavý, pridaj ho do override block.
- **Core skin regression risk:** Všetky CSS rules musia byť scope-fenced cez `:where([data-skin="pko"])`. Pred PR-J mergeom **otestuj `SKIN=core pnpm dev`** a pozri /games, /leaderboard, /miasto — žiadna zmena oproti pre-PR-J.
- **R-03 watt-city-client.tsx scope:** Ak `watt-city-client.tsx` je 1500+ riadkov, integrácia LoanComparison môže byť rozsiahla. Ak time-box je tlak, spravte len R-03-A (nav link) + R-03-C (tutorial copy) v Pass-7 a R-03-B (mortgage panel inline compare) odložte na Pass-8.
- **Avatar generation:** Aktuálne podium nemá avatar URL (LeaderboardEntry has no `avatarUrl`). Initials placeholder je acceptable pre Pass-7. Real avatars decision-needed item D-4 zostáva nevyriešený.
- **Keyboard nav:** Po R-01-D zmene (level/xp/username chips na xl breakpoint) treba znovu validovať že drawer-trigger ostáva keyboard-accessible pri lg-xl. Test: Tab order na 1280px viewport → logo → 5 navlinks → bell → lang → logout → drawer-trigger (žiadny chip/level v poradí).

---

## R-05 · CitySkylineHero — "Twilight Watt City" reskin (MAJOR)

**Čo užívateľ povedal** (po review screenshot 17.45.29 + 17.58.37 + 17.59.03):
- Catalog farby na buildingoch sú **dobré** (saturated PKO paleta) — nemenit
- Pozadie je **prázdne** (light grey gradient, no texture, no depth)
- Žiadne pekné pozadie za budovami → chce **podobnú vizuálnu hĺbku ako CityScene compact** (distant Katowice silhouette + cobble street)
- Pridať **mesiac + zapnuté pouličné lampy** v scéne
- Explicitný kontrast: **lampy svietia, budovy nie** — narratíva "tvoje budovy ešte nemajú elektrinu, hraj minihry aby si im zapálil okná"

**Centrálna metafora:** "Mesto čaká na elektrinu. Ulice svietia (mestská infraštruktúra), tvoje budovy nie (zarobíš si elektrinu hraním)."

**Súbory:**
- `components/city-skyline-hero.tsx` (kompletný redesign render path)
- `app/globals.css` (nový scope `.city-night-hero` bez filtra; .city-scene-root rules ostávajú netknuté)
- `lib/building-catalog.ts` — bezo zmien (catalog farby ostávajú)

### R-05-A: SVG canvas — 4 vrstvy

Aktuálny `viewBox="0 0 1800 460"` ostáva. Replace render path s 4 hierarchickými vrstvami (renderované zdola-hore v SVG paint order):

**LAYER 1 — Night sky (pozadie, vyplní 100% canvasu):**
```svg
<defs>
  <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1e1b4b" />     <!-- deep indigo -->
    <stop offset="60%" stop-color="#312e81" />    <!-- royal indigo mid -->
    <stop offset="92%" stop-color="#92400e" />    <!-- sunset amber strip -->
    <stop offset="100%" stop-color="#1c1917" />   <!-- horizon line dark -->
  </linearGradient>
  <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.45" />
    <stop offset="100%" stop-color="#fef3c7" stop-opacity="0" />
  </radialGradient>
  <radialGradient id="lamp-pool" cx="50%" cy="100%" r="50%">
    <stop offset="0%" stop-color="#fde047" stop-opacity="0.55" />
    <stop offset="100%" stop-color="#fde047" stop-opacity="0" />
  </radialGradient>
  <pattern id="cobbles-night" width="20" height="12" patternUnits="userSpaceOnUse">
    <rect width="20" height="12" fill="#374151" />
    <rect x="2" y="2" width="6" height="3" fill="#475569" opacity="0.6" />
    <rect x="11" y="6" width="7" height="3" fill="#475569" opacity="0.6" />
    <line x1="0" y1="6" x2="20" y2="6" stroke="#1f2937" stroke-width="0.5" />
  </pattern>
</defs>
<rect width="1800" height="460" fill="url(#night-sky)" />
```

**Mesiac (top-right, ~85% horiz, 18% top):**
```svg
<g transform="translate(1530, 80)">
  <circle r="72" fill="url(#moon-glow)" />          <!-- soft halo -->
  <circle r="42" fill="#fffbeb" opacity="0.95" />   <!-- moon disk -->
  <circle cx="-12" cy="-8" r="6" fill="#e7e5e4" opacity="0.4" />  <!-- crater -->
  <circle cx="14" cy="6" r="4" fill="#e7e5e4" opacity="0.5" />
  <circle cx="-4" cy="14" r="3" fill="#e7e5e4" opacity="0.4" />
</g>
```

**Hviezdy (deterministic 22 positions, top 50%):**
Použiť rovnaký pattern ako city-scene.tsx STARS const, ale **zúžiť range na top 50% canvasu** (y=10..230), fill `#fffbeb` opacity 0.4-0.85. Bigger stars majú 4px crosshatch line cross.

**LAYER 2 — Distant Katowice silhouette (~25-40% výšky pod nebom):**
```svg
<polygon
  points="0,320 60,300 100,280 140,310 180,290 220,250 260,260 300,240 320,200 340,180 360,200 380,240 420,260 460,280 500,250 540,200 580,210 620,240 660,260 700,250 740,230 780,260 820,240 860,200 900,180 940,210 980,260 1020,240 1060,260 1100,240 1140,200 1180,180 1220,210 1260,260 1300,240 1340,260 1380,250 1420,240 1460,260 1500,240 1540,260 1580,250 1620,260 1660,240 1700,260 1800,250 1800,360 0,360"
  fill="#1e293b"
  opacity="0.6"
/>
```
Profil zahŕňa generic high-rises + 1 zaoblenú "stadium" silhouette (Spodek-suggestive, ale generic) + 1 chimney. **Bez konkrétnych landmarks** (license-safe per tvoje rozhodnutie #1, ak nepotvrdíš inak).

**LAYER 3 — Foreground buildings (zachovať existing render):**
- BuildingSilhouette komponent v city-skyline-hero.tsx OSTÁVA, len:
  - Pridať `filter="url(#bldg-shadow)"` na každý `<g>` wrapper (soft shadow z mesiaca)
  - Pridať `<filter id="bldg-shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.35" /></filter>` do defs
  - **Žiadne lit windows** — ak BuildingSilhouette renderuje window glyphs s warm fill, prepnúť na `fill="#0f172a" opacity="0.7"` (dark glass)
  - **L1 chip pozadie** (riadok 198 city-skyline-hero.tsx) zmeniť z `paintOrder.stroke=white` na `paintOrder.stroke="#fffbeb"` aby čip ostal čitateľný na tmavej scéne

**LAYER 4 — Streetlights + cobble ground:**
```svg
<!-- Cobble ground (replace existing hero-ground pattern usage) -->
<rect x="0" y="380" width="1800" height="80" fill="url(#cobbles-night)" />
<rect x="0" y="376" width="1800" height="4" fill="#1f2937" />  <!-- thin grass strip -->
<rect x="0" y="456" width="1800" height="4" fill="#475569" />  <!-- sidewalk -->

<!-- 6 streetlights evenly spaced -->
<!-- pre kazdu lampu na x = 150, 450, 750, 1050, 1350, 1650 -->
<g transform="translate({x}, 380)">
  <ellipse cx="0" cy="0" rx="50" ry="14" fill="url(#lamp-pool)" />  <!-- light pool on ground -->
  <line x1="0" y1="0" x2="0" y2="-44" stroke="#1e293b" stroke-width="2.5" />
  <circle cx="0" cy="-48" r="8" fill="#1e293b" />
  <circle cx="0" cy="-48" r="4" fill="#fde047" />
  <circle cx="0" cy="-48" r="14" fill="#fde047" opacity="0.25" />  <!-- bulb halo -->
</g>
```

### R-05-B: Empty slot redesign

Nahradiť `EmptySlot` komponent (city-skyline-hero.tsx:141-155) z dotted ghost rect na "stavebnú parcelu":

```tsx
function EmptySlot({ slot }: { slot: SlotDef }) {
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h - 24;
  return (
    <g className="empty-slot-night" data-slot-id={slot.id}>
      <rect
        x={slot.x}
        y={slot.y + slot.h * 0.7}
        width={slot.w}
        height={slot.h * 0.3}
        fill="none"
        stroke="#fffbeb"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.35"
        rx="4"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="20"
        fill="#fffbeb"
        opacity="0.5"
        style={{ fontWeight: 600 }}
      >
        +
      </text>
    </g>
  );
}
```

V CSS:
```css
.empty-slot-night:hover {
  opacity: 0.85;
  cursor: pointer;
}
.empty-slot-night:hover rect { stroke: var(--sales); opacity: 0.9; }
.empty-slot-night:hover text { fill: var(--sales); opacity: 1; }
```

### R-05-C: Globals.css scope rules

V city-skyline-hero.tsx riadok 64 zmeniť className **z** `"city-scene-root card relative overflow-hidden"` **na** `"city-night-hero card relative overflow-hidden"`.

Pridať do `app/globals.css` (po existing .city-scene-root block, ~riadok 320):
```css
/* R-05: CitySkylineHero "Twilight" — vlastný scope, žiadny filter
 * (catalog farby ostávajú v plnej saturácii), len pretint card chrome
 * aby ostal kontrast s tmavým SVG vnútri. Core skin nevidí žiadnu
 * zmenu (selector je :where([data-skin="pko"])). */
:where([data-skin="pko"]) .city-night-hero {
  background: transparent; /* SVG vnútri má vlastný night-sky gradient */
  border: 1px solid var(--line);
}
:where([data-skin="pko"]) .city-night-hero .city-skyline-empty-overlay {
  /* Empty city overlay — text musí byť čitateľný na tmavej noci */
  background: linear-gradient(180deg, rgba(30, 27, 75, 0.6), rgba(30, 27, 75, 0.85));
  color: #fffbeb;
}
:where([data-skin="core"]) .city-night-hero {
  /* Core skin opt-out — fall back to legacy hero-sky gradient via
   * inline SVG defs (no override needed). */
}
```

### R-05-D: Storytelling overlay copy

V `city-skyline-hero.tsx:125-135` (existing empty-state overlay) zmeniť copy aby reflektovala "noc / čaká na elektrinu":

```tsx
const NIGHT_COPY: Record<Lang, { title: string; body: string }> = {
  pl: {
    title: "Miasto czeka na prąd",
    body: "Lampy świecą — Twoje budynki jeszcze nie. Zagraj pierwszą minigrę, żeby zaświecić okna.",
  },
  uk: {
    title: "Місто чекає на світло",
    body: "Ліхтарі горять — твої будинки ще ні. Зіграй першу гру, щоб засвітити вікна.",
  },
  cs: {
    title: "Město čeká na elektřinu",
    body: "Lampy svítí — tvé budovy ještě ne. Zahraj první minihru, ať se rozsvítí okna.",
  },
  en: {
    title: "The city is waiting for power",
    body: "Lamps are lit — your buildings aren't. Play your first mini-game to switch on the windows.",
  },
};
```

### R-05-E: Mobile portrait fallback (390px)

Pri viewport `<sm` (≤640px) sa SVG zhorší (príliš veľa elementov). Pridať `compact` prop ktorý:
- Vyhodí distant Katowice silhouette (zachovať len sky + foreground + ground)
- Zníži počet hviezd z 22 na 8
- Zníži počet lámp z 6 na 3
- Posunie mesiac na top-left (aby nekolidoval s overlay copy)

```tsx
const compact = useMemo(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches, []);
```
*(alebo lepšie: prop z parent server component cez `viewport` headers)*

### R-05 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough screenshot `04-miasto.png` | Vidno mesiac, hviezdy, distant silhouette, 6 lámp s halo, dark sky, NEzapnuté budovy s catalog farbami |
| Walkthrough screenshot `04-miasto-mobile.png` | Compact varianta (3 lampy, no silhouette, mesiac top-left) |
| axe-core color-contrast | 0 findings — overlay text na night gradient ≥ 4.5:1, L1 chip ≥ 4.5:1 |
| Vitest | nový test `lib/city-night-hero-readability.test.ts` overuje WCAG na text overlay |
| Core skin regression | `SKIN=core pnpm dev` → /miasto vyzerá ako PRED PR-J (zero diff) |

### R-05 Rozhodnutia ktoré FE musí potvrdiť

1. **Spodek silueta** — moja default je *generic stadium ellipse* (license-safe). Ak PO chce explicit Spodek (Katowice landmark), spravte ako follow-up po PKO design team approval.
2. **Lit windows pri powered** — ak hráč zahrá hru, mal by sa appartment "rozsvietiť"? Default Pass-7 je **vypnuté všetko** (kontrast s lampami). Lit-on-play je extra ~1h, navrhujem odložiť na Pass-8 ako "celebration moment".
3. **Viewport výška** — zachovať 460px viewBox (môj default). Ak PO chce kompaktný 320px, povedz pred štartom.

---

## R-06 · MortgageCard — reliability + UX (MAJOR)

**Čo užívateľ povedal:** "hypotečná kalkulačka mi príde že nefunguje" (screenshot 17.47.27 — slider na 500/50000, all values 0 ak push to extreme).

**Math je správny** (`lib/loans.ts:192-223` quoteMortgage), ALE komponent má 8 reliability bugov + UX gaps. Top 3 user-facing nefunkčnosti:

1. **Slider min=0** → posun na 0 → quote.eligibility.ok=false → "Vzít úvěr" silently disabled, no clear error
2. **Race condition** — `refreshQuote` bez debounce + bez AbortController; rýchly drag = stale quote
3. **Nový hráč bez cashflow** → `maxPrincipal=0` → slider min=0 max=0 → **fyzicky nemovable**, completely broken UX

**Súbory:**
- `components/watt-city/watt-city-client.tsx:620-810` (MortgageCard)
- `app/api/loans/quote/route.ts` (BE OK, neméniť)
- `app/api/loans/take/route.ts` (BE OK, neméniť)

### R-06-A: Slider safety floor + max=0 empty state

V `MortgageCard` riadkoch 686-702:
```tsx
// Replace existing range input
const minPrincipal = 100;
const dynamicMax = quote?.maxPrincipal ?? 0;

if (dynamicMax < minPrincipal) {
  // Empty state — nový hráč nemá cashflow na úver
  return (
    <EmptyState
      icon="🏗"
      title={
        { pl: "Najpierw zbuduj", uk: "Спочатку збудуй", cs: "Nejprve postav", en: "Build first" }[lang]
      }
      body={
        { pl: "Aby dostać hipotekę, potrzebujesz miesięcznego cashflow z budynków. Zagraj minigrę i postaw pierwszy budynek.",
          uk: "Щоб отримати іпотеку, потрібен місячний cashflow з будівель.",
          cs: "Pro hypotéku potřebuješ měsíční cashflow z budov. Zahraj minihru a postav první budovu.",
          en: "You need monthly cashflow from buildings to get a mortgage. Play a mini-game and build your first." }[lang]
      }
      cta={{
        href: "/games",
        label: { pl: "Zagraj minigrę", uk: "Грати міні-гру", cs: "Zahrát minihru", en: "Play mini-game" }[lang],
        variant: "sales",
      }}
    />
  );
}

<input
  type="range"
  min={minPrincipal}
  max={dynamicMax}
  step={500}
  value={Math.max(minPrincipal, principal)}
  onChange={...}
  aria-label={`${dict.principal} v W$, krok 500`}
  aria-valuetext={`${principal.toLocaleString("pl-PL")} W$`}
/>
```

### R-06-B: Debounce + AbortController

Skopírovať pattern z `LoanComparison` (riadky 151-163):
```tsx
const fetchAbort = useRef<AbortController | null>(null);
const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

function debouncedRefresh(p: number, t: number) {
  if (pushTimer.current) clearTimeout(pushTimer.current);
  pushTimer.current = setTimeout(async () => {
    if (fetchAbort.current) fetchAbort.current.abort();
    const ac = new AbortController();
    fetchAbort.current = ac;
    try {
      const r = await fetch(`/api/loans/quote?principal=${p}&termMonths=${t}`, {
        signal: ac.signal,
      });
      const j = await r.json();
      if (j.ok) setQuote(j.quote);
      else setError({ code: j.error });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError({ code: "network-error" });
      }
    }
  }, 200);
}

useEffect(() => () => {
  if (pushTimer.current) clearTimeout(pushTimer.current);
  if (fetchAbort.current) fetchAbort.current.abort();
}, []);
```

### R-06-C: Translated error messages

V dict pridať i18n bloky pre quote/take errors:
```tsx
const QUOTE_ERROR_COPY: Record<Lang, Record<string, string>> = {
  cs: {
    "zero-principal": "Zadej částku vyšší než 0 W$",
    "principal-exceeds-cap": "Tvůj cashflow nestačí na tuto částku. Postav víc budov.",
    "invalid-term": "Neplatná doba splácení",
    "rate-limited": "Pomalu — zkus to za chvíli",
    "unauthorized": "Musíš být přihlášen",
    "network-error": "Síťová chyba — zkus znovu",
  },
  pl: { /* … */ },
  uk: { /* … */ },
  en: { /* … */ },
};

// In component:
{error && (
  <p role="alert" className="text-xs text-[var(--danger)] font-semibold">
    {QUOTE_ERROR_COPY[lang][error.code] ?? error.code}
  </p>
)}
```

### R-06-D: Slider thumb visibility

V `app/globals.css` pridať custom thumb pre `input[type=range]` (pri PKO skin):
```css
:where([data-skin="pko"]) input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--surface-2);
  border-radius: 9999px;
  outline: none;
}
:where([data-skin="pko"]) input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--accent);
  border-radius: 50%;
  border: 2px solid var(--surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
:where([data-skin="pko"]) input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--accent);
  border-radius: 50%;
  border: 2px solid var(--surface);
  cursor: pointer;
}
```

Toto rieši "neviditeľný slider thumb" pri pozícii vľavo + zlepší tap target na mobile.

### R-06-E: Quote box bez `bg-black/20`

V `MortgageCard:721` zmeniť `<ul className="text-xs font-mono flex flex-col gap-0.5 bg-black/20 p-2 rounded">` na:
```tsx
<ul className="text-xs flex flex-col gap-1 card p-3 bg-[var(--surface-2)]">
```

`bg-black/20` je cudzia farba mimo PKO tokens; na light skin pôsobí ako "sklo". Použiť token.

### R-06-F: Loading state počas refreshQuote

```tsx
{isFetching ? (
  <div className="card p-3 text-center">
    <span className="t-body-sm text-[var(--ink-muted)]">Počítám…</span>
  </div>
) : quote && (
  <ul>...</ul>
)}
```

### R-06-G: Zjednotiť config s LoanComparison

V budúcnosti (Pass-8) **nahradiť** MortgageCard komponentom `<LoanComparison variant="inline" defaultProduct="mortgage" />`. Pre Pass-7 stačí harmonizovať konstanty (`PRINCIPAL_MIN=500`, `PRINCIPAL_STEP=500`, `TERM_OPTIONS=[12,24,36]` — mortgage doesn't allow 6m).

### R-06 Quality gates

| Gate | Kritérium |
|------|-----------|
| Vitest | Nový `components/mortgage-card.test.tsx` — test slider min/max guard, debounce window, error i18n mapping |
| Walkthrough | `/miasto` mortgage panel snapshot pre 3 user states: (a) cashflow=0 → empty state, (b) cashflow=300 → max=3600, slider OK, (c) cashflow=10k → max=50k cap |
| Manual smoke | Drag slider rýchlo cez celý range — žiadne stale values, posledná hodnota = aktuálna slider position |
| axe-core | 0 findings; slider má `aria-label` + `aria-valuetext` |

---

## R-07 · Page crash po upgrade budovy (CRITICAL)

**Čo užívateľ vidí** (Screenshot 18.00.21): po klik "Ulepsz" → URL ostáva `/miasto` ALE Brave zobrazuje **browser-level error**: `⚠ This page couldn't load. Reload to try again, or go back. [Reload] [Back]`. Toto je **HTTP 5xx** odpoveď z Vercel deploymentu, nie naša graceful UI.

**Root cause hypotézy:**
1. **Žiadna error boundary** v `app/miasto/error.tsx` — runtime exception počas server-side render `/miasto` → Next.js fall-through → Vercel returnuje 500 → Brave zobrazí browser error
2. **Player state corruption** po upgrade — `/api/buildings/upgrade` možno mutuje state do invalid shape (napr. `level: NaN`, `catalogId` reference na neexistujúci entry)
3. **`getCatalogEntry()` returns undefined** post-upgrade → nasledujúci `.something` access crashne render

**Súbory na vytvorenie:**
- `app/miasto/error.tsx` (NEW — Next.js error boundary)
- `app/global-error.tsx` (NEW — fallback ak miasto/error.tsx samé crashne)

**Súbory na inspect:**
- `app/api/buildings/upgrade/route.ts`
- `lib/buildings.ts` (upgrade mutation)
- `components/watt-city/watt-city-client.tsx:235-251` (doUpgrade callback)
- `app/miasto/page.tsx` (server component render path — kde môže crashnúť po upgrade)

### R-07-A: Pridať error boundary

Vytvoriť **`app/miasto/error.tsx`**:
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const COPY = {
  cs: {
    title: "Něco se pokazilo",
    body: "Nepodařilo se načíst Watt City. Zkusíme to znovu.",
    retry: "Zkusit znovu",
    back: "Zpět na úvod",
    digest: "Kód chyby",
  },
  pl: { /* … */ },
  uk: { /* … */ },
  en: { /* … */ },
};

export default function MiastoError({ error, reset }: Props) {
  useEffect(() => {
    // Production: forward to Vercel logs / Sentry hook
    console.error("[/miasto] runtime error:", error);
  }, [error]);

  // TODO i18n — getLang() not callable in client; fall back to cs for now
  const t = COPY.cs;

  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl" aria-hidden>⚠️</span>
      <h1 className="t-h2">{t.title}</h1>
      <p className="text-[var(--ink-muted)]">{t.body}</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          {t.retry}
        </button>
        <Link href="/" className="btn btn-secondary">
          {t.back}
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-[var(--ink-muted)] font-mono">
          {t.digest}: {error.digest}
        </p>
      )}
    </main>
  );
}
```

Vytvoriť **`app/global-error.tsx`** (fallback ak ostatné error.tsx samé padnú):
```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: 32, textAlign: "center" }}>
        <h2>Aplikácia nefunguje</h2>
        <p>Nastala neočakávaná chyba. Skús obnoviť stránku.</p>
        <button type="button" onClick={() => reset()}>Obnoviť</button>
        {error.digest && <p style={{ fontSize: 12, opacity: 0.5 }}>{error.digest}</p>}
      </body>
    </html>
  );
}
```

### R-07-B: Defenzívne null-checks v `app/miasto/page.tsx`

Inspect render path — všade kde `getCatalogEntry(id)` returnuje `T | undefined`, pridať explicit check:
```tsx
const entry = getCatalogEntry(inst.catalogId);
if (!entry) {
  // Log + skip — corrupted state shouldn't crash render
  console.warn(`[/miasto] missing catalog entry for instance ${inst.id}, catalog=${inst.catalogId}`);
  return null;
}
```

### R-07-C: Validate upgrade response shape

V `doUpgrade` (watt-city-client.tsx:235-251) pridať shape guard:
```tsx
const j = await res.json();
if (!j.ok) {
  setError({ code: j.error, missing: j.missing });
} else if (typeof j.state === "object" && j.state !== null) {
  // Refresh only if response shape is sensible
  await refresh();
} else {
  console.error("[upgrade] malformed response:", j);
  setError({ code: "malformed-response" });
}
```

### R-07-D: Server-side validation hardening

V `app/api/buildings/upgrade/route.ts` (read-and-add, neprepisovať existing logic):
- Wrap `upgradeBuilding(state, instanceId)` v try/catch
- Pri exception log + return `{ ok: false, error: "upgrade-failed", reason: e.message }` namiesto 500
- Toto zabrani Brave error page; user dostane in-app error toast

### R-07-E: Reproducibility check

Pred PR-J merge **manually reprodukuj na lokálnom dev serveri**:
1. `pnpm dev` + login as `asadsa` (test account)
2. Open `/miasto`, vyber slot, postav budovu
3. Klik upgrade
4. **Verify:** žiadny browser-level error; ak BE crashne, miasto/error.tsx zobrazí graceful UI
5. Skopíruj presný error message + stack do PR-J description (ak vznikne) → BE follow-up ticket

### R-07 Quality gates

| Gate | Kritérium |
|------|-----------|
| Vitest | Nový `app/miasto/error.test.tsx` — render error.tsx s mock error, klik retry calls reset() |
| Manual smoke | Upgrade-to-crash flow nikdy nehodí browser error; error.tsx sa zobrazí |
| Vercel logs | Po deploy → upgrade test → check logs pre new "[/miasto] runtime error" entries |

---

## R-08 · WattDeficitPanel banner ide cez header (CRITICAL)

**Čo užívateľ vidí** (Screenshot 18.01.26): žltý/info banner `⚠️ Nedostatek energie ve městě · Trvá 1h · Za 23h výroba klesne na 50%` s 2 CTA + dismiss `✕`. Banner je **transparent** a **renderuje sa CEZ** horný header (vidno za ním "Watt", "BY", "0", "1526", "asadsa", "▶ Spustit tutoriál" prvky). User chce: **pod header, nie cez neho**.

**Súbory:**
- `components/watt-deficit-panel.tsx:158` (`className="sticky top-[144px] sm:top-16 z-[30] ..."`)
- `components/site-nav.tsx:103` (`className="... sticky top-0 z-20 ..."`)
- `app/layout.tsx:173` (mount point — `<WattDeficitPanel ... />` je **sibling** k SiteNav, nie child)

**Root cause (3 súbežné chyby):**
1. **z-index inverzia** — panel má `z-[30]`, nav má `z-20` → panel sa renderuje **nad** nav-om
2. **Sticky offset off-by-N** — `sm:top-16` (64px) ale skutočná SiteNav výška na sm+ je `h-[72px]` (riadok 104 site-nav.tsx) + ResourceBar sub-row (~40px ak `username && resources`) = **~112px**. Panel pinuje 8-48px zhora pod nav stack → viditeľné prekrytie.
3. **bg-[var(--surface-2)]** je svetlo šedá s alpha (cez color-mix v tokens) → header za ňou presvitá → user vidí "transparent banner over header".

### R-08-A: Sticky offset cez CSS variable

**Najlepší fix:** SiteNav exportuje vlastnú výšku ako CSS custom property na document.body alebo na header element. WattDeficitPanel ju číta cez `top-[var(--nav-height)]`.

V `components/site-nav.tsx:103-104`:
```tsx
<header
  className="w-full border-b border-[var(--line)] sticky top-0 z-20 bg-[var(--surface)]"
  style={
    {
      // Nav height varies by viewport + resource-bar presence:
      // - mobile no resources: 56 px
      // - mobile + resources:   56 + 40 = 96 px
      // - desktop no resources: 72 px
      // - desktop + resources:  72 + 40 = 112 px
      // The CSS var lets WattDeficitPanel + any other sticky-below-nav
      // primitive read the actual offset without brittle hard-coded values.
      "--nav-height": username && resources ? "112px" : "72px",
    } as React.CSSProperties
  }
>
```

V `components/watt-deficit-panel.tsx:158` zmeniť className na:
```tsx
className="sticky top-[var(--nav-height,112px)] z-[10] border-b border-[var(--danger)] bg-[var(--surface-2)] shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
```

**Kľúčové zmeny:**
- `top-[var(--nav-height,112px)]` — fallback 112px ak nie je var
- `z-[10]` (znížený z 30) — pod nav-om v stacking order
- `bg-[var(--surface-2)]` ostáva, ale **plne opaque** (fix transparency by re-checking token def — ak je color-mix s alpha, tu fixneme na solid)
- Pridaný drop shadow `shadow-[0_2px_4px_rgba(0,0,0,0.08)]` aby vizuálne signalizoval "lebka pod" hierarchiu

### R-08-B: Plne opaque background

V `app/globals.css` overuj že `var(--surface-2)` nemá alpha. Ak áno, definuj v WattDeficitPanel **explicit solid**:
```tsx
className="... bg-[#fef3c7] ..."  // warm amber-tinted (matches "warning" semantic)
```
ALEBO lepšie pridať nový token v globals.css:
```css
:root {
  --surface-warning: #fef3c7;
  --surface-warning-ink: #78350f;
}
:root[data-skin="core"] {
  --surface-warning: #fde047;
  --surface-warning-ink: #0a0a0f;
}
```

A WattDeficitPanel:
```tsx
className="sticky top-[var(--nav-height,112px)] z-[10] bg-[var(--surface-warning)] text-[var(--surface-warning-ink)] border-b border-[var(--danger)] shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
```

Toto **vizuálne odlíši** banner od headeru aj contentu (warm amber je univerzálny "warning" signál) + plne opaque (no transparency leak).

### R-08-C: Mobile portrait sanity

Na 390px viewport:
- SiteNav má `h-[56px]` (mobile) + ResourceBar ~40px = 96px
- CSS var bude `--nav-height: 96px` (mobile) — treba mediaquery v inline style alebo lepšie cez Tailwind plugin

**Implementácia s Tailwind:** namiesto inline style použiť Tailwind responsive classes na header:
```tsx
<header
  className="w-full border-b border-[var(--line)] sticky top-0 z-20 bg-[var(--surface)]
             [--nav-height:96px] sm:[--nav-height:112px]"
>
```
Tailwind syntax `[--nav-height:96px]` vytvorí inline CSS var na element → WattDeficitPanel ju zdedí cez child of body kontextu.

ALE WattDeficitPanel je **sibling**, nie child SiteNav. Takže CSS var musí byť na **`<body>` alebo `<html>`** aby ju mal v scope aj sibling element.

**Riešenie:** v `app/layout.tsx:173` wrap-núť oba elementy do common parent ktorý má var:
```tsx
<div
  className="[--nav-height:96px] sm:[--nav-height:112px]"
>
  <SiteNav ... />
  <WattDeficitPanel ... />
</div>
```

### R-08-D: Z-index audit

Po fix-e (banner z-10, nav z-20) overiť ďalšie sticky/fixed elementy v repe (CashflowHud, NotificationBell drop, mobile drawer):
```bash
grep -rn "z-\[\|z-50\|z-40\|z-30\|z-20\|z-10\|sticky\|fixed " components app | grep -v node_modules
```
Build z-index hierarchy table v PR-J description:
| Element | z-index |
|---------|---------|
| MobileNavDrawer overlay | z-50 |
| NotificationBell dropdown | z-40 |
| SiteNav header | z-20 |
| WattDeficitPanel banner | z-10 |
| CashflowHud (bottom sticky) | z-10 |

### R-08 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough screenshot `04-miasto.png` (logged-in deficit user) | Banner pod header, žiadny overlap, plne opaque |
| Walkthrough screenshot `04-miasto-mobile.png` | Banner pinuje na 96px (pod mobile nav stack) |
| axe-core | 0 findings — banner má `role="alert"`, contrast amber-on-amber ≥ 4.5:1 |
| Manual smoke | Scroll cez `/miasto` — banner ostáva sticky pod headerom; dismiss ✕ funguje; "Postavit Malou elektrárnu" naviguje na build |

---

## R-09 · WattMeter (žltý progress bar pod budovami) zmizol (MAJOR)

**Čo užívateľ povedal** (po review screenshot 18.03.52, dashboard "Tvé město" widget): "ten spodný progress bar pod jednotlivými budovami už nefunguje ... ako tam bola ta žltá pred tým tak to bola pekná"

**Súčasný stav:** Progress bar (8px tall, dark navy bg + yellow fill, pod každou budovou v CityScene) je v PKO skin **vizuálne neviditeľný** — bar background `#0a0a0f` po PR-G G-01 broaden override sa retintne na `var(--sc-building-secondary)` (#c4ccd8 light grey) → splýva s pozadím. Žltý fill `#fde047` sa retintne na `var(--sc-window)` (#f9d97a desaturated warm yellow) + filter `saturate(0.35) brightness(1.55)` ho ďalej oslabí. Pri `bestScore=0` (nový hráč) je bar úplne neviditeľný.

**Súbory:**
- `components/city-scene.tsx:1638-1659` (`WattMeter` komponent)
- `app/globals.css:253-264, 305-316` (override blocks ktoré retintnli WattMeter farby)

### R-09-A: Scoped exception — WattMeter ostáva v "watt-yellow" identite

**Najjednoduchší fix:** dať WattMeter vlastný className a vyňať ho z generálnych attribute-selector overrides. WattMeter je sémanticky **branded indicator** ("Watty" = jednotka v hre) → musí ostať distinct.

V `city-scene.tsx:1638-1659`:
```tsx
function WattMeter({
  x, y, w, value, cap,
}: { x: number; y: number; w: number; value: number; cap: number }) {
  if (cap <= 0) return null;
  const pct = Math.min(1, value / cap);
  const empty = pct === 0;
  return (
    <g className="watt-meter" data-empty={String(empty)}>
      <rect
        className="watt-meter-bg"
        x={x} y={y} width={w} height={8}
        rx={2}
      />
      <rect
        className="watt-meter-fill"
        x={x + 1} y={y + 1}
        width={empty ? Math.max(4, (w - 2) * 0.04) : (w - 2) * pct}
        height={6}
      />
    </g>
  );
}
```

Kľúčové zmeny:
- Pridaný `className="watt-meter"` wrapper → CSS scope hook
- Background a fill majú vlastné triedy `.watt-meter-bg` / `.watt-meter-fill` (CSS class má vyššiu specificity ako attribute selector)
- **Empty state** (score=0): bar má **viditeľný 4% sliver** namiesto 0px (užívateľ vidí "tu má bar byť, len je prázdny")
- `data-empty` atribút umožňuje CSS rendering (slabšia opacity ak prázdny)

### R-09-B: CSS rules — restore yellow identity

V `app/globals.css` pridať za existujúci `.city-scene-root` block (~riadok 320, pred R-05 city-night-hero rules):
```css
/* R-09: WattMeter — branded score indicator. Must stay yellow + dark
 * regardless of pko skin retints. Class-based selector beats the
 * attribute-selector overrides above (specificity 0,1,1 > 0,0,2,1). */
.watt-meter-bg {
  fill: #1e1b4b;          /* deep navy bg — high contrast against light skin scene */
  stroke: #1e1b4b;
  stroke-width: 1;
}
.watt-meter-fill {
  fill: #fde047;          /* PKO yellow accent (existing token in design palette) */
  transition: width 0.4s ease-out;
}
.watt-meter[data-empty="true"] .watt-meter-fill {
  fill: #fef3c7;          /* light cream — empty bar still visible */
  opacity: 0.6;
}

/* Counter the inherited filter saturate/brightness on parent — WattMeter
 * stays at full saturation. This wraps the meter's own filter to NEGATE
 * the scene-level filter for this element only. */
:where([data-skin="pko"]) .city-scene-root .watt-meter {
  filter: saturate(2.85) brightness(0.65) contrast(1.08);
  /* Math: parent applies saturate(0.35) brightness(1.55) contrast(0.92).
   * Inverse multipliers: 1/0.35 = 2.857, 1/1.55 = 0.645, 1/0.92 = 1.087.
   * Net effect: WattMeter renders as if there's no parent filter. */
}
```

**Prečo tento prístup vs. úprava override blocks:** Mass-overrides na `[fill="#0a0a0f"]` slúžia 50+ iným elementom (door frames, window mullions, antenna details). Ak ich vrátime, kompromitujeme R-02 fix. Class-based exception zachová oba.

### R-09-C: Optional polish — text label pod bar

Pre čitateľnosť pridať tiny "X/Y W" label pod bar (4px gap):
```tsx
<text
  className="watt-meter-label"
  x={x + w / 2}
  y={y + 18}
  textAnchor="middle"
  fontSize={7}
  fontWeight={600}
>
  {value} / {cap} W
</text>
```

```css
.watt-meter-label {
  fill: var(--ink-muted);
  font-family: ui-monospace, monospace;
  letter-spacing: 0.02em;
}
.watt-meter[data-empty="true"] .watt-meter-label {
  fill: var(--ink-muted);
  opacity: 0.6;
}
```

**Pozor:** Pri 9 buildings × text label = 9 dodatočných text nodes v SVG. Performance impact zanedbateľný (one-time render), ale ak FE chce conservative scope, môže R-09-C odložiť na Pass-8.

### R-09-D: AI buildings WattMeter

`LiveAiBuilding` (city-scene.tsx:1502-1505) tiež volá `WattMeter`. Po R-09-A/B sa fix automaticky vzťahuje aj na AI slots (rovnaký komponent).

**Verifikuj:** Walkthrough screenshot `20-dashboard.png` a `/games` hub musí ukázať yellow bars pod **všetkými** budovami (evergreen + AI), nie len evergreen.

### R-09 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough screenshot `20-dashboard.png` | Pod každou z 9 evergreen buildings + 3 AI slots vidno yellow progress bar (alebo cream sliver pri score=0) |
| Vizuálna porovnávka pre/post | Side-by-side `tmp/walkthrough-shots/pre-pr-j/dashboard.png` ↔ `post-pr-j/dashboard.png` — yellow bars sú reštaurované |
| axe-core | 0 findings — yellow `#fde047` na navy `#1e1b4b` má contrast ≥ 7:1 (AAA) |
| Vitest | Nový `components/watt-meter.test.tsx` — render with cap=0 returns null, cap=100 value=0 renders empty sliver, cap=100 value=50 renders 50% width |
| Core skin | `SKIN=core pnpm dev` → /games hub WattMeter vyzerá identicky ako PRED PR-J (no regression) |

---

## R-10 · i18n consistency — language switcher nepokorí celý strom (CRITICAL)

**Čo užívateľ vidí** (Screenshot 18.13.12, jazyk prepnutý na `pl`):
- Top nav: `Miasteczko · Gry · Kredyty · Liga · O platformie · Tutorial · pl · Wyloguj` ✅ POLISH
- Detail panel pod budovou (po vyberaní slotu): `Místní banka · Úroveň: L1 · Příjem: -/h → -/h · Další úroveň Cena: 2400 · 320 · Vylepšit (L2) · Zbořit (50%) · Kategorie: občanské` ❌ CZECH
- Body building name `Místní banka` (z `lib/building-catalog.ts:193 cs:"Místní banka"`) — pre PL by malo byť `Bank lokalny`

**Root cause hypotéza (3 paralelné chyby):**

1. **`/api/lang` route nesignalizuje cache invalidation.** Súbor `app/api/lang/route.ts` len nastaví cookie a vráti 200. **Chýba `revalidatePath('/', 'layout')`** — Next.js 16 server cache pre `/miasto` page (`dynamic = "force-dynamic"` ale RSC payload sa cache-uje na router level) ostáva v starom jazyku. Takže nav (re-rendered z site-nav RSC) má nový lang, ale body (cached `/miasto` RSC) ostáva v starom.

2. **`router.refresh()` v Next.js 16 nepokorí všetky parallel route segments.** V `language-switcher.tsx:64` sa volá `router.refresh()` po fetch. V Next.js 16 router.refresh() **respektuje už existujúce RSC cache entries**, takže ak `/miasto` RSC bola cachovaná pred cookie zmenou, refresh ju neevictne.

3. **`getLang()` v `app/miasto/page.tsx:233` číta cookie, ALE Next.js cookie() API v Server Action context má rôznu fresh-ness vs. v RSC render context.** V async page.tsx render môže `await cookies()` vrátiť stale snapshot ak page je v "build cache" mode.

### R-10-A: Fix `/api/lang` route — explicit revalidation

V `app/api/lang/route.ts` po `store.set(COOKIE_NAME, ...)`:
```ts
import { revalidatePath } from "next/cache";

// … existing cookie set …

// Force-revalidate the entire app tree so every server segment re-renders
// with the new cookie. Without this, stale RSC payloads keep showing the
// old language even after router.refresh().
revalidatePath("/", "layout");

return Response.json({ ok: true, lang });
```

### R-10-B: Fix language-switcher — fallback `window.location.reload()`

V `components/language-switcher.tsx:49-69` zmeniť `pick()`:
```tsx
async function pick(lang: Lang) {
  if (lang === current || pending) return;
  setPending(lang);
  try {
    const res = await fetch("/api/lang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    if (!res.ok) {
      console.error("[lang] switch failed:", await res.text());
      return;
    }
    // R-10: router.refresh() in Next.js 16 doesn't reliably evict stale
    // RSC payloads when only a cookie changes. Combine refresh with a
    // hard reload for stragglers — the visual jump is preferable to
    // half-translated UI. Detect via 200ms post-refresh check; if any
    // server-rendered text still matches old locale, reload.
    router.refresh();
    setOpen(false);

    // Safety net: hard reload after 250ms if document.documentElement.lang
    // didn't update (means RSC re-render didn't reach the html tag).
    setTimeout(() => {
      const htmlLang = document.documentElement.lang;
      if (htmlLang && htmlLang !== lang) {
        window.location.reload();
      }
    }, 250);
  } finally {
    setPending(null);
  }
}
```

### R-10-C: i18n hardening audit — kde inde môžu byť stale strings

**Spustiť grep audit** pred fixom + po fixe:
```bash
# 1. Find all hardcoded user-facing czech-only strings in components
grep -rnE "(Vylepšit|Zbořit|Úroveň|Příjem|Kategorie|Místní|Vzít|Zrušit|Postavit)" components app | grep -v test | grep -v "_fe-fix" | grep -v "Record<Lang"

# 2. Find dict[lang] where lang is potentially undefined
grep -rnE "dict\[[a-zA-Z]+\]|DICT\[[a-zA-Z]+\]" components app | grep -v test

# 3. Find Server Components reading getLang() — verify they pass it down
grep -rn "getLang()" app | grep -v node_modules

# 4. Find Components missing lang prop
grep -rn "function [A-Z].*Props" components | xargs grep -L "lang"
```

Audit výsledky pridať do PR-J description ako tabuľku „komponentov s i18n risk“. Cieľ: nula komponentov ktoré renderujú user-facing string bez `lang` prop alebo bez fallback na `getLang()`.

### R-10-D: Pridať Playwright e2e test pre language consistency

Vytvoriť `e2e/i18n-consistency.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

const LANGS = ["pl", "uk", "cs", "en"] as const;

const SAMPLE_TEXTS: Record<typeof LANGS[number], { nav: string; body: string }> = {
  pl: { nav: "Miasteczko", body: "Bank lokalny" },
  uk: { nav: "Містечко", body: "Місцевий банк" },  // confirm exact match in catalog
  cs: { nav: "Městečko", body: "Místní banka" },
  en: { nav: "City", body: "Local bank" },
};

for (const lang of LANGS) {
  test(`language ${lang} renders consistently across nav + /miasto body`, async ({ page }) => {
    // Login as a test account with at least 1 building
    await page.goto("/login");
    await page.getByLabel(/usuario|nazwa|jméno|name/i).fill("playwright-i18n");
    await page.getByLabel(/hasło|heslo|password|пароль/i).fill("test-pw");
    await page.getByRole("button", { name: /zaloguj|přihlás|login|увійти/i }).click();

    // Switch language via /api/lang directly (skips UI flake)
    await page.evaluate((l) => fetch("/api/lang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: l }) }), lang);
    await page.reload();

    // Verify nav
    await expect(page.locator("nav")).toContainText(SAMPLE_TEXTS[lang].nav);

    // Navigate to /miasto, click on a slot with a "Local bank" building
    await page.goto("/miasto");
    await page.getByText(/Bank lokalny|Місцевий банк|Místní banka|Local bank/).first().click();

    // Verify detail panel uses same lang
    const panel = page.getByRole("region", { name: /detail|szczegóły|details/i });
    await expect(panel).toContainText(SAMPLE_TEXTS[lang].body);
  });
}
```

Test sa pridá do `e2e/walkthrough.spec.ts` projektu alebo nové projektu `i18n-consistency`. Beží v CI.

### R-10-E: Building catalog labels — verify all 4 langs present

V `lib/building-catalog.ts` overuj že **každý** entry má kompletný `labels: { pl, uk, cs, en }` set. Audit:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('lib/building-catalog.ts', 'utf-8');
const entries = src.split(/^\s*\{/m);
let missing = [];
for (const block of entries) {
  if (!block.includes('catalogId')) continue;
  const id = block.match(/catalogId:\s*\"([^\"]+)\"/)?.[1];
  if (!id) continue;
  for (const lang of ['pl','uk','cs','en']) {
    if (!block.includes(\`\${lang}:\`)) missing.push({ id, lang });
  }
}
console.log(JSON.stringify(missing, null, 2));
"
```

Ak audit nájde missing, doplniť cez native speakerov (PL/UK/CS/EN) alebo aspoň cez konzistentnú machine translation s human review.

### R-10 Quality gates

| Gate | Kritérium |
|------|-----------|
| Manual smoke | Switch lang pl→cs→uk→en→pl, na každom kroku navštív `/`, `/miasto`, `/games`, `/leaderboard`, `/loans/compare` — VŠETKY user-facing texty v aktívnom jazyku |
| `e2e/i18n-consistency.spec.ts` | 4 testy (1 per lang) zelené |
| Audit grep | Zero hardcoded czech strings v `components/` a `app/` (mimo `cs:` keys v Record<Lang> mapách) |
| Vercel cache | Po `revalidatePath("/", "layout")` v `/api/lang` → response headers obsahujú `x-vercel-cache: REVALIDATED` |

---

## R-11 · CitySkylineHero building bodies prakticky neviditeľné (CRITICAL — overlap s R-05)

**Čo užívateľ vidí** (Screenshot 18.14.34, "Tvůj dům" widget): vidno **iba strešky** (modré/béžové trojuholníky) + glyphs (UFO, knihy, slnko, blesk, robot, laptop, stromy) + L1/L3/L6 chips. **Building body rectangles úplne chýbajú** — vyzerá to ako "lebka bez tela". User povedal: "ta grafika je nan" (na nič).

**Vzťah k R-05:** R-05 reskin (twilight night scene) toto vyrieši ako side-effect (tmavé pozadie + odstránenie filtra → catalog farby ostanú visible). ALE ak FE odloží R-05 alebo ho rozdelí, **R-11 musí byť samostatne adresovaný v rovnakom PR-J commit**. Buď R-05 alebo R-11 musí byť shipped — neostať s "lebka bez tela".

**Root cause** (potvrdené z `app/globals.css:230` + `lib/building-catalog.ts`):

1. **`CitySkylineHero` má className `city-scene-root`** (city-skyline-hero.tsx:64) → globals.css:212-230 aplikuje `filter: saturate(0.35) brightness(1.55) contrast(0.92)`. Toto filter **destruktívne ovplyvní catalog body colors**:
   - Cream `#fef3e2` → po brightness(1.55) → fakticky biele → splýva s sky background `#e8f0f9`
   - Light grey `#f3f4f6` (catalog domek body!) → po brightness → **úplne biele** → invisible
   - Light navy `#dde9f5` → po brightness → biele → invisible
2. **PR-G G-01 broaden** override (globals.css:305-314) zachytí len `#0f172a, #1e293b, #111827, #0a0a0f, #020617, #000, #000000, #111` → catalog body colors **NIE SÚ retintnuté**, len passthrough cez filter → bleached.
3. **Roof colors v catalog sú väčšinou tmavšie** (`#003574` PKO navy, `#d4783a` terracotta, `#9a6b1a` bronze, `#65a30d` lime) → po brightness(1.55) ostávajú **viditeľné** ako modré/béžové trojuholníky. Preto vidíme strešky ale nie body.

**Dôkaz:** Screenshot ukazuje že **iba domčeky vpravo** (rodinné domy s roof color `#d4783a` terracotta + body color `#fef3e2` cream) majú **viditeľný roof** ale takmer **neviditeľné body**. Toto je presne čo by sa stalo ak filter desaturuje + brightness vybielil cream.

### R-11-A: Quick fix (ak R-05 odložené)

V `components/city-skyline-hero.tsx:64` zmeniť className:
```tsx
className="city-skyline-hero-root card relative overflow-hidden"
```

V `app/globals.css` pridať:
```css
/* R-11: CitySkylineHero — opt out from .city-scene-root filter overrides.
 * Hero používa pko-friendly catalog colors → filter ich len kazí. */
:where([data-skin="pko"]) .city-skyline-hero-root {
  background: var(--surface-2);
  /* žiadny filter — catalog farby ostávajú v plnej saturácii */
}
:where([data-skin="pko"]) .city-skyline-hero-root .city-skyline-empty-overlay {
  background: linear-gradient(180deg, rgba(0, 53, 116, 0.05), rgba(0, 53, 116, 0.15));
  color: var(--ink);
}
```

### R-11-B: Remove `light-grey` body colors z catalog

V `lib/building-catalog.ts` audit všetky entries — nech `bodyColor` má **dostatočný kontrast vs. surface-2 background**:
```bash
# Find entries with body colors that are too light to see on light surface
grep -nE "bodyColor:\s*\"#(f[0-9a-f]|e[0-9a-f]{2})" lib/building-catalog.ts
```

Konkrétne **3 entries treba upraviť** (z 30+ entries):
| Entry | Old body | Problem | Suggested new body |
|-------|----------|---------|-------------------|
| `domek` (`#f3f4f6`) | almost-white | invisible on light surface | `#fef3e2` (warm cream) + tmavší roof |
| (kdekoľvek `#f5f5f5+`) | similar | similar | `#dde9f5` light navy |

### R-11-C: Add 1 px navy outline na každú building body

Aj pri svetlých body colors, **outline ich vyrazí z pozadia**. V `BuildingSilhouette` (city-skyline-hero.tsx:178-208):
```tsx
<rect
  x={slot.x} y={y + roofH} width={slot.w} height={bodyH}
  fill={body}
  stroke="var(--accent)"          // navy outline
  strokeWidth="1"
  strokeOpacity="0.4"
/>
```

Toto je **brand-discipline-safe** (1 px border je povolený, nie border-2+). Outline pomôže aj pri svetlých body colors.

### R-11-D: Window detail (premostiť k R-05)

V `BuildingSilhouette` pridať 2-3 window rectangles na body (žltý fill ak `powered`, tmavý ak nie). Ak R-05 ide ako balík, toto skip — R-05 spec to obsahuje. Ak R-05 odložené, pridať aspoň basic window detail aby buildings nevyzerali ako "blocks":
```tsx
{/* basic window grid — 2 cols × 2 rows */}
{level >= 1 && Array.from({ length: 4 }).map((_, i) => {
  const wx = slot.x + 6 + (i % 2) * (slot.w - 14);
  const wy = y + roofH + 8 + Math.floor(i / 2) * (bodyH - 14);
  return (
    <rect
      key={i}
      x={wx} y={wy} width={6} height={6}
      fill="var(--accent)"
      opacity="0.25"
    />
  );
})}
```

### R-11 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough screenshot `04-miasto.png` | Vidno **každú building body** ako solid coloured rectangle s rozpoznateľnou farbou (cream/navy/sage/etc.), NIE ako "len strešky" |
| Vizuálny diff pre/post | Body fills sú visible (post screenshot ukáže zreteľné stenám, side-by-side vs. pre kde sú invisible) |
| axe-core | 0 findings — body fills majú contrast ≥ 3:1 voči background |
| Brand discipline | 1px outline na body je v rámci pravidiel (nie border-2+) |

### R-11 vs. R-05 — relationship

- **R-05 (Twilight reskin)** = celý reskin scéna do nočnej + lampy + mesiac → trvá ~3.5h, vyrieši aj R-11 ako side-effect
- **R-11 (quick fix)** = len opt-out z filtra + outline → trvá ~30 min, riešy len visibility, nie depth/atmosphere

**Odporúčanie pre FE:**
- Ak time-box dovolí, **dropt R-11 a urobte R-05** (väčší WOW moment, rieši všetko)
- Ak time-box tlačí, **shippnite R-11 ako must-have v PR-J** + R-05 odložte na Pass-8

PO musí potvrdiť ktorú cestu — **toto je 4. čakajúce rozhodnutie do listu z R-05** (predošlé tri: Spodek áno/nie, lit-on-play timing, viewBox výška).

---

## 5 · Reporting back

Po dokončení napíš krátky merge-report (~25 bullet pointov) v štýle predošlých PR-G/H/I correspondence:

- **Per-commit summary** (čo sa zmenilo, ktoré súbory, koľko riadkov diff)
- **Quality gates results** (typecheck/lint/vitest/playwright pass counts)
- **Walkthrough delta** (počet diff-snímok, top 3 vizuálne zmeny)
- **axe-core delta** (pred/po finding count, regression check)
- **Edge cases hit** (čo sa stalo neočakávane, ako si to riešil)
- **Open follow-ups** (R-03-B ak odložené, catalog hexes ak treba ďalej rozšíriť, podium contrast edge cases)
