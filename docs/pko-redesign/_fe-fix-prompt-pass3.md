# Prompt pre FE dev — oprava PKO redesign UX findings (Pass 3)

> Skopíruj celý tento súbor ako úvodný prompt pre nový dev session. Agent má všetok kontext, nič nehádaj — všetky podklady sú in-repo.

---

## 1. Kontext a ciele

Si FE developer na Watt City (Next.js 16 / React 19.2 / Tailwind v4, default skin `pko`).

Po round-1 (E0–E6 implementation), round-2 (PR-A contrast sweep `af36950`, PR-B border sweep `6847628`, PR-C brutalism kill `a8ab6a6`), SS1–SS12 polish (`d2aaeca`) a auth-page polish (`70047b9`) prišiel **UX Pass 3** — senior produkt review s 18 novými findings.

**Tvoj backlog:**
- **`docs/pko-redesign/_ux-pass-3.md`** ← všetky F-NEW-01 až F-NEW-18 + Sprint A/B/C návrh
- Walkthrough screenshots: `tmp/walkthrough-shots/{desktop,mobile}__NN-route.png` (56 ks)
- Machine-readable findings: `tmp/walkthrough-shots/_findings.json`
- Reproducer: `e2e/walkthrough.spec.ts` (spustiť po každom PR pre verify)

Spec hierarchy pri konflikte (per `06-UX-REVIEW-BRIEF.md` §8):
`01-BRAND-MANUAL.md` > `02-DESIGN-TOKENS.md` > `03-COMPONENTS.md` > aktuálny kód.

Default skin `pko` (svetlý, navy `#003574` + warm orange `#db912c`). Legacy `core` brutalism zostáva pod `[data-skin="core"]` — **nemeň ho**.

Prečítaj v tomto poradí **predtým** než začneš čokoľvek meniť:

1. `docs/pko-redesign/_ux-pass-3.md` — TL;DR + top-3 red flags + F-NEW-01..18 + Sprint A/B/C
2. `AGENTS.md` — vizuálne rules
3. `docs/pko-redesign/01-BRAND-MANUAL.md` §1, §2, §7, §12 (esencia, forbidden, borders, a11y)
4. `docs/pko-redesign/02-DESIGN-TOKENS.md` §1, §12 (paleta + rýchla referencia)
5. `docs/pko-redesign/03-COMPONENTS.md` — spec pre komponent ktorý práve riešiš (nie celé)

---

## 2. Scope fence — čo **NEROBIŤ**

- ❌ Nepridávať nové features. Iba polish + a11y + visual fix.
- ❌ Nemeniť routing, DB, API, hernú logiku, i18n keys (môžeš pridávať nové preklady ak chýbajú, nemeniť existujúce).
- ❌ Nemeniť `[data-skin="core"]` CSS.
- ❌ Nezavádzať dark-mode pko variant.
- ❌ Nemeniť texty v `_ux-pass-3.md` — report je read-only artefakt.
- ❌ Žiadne `--no-verify` commits, žiadne force-push.
- ❌ F-NEW-09 (loan calculator sliders) — **najprv overiť**, či to nie je len screenshot scroll issue, predtým než pridáš kód. Ak slider existuje, len ho vyznač v UI lepšie; ak nie, implementuj per spec.
- ❌ F-NEW-04 screenshots v `/dla-szkol` — **nezbieraj reálne screenshoty z prod Upstash**. Demo class musí byť seedovaná s in-memory tier (PLAYWRIGHT_WEBSERVER stack).

---

## 3. Quality gates — musí platiť pred každým PR

```bash
pnpm lint          # eslint
pnpm typecheck     # zero errors
pnpm test          # vitest 635/635
pnpm exec playwright test --project=chromium  # 14 specs zelené
pnpm build         # turbopack prod build pass
```

**A11y verification po každom PR:**
```bash
# Zopakovať walkthrough — _findings.json musí ukázať
# 0 a11y serious findings na všetkých 56 navigationch
pnpm exec playwright test --project=chromium walkthrough.spec.ts
jq '[.[] | select(.a11ySerious | length > 0)] | length' \
  tmp/walkthrough-shots/_findings.json
# expected output: 0
```

---

## 4. Plán práce — **3 PR-ká** (Sprint A) + **1 zoskupený PR** (Sprint B)

### Sprint A — Pred PKO showcase

**Goal:** odstrániť 3 blokery, ktoré zhoršujú prvý dojem partnera.

---

#### PR-D · F-NEW-01 — ResourceBar lightColor (CRITICAL)

