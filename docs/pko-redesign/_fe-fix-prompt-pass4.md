# Prompt pre FE dev — release N+1 (Sprint B-prime + workflow polish)

> Skopíruj celý tento súbor ako úvodný prompt pre nový dev session. Agent má všetok kontext, nič nehádaj — všetky podklady sú in-repo.

---

## 0. Stav repozitára pred týmto release

Aktuálny `main` po Sprint A:
- `0ec08de` PR-F /dla-szkol 4-step + preview cards
- `a5886c2` PR-E CityScene + skyline pko light filter (+ drive-by a11y)
- `e03f15a` PR-D ResourceBar lightColor (WCAG AA)
- `ca69758` Round 2.5 demo-review punch list

Walkthrough metrika: **0 a11ySerious / 0 console errors / 0 page errors** na 56 navigationch.

Re-review výstup: **`docs/pko-redesign/_ux-pass-4.md`** (čítaj **najprv**, je to tvoj backlog).

---

## 1. Kontext a ciele

Si FE developer na Watt City (Next.js 16 / React 19.2 / Tailwind v4, default skin `pko`).

Tento release má **dva rovnocenné ciele**:

1. **Dokončiť Sprint B z Pass-3 + nové Pass-4 vizuálne nálezy** (7 ticketov).
2. **Vyplniť workflow gap-y** (5 ticketov) — CI, scripts, pre-commit, walkthrough infra.

Zaobaľ ich ako **2 zoskupené PR** (UX + workflow), alebo do 4–6 menších podľa preferencie reviewera.

Spec hierarchy pri konflikte:
`01-BRAND-MANUAL.md` > `02-DESIGN-TOKENS.md` > `03-COMPONENTS.md` > aktuálny kód.

Prečítaj v tomto poradí **predtým** než začneš čokoľvek meniť:

1. `docs/pko-redesign/_ux-pass-4.md` — TL;DR + status Pass-3 findings + 4 nové vizuálne + 5 workflow nálezov
2. `docs/pko-redesign/_ux-pass-3.md` — F-NEW-01..18 referenčný backlog
3. `AGENTS.md` — vizuálne rules
4. `docs/pko-redesign/01-BRAND-MANUAL.md` §1, §2, §7, §12

---

## 2. Scope fence — čo **NEROBIŤ**

- ❌ Nepridávať nové features (workflow + polish only).
- ❌ Nemeniť hernú logiku, DB schémy, API contracts.
- ❌ Nemeniť `[data-skin="core"]` CSS.
- ❌ Nezavádzať dark-mode pko variant.
- ❌ Nemeniť `_ux-pass-3.md` ani `_ux-pass-4.md` mimo `STATUS: FIXED in PR-X` anotácií.
- ❌ Žiadne `--no-verify` commits, žiadne force-push.
- ❌ F-NEW-09 (loan calculator sliders) — **najprv overiť** či slider neexistuje mimo screenshot scroll. Ak existuje, len zlepši vizuálnosť; ak chýba, implementuj.
- ❌ F-NEW-17 (Help/FAQ) — vyžaduje **product decision** o FAQ obsahu. Ak FAQ neexistuje, len zalogovať `@decision-needed` a presunúť na backlog.
- ❌ W-05 (take-school-shots.ts) — vyžaduje product decision A/B z `_ux-pass-4.md` Časť 3 W-05. Bez decision, defaultne **Voľba A** (drop z roadmap, mark OUT-OF-SCOPE).

---

## 3. Quality gates — musí platiť pred každým PR

```bash
pnpm lint                                      # eslint
pnpm exec tsc --noEmit                         # (po W-02: pnpm typecheck)
pnpm test                                      # vitest 708/708 alebo viac
pnpm exec playwright test --project=chromium   # 14+ specs zelené
pnpm exec playwright test walkthrough.spec.ts  # (po W-02: pnpm test:walk)
pnpm build                                     # next build
```

**Walkthrough gate:**
```bash
jq '[.[] | select(.a11ySerious | length > 0)] | length' \
  tmp/walkthrough-shots/_findings.json
# expected: 0

jq '[.[] | select(.consoleErrors | length > 0)] | length' \
  tmp/walkthrough-shots/_findings.json
# expected: 0
```

---

## 4. Plán práce — 12 úloh v 2 PR sekcjach

### PR-G · UX backlog dokončenie (7 úloh)

