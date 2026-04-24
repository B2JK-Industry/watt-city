# Migration notes — pasce, lekcie, pre-merge checklist

Čítať **pred** začatím práce. Obsahuje presné dôvody prečo padol predošlý pokus a ako sa im vyhnúť.

---

## 1. Lekcie z reverte `e97b732` (SKO visual system)

Commit `e97b732` revertol PR-1, PR-2, PR-3 a ich follow-upy. Priama citácia zo správy:

### Lekcia A — Paleta musí slúžiť kompozícii, nie kompozícia palete

> *"The design spec anchored on navy as primary color and built a dark-mode dashboard. pkobp.pl/junior is a light-mode banking site — white surfaces with navy as accent. We inverted the posture, producing a navy-on-navy enterprise dashboard instead of a bright, welcoming kids' banking product."*

**Aplikácia:**
- Pozadie stránky **JE BIELE**. Surface `#ffffff`, nie navy.
- Navy `#003574` je akcent — text, CTA, border emphasis. **Nikdy ako background sekcie.**
- Ak niekto začne písať karty s `bg-navy-700` — je to chyba, povedať mu stop.

### Lekcia B — CSS shield neporazí Tailwind arbitrary utilities

> *"The brutalism shield via :root[data-skin="pko"] CSS overrides can't catch Tailwind arbitrary utilities (border-[Npx], shadow-[Npx Npx 0 0 …]) which compile to equal-specificity utility classes. /město, /games and deeper surfaces kept visible brutalism despite PR-2's shield claims."*

**Aplikácia:**
- Nepokúšať sa prebiť `border-[3px]` CSS pravidlom. **Má rovnakú špecificitu.**
- Jediný spôsob: **zmazať** `border-[3px]` zo zdrojového JSX a nahradiť `border` (= 1 px) alebo triedou z primitives.
- Pravidlo PR review: ak PR obsahuje `border-[` alebo `shadow-[` v diffe — reject pokiaľ nie je v core-skin scope.

### Lekcia C — Placeholder „vyzerá zlomene"

> *"Mascot substitute (yellow/brown rectangles) looked broken in the footer. Better to show nothing than a placeholder that reads as an error state."*

**Aplikácia:**
- `components/pko-mascot.tsx` early-return `null` ak `theme.mascot === null`.
- `PKO_THEME.mascot = null` zostáva kým reálny asset nebude k dispozícii.
- Toto platí všeobecne — ak chýba asset (fotografia, logo, ilustrácia), **nerenderujeme "coming soon" obdĺžnik**. Renderujeme nič, alebo uhybnú vizuálnu tvár (napr. iniciály v avatare).

### Lekcia D — Refactor palety v SVG sa neobíde

> *"City-scene 73-hex → 6-semantic-var refactor mapped to a neon-saturated PKO palette that produced an uglier cityscape than the core skin it replaced."*

**Aplikácia:**
- city-scene nesmie dostať 6 neon-saturovaných farieb. **8 tlmených bucketov** podľa `03-COMPONENTS.md` §11.
- Pred merge city-scene zmien: screenshot side-by-side core vs. pko. Ak pko vyzerá „horšie" — stop, revisit farby.
- Teplé akcenty (`--sc-detail-warm`) použiť iba na < 3 % plochy (svetlá v oknách, nápisy na bilboardoch).

---

## 2. Tailwind v4 kontext (toto NIE je Next.js/Tailwind ktoré poznáš)

Podľa `AGENTS.md`: „This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

**Konkrétne pre náš redesign:**

- **`@theme inline` blok** v `globals.css` je Tailwind v4 spôsob registrácie design tokenov. Custom properties na `:root` sa automaticky premietnu do utility classes (`bg-accent`, `text-ink-muted`, …). Nepokúšaj sa konfigurovať cez `tailwind.config.js` — neexistuje alebo je minimálny.
- **PostCSS pipeline** je len `@tailwindcss/postcss` plugin (viď `postcss.config.mjs`). Žiadne ďalšie konfiguračné dverá.
- **`:where()` selektor** je tvoj priateľ pre scoped core skin pravidlá (0 špecificita, nekonflikt s utility classes). Príklad:
  ```css
  :where([data-skin="core"]) .brutal-tag { … }
  ```
- **ESLint rules sú „warn" v React 19** (viď memory) — niektoré purity warnings môžeš ignorovať ak sú false positives, ale preferuj fix pred disable.

