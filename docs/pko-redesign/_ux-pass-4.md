# PKO Redesign — UX Pass 4 (Re-review po Sprint A + Round 2.5 + workflow audit)

**Reviewer:** Senior produkt vizionár
**Dátum:** 2026-04-26
**Východisko:** Pass-3 (`docs/pko-redesign/_ux-pass-3.md` 18 findings) + Round 2.5 (`ca69758`, demo-review punch list) + Sprint A (PR-D `e03f15a`, PR-E `a5886c2`, PR-F `0ec08de`).
**Metóda:** opakovaný `walkthrough.spec.ts` na čistom Sprint A state, vizuálne porovnanie pred/po (`tmp/walkthrough-shots-pass3/` baseline vs. `tmp/walkthrough-shots/` po-Sprint-A), audit `package.json`/`scripts/`/`.github/`/`globals.css`/`lib/resources.ts`.
**Artefakty:** `tmp/walkthrough-shots-pass3/` (56 PNG = baseline), `tmp/walkthrough-shots/` (56 PNG = po Sprint A) + `_findings.json`.

---

## TL;DR pre product owner

**Sprint A + Round 2.5 = veľký skok kvality.** Walkthrough metriky idú z **31 → 0** axe-serious findings. Všetky 3 P0 blokery z Pass-3 sú formálne FIXED. **Produkt je shipping-ready pre PKO showcase.**

Ale tri kvalifikácie:

1. ⚠️ **F-NEW-02 (CityScene tmavý) je len ČIASTOČNE fixed** — filter `saturate(.35) brightness(1.55)` + sky-stop overrides _odsiahli_ sky farby, ale samotné silhuetty budov (hardcoded `<rect fill="#0f172a">`-style raw fills) ostávajú tmavé. Vizuálny rozdiel pred/po je **kozmetický**, nie zásadný — landing a /games stále majú „tmavú mestskú ilustráciu uprostred bielej stránky". Plný E4 epic refactor je stále potrebný.
2. ⚠️ **„Noc nad Katowicami" copy mismatch** — sekčné nadpisy na `/`, `/games`, dashboard hovoria „Noc nad Katowicami / 8 budynků jest nieoświetlonej, dopuk nie zagrasz, budynki stoją v ciemności". Po fixe city-scene (čiastočnom) je copy ešte nesynchronný — vizuál pôsobí ako šedo-modrý súmrak, nie noc.
3. ⚠️ **Round 2.5 + Sprint A pokryli viac ako Pass-3 navrhol**, ale aj viac vlastných úloh (anonymous demo finance-quiz, account-filter, fresh-user dashboard) — to znamená že **`_ux-pass-3.md` Sprint B/C poradie je neaktuálne**: F-NEW-06/07/08/11 sú už čiastočne adresované.

**Súhrn statusu Pass-3 findings:**

| Status | Count | F-NEW-IDs |
|---|---|---|
| ✅ FULLY FIXED | 5 | F-NEW-01, 03, 04, 07, 11 |
| ⚠️ PARTIALLY FIXED | 4 | F-NEW-02, 06, 08, 10 |
| ❌ NOT YET | 9 | F-NEW-05, 09, 12, 13, 14, 15, 16, 17, 18 |

**Nové nálezy (Pass-4):** 4 vizuálne + 5 workflow.

---

## Časť 1 · Overenie Pass-3 findings (status detail)

### ✅ F-NEW-01 ResourceBar lightColor — **FULLY FIXED** (PR-D)
- `lib/resources.ts` má `lightColor` field × 7 entries.
- `lib/resources-contrast.test.ts` je token guard (9 cases, AA ≥ 4.5:1).
- Walkthrough → 0 color-contrast violations na 18 routes.
- **Verdict:** clean kill. Drive-by TS fix v `walkthrough.spec.ts:198` tiež v poriadku.