#### G-01 · F-NEW-19 — Broaden city-scene attribute selectors (raw fills)
**Súbor:** `app/globals.css` (rozšíriť `:where([data-skin="pko"]) .city-scene-root` blok cca line 218–249).

**Pridať:**
```css
/* Raw fill silhouettes — extend the stop-only override to cover hardcoded
 * <rect fill="#0f172a"> style building shapes that the gradient-stop
 * selector misses. */
:where([data-skin="pko"]) .city-scene-root [fill="#0f172a"],
:where([data-skin="pko"]) .city-scene-root [fill="#1e293b"],
:where([data-skin="pko"]) .city-scene-root [fill="#1f2937"],
:where([data-skin="pko"]) .city-scene-root [fill="#111827"] {
  fill: var(--sc-building-primary);
}

:where([data-skin="pko"]) .city-scene-root [fill="#0a0a0f"],
:where([data-skin="pko"]) .city-scene-root [fill="#020617"],
:where([data-skin="pko"]) .city-scene-root [fill="#000"],
:where([data-skin="pko"]) .city-scene-root [fill="#000000"] {
  fill: var(--sc-building-secondary);
}
```

**Pozor:** Selektory sú attribute-based, nie `<stop>`-only — môžu retintnúť aj **strokes/borders** ak sú ako `fill`. Skontrolovať že silhouetty nestratili relief. Ak áno, zúžiť scope: `rect[fill=...]` namiesto `[fill=...]`.

**Acceptance:**
- Side-by-side `tmp/walkthrough-shots/desktop__01-landing.png` pred/po — pko city scene má **viditeľný denný look** (svetlo-sivé budovy na svetlo-modrom nebi, nie noir-noc).
- `SKIN=core pnpm dev` → city scene ostáva v pôvodnom neon look (overiť scope).
- Walkthrough zostáva 0 a11y findings.

---

#### G-02 · F-NEW-20 — „Noc nad Katowicami" copy rewrite × 4 lokále
**Súbory:** `lib/locales/{pl,uk,cs,en}.ts`

**Identifikuj kľúče:** `grep -rn "Noc nad Katowicami\|nieoświetlonej" lib/locales/` (alebo ekvivalent v inom path). Pravdepodobne `dashboard.cityHeroTitle` / `cityHeroBody` alebo podobne.

**Návrh copy:**
| Lang | Title | Body |
|---|---|---|
| pl | Twoje miasto czeka | {n} budynków stoi w pustkach. Zagraj minigry, by je oświetlić. |
| uk | Твоє місто чекає | {n} будинків стоїть пусткою. Зіграй мінігри, щоб засвітити їх. |
| cs | Tvé město čeká | {n} budov je prázdných. Hraj minihry, abys je rozsvítil. |
| en | Your city is waiting | {n} buildings stand empty. Play minigames to light them up. |

**Acceptance:**
- Žiadny výskyt „Noc nad Katowicami" / „nieoświetlonej" / „ciemności" v aktuálnych dictionaries (allowed back-compat keys ostávajú s `_legacy` suffix ak sú referencované odinakaď).
- Vitest content-hash testy (per `project_tests` memory) môžu fail-núť — updatovať očakávané hashe.

---

#### G-03 · F-NEW-06 dokončiť — `EmptyState` primitív + 4 surfaces
**Nový súbor:** `components/empty-state.tsx`

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  body?: string;
  cta?: { href: string; label: string; variant?: "primary" | "secondary" | "sales" };
};