---

## 3. Pasce špecifické pre tento projekt

### 3.1 Content-hash testy v `lib/pko-skin.test.ts`

Testy čítajú `app/layout.tsx` ako string a hľadajú konkrétne stringy (`data-skin={theme.id}`, `theme.colors.accent`). Ak refaktorujeme riadky layoutu — testy zlomíme.

**Stratégia:**
- Pred refaktorom `app/layout.tsx` otvor test a pozri aké stringy hľadá.
- Aktualizuj test paralelne s layoutom (v rovnakom commite).

### 3.2 `lib/theme.ts` komentáre odkazujú na PKO

Súbor začína vetou: *"The PKO skin uses PKO's public brand colors (navy + red accent) per the publicly available PKO BP styleguide…"*

**Chyba v komentári:** PKO BP NEMÁ red ako primary. Má **navy** primary + **orange** sales accent. (Potvrdené z `pkobp.pl` CSS v apríli 2026.)

**Úloha:** v E0-01 aktualizovať aj tento komentár.

### 3.3 Role-aware nav sa renderuje v `app/layout.tsx`

`site-nav.tsx` dostáva `role` prop z layoutu a mení link set. **Nemeníme** role logiku — iba vizuál linkov.

### 3.4 Tailwind v4 + Playwright WebKit bug

V `globals.css` je komentár o `.tap-target.tap-target` s doubled specifikitou. Dôvod: WebKit v Playwright má bug s flat `.tap-target`. **Netreba to „opraviť"** — ten `.tap-target.tap-target` je zámerný workaround.

### 3.5 Geist Sans sa stále loaduje cez `next/font/google`

Ak pridáš Inter, **nezabuď** Geist ponechať ako fallback variable pre core skin. Font stack:
```
pko skin:  "Inter", var(--font-geist-sans), system-ui, sans-serif
core skin: var(--font-geist-sans), Arial, Helvetica, sans-serif
```

### 3.6 `body` background image

Aktuálne `body { background-image: radial-gradient(…) }` je „bodkovaný" pattern pre core skin. V pko skine **musíš vypnúť** (`background-image: none`). Inak máš bodkovanú bielu plochu čo vyzerá ako textúra.

### 3.7 E2E testy očakávajú konkrétne texty

Playwright specs (`e2e/smoke.spec.ts` a iné) hľadajú konkrétne texty ako "Zarejestruj się", "Zaloguj się", atď. **Texty nemeníme** v rámci redesignu. Ak niekoho napadne „modernizovať copy", povedať stop — je to mimo skopu.

### 3.8 Mobile touch targets

`min-height: 44px; min-width: 44px` je required (WCAG + iOS HIG). Všetky nové komponenty **musia zachovať** tento floor. Utility `.tap-target` + `@media (max-width: 639px) button { min-height: 44px }` už je v `globals.css` — netreba odstraňovať.

### 3.9 PWA manifest a ikony

`app/manifest.ts` je request-aware (vracia rôzne ikony podľa skinu). **Zachovať**. V pko skine môžeme ikony nechať ako sú pre core, alebo dodať new set — ale to je samostatný tiket (nie v tomto backlogu, patrí do PKO partnership epicu ak bude).

### 3.10 CSRF bootstrap komponent

`components/csrf-bootstrap.tsx` je funkcionalita, nie UI. **Nemeníme.**

---

## 4. Pre-merge checklist

Pred každým PR v tomto redesigne:

### Lint & type safety
- [ ] `pnpm tsc --noEmit` — 0 errors
- [ ] `pnpm lint` — 0 errors (warnings povolené ak existujúce)

### Tests
- [ ] `pnpm test` — 635 testov zelených
- [ ] `pnpm test:e2e` — 13 specs zelených
- [ ] Žiadne nové flaky v CI

### Dizajn
- [ ] Žiadne nové `border-[Npx]` s N ≥ 2 v diffe
- [ ] Žiadne nové `shadow-[Npx Npx 0 0 ...]` hard-offset
- [ ] Žiadne nové `uppercase` na nadpisoch (výnimka: `.t-overline`, chip tagy)
- [ ] Žiadne nové `font-weight: 800|900` (výnimka: `.brutal-*` v core scope)
- [ ] Žiadne nové hex values mimo palety z `02-DESIGN-TOKENS.md`
- [ ] Žiadne nové `rounded-[Npx]` arbitrary — iba `rounded-{none,sm,md,lg,full}`