**Problém:** `RESOURCE_DEFS.color` v `lib/resources.ts:84,102,138,176` obsahuje neon hex (`#fde047`, `#22d3ee`, `#22c55e`, `#f59e0b`). ResourceBar ich konzumuje cez `style={{color: def.color}}` — text contrast ~1.6–2.4:1 na bielom pozadí. **Axe-core serious fail na 18 logged-in routes.**

**Súbory:**
- `lib/resources.ts` — pridať pole `lightColor` do `ResourceDef` typu a do každej entry (Watts → `#a16207`, Coins → `#a85a18`, Glass → `#0e6b78`, Steel → `#475569`, Cash → `#16a34a`/`#15803d`). Cieľ: contrast ≥ 4.5:1 na `#ffffff`.
- `components/resource-bar.tsx:46` — zmeniť `style={{color: def.color}}` na `style={{color: def.lightColor}}`.
- `components/resource-bar.tsx:41` — zmeniť `borderColor: def.color` na `def.lightColor` (pre konzistentný look).
- Možné dotknuté: `components/resource-flash-chip.tsx`, `components/cashflow-hud.tsx` — overiť grep `def.color`.

**Test (acceptance):**
1. `pnpm exec playwright test walkthrough.spec.ts`
2. `jq '[.[] | select(.a11ySerious[]?.id == "color-contrast")] | length' tmp/walkthrough-shots/_findings.json` → **0**
3. Vizuálne: navy ramček, hodnoty čitateľné na 60 cm odstup.

**Bonus (`_ux-pass-2.md` návrh O):** vitest test `lib/resources.test.ts` ktorý spočíta contrast `RESOURCE_DEFS.lightColor` proti `#ffffff` cez `color-contrast` lib (alebo manuálny relative-luminance výpočet) a fail < 4.5.

---

#### PR-E · F-NEW-02 — CityScene + city-skyline-hero pko light filter (CRITICAL)

**Problém:** Tmavý „Noc nad Katowicami" SVG hero leak na `/`, `/` (logged-in), `/games`. Vyzerá ako arcade na bankovom webe.

**Root cause #1 (`globals.css:216`):** Filter `saturate(0.5) brightness(1) contrast(1.04)` slabý — výsledok ostáva tmavý. Zvýšiť na svetlý variant:
```css
:where([data-skin="pko"]) .city-scene-root {
  filter: saturate(0.35) brightness(1.55) contrast(0.92);
}
```

**Root cause #2:** `components/city-skyline-hero.tsx` má vlastný SVG render, ktorý **nie je pod `.city-scene-root` selectorom** → globálny filter ho nezasiahne.
- Pridať `className="city-scene-root"` na root `<svg>` element (alebo wrapper div).
- Overiť že nepoškodí inline tap-target areas.

**Sky color override (extra polish):**
```css
:where([data-skin="pko"]) .city-scene-root [fill="#0f172a"],
:where([data-skin="pko"]) .city-scene-root [fill="#1e1b4b"],
:where([data-skin="pko"]) .city-scene-root [fill="#0a0a0f"] {
  fill: var(--sc-sky); /* #e8f0f9 */
}
```
(Pridať do existujúceho bloku `:where([data-skin="pko"]) .city-scene-root` v `globals.css:218`.)

**Test (acceptance):**
1. `SKIN=pko pnpm dev` → `/`, `/games`, dashboard — city scene má **denný svetlý feel**, nie nočný.
2. `SKIN=core pnpm dev` → city scene ostáva v pôvodnom neon look (overiť že override neunikol mimo pko scope cez `:where([data-skin="pko"])`).
3. Side-by-side screenshot pred/po (priložiť do PR description).
4. Walkthrough znova — pozri `tmp/walkthrough-shots/desktop__01-landing.png`, `desktop__09-games-anon.png`, `desktop__22-games-loggedin.png`.

**Pozor:** Nezmeniť `building-link:hover filter` v pko (line 866-870 v `globals.css`) — hover glow je intentional.

---

#### PR-F · F-NEW-03 + F-NEW-04 — `/dla-szkol` content gaps (CRITICAL)

**Problém A (F-NEW-03):** „Jak to działa — 4 kroki" sekcia má iba 4 navy číselné krúžky (1,2,3,4) bez textov. School director nevie čo kroky znamenajú. Identický pattern aj na `/o-platforme`.

**Problém B (F-NEW-04):** „Jak wygląda produkt" má 3 prázdne browser-frame mockupy s textom „PREVIEW · SOON".