export function EmptyState({ icon, title, body, cta }: Props) {
  const btnClass =
    cta?.variant === "sales" ? "btn btn-sales" :
    cta?.variant === "secondary" ? "btn btn-secondary" : "btn";
  return (
    <div className="card flex flex-col items-center text-center gap-4 py-12 px-6">
      <div className="text-5xl" aria-hidden>{icon}</div>
      <h3 className="t-h4">{title}</h3>
      {body && <p className="t-body-sm text-[var(--ink-muted)] max-w-md">{body}</p>}
      {cta && <Link href={cta.href} className={btnClass}>{cta.label}</Link>}
    </div>
  );
}
```

**Aplikuj na 4 surfaces:**

1. `app/leaderboard/page.tsx` — pri 0 entries po account-filter:
   ```tsx
   <EmptyState
     icon="🏆"
     title={d.leaderboard.emptyTitle}
     body={d.leaderboard.emptyBody}
     cta={{ href: "/games", label: d.leaderboard.emptyCta, variant: "sales" }}
   />
   ```
2. `components/friends-client.tsx` — pri `friends.length === 0`:
   ```tsx
   <EmptyState
     icon="👥"
     title={d.friends.emptyTitle}
     body={d.friends.emptyBody}
     cta={{ href: `/profile/${currentUsername}`, label: d.friends.emptyCta, variant: "secondary" }}
   />
   ```
3. `app/profile/page.tsx` — pri `achievements.unlocked.length === 0` (fresh user) **skryť grid úplne** a zobrazit:
   ```tsx
   <EmptyState
     icon="🎖"
     title={d.profile.achievementsEmptyTitle}
     body={d.profile.achievementsEmptyBody}
     cta={{ href: "/games", label: d.profile.achievementsEmptyCta, variant: "sales" }}
   />
   ```
   (Pokrýva aj F-NEW-16.)
4. `components/parent-client.tsx` — pri „kid not linked" stave (default pri prvom príchode rodiča):
   ```tsx
   <EmptyState
     icon="👨‍👧"
     title={d.parent.unlinkedTitle}
     body={d.parent.unlinkedBody}
     cta={{ href: "/rodzic/dolacz", label: d.parent.unlinkedCta, variant: "primary" }}
   />
   ```

**i18n keys** doplniť do všetkých 4 lokálov. Návrh PL:
- `leaderboard.emptyTitle` = „Buď pierwszy!"
- `leaderboard.emptyBody` = „Liga jest pusta. Zagraj minigry, by zdobyć pierwsze punkty."
- `leaderboard.emptyCta` = „Zagraj minigrę"
- (analogicky pre friends, profile, parent)

**Acceptance:**
- Žiadny suchý text-only empty state na 4 surfaces.
- EmptyState component má svoj vlastný vitest snapshot test (ak má repo snapshot konvenciu).

---

#### G-04 · F-NEW-09 — Loan calculator sliders (verify-then-implement)
**Krok 1 — Verify:**
```bash
pnpm dev
# Otvor http://localhost:3000/loans/compare (logged-in)
# Pozri či existuje slider hore mimo screenshot scroll.
grep -n "input.*type.*range\|slider" components/loan-comparison.tsx
```

**Krok 2 — Ak existujú:** zlepši ich viditeľnosť (sticky header, larger touch targets, value labels). Acceptance done.

**Krok 2 — Ak chýbajú, implementuj:**
- Súbor: `components/loan-comparison.tsx`
- Pridať dva ovládače:
  - **Principal slider** (1000 — 10000 W$, step 500). Default 3000.
  - **Term selector** (segmented buttons: 6 / 12 / 24 / 36 mes). Default 12.
- Stav v `useState`. On change recalcuje rows v tabuľke.
- Use `.input` primitive pre slider styling, alebo custom track per `03-COMPONENTS.md` §forms (4px track, 20×20 thumb).

**Acceptance:**
- User môže zmeniť parametre bez reloadu.
- Displayed amount + RRSO sa updatuje real-time.
- Mobile-friendly (slider min height 44px tap area).

---

#### G-05 · F-NEW-10 — Onboarding skip + skratenie + replay
**Súbor:** `components/onboarding-tour.tsx`

**Zmeny:**
1. **Skratiť na 3 kroky:**
   - Krok 1: „Zarabiaj Watty" (energia z minihier)
   - Krok 2: „Buduj miasto" (resources → budovy)
   - Krok 3: „Zlož kredyt" (bonus z budov → mortgage)
   - Drop ostatné kroky (alebo presunúť do separátneho „Pokročilé tipy" volaného z menu).
2. **Skip link na každom kroku**, nie iba na poslednom.
3. **Replay button v menu:**
   - `components/site-nav.tsx` user dropdown (pri `username` → existing right-cluster) pridať položku „Zobacz tutorial" → spúšťa `OnboardingTour` cez localStorage reset + state trigger.
   - Mobile drawer (`components/mobile-nav-drawer.tsx`) footer pridať `<button>` „Zobacz tutorial".
4. **localStorage gate** — overiť že existuje (per `2026-04-22 ux-fixes-batch.md` to bolo opravené). Ak nie je, pridať key `watt-city-onboarding-completed-v2` (verzionovaný — nový tour treba znova ukázať).

**Acceptance:**
- Onboarding completable v ≤ 30 sec.
- Skip funguje na ľubovoľnom kroku.
- Replay z menu spustí tour znova.

---

#### G-06 · F-NEW-12 — `/parent` Polacz button visual states
**Súbor:** `components/parent-client.tsx`

**Zmeny:**
1. Default state inputu prázdny → button má `btn btn-secondary` (outline navy) — vyzerá clickable.
2. `useEffect` (alebo controlled state) sleduje `code.length`:
   - `< 6` → `btn-secondary`, ale **nie disabled** (POST sa odbije server-side validáciou s pekným error toastom).
   - `=== 6` → swap na `btn btn-primary` (full navy fill), aktivácia signalled vizuálne.
3. Pridať helper text pod input:
   ```tsx
   <p className="t-body-sm text-[var(--ink-muted)] mt-2">
     {d.parent.codeHelper}  {/* "Wpisz 6-znakowy kód, który dostalo Twoje dziecko..." */}
   </p>
   ```
4. i18n key `parent.codeHelper` × 4 lokále.

**Acceptance:**
- Pri prvom príchode rodiča je jasná „input → action" cesta.
- Helper text reagujte na input length (countdown chip „4/6 znaków").

---

#### G-07 · F-NEW-08 dokončiť — Cookie banner subheading + auto-dismiss
**Súbor:** `components/cookie-consent.tsx`

**Zmeny:**
1. Pridať tri inline checkmarks pod hlavnú vetu:
   ```tsx
   <div className="flex flex-wrap gap-3 t-caption text-[var(--ink-muted)]">
     <span>✓ {d.cookies.noTrackers}</span>
     <span>✓ {d.cookies.noAnalytics}</span>
     <span>✓ {d.cookies.noAds}</span>
   </div>
   ```
2. Auto-dismiss po 30 sec scroll OR 3 page navigations:
   ```tsx
   useEffect(() => {
     let pageCount = 0;
     const onNav = () => {
       pageCount++;
       if (pageCount >= 3) dismiss();
     };
     window.addEventListener("popstate", onNav);
     return () => window.removeEventListener("popstate", onNav);
   }, []);
   ```
3. i18n keys: `cookies.noTrackers`, `cookies.noAnalytics`, `cookies.noAds` × 4 lokále.

**Acceptance:**
- Banner explicitne komunikuje „nie je čo odmietnuť" → checkmarky.
- Po 3 page navigations sa schová (without click „Rozumiem").

---

### PR-H · Workflow + infra (5 úloh)

#### H-01 · W-01 — GitHub Actions CI pipeline
**Nový súbor:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm exec tsc --noEmit
      - run: pnpm test
      - run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm exec playwright test --project=chromium
        env:
          CI: "1"
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Acceptance:**
- Push na `main` triggers CI.
- PR check zelený / červený podľa testov.
- Failed E2E uploadne `playwright-report` ako GitHub artifact.

---

#### H-02 · W-02 — package.json scripty
**Súbor:** `package.json`

```diff
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "eslint",
+    "typecheck": "tsc --noEmit",
     "test": "vitest run",
     "test:watch": "vitest",
     "test:e2e": "playwright test",