### ⚠️ F-NEW-02 CityScene tmavý leak — **PARTIALLY FIXED** (PR-E)
- `globals.css:218` filter zosilnený na `saturate(.35) brightness(1.55) contrast(.92)`.
- 7 sky `<stop>` color overrides + ground pattern + empty-overlay swapped na `.city-skyline-empty-overlay`.
- `CitySkylineHero` opted-in cez `city-scene-root`.
- **Pred/po porovnanie (`tmp/walkthrough-shots-pass3/desktop__01-landing.png` vs `tmp/walkthrough-shots/desktop__01-landing.png`):** vidieť veľmi jemný rozdiel — sky čiastočne svetlejšia, ale silhuetty budov v strednom plánu **stále vyzerajú tmavé**. Subjektívna kvalita: „súmrak", nie „deň".
- **Root cause zostávajúci:** raw inline `fill="#0f172a"` (a podobné) na `<rect>` budovách nie sú v attribute-selector overrides. Iba `<stop>` selektor zachytáva sky gradient, nie raw fills.
- **Drive-by a11y fixes z PR-E (drawer `inert`, marketplace progressbar aria-label, /loans/compare badge text → accent, budget-balance + parent input aria labels) sú samostatné a vyriešili 31 → 0 a11y findings.** Tie sú clean win.
- **Verdict:** stopgap funguje pre a11y a sky, neeradikuje vizuálny disonance. Plný E4 epic ostáva v backlogu.

### ✅ F-NEW-03 `/dla-szkol` 4 kroki — **FULLY FIXED** (PR-F)
- `schoolSteps: [{title, body} × 4]` v inline Copy × 4 lokále.
- Render: number badge + `t-h5` title + `t-body-sm` body, `md:grid-cols-2 lg:grid-cols-4`.
- `/o-platforme` overené že už používa `aboutPage.howSteps` (title+body) — nezmenené.
- **Verdict:** narratív kompletný, čisté fix.

### ✅ F-NEW-04 `/dla-szkol` PREVIEW SOON — **FULLY FIXED** (Round 2.5 + PR-F status doc)
- 3 stripped placeholders nahradené content-rich preview cards (mock class roster top-5, weekly PDF stat summary, student dashboard cashflow strip + emoji row).
- 0 výskytov stringu „PREVIEW · SOON" v JSX.
- `e2e/ux-fixes.spec.ts` to pokrýva.
- **Verdict:** výborne. Headless `take-school-shots.ts` pipeline ostáva ako future enhancement, nie blocker.

### ❌ F-NEW-05 `/o-platforme` sticky TOC — **NOT YET**
- Round 2.5 zmenil **section order** ale nepridal TOC. Stránka je stále veľký scroll.
- **Verdict:** zostáva v Sprint B.

### ⚠️ F-NEW-06 Empty states — **PARTIALLY FIXED** (Round 2.5)
- ✅ Dashboard fresh-user „First step" card (eyebrow + H2 + body + sales CTA + 3-step horizon).
- ✅ Marketplace tier-gated soft-lock (eyebrow + H3 + body + tier-progress bar + CTAs).
- ❌ `/leaderboard` empty: stále „Jeszcze nikt nie zdobyl punktów. Bądź pierwszy!" bez ikony / CTA.
- ❌ `/friends` empty: „Znajomi · 0 · Jeszcze nikogo tu nie ma." bez CTA.
- ❌ `/profile` achievements: stále 8 „Zablokowane" placeholderov pre nového usera.
- ❌ `/parent` empty: rovnako.
- **Verdict:** ½ hotové. Treba dokončiť 4 zostávajúce s `EmptyState` primitívom.

### ✅ F-NEW-07 Marketplace progress bar — **FULLY FIXED** (Round 2.5)
- „TWÓJ POSTĘP / Giełda otworzy się przy Tier 7" karta s progress bar Tier 1/7 (14%) + 2 CTAs (Zagraj minigrę, Zobacz swoje miasto).
- Pôvodný Pass-3 návrh chcel aj „zoznam zostávajúcich budynkov" — Round 2.5 fix to nezahrňuje, ale aktuálny variant je dostatočný a clean.
- **Verdict:** acceptance met.