### Accessibility
- [ ] Axe scan na dotknutých stránkach: 0 serious findings
- [ ] Kontrast manuálne overený ak sa menila farba textu
- [ ] Focus ring viditeľný na interaktívnych prvkoch
- [ ] `prefers-reduced-motion` rešpektované

### Oba skiny fungujú
- [ ] Test manuálne: `SKIN=core pnpm dev` → stará neo-brutalist verzia
- [ ] Test manuálne: `SKIN=pko pnpm dev` (default) → nová light-mode verzia
- [ ] Žiadne komponenty nezlomené v core skine kvôli pko zmenám

### Screenshoty v PR
- [ ] Pred/po screenshoty pre vizuálne zmeny (desktop + mobile)
- [ ] Popis v PR body: čo sa zmenilo, čo zostalo

---

## 5. Commit message konvencia

Podľa existujúcej histórie repozitára:

```
feat(skin): E1-02 card primitive — tenký border, 10px radius, no hard-offset
refactor(ui): E2-04 dashboard — strip brutalism classes from 320-line JSX
fix(skin): E4-03 city-scene — replace 73 hardcoded hex with --sc-* tokens
```

Prefix: `feat(skin)`, `refactor(ui)`, `fix(skin)`, `chore(skin)`.

ID tiketu v správe pomáha trackovaniu.

---

## 6. Red flags pre reviewera

Ak PR obsahuje čokoľvek z nasledujúceho — **reject**, poslať naspäť autorovi:

1. Zmenu `app/api/*/route.ts` (backend zmena mimo skop)
2. Zmenu `lib/*.ts` okrem `theme.ts` a `pko-skin.test.ts`
3. Nový test súbor (zatiaľ nepridávame, test coverage zostáva)
4. Zmenu `prisma/**/*` alebo DB migrácie
5. Zmenu `package.json` dependencies (ak nie je to Inter font alebo Lucide icons — všetky ostatné pridávania diskutovať mimo redesignu)
6. Zmenu herných pravidiel (`lib/game-*.ts`, `app/api/games/...`)
7. Odstránenie accesibility attributov (`aria-*`, `role=`)
8. Zmenu textov v i18n dictionaries (žiadne zmeny copy v redesignovom PR)

---

## 7. Rollback plán

Ak niečo pri mergnutí rozbije produkciu:

### Rýchly rollback (< 2 min)
Env var:
```bash
SKIN=core
```
Tým sa aplikácia prepne späť na pôvodný neo-brutalist default. Ostáva to v prod kým nevyriešime problém.

### Kódový rollback
Každý epic **musí byť** samostatný PR (alebo max per-tiket merge). Revert jedného PR nezbúra celý redesign. E0 je samostatný PR ktorý treba revertnúť iba v krajnom prípade.

### Monitoring po merge
- Sentry error rate (ak je naviazaný)
- Vercel analytics: bounce rate, time-on-page na `/`
- Smoke test `production-ready.spec.ts` proti preview URL

---

## 8. Definition of Done pre celý redesign

Redesign je hotový keď:

- [ ] Všetky epicy E0–E6 mergnuté
- [ ] `SKIN=pko` default v prod
- [ ] 635 vitest + 13 playwright specs zelené
- [ ] 0 serious axe findings na kľúčových routes
- [ ] Lighthouse Perf ≥ 90, A11y ≥ 95
- [ ] Screenshot matrix uložená v `docs/pko-redesign/screenshots/`
- [ ] QA walkthrough odsúhlasený stakeholderom
- [ ] `AGENTS.md` / `README.md` aktualizované
- [ ] Žiadny `border-[Npx]` s N ≥ 2 ani `shadow-[...]` hard-offset v `components/**/*.tsx` (grep check)

---

## 9. Follow-up (mimo skop tohto redesignu)

Veci ktoré dávajú zmysel neskôr, ale nie teraz:

- **Skin toggle UI** (cookie-based) — revertnutá infraštruktúra, reintroduce ako samostatný epic ak biznis chce
- **Dark-mode variant pko skinu** — po dodaní stakeholder requestu
- **PKO partnership co-brand** — zavedenie reálneho loga, maskota, disclaimer textov z legal review
- **Motion design system** — premyslenejšie entrance/exit animácie
- **Illustration set** — 2-farebné ploché ilustrácie pre empty states
- **Design Figma library** — synced s `tokens.json`