**Súbory:**
- `app/dla-szkol/page.tsx`
- `app/o-platforme/page.tsx` (kde sa vyskytuje rovnaký 4-krok pattern)
- `lib/locales/{pl,uk,cs,en}.ts` — pridať nové i18n keys pre kroky
- Nové asset: `public/dla-szkol/preview-{1,2,3}.png` (alebo `.avif`)
- Nový script (optional): `scripts/take-school-shots.ts`

**Implementácia A (kroky):**

1. Pridať i18n keys (každý jazyk 4 kroky × 2 polia = 8 nových stringov):
```typescript
// pl
schoolSteps: {
  s1Title: "Załóż konto nauczyciela",
  s1Body: "Wpisz imię, szkołę i ustaw hasło. Zajmuje 30 sekund.",
  s2Title: "Stwórz klasę i pobierz kody",
  s2Body: "Generujemy 30 jednorazowych kodów do rozdania uczniom.",
  s3Title: "Uczniowie grają",
  s3Body: "Logują się kodem, grają minigry, budują swoje miasto Watt City.",
  s4Title: "Sledujesz postępy",
  s4Body: "Tygodniowy raport PDF, panel klasy, wybór tematu na kolejny tydzień.",
}
```
Plus EN/CS/UK varianty (pre EN ber `_ux-pass-3.md` originál a preprežmi natívne).

2. JSX zmena (príklad pre dla-szkol):
```jsx
<ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {[1,2,3,4].map(n => (
    <li key={n} className="card p-6 flex flex-col gap-3">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-semibold">
        {n}
      </span>
      <h3 className="t-h5">{d.schoolSteps[`s${n}Title`]}</h3>
      <p className="t-body-sm text-[var(--ink-muted)]">{d.schoolSteps[`s${n}Body`]}</p>
    </li>
  ))}
</ol>
```

**Implementácia B (preview screenshots):**

Doporučený prístup — **headless screenshot pipeline**:

```typescript
// scripts/take-school-shots.ts
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";

const SHOTS = [
  { url: "/klasa/demo-class", file: "preview-1-class-dashboard.png" },
  { url: "/parent/demo-kid", file: "preview-2-parent-view.png" },
  { url: "/", file: "preview-3-kid-dashboard.png" }, // logged in as demo kid
];

(async () => {
  // 1. start dev server with empty Upstash (in-memory)
  // 2. seed: register demo_teacher, demo_kid, link them
  // 3. screenshot each, crop browser-frame, write to public/dla-szkol/
})();
```

Ak je to príliš veľký scope, fallback: ručne urobit 3 screenshoty z `pnpm dev`, prejsť a uložit do `public/dla-szkol/preview-{1,2,3}.png`. Embed v JSX:

```jsx
<figure className="card overflow-hidden">
  <Image src="/dla-szkol/preview-1.png" alt="Panel klasy nauczyciela"
         width={800} height={520} className="w-full h-auto" />
  <figcaption className="t-body-sm text-[var(--ink-muted)] p-4">
    Panel klasy — top 10 uczniów, tygodniowy raport PDF.
  </figcaption>
</figure>
```

**Test (acceptance):**
1. Žiadny string „PREVIEW · SOON" v `app/dla-szkol/page.tsx` (`grep -c`).
2. Každý zo 4 krokov má title + body v každom z 4 jazykov.
3. School director „walk-through" — čitateľná narratíva za < 30 sec scroll.

---

### Sprint B — User journey polish (1 PR alebo viac, podľa preferencie)

#### PR-G · F-NEW-05 až F-NEW-12 (8 MAJOR fixov)

Toto je „kuchynka" — relatívne nezávislé fixy, môžu ísť ako jeden PR alebo rozdelené po 2-3.

**B1 · F-NEW-05** — `/o-platforme` sticky TOC
- Súbor: `app/o-platforme/page.tsx`
- Pridať desktop-only `<aside>` s TOC v `lg:grid-cols-[240px_1fr]` layoute. Mobile: top sticky chip-row.
- ID tagy do každého `<h2>`: `<h2 id="idea">`, `#nauka`, `#pipeline`, atď.
- IntersectionObserver na highlight aktívnej sekcie (alebo skip ak appear príliš cynic — basic anchor links postačí).
- Acceptance: click na TOC link skrolne, mobile chip-row ostáva sticky.