-    "test:e2e:install": "playwright install chromium"
+    "test:e2e:install": "playwright install chromium",
+    "test:walk": "playwright test --project=chromium walkthrough.spec.ts",
+    "test:walk:diff": "node scripts/walkthrough-diff.mjs",
+    "review": "pnpm typecheck && pnpm lint && pnpm test && pnpm test:walk"
   }
```

**Plus update referenčných dokumentov** (find-replace `pnpm exec tsc --noEmit` → `pnpm typecheck` v `_fe-fix-prompt-pass3.md`, `_fe-fix-prompt-pass4.md`, prípadne ostatné). **Pozor scope-fence** pri `_ux-pass-3.md` / `_ux-pass-4.md` — tie nemeň, sú read-only artefakty.

**Acceptance:**
- `pnpm typecheck` funguje.
- `pnpm test:walk` funguje.
- `pnpm review` (chained) funguje.

---

#### H-03 · W-03 — simple-git-hooks pre-commit
**Súbor:** `package.json`

```diff
   "devDependencies": {
+    "simple-git-hooks": "^2.11.0",
+    "lint-staged": "^15.0.0",
     ...
+  },
+  "simple-git-hooks": {
+    "pre-commit": "pnpm exec lint-staged"
+  },
+  "lint-staged": {
+    "*.{ts,tsx}": "eslint --fix"
   }