### ⚠️ F-NEW-08 Cookie banner — **PARTIALLY FIXED** (Round 2.5)
- ✅ Compact single-row bar, terse copy, ✕ icon dismiss (44×44), `role="region"` (no focus trap).
- ❌ Subheading „✓ Brak trackerów ✓ Brak analityki ✓ Brak reklam" (Pass-3 návrh) **nepridaná** — copy je teraz krátka a jasná, ale subheading by ďalej zvýraznil že nie je čo „odmietnúť".
- ❌ Auto-dismiss po N sec scrolle nepridaný.
- **Verdict:** vizuálne výborné, copy môže ďalej dotiahnuť.

### ❌ F-NEW-09 `/loans/compare` sliders — **NOT YET (verify-first holds)**
- Stále vidím **fixnú kombináciu Kwota: 3000 W$ · Okres: 12 msc**, žiadne sliders.
- Vyžaduje overiť či existuje slider hore mimo screenshot scroll (per scope-fence v `_fe-fix-prompt-pass3.md`). Aktuálny screenshot z full-page render ich nevidí.
- **Verdict:** treba ručne overiť / dokončiť.

### ⚠️ F-NEW-10 Onboarding skip + skratenie — **PARTIALLY (drive-by)**
- Onboarding modal stále existuje ako multi-step joyride (vidieť modal „Witaj w Watt City" na fresh-kid dashboard screenshote).
- Round 2.5 nepridal skip / skratenie / replay v menu.
- **Verdict:** zostáva v Sprint B.

### ✅ F-NEW-11 Roadmap banner — **FULLY FIXED** (Round 2.5)
- Pôvodný danger-red `border-l-4` X-icon nahradený subtle navy 2px „Roadmap" overline.
- Pridaný „Zagraj demo bez rejestracji" sales CTA — bonus pokrýva aj pôvodný `_ux-pass-2.md` návrh L (anonymous flow).
- ComingSoonBanner moved below hero (lepšia hierarchia).
- **Verdict:** clean fix + nadhodnotná hodnota.

### ❌ F-NEW-12 `/parent` Polacz button states — **NOT YET**
- Polacz button stále vyzerá disabled (greyed, bez `aria-disabled` — len výskyt). Helper text pod input nie je.
- **Verdict:** zostáva v Sprint B.

### ❌ F-NEW-13 ResourceBar `font-mono` — **NOT YET**
- `components/resource-bar.tsx:29` má stále `text-xs font-mono tabular-nums`.
- **Verdict:** Sprint C polish.

### ❌ F-NEW-14 Cookie banner padding-bottom overlap — **NOT YET**
- Sticky bar ešte zaberá ~50px na spodu, padding-bottom CSS variable nepridaná.
- **Verdict:** Sprint C.

### ❌ F-NEW-15 DisplayName nudge — **NOT YET**
- Default `wt_xxx` username sa stále ukazuje v dashboard hero. Žiadny prompt na customizáciu.
- **Verdict:** Sprint C.

### ❌ F-NEW-16 Achievement empty state — **NOT YET**
- 8 „Zablokowane" placeholder kariet pre nového usera. Empty state primitive (z F-NEW-06) neaplikovaný sem.
- **Verdict:** Sprint C, súčasť `EmptyState` rolloutu.

### ❌ F-NEW-17 Help/FAQ v navigácii — **NOT YET**
- Žiadna ikona „?" ani replay tutorial item v dropdown / mobile drawer.
- **Verdict:** Sprint C, nutný product decision (FAQ obsah „wkrótce").

### ❌ F-NEW-18 Avatar konsistencia — **NOT YET**
- Dashboard hero, leaderboard rows, friends list nemajú avatar emoji. Iba `/profile` selektor.
- **Verdict:** Sprint C polish.

---

## Časť 2 · Nové nálezy (Pass-4)

### F-NEW-19 · MAJOR · CityScene fix je vizuálne kozmetický — landing + /games stále vyzerajú „tmavé"
**Kde:** `/`, `/games`, `/games` (logged-in), dashboard „Twój dom" sekcia
**Čo vidím (po Sprint A):** city skyline má teraz tlmenú navy paletu namiesto plného neon noir, ale **veľký vizuálny blok zostáva tmavomodrý/tmavošedý uprostred bielej stránky**. Subjektívne pôsobí ako „súmrak", nie „deň".
**Root cause:** `globals.css:227-249` má attribute-selector overrides len na `<stop>` elementy a vybrané cyan/yellow `fill` hodnoty. Hardcoded `<rect fill="#0f172a">`-style raw fills na siluetách budov nie sú zachytené.
**Návrh fixu (krátkodobý — ďalšia stopgap iterácia):**
- Pridať broad attribute selector pre raw fills: `:where([data-skin="pko"]) .city-scene-root [fill="#0f172a"], [fill="#1e293b"], [fill="#1f2937"], [fill="#111827"] { fill: var(--sc-building-primary); }`
- Pre tmavšie odtiene: `[fill="#0a0a0f"], [fill="#020617"] { fill: var(--sc-building-secondary); }`
- Acceptance: side-by-side core vs. pko ukazuje pko vyzerá ako „svetlé denné mesto", nie „súmrak".
**Návrh fixu (dlhodobý):** epic E4 v `04-BACKLOG.md` (8-bucket SVG refactor).
**Severity:** MAJOR — nepoškodzuje a11y, ale narúša pko brand discipline (§1 „biely povrch").

### F-NEW-20 · MINOR · „Noc nad Katowicami" copy mismatch po city scene fix
**Kde:** `/`, `/games` (anon + logged-in), dashboard „Twój dom"
**Čo vidím:** sekčné nadpisy hovoria **„Noc nad Katowicami — X budynków jest nieoświetlonej, dopuk nie zagrasz, budynki stoja v ciemności"**. Po čiastočnom F-NEW-02 fixe vizuál pôsobí ako šedo-modrý súmrak, nie noc → copy je ešte nezosúladená s reálnym lookom.
**Root cause:** copy v i18n ostala z čias keď `core` skin bol default (čierne pozadie + neon yellow okná = naozaj „noc"). Pko zmenila skin, copy ostala.
**Návrh fixu (po F-NEW-19):** prepísať na pko-aware copy:
- PL: „Twoje miasto czeka — X budynków stoi pustkach. Zagraj minigry, by je oświetlić."
- UK/CS/EN ekvivalentne.
- Súbor: `lib/locales/{pl,uk,cs,en}.ts` — `dashboard.cityHeroTitle`, `cityHeroBody` (alebo ekvivalentné kľúče).
**Severity:** MINOR — copy nuance, nie funkčný bug.

### F-NEW-21 · MINOR · Cookie banner zachytený v každom screenshote — auto-dismiss helper v test env chýba
**Kde:** `tmp/walkthrough-shots/*.png` — všetkých 56 screenshotov má cookie banner na spodu (zaberá ~50 px). Vizuálny audit je sťažený lebo `cookie-consent` prekryje legit obsah pod ním.
**Root cause:** `walkthrough.spec.ts` nedismissuje cookie consent pred screenshot. V prod test-env to nie je aktivny problém, ale **každý reviewer musí mentálne odfilrovať cookie footer** zo screenshotu.
**Návrh fixu:** v `e2e/walkthrough.spec.ts` po prvom `page.goto("/")` vykonať `await page.evaluate(() => localStorage.setItem("watt-city-cookie-consent", "accepted"))`. Ak storage key má iný názov, pozrieť `components/cookie-consent.tsx` — používa svoj key. Posledná možnosť: kliknúť Rozumiem programaticky.
**Severity:** MINOR — neovplyvňuje user-facing kvalitu, ale dev experience.

### F-NEW-22 · POLISH · Manuálny baseline backup (`walkthrough-shots-pass3/`) je not-scalable
**Kde:** `tmp/` directory
**Čo som spravil:** ručne `mv tmp/walkthrough-shots tmp/walkthrough-shots-pass3` pred re-walkthrough, aby som mohol porovnať pred/po. **Toto neexistuje ako automated workflow.**
**Návrh fixu:**
- `walkthrough.spec.ts` brať argument cez env var: `WALKTHROUGH_LABEL=pass3 pnpm exec playwright test walkthrough.spec.ts` → ukladá do `tmp/walkthrough-shots/pass3/`.
- Default label = aktuálny git commit short SHA: `WALKTHROUGH_LABEL=$(git rev-parse --short HEAD)`.
- Spec sám vie čítať `process.env.WALKTHROUGH_LABEL` a postaviť `SHOT_DIR` cestu.
- Bonus: `scripts/walkthrough-diff.mjs` ktorý porovná dva run adresáre (pixel diff + JSON diff a11y findings).
**Severity:** POLISH — dev experience, accelerates each future review cycle.

---

## Časť 3 · Workflow / dev experience audit

Pri prejdení repo som našiel niekoľko nedostatkov ktoré sa oplatí adresovať v ďalšom release.

### W-01 · CRITICAL · Žiadny CI workflow (`.github/workflows/` chýba)
**Stav:** repo nemá žiadny GitHub Actions / CI súbor. 708 vitest testov + 14 Playwright spec + ESLint + tsc — všetko sa spúšťa **iba manuálne pred PR**. Nič nehraje, ak FE zabudol spustiť `pnpm test:e2e` lokálne — broken main môže ladnúť bez detekcie.
**Návrh fixu:** vytvoriť `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm exec tsc --noEmit
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm exec playwright test --project=chromium
```
**Acceptance:** každý push na `main` + každý PR má 5-bod gate (lint, typecheck, vitest, playwright, build).
**Severity:** CRITICAL pre dlhodobú stabilitu.

### W-02 · MAJOR · Chýbajúce package.json scripty (`typecheck`, `test:a11y`, `test:walk`)
**Stav:**
- `_fe-fix-prompt.md`, `_fe-fix-prompt-pass3.md` referencujú `pnpm typecheck` — neexistuje, FE musí volať `pnpm exec tsc --noEmit`.
- `pnpm test:a11y` referenced — neexistuje.
- Walkthrough spec sa spúšťa cez `pnpm exec playwright test walkthrough.spec.ts` — žiadny shortcut.
**Návrh fixu (`package.json`):**
```jsonc
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:install": "playwright install chromium",
  "test:walk": "playwright test --project=chromium walkthrough.spec.ts",
  "test:walk:diff": "node scripts/walkthrough-diff.mjs",
  "review": "pnpm typecheck && pnpm lint && pnpm test && pnpm test:walk"
}
```
**Acceptance:** všetko v `_fe-fix-prompt-*.md` je 1-line príkaz.
**Severity:** MAJOR — DX + autoritatívnosť dokumentov.

### W-03 · MAJOR · Žiadny pre-commit hook
**Stav:** `.git/hooks/` má iba sample súbory. Bez Husky/lint-staged/simple-git-hooks. PR môže push-nut s broken `tsc` alebo lint error a iba CI by to zachytilo (ktoré ešte nemá).
**Návrh fixu (light-touch):** `simple-git-hooks` (lighter ako Husky):
```json
// package.json
"devDependencies": { "simple-git-hooks": "^2", "lint-staged": "^15" },
"simple-git-hooks": { "pre-commit": "pnpm exec lint-staged" },
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix"],
  "*.{ts,tsx,md,json,css}": ["prettier --write"]
}
```
A `pnpm dlx simple-git-hooks` po `pnpm install`.
**Acceptance:** broken lint je zachytený lokálne, nie čaká až na CI.
**Severity:** MAJOR — first line of defense.

### W-04 · MINOR · `walkthrough.spec.ts` nie je explicitne v testIgnore exclusion ani v review gate
**Stav:** `playwright.config.ts:37` má `chromium` projekt s `testIgnore: [/.*\.mobile\.spec\.ts/, /.*\.cross\.spec\.ts/]`. Walkthrough spec nie je `.mobile` ani `.cross`, takže sa spúšťa s default chromium runom — to znamená že **každý `pnpm test:e2e` ho beží spolu s 14 ostatnými spec**, čo trvá ~3-4 min navyše a generuje 56 PNG do `tmp/`.
Ale **zároveň nie je v žiadnej review gate doložene** ako primary product audit — FE môže pustit `pnpm test:e2e` bez vedomia že walkthrough screenshoty sa generujú (a pridajú do disk).
**Návrh fixu:**
- Buď: presunúť walkthrough do separátneho projekt grupy: `name: "walkthrough", testMatch: /walkthrough\.spec\.ts/, testIgnore: []` a **vyradiť** z `testIgnore` chromium projektu cez `testIgnore: [/.*\.mobile\..*/, /.*\.cross\..*/, /walkthrough\.spec\.ts/]`. Default `pnpm test:e2e` neobsahuje walkthrough; spustí sa explicitne `pnpm test:walk` (per W-02).
- Alebo: ponechať v default chromium ale dokumentovať to v `README.md` + `docs/SMOKE-TEST.md` — „walkthrough generates 56 PNG into tmp/, gitignored, expect ~2 min".
- Pridať `tmp/walkthrough-shots/` do `.gitignore` (overiť).
**Acceptance:** `pnpm test:e2e` rýchle, `pnpm test:walk` je samostatný product-review tool.
**Severity:** MINOR — DX clarification.

### W-05 · MINOR · `take-school-shots.ts` deferred/dangling — treba decision

> **RESOLVED — Voľba A (PR-H · H-05).** `take-school-shots.ts` is dropped from the roadmap. Inline content cards in `app/dla-szkol/page.tsx` stay as the canonical "what it looks like" surface. F-NEW-04 status updated in `_ux-pass-3.md`. If product later requests Voľba B (real seeded screenshots), it re-enters the post-release backlog.

**Stav:** `_fe-fix-prompt-pass3.md` PR-F doporučil headless screenshot pipeline pre `/dla-szkol`. Sprint A reportoval „deferred" lebo požaduje seedovaný demo class behind stable URL. PR-F status v `_ux-pass-3.md` to potvrdzuje.
**Návrh:** explicitne urobiť **product decision**:
- **Voľba A:** Ostať na inline content cards (Round 2.5 status quo). Mark `take-school-shots.ts` ako `OUT-OF-SCOPE` v všetkých dokumentoch, drop ho z roadmap.
- **Voľba B:** Implementovať. Vyžaduje:
  1. Seed script v `scripts/seed-demo-school.ts` — register demo_teacher, vytvorit class, register 30 demo_students s curve XP distribution, simulate weekly progress.
  2. Stabilný URL `/dla-szkol/demo-preview` ktorý je gated na `?demo=true` query param + dev/preview env.
  3. `scripts/take-school-shots.ts` — Playwright launchne, prelogguje sa ako demo_teacher, navštívi `/klasa/[demo-class-id]`, screenshot 3 routes, výstup do `public/dla-szkol/preview-{1,2,3}.png`.
  4. CI step pre regenerát po každej zmene v relevantných komponentoch.
- Komplikácia: scope fence z Pass-3 hovorí „nemeniť API/routing" — voľba B porušuje (nový route `/dla-szkol/demo-preview`).
**Severity:** MINOR — open loop v doku.

---

## Časť 4 · Pozitívne (čo Sprint A + Round 2.5 zlepšili nad rámec Pass-3)

- ✅ **`lib/account-filter.ts`** strips QA / smoke / e2e usernames (`gp_`, `pr_`, `smoke`, `e2e_`, atď.) z anonymous landing, `/leaderboard`, `/sin-slavy`. Anonymous user vidí real community, nie playwright fixture roster. **Toto Pass-3 nezachytil ale je veľmi dobrý fix** — ja by som ho navrhol ako F-NEW-19 v Pass-3 keby som vedel.
- ✅ **Anonymous demo `/games/finance-quiz`** — nelogovaný visitor môže hrať plný round bez registracie + pri konci dostane register/login CTA. **Reduces friction k onboardingu**, klasický „let them taste before signup" pattern. Pokrýva aj _ux-pass-2.md L pozorovanie.
- ✅ **Mobile drawer pattern** — Round 2.5 root-cause-fixed `.tap-target` display issue v globals.css ktorý bil Tailwind responsive `*:hidden`. Hamburger boundary z `sm` na `lg` (= tablet uses mobile pattern). Mobile header je teraz čistý: logo + Register CTA + menu.
- ✅ **Drawer `inert` attribute** keď je closed (PR-E drive-by) — clears `aria-hidden-focus` axe-serious finding.
- ✅ **Walkthrough metriky** 31 → 0 a11ySerious + 0 console + 0 page errors. **Aplikácia je v shipping kvalite na axe baseline.**

---

## Časť 5 · Sprint B + workflow → ďalší release

Návrh release plánu (v separátnom dokumente `_fe-fix-prompt-pass4.md`):

### Sprint B-prime (P0/P1 zostávajúce z Pass-3, plus nové Pass-4)
1. **F-NEW-19** — broaden city-scene attribute selectors (raw fills) → ďalšia stopgap iterácia pred E4.
2. **F-NEW-20** — copy „Noc nad Katowicami" rewrite (× 4 lokále).
3. **F-NEW-06** dokončiť — `EmptyState` primitív + 4 zostávajúce surfaces (`leaderboard`, `friends`, `profile/achievements`, `parent`).
4. **F-NEW-09** verify-then-implement — ak slider chýba, pridaj.
5. **F-NEW-10** onboarding skip + skratenie + replay menu item.
6. **F-NEW-12** parent Polacz button states.
7. **F-NEW-08 dokončiť** — subheading checkmarks + auto-dismiss.

### Workflow polish (W-01..W-05)
8. **W-01** GitHub Actions CI pipeline.
9. **W-02** package.json scripts (`typecheck`, `test:walk`, `test:walk:diff`, `review`).
10. **W-03** simple-git-hooks pre-commit lint.
11. **W-04** walkthrough projekt separation v playwright.config.
12. **W-05** product decision pre take-school-shots.ts.
13. **F-NEW-21** cookie auto-dismiss helper v walkthrough.spec.
14. **F-NEW-22** walkthrough labelled baseline + diff script.

### Sprint C-tail (polish, post-release)
- F-NEW-05 sticky TOC.
- F-NEW-13 font-mono drop.
- F-NEW-14 cookie padding-bottom.
- F-NEW-15 displayName nudge.
- F-NEW-16 achievement empty (can fold do F-NEW-06 EmptyState rollout).
- F-NEW-17 Help/FAQ nav.
- F-NEW-18 avatar konsistencia.

---

## Časť 6 · Reproducer

```bash
# Re-walkthrough na ľubovoľnom commite (po W-02 implementácii):
pnpm test:walk

# Diff vs. baseline (po W-02 + F-NEW-22):
WALKTHROUGH_LABEL=pre-sprint-b pnpm test:walk
git checkout sprint-b-merged
WALKTHROUGH_LABEL=post-sprint-b pnpm test:walk
pnpm test:walk:diff pre-sprint-b post-sprint-b

# Smoke summary:
jq '[.[] | select(.a11ySerious | length > 0)] | length' \
  tmp/walkthrough-shots/_findings.json   # expected: 0
jq '[.[] | select(.consoleErrors | length > 0)] | length' \
  tmp/walkthrough-shots/_findings.json   # expected: 0
```

---

## Súbory dotknuté review

- **Read:** `app/page.tsx` (diff Round 2.5), `app/globals.css`, `lib/resources.ts`, `package.json`, `tsconfig.json`, `playwright.config.ts`, `.git/hooks/`, screenshoty z oboch baseline (28 desktop + 28 mobile × 2 = 112 PNG).
- **Read commits:** `ca69758` (Round 2.5), `e03f15a` (PR-D), `a5886c2` (PR-E), `0ec08de` (PR-F).
- **Created:** tento dokument + `_fe-fix-prompt-pass4.md`.
- **Žiadne JSX/CSS zmeny** — to je úloha pre FE v ďalšom release.