**B2 · F-NEW-06** — Empty state komponent + 6 použití
- Nový súbor: `components/empty-state.tsx`
```tsx
type Props = { icon: ReactNode; title: string; body?: string; cta?: { href: string; label: string } };
export function EmptyState({ icon, title, body, cta }: Props) {
  return (
    <div className="card flex flex-col items-center text-center gap-4 py-12">
      <div className="text-5xl" aria-hidden>{icon}</div>
      <h3 className="t-h4">{title}</h3>
      {body && <p className="t-body-sm text-[var(--ink-muted)] max-w-md">{body}</p>}
      {cta && <Link href={cta.href} className="btn btn-secondary">{cta.label}</Link>}
    </div>
  );
}
```
- Použitie:
  - `app/leaderboard/page.tsx` — 🏆 „Buď první!" → `/games`
  - `components/friends-client.tsx` — 👥 „Pozvi prvního" (CTA: skopírovať profile odkaz)
  - `app/profile/page.tsx` — achievements grid → 🎖 „Tvoj prvý medal čaká"
  - `components/marketplace-client.tsx` — link s F-NEW-07 (progress bar variant)
  - Dashboard „Top Silesia" empty
  - `components/parent-client.tsx` — empty „Nie si spárovaný s deťmi"

**B3 · F-NEW-07** — Marketplace progress bar
- Súbor: `components/marketplace-client.tsx`
- JSX podľa `_ux-pass-3.md` F-NEW-07 návrhu (progress bar + CTA na `/miasto`).
- Pull `currentTier` + `buildingsCount` z player state.
- Acceptance: tier-locked stránka má clear „path to unlock" diagram.

**B4 · F-NEW-09** — Loan calculator sliders **(najprv overiť!)**
- Súbor: `components/loan-comparison.tsx`
- Otvoriť `/loans/compare` v dev — možno slider existuje hore a screenshot ho len nezachytil.
- Ak chýba: pridať dva slidery (principal: 1000–10000 W$ step 500; term: segmented 6/12/24/36 mes).
- Tabuľka recalcuje on-change.
- Acceptance: user vidí impact na monthly/total/RRSO real-time.

**B5 · F-NEW-11** — Roadmap banner restyle (anonymný landing)
- Súbor: `app/page.tsx` (anonymný hero notification stripe)
- Border: `var(--line)`, bg `var(--surface-2)`, ikona namiesto X → 🗓 (alebo Lucide CalendarClock).
- Acceptance: nepôsobí ako error, pôsobí ako roadmap teaser.

**B6 · F-NEW-12** — `/parent` Polacz button visual states
- Súbor: `components/parent-client.tsx`
- Default: `btn btn-secondary` (outline navy).
- Po `code.length === 6`: zmeniť na `btn` (primary navy fill).
- Helper text pod input: „Wpisz 6-znakowy kód, który dostalo Twoje dziecko..."
- Acceptance: jasná „input → action" cesta pri prvom príchode.

**B7 · F-NEW-08** — Cookie banner copy + visual rebalance
- Súbor: `components/cookie-consent.tsx`
- Pridať subheading: „✓ Brak trackerów ✓ Brak analityki ✓ Brak reklam" (tri chips alebo line s checkmarkmi).
- „Rozumiem" ako `btn btn-secondary` (outline), nie primary fill — vizuálne nepôsobí ako „accept tracking".
- „Więcej" → link na `/ochrana-sukromia`.
- Auto-dismiss po 30 sec scrolle (storage gate).
- Acceptance: nepôsobí ako klasický cookie wall.

**B8 · F-NEW-10** — Onboarding skip + skratenie
- Súbor: `components/onboarding-tour.tsx`
- Skip link na každom kroku, nie iba na poslednom.
- Skrátiť na max 3 kroky (Watt = energia / Buduj v meste / Zlož kredyt = bonus).
- Pridať „Pozri tutorial znova" link do mobile drawer + desktop user dropdown.
- Acceptance: onboarding completable v 30 sec, replay-able.

**Test (acceptance pre celý PR-G):**
- Všetky existujúce Playwright specs zelené.
- Walkthrough re-run — žiadne nové a11y findings.
- Manuálne: každú zmenenú stránku otvoriť v dev a verify intent.

---

### Sprint C — Polish backlog (optional, 1 PR-H)

**C1 · F-NEW-13** — Drop `font-mono` v ResourceBar
- `components/resource-bar.tsx:29` — odstráň `font-mono`, ponechaj `tabular-nums`.

**C2 · F-NEW-14** — Cookie banner padding-bottom
- Layout fix: keď je banner viditeľný, `<body>` dostane `padding-bottom: var(--cookie-bar-h)`.

**C3 · F-NEW-15** — DisplayName nudge
- Ak `user.displayName === user.username` (default), zobraziť toast / dashboard stripe „Daj si meno".

**C4 · F-NEW-16** — Achievement empty state pre nového usera
- `app/profile/page.tsx` — pre 0 achievements skryť grid, ukázať `<EmptyState />` (z B2).