```

A install:
```bash
pnpm install
pnpm dlx simple-git-hooks
```

(Druhý príkaz registruje hook do `.git/hooks/pre-commit`.)

**Pozor:**
- Repo nemá Prettier — netreba pridať. Iba `eslint --fix` na `.ts/.tsx`.
- Pridať `prepare` script: `"prepare": "simple-git-hooks"` aby sa hook reintaloval po `pnpm install`.

**Acceptance:**
- `git commit` na broken lint zlyháva s eslint output.
- `git commit` na fixable lint auto-fixne a continue.

---

#### H-04 · W-04 — Walkthrough projekt separation
**Súbor:** `playwright.config.ts`

**Zmeny:**

```diff
   projects: [
     {
       name: "chromium",
       use: { ...devices["Desktop Chrome"] },
-      testIgnore: [/.*\.mobile\.spec\.ts/, /.*\.cross\.spec\.ts/],
+      testIgnore: [
+        /.*\.mobile\.spec\.ts/,
+        /.*\.cross\.spec\.ts/,
+        /walkthrough\.spec\.ts/,  // separate project, see below
+      ],
     },
+    {
+      name: "walkthrough",
+      use: { ...devices["Desktop Chrome"] },
+      testMatch: /walkthrough\.spec\.ts/,
+    },
     ...
```

A v `.gitignore` overiť:
```
tmp/
playwright-report/
test-results/
```

**Acceptance:**
- `pnpm test:e2e` (default chromium) bezí ~1 min, neobsahuje walkthrough.
- `pnpm test:walk` spúšťa iba walkthrough projekt.
- CI (H-01) môže triggernuť oba samostatne.

---

#### H-05 · W-05 — Product decision pre take-school-shots.ts
**Default voľba (bez decision od PO):** **Voľba A** — drop z roadmap.

**Akcie:**
1. Update `_ux-pass-3.md` F-NEW-04 sekciu — doplniť anotáciu „**STATUS: OUT-OF-SCOPE — Voľba A defaulted (in-line cards approve)**".
2. Update `_ux-pass-4.md` Časť 3 W-05 — doplniť „**RESOLVED — Voľba A**".
3. Skontrolovať či nie je dangling reference v `_fe-fix-prompt-pass3.md` PR-F sekcii — ak je, doplniť poznámku.
4. **Žiadny commit** s `take-school-shots.ts` skriptom — neimplementovať.

**Ak PO eskaluje Voľba B (počas review):** otvoriť samostatný `@decision-needed` issue, presunúť do post-release backlog.

**Acceptance:**
- Žiadne `take-school-shots.ts` reference v dokumentoch nie sú „loose".

---

#### H-06 (extra) · F-NEW-21 — Cookie banner auto-dismiss v walkthrough.spec
**Súbor:** `e2e/walkthrough.spec.ts`

**Zmena:** v `captureRoute` alebo nad ňou, pred screenshot, dismiss cookie consent:

```typescript
// In captureRoute, after navigation but before screenshot:
await page.evaluate(() => {
  // The exact key depends on cookie-consent.tsx; grep that file.
  // Likely candidates: "watt-city-cookie-consent" or "cookies-accepted-v1".
  const KEYS = ["watt-city-cookie-consent", "cookies-accepted-v1", "cookies-v1"];
  for (const k of KEYS) {
    try { localStorage.setItem(k, "accepted"); } catch {}
  }
});
```

Alternatíva (ak nemá localStorage gate, len click): `await page.locator('[aria-label="Zamknij banner cookies"]').click({timeout: 1000}).catch(() => null);`

**Acceptance:**
- Žiadny screenshot z `tmp/walkthrough-shots/` neobsahuje cookie banner footer.
- Walkthrough trvá rovnako alebo kratšie.

---

#### H-07 (extra) · F-NEW-22 — Walkthrough labelled baseline + diff script

**Zmena `e2e/walkthrough.spec.ts`:**

```typescript
const LABEL = process.env.WALKTHROUGH_LABEL ?? "current";
const SHOT_DIR = path.resolve(process.cwd(), "tmp/walkthrough-shots", LABEL);
```

**Nový súbor:** `scripts/walkthrough-diff.mjs`

```javascript
#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error("Usage: node scripts/walkthrough-diff.mjs <labelA> <labelB>");
  process.exit(1);
}

const root = path.resolve(process.cwd(), "tmp/walkthrough-shots");
const aDir = path.join(root, a);
const bDir = path.join(root, b);