**C5 · F-NEW-17** — Help/FAQ v navigácii
- `components/site-nav.tsx` — Lucide HelpCircle ikona vedľa NotificationBell, dropdown s 3 položkami.
- Predpoklad: FAQ obsah existuje. Ak nie, `@decision-needed`.

**C6 · F-NEW-18** — Avatar konsistencia
- Dashboard hero: 48×48 avatar emoji vľavo od „Welcome".
- Leaderboard rows: 24×24 avatar pred username.
- Friends list: avatar v každom row.

---

## 5. Per-PR checklist (skopíruj do PR description)

```markdown
- [ ] Súvisiace findings z `_ux-pass-3.md` zaadresované (vymenuj F-NEW-IDs)
- [ ] `pnpm lint` zelené
- [ ] `pnpm typecheck` zelené
- [ ] `pnpm test` 635/635
- [ ] `pnpm exec playwright test` zelené
- [ ] `pnpm build` pass
- [ ] Walkthrough re-run: `_findings.json` → 0 a11y serious findings (alebo iba známe `@decision-needed`)
- [ ] Žiadne `border-[Npx≥2]`, `shadow-[hard-offset]`, `font-{black,extrabold,800,900}`, `uppercase` na headings (mimo `.t-overline`)
- [ ] Žiadne nové hex hodnoty mimo `02-DESIGN-TOKENS.md` palety
- [ ] Pred/po screenshot pre každú zmenenú stránku v PR body
- [ ] Žiadne i18n keys removed (iba added)
```

---

## 6. Brand discipline reminder

Z `01-BRAND-MANUAL.md` §2 — čo sa NIKDY neobjaví:

- ❌ Gradienty (lineárne, radiálne, mesh)
- ❌ Glassmorphism, blur, backdrop-filter
- ❌ Hard-offset shadows (`6px 6px 0 0`)
- ❌ Bordery > 1 px
- ❌ Uppercase na headings (OK na `.t-overline`)
- ❌ Font weights 800/900 na body texte
- ❌ Bodkované/čiarkované pozadia (repeating patterns)
- ❌ Neonové farby (#fde047, #22d3ee, #f472b6 — všetky preč)
- ❌ Dark-mode ako default
- ❌ Maskot placeholder (radšej `null`)

Z `02-DESIGN-TOKENS.md` semantic aliases — používaj iba:
- Farby: `--accent`, `--accent-hover`, `--accent-ink`, `--sales`, `--sales-hover`, `--sales-ink`, `--success`, `--danger`, `--background`, `--foreground`, `--surface`, `--surface-2`, `--ink`, `--ink-muted`, `--ink-subtle`, `--line`, `--focus-ring`
- Shadows: `--shadow-line`, `--shadow-soft`, `--shadow-soft-lg` (alebo `.elev-line`, `.elev-soft`, `.elev-soft-lg`)
- Radius: `rounded-{none,sm,md,lg,full}` (žiadne `rounded-[Npx]`)
- Typo: `.t-{display,h1,h2,h3,h4,h5,body-lg,body,body-sm,caption,micro,overline}`

---

## 7. Reproducer pre overenie

```bash
# Po každom PR spusti walkthrough:
rm -rf tmp/walkthrough-shots
pnpm exec playwright test --project=chromium walkthrough.spec.ts

# Súhrn errors:
jq -r '.[] | select(.consoleErrors | length > 0 or .pageErrors | length > 0) |
  "\(.viewport)\t\(.route)\tconsole=\(.consoleErrors | length)\tpage=\(.pageErrors | length)"' \
  tmp/walkthrough-shots/_findings.json

# A11y count (musí byť 0 po Sprint A):
jq '[.[] | select(.a11ySerious | length > 0)] | length' \
  tmp/walkthrough-shots/_findings.json

# Vizuálna kontrola:
ls tmp/walkthrough-shots/*.png | head
# Otvor desktop__01-landing.png a porovnaj s pred-PR variantom.
```

---

## 8. Output

Po dokončení Sprint A (3 PR-ká) commitni do `main` v poradí PR-D → PR-E → PR-F.
Sprint B môže ísť ako 1 alebo 3-4 PR podľa preferencie reviewera.

**Update `_ux-pass-3.md`** — pri každom F-NEW-NN nájdenom v PR pridaj „**STATUS: FIXED in PR-X**" za nadpis.

Po dokončení vyrobit `_ux-pass-4.md` (re-review) — ak chce produkt vidieť ďalšiu vlnu pozorovaní.