if (!existsSync(aDir) || !existsSync(bDir)) {
  console.error(`Missing dir: ${aDir} or ${bDir}`);
  process.exit(1);
}

const aFindings = JSON.parse(readFileSync(path.join(aDir, "_findings.json"), "utf8"));
const bFindings = JSON.parse(readFileSync(path.join(bDir, "_findings.json"), "utf8"));

const summary = (f) => ({
  routes: f.length,
  a11y: f.reduce((s, r) => s + r.a11ySerious.length, 0),
  console: f.reduce((s, r) => s + r.consoleErrors.length, 0),
  page: f.reduce((s, r) => s + r.pageErrors.length, 0),
});

const sa = summary(aFindings), sb = summary(bFindings);
console.log(`A=${a}: ${JSON.stringify(sa)}`);
console.log(`B=${b}: ${JSON.stringify(sb)}`);
console.log(`Δ a11y: ${sb.a11y - sa.a11y}`);
console.log(`Δ console: ${sb.console - sa.console}`);
console.log(`Δ page: ${sb.page - sa.page}`);

// PNG count diff:
const aShots = readdirSync(aDir).filter((f) => f.endsWith(".png"));
const bShots = readdirSync(bDir).filter((f) => f.endsWith(".png"));
const onlyA = aShots.filter((f) => !bShots.includes(f));
const onlyB = bShots.filter((f) => !aShots.includes(f));
if (onlyA.length) console.log(`Only in A: ${onlyA.join(", ")}`);
if (onlyB.length) console.log(`Only in B: ${onlyB.join(", ")}`);
```

A pridať `+x` mode + linkovať z `package.json` `test:walk:diff` (pozri H-02).

**Acceptance:**
```bash
WALKTHROUGH_LABEL=pre-pr-g pnpm test:walk
# ... checkout + change ...
WALKTHROUGH_LABEL=post-pr-g pnpm test:walk
pnpm test:walk:diff pre-pr-g post-pr-g
# Shows Δ counts + only-in-A/B PNG names.
```

---

## 5. Per-PR checklist

```markdown
- [ ] F-NEW-IDs / W-IDs zaadresované (vymenuj)
- [ ] pnpm lint / typecheck / test / playwright / build — všetko zelené
- [ ] Walkthrough re-run: 0 a11y serious findings, 0 console, 0 page errors
- [ ] Žiadne border-[Npx≥2], shadow-[hard-offset], font-{black,extrabold,800,900}, uppercase na headings (mimo .t-overline)
- [ ] Žiadne nové hex hodnoty mimo 02-DESIGN-TOKENS.md palety (okrem `lib/resources.ts` lightColor — už doložené v PR-D)
- [ ] Žiadne i18n keys removed (allow added)
- [ ] Pred/po screenshot v PR body
- [ ] _ux-pass-3.md / _ux-pass-4.md anotácie „STATUS: FIXED in PR-X" pridané pre relevant findings
```

---

## 6. Order of operations

Doporučené poradie:

1. **H-02 first** — pridať `pnpm typecheck`, `pnpm test:walk`. Zostávajúce PR-ká môžu používať tieto skratky.
2. **H-04 spolu s H-02** — separuje walkthrough projekt, pridá .gitignore entries.
3. **H-01** — GitHub Actions CI (závislé na H-02 scriptoch v idealnom stave).
4. **H-03** — pre-commit hooks.
5. **H-05** — decision dokumentačná práca, žiadny code.
6. **H-06, H-07** — walkthrough infra (kvalita reviewov).
7. **PR-G UX backlog** — paralelne s H ticketmi alebo po nich.

Alebo: **2 paralelné PR-ká** — PR-H (workflow) ide nezávisle, PR-G (UX) je orto-gonálny.

---

## 7. Output

Po dokončení release:

- Update `_ux-pass-3.md` — pri každom F-NEW-NN dokončenom v tomto release pridaj „**STATUS: FIXED in PR-G**" (alebo PR-X according).
- Update `_ux-pass-4.md` — Časť 1 (status detail) finalizovat na FIXED kde aplikovateľné.
- Vyrobiť nový `_ux-pass-5.md` (re-review) iba ak produkt chce ďalšiu vlnu pred PKO showcase.

**Doporučenie pre PO:** po tomto release urobiť **30-min product walkthrough** osobne (live, nie cez screenshoty) na anonymous / kid / parent / teacher persona, ako finálna acceptance pred PKO partner demo.
