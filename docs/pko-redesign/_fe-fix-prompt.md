# Prompt pre FE dev — oprava PKO redesign UX findings

> Skopíruj celý tento súbor ako úvodný prompt. Agent má všetok kontext, nič nehádaj — report + spec dokumenty sú in-repo.

---

## 1. Kontext a ciele

Si FE developer na Watt City (Next.js 16 / React 19.2 / Tailwind v4, skin = `pko` default).
Po round-1 refactore (E0–E6) dorobil UX audit 47 findings v:

- **`docs/pko-redesign/_ux-findings.md`** ← tvoj backlog

Spec hierarchy pri konflikte (per `06-UX-REVIEW-BRIEF.md` §8):
`01-BRAND-MANUAL.md` > `02-DESIGN-TOKENS.md` > `03-COMPONENTS.md` > aktuálny kód.

Default skin je `pko` (svetlý, navy `#003574` + orange `#db912c`). Legacy `core` brutalism zostáva pod `[data-skin="core"]` — **nemeň ho**.

Prečítaj v tomto poradí **predtým** než začneš čokoľvek meniť:

1. `docs/pko-redesign/_ux-findings.md` — **hlavičku + F-001 až F-047**
2. `AGENTS.md` — vizuálne rules (bordery, shadows, uppercase, font weights, rounded, hex)
3. `docs/pko-redesign/01-BRAND-MANUAL.md` §2, §7, §12 (forbidden patterns, borders, a11y)
4. `docs/pko-redesign/02-DESIGN-TOKENS.md` §1, §12 (paleta + rýchla referencia)
5. `docs/pko-redesign/03-COMPONENTS.md` — spec pre komponent ktorý práve rieši (nie celé)

---

## 2. Scope fence — čo **NEROBIŤ**

- ❌ Nepridávať nové features / komponenty (okrem `site-footer.tsx` ktorý je už v spec — to je OUT-OF-SCOPE pre teraz, @decision-needed).
- ❌ Nemeniť texty / i18n dictionaries / copy.
- ❌ Nemeniť routing, DB, API, hernú logiku.
- ❌ Nemeniť `[data-skin="core"]` CSS (legacy skin).
- ❌ Nezavádzať nový dark-mode / skin toggle UI.
- ❌ Nemeniť texty v `docs/pko-redesign/_ux-findings.md` — report je read-only artefakt.
- ❌ Žiadne `--no-verify` commits, žiadne `git rebase -i`, žiadne force-push na `main`.
- ❌ Neimplementovať F-028, F-029, F-030, F-038, F-039 bez explicit potvrdenia od produktu (označené `@decision-needed`).

---

## 3. Quality gates — musí platit pred každým PR

```bash
pnpm lint        # eslint (React 19.2 purity rules sú "warn", nie "error" — vid MEMORY)
pnpm typecheck   # zero errors
pnpm test        # vitest: 635 tests / 80 files, content-hash tests musia passovať
pnpm test:a11y   # axe-core: 0 serious findings (môže byt scoped script)
pnpm build       # turbopack prod build pass
```

Playwright (13 spec / ~600 assertions) spusti lokálne:
```bash
pnpm exec playwright test   # alebo ekvivalentné repo-specific script
```

Ak `pnpm test:a11y` neexistuje ako script, nájdi `scanSeriousA11y` helper v test infra a spusti cez vitest.

---

## 4. Plán práce — **3 focused PR** v tomto poradí

> **Dôležité:** urob 3 samostatné PR, nie jeden mega-PR. Recenzia bude rýchlejšia a regresy ľahšie izolovateľné. Každý PR má checklist pred mergom.

### PR-A — Contrast sweep (F-001, F-002, F-010, F-016, F-035)

**Cieľ:** všetok dark-skin farebný residue → palette tokens. Body text ≥ 4.5:1 na bielom pozadí.

**Codemod (pusti ho ako prvý):**

```bash
# 1. zinc residue (60+ výskytov)
rg -l "text-zinc-(300|400)" app components | xargs sed -i '' \
  -e 's/text-zinc-400/text-[var(--ink-muted)]/g' \
  -e 's/text-zinc-300/text-[var(--ink-muted)]/g'

# 2. amber residue
rg -l "text-amber-(300|400)" app components | xargs sed -i '' \
  -e 's/text-amber-300/text-[var(--foreground)]/g' \
  -e 's/text-amber-400/text-[var(--ink-muted)]/g'
```

**Pozor:** `text-zinc-300` pri hero intro odsekoch (napr. `/dla-szkol:263`) chceme `text-[var(--foreground)]` (čierny body), **nie** `ink-muted`. Manuálne prejdi `app/dla-szkol/page.tsx` po codemode a prepni hero paragrafy.

**Emerald + rose semantic colors (F-010):**

Nie sú jednoduchý find-replace, lebo majú opacity variants. Postupuj per komponent:

- `text-emerald-\d+` → `text-[var(--success)]`
- `text-rose-\d+` → `text-[var(--danger)]`
- `bg-emerald-500/15` → `bg-[color-mix(in_oklab,var(--success)_8%,white)]` (alebo `bg-[var(--surface-2)]` ak je opacity väčšia)
- `bg-rose-500/15` → `bg-[color-mix(in_oklab,var(--danger)_8%,white)]`
- `border-emerald-400` → `border-[var(--success)]`
- `border-rose-500` → `border-[var(--danger)]`
- `bg-emerald-500 text-black` na result-card → `bg-[var(--success)] text-white`
- `bg-rose-500 text-black` → `bg-[var(--danger)] text-white`

Postupuj v tomto poradí komponentov (high-traffic first):
1. `components/games/fx.tsx`
2. `components/games/ai-truefalse-client.tsx`
3. `components/games/ai-quiz-client.tsx`
4. `components/games/finance-quiz-client.tsx`
5. `components/games/ai-chartread-client.tsx`
6. Ostatné `components/games/*` podľa abecedy
7. `components/parent-client.tsx` (L101)
8. `components/notification-bell.tsx` (L102 — `bg-rose-500` → `bg-[var(--danger)]`)

**F-035 marketplace tier-gate:** `app/marketplace/page.tsx:92` — `text-sm text-amber-300` → `text-sm text-[var(--foreground)]`. Pridaj `font-medium` pre váhu.

**F-011 chartread SVG:** `components/games/ai-chartread-client.tsx:36-79` — nahrať inline hex:
- `stroke="#475569"` (osy) → `stroke="var(--line)"`
- title `fill="#e2e8f0"` → `fill="var(--accent)"`
- axis labels `fill="#94a3b8"` → `fill="var(--ink-muted)"`
- data path `stroke="#fde047"` → `stroke="var(--accent)"`
- datapoints `fill="#22d3ee" stroke="#0f172a"` → `fill="var(--sales)" stroke="var(--accent)"`
- secondary `fill="#fde047"` → `fill="var(--sales)"`
- label text `fill="#94a3b8"` → `fill="var(--ink-muted)"`

**Acceptance:**
- [ ] `rg "text-zinc-|text-amber-(300|400)|text-emerald-|text-rose-"` vráti 0 riadkov v `app/` a `components/` (okrem ak je pod `[data-skin="core"]` conditional).
- [ ] `pnpm test:a11y` pass bez serious/critical findings.
- [ ] Vizuálne: otvor `/login`, `/register`, `/` (both anon + logged-in), `/games`, `/marketplace` — všetok body text čitateľný. Post-game breakdown wrong-answer explanation čitateľný.
- [ ] Playwright snapshots/traces z hier passovať (ak majú colour-regression check — content-hash tests by sa nemali zlomiť, iba visual).

**PR-A commit zoznam (návrh):**
1. `fix(a11y): replace text-zinc-300/400 with ink-muted token`
2. `fix(a11y): replace text-amber-300/400 with palette tokens`
3. `fix(a11y): emerald/rose semantic colors → success/danger tokens (games)`
4. `fix(a11y): chartread SVG uses palette tokens instead of slate/yellow/cyan hex`

---

### PR-B — Border sweep (F-033, F-034, F-040, F-041, F-042, F-043, F-044, F-046)

**Cieľ:** všetky `border-[var(--ink)]` → `border-[var(--line)]` (spec §7 default). `border-dashed` preč.

**Codemod:**

```bash
# 1. explicit ink borders
rg -l "border-\[var\(--ink\)\]" app components | xargs sed -i '' \
  -e 's|border-\[var(--ink)\]|border-[var(--line)]|g'

# 2. ink opacity variants
rg -l "border-\[var\(--ink\)\]/[0-9]+" app components | xargs sed -i '' \
  -e 's|border-\[var(--ink)\]/[0-9]\+|border-[var(--line)]|g'

# 3. dashed border removal (F-034)
# Manual: components/web3/medal-gallery.tsx:200 — odstráň `border-dashed`
```

**Manual follow-ups (codemod nechytí):**

**F-033 tier-up-toast** — `components/tier-up-toast.tsx:62` — `border-[var(--ink)]` → `border-[var(--line)]`. Plus (F-036) `bg-[var(--accent)] text-[var(--foreground)]` → `bg-[var(--surface)] text-[var(--foreground)] elev-soft`. Pridaj ľavý `border-l-[4px] border-l-[var(--accent)]` stripe ako celebration indikátor. Odskúšaj že confetti overlay zostáva viditeľný.

**F-037 city-level-card badge** — `components/city-level-card.tsx:113-118`:
```tsx
// PRED
<span className="text-[11px] font-mono font-bold border border-[var(--ink)] px-2 py-0.5"
      style={{ background: gridColor, color: "#0a0a0f" }}>

// PO
<span className="text-[11px] font-mono font-semibold tabular-nums rounded-sm px-2 py-0.5"
      style={{ background: gridColor, color: "var(--accent-ink)" }}>
```
A L145 `border-t border-[var(--ink)]/40` → `border-t border-[var(--line)]`.

**F-043 nauczyciel/signup** — `app/nauczyciel/signup/page.tsx:72, 81, 95, 107, 118` — nahraď inline input styling:
```tsx
// PRED
className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"

// PO
className="input"
```
Pre `font-mono` verification inputs: `className="input font-mono"`.

**F-044 o-platforme** — `app/o-platforme/page.tsx:29, 35, 41` — inline `style={{ background: "var(--accent)", color: "#0a0a0f" }}` → `style={{ background: "var(--accent)", color: "var(--accent-ink)" }}`. Potom na L223, 381 `text-[var(--foreground)]` na `bg-[var(--accent)]` → `text-[var(--accent-ink)]`.

**F-045 language-switcher** — prepísať `components/language-switcher.tsx:44`:
```tsx
// PRED
className="inline-flex items-center gap-1.5 h-9 px-2.5 border border-[var(--ink)] rounded-lg bg-[var(--surface)] font-bold text-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"

// PO
className="btn btn-secondary btn-sm"
```
Dropdown L54: `border border-[var(--ink)]` → `border-[var(--line)] elev-soft`.

**Acceptance:**
- [ ] `rg "border-\[var\(--ink\)\]"` vráti 0 riadkov mimo `:where([data-skin="core"])` bloku v CSS.
- [ ] `rg "border-dashed"` vráti 0 riadkov v `app/` a `components/`.
- [ ] `rg "hover:-translate-"` vráti 0 riadkov v `app/` a `components/` (brutalism hover preč).
- [ ] Vizuálne: `/o-platforme` emoji-badges čitateľné (biely text na navy), nauczyciel signup inputs majú ostré rohy, language switcher bez press-animation.

**PR-B commit zoznam:**
1. `refactor(ui): replace border-[var(--ink)] with var(--line) per brand §7`
2. `refactor(ui): remove dashed borders (brand §2 forbidden pattern)`
3. `fix(ui): nauczyciel/signup uses .input primitive (spec §3)`
4. `fix(ui): language-switcher uses .btn-secondary, drops brutalism translate`

---

### PR-C — Brutalism residue + `--accent-2` kill + gradient strip (F-004, F-005, F-006, F-009, F-015, F-020)

**Cieľ:** odstrániť všetky `AGENTS.md` checklist violations.

**F-004 watt-deficit-panel** — `components/watt-deficit-panel.tsx:158`:
```tsx
// PRED
className="sticky top-[144px] sm:top-16 z-[30] border-b-[3px] border-[var(--ink)] bg-amber-500/20 backdrop-blur"
style={{ borderColor: "var(--danger)" }}

// PO
className="sticky top-[144px] sm:top-16 z-[30] border-b border-[var(--danger)] bg-[var(--surface-2)]"
// (odstráň inline style — borderColor už v className)
```
Text v panel: `text-xs opacity-80` → `text-xs text-[var(--ink-muted)]`. F-020 solved tým.

**F-005 + F-006 `--accent-2` kill + gradients:**

`components/dashboard.tsx:117-122` — replace gradient def s solid stroke:
```tsx
// PRED
<circle ... stroke="url(#ring)" ... />
<defs>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stopColor="var(--accent)" />
    <stop offset="100%" stopColor="var(--accent-2)" />
  </linearGradient>
</defs>

// PO
<circle ... stroke="var(--accent)" ... />
// (zmaž celý <defs> blok)
```

Codemod pre progress bars v games:
```bash
# `from-[var(--accent)] to-[var(--accent-2)]` → solid navy
rg -l "from-\[var\(--accent\)\] to-\[var\(--accent-2\)\]" components | xargs sed -i '' \
  -e 's|bg-gradient-to-r from-\[var(--accent)\] to-\[var(--accent-2)\]|bg-[var(--accent)]|g'

# 3-stop gradients v stock-tap, power-flip, energy-dash
# Manual (nemaju bezpeny sed pattern):
#  components/games/stock-tap-client.tsx:239
#  components/games/power-flip-client.tsx:173
#  components/games/energy-dash-client.tsx:255
# Všetky: `bg-gradient-to-r from-emerald-400 via-[var(--accent)] to-[var(--accent-2)]`
#     →   `bg-[var(--accent)]`

# dashboard game-emoji chip (L235)
#  components/dashboard.tsx:235 — `bg-gradient-to-br ${game.accent}` — nahraď `bg-[var(--surface-2)]`
#  Pozor: game.accent môže byť tailwind gradient class z lib/games → skontroluj a uprav lib/games ak treba.

# budget-balance L162 — dynamický gradient z colors array → solid color
#  components/games/budget-balance-client.tsx:162 — review array a nahraď jedným var(--accent) alebo var(--success) per bucket.

# city-preview repeating-gradient (L30, L54)
# Nahraď striped overlay za `bg-[var(--surface-2)]` s subtle border pattern.
```

**F-009 PodiumCard ring-4:** `app/leaderboard/page.tsx:189`:
```tsx
// PRED
${isMe ? "ring-4 ring-[var(--danger)] ring-offset-4 ring-offset-[var(--background)]" : ""}

// PO
${isMe ? "border-l-[4px] border-[var(--accent)]" : ""}
```
(Plus pozri F-008 rankBadge tone prepis — `text-amber-300` etc. už spraví PR-A.)

**F-015 onboarding-tour backdrop-blur:** `components/onboarding-tour.tsx:171`:
```tsx
// PRED
className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ..."

// PO
className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4 ..."
```

**F-018 podium silver + sin-slavy zinc-300:**
- `app/leaderboard/page.tsx:84` `bg="bg-zinc-300"` → `bg="bg-[var(--ink-subtle)]"`
- `app/sin-slavy/page.tsx:123, 238, 320` `bg-zinc-300` → `bg-[var(--ink-subtle)]`

**F-026 post-game-breakdown:** `components/post-game-breakdown.tsx:133`:
```tsx
// PRED
style={{ background: "var(--danger)", color: "#0a0a0f" }}

// PO
style={{ background: "var(--danger)", color: "var(--accent-ink)" }}
```

**F-019 dashboard leaderboard border:** `components/dashboard.tsx:172` — `border-[var(--border)]/60` → `border-[var(--line)]`.

**F-022 leaderboard thead bg:** `app/leaderboard/page.tsx:114` — `bg-[var(--surface-2)]/60 text-xs text-zinc-400` → `bg-[var(--surface-2)] text-xs text-[var(--ink-muted)] font-semibold`.

**F-013 games page zinc-700 dot:** `app/games/page.tsx:109` — `bg-zinc-700` → `bg-[var(--ink-subtle)]`. Plus remove `border border-[var(--ink)]` (PR-B už spravilo cez codemod).

**F-014 city-preview:** `components/city-preview.tsx:30, 51, 54`:
- L30, 54 `repeating-linear-gradient(...)` — vyhodiť kompletne, použiť `bg-[var(--surface-2)]`.
- L51 `rounded-lg border border-[var(--ink)] bg-zinc-700` → `rounded-md border border-[var(--line)] bg-[var(--ink-subtle)]`.

**F-012 brutal-tag v JSX:**
- `app/games/page.tsx:61-66, 67-72` — replace `brutal-tag` s `chip`:
```tsx
<span className="chip" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
  {cityBadge}
</span>
```
(inline style drží akcent fill — `.chip` defaultne má `--surface-2` bg. Ak chceš stiahnuť aj inline style, definuj `.chip--accent` variant v `globals.css`.)

- `app/leaderboard/page.tsx:46-51` — rovnako.

**F-017 notification-bell badge:** `components/notification-bell.tsx:102` — `bg-rose-500 text-white` → `bg-[var(--danger)] text-white`. (PR-A už hádam zmenilo ak si použil codemod; ručné overenie.)

**Acceptance:**
- [ ] `rg "border-\[[2-9]|border-[2-9]"` = 0 výskytov (mimo core skin).
- [ ] `rg "shadow-\[[0-9]+px_[0-9]+px_0_0"` = 0 výskytov (mimo core).
- [ ] `rg "backdrop-blur|backdrop-filter"` = 0 výskytov.
- [ ] `rg "bg-gradient|linear-gradient|radial-gradient"` = 0 výskytov (mimo city-scene.tsx ak E4 ešte nezačal a mimo core gate).
- [ ] `rg "var\(--accent-2\)"` = 0 výskytov v pko-default (allowed iba ak je definované pod `[data-skin="core"]`).
- [ ] `rg "brutal-tag"` v `app/` a `components/` JSX = 0 (CSS class zostáva v `globals.css` pod core gate).
- [ ] `rg "#0a0a0f"` v inline styles mimo `[data-skin="core"]` = 0. V game `components/city-scene.tsx` zostáva (E4 backlog).
- [ ] Vizuálne: deficit banner je červený stripe nad `surface-2`, nie amber-blur. XP ring je solid navy. Modal backdrop je plný rgba, nie blur. Onboarding tour čitateľný. Podium ring je ľavý 4px akcent, nie červené štvor-border.

**PR-C commit zoznam:**
1. `fix(brand): watt-deficit-panel uses 1px danger border on surface-2 (no blur, no amber)`
2. `fix(brand): drop --accent-2 references; XP ring + progress bars use solid var(--accent)`
3. `fix(brand): remove all bg-gradient utilities (brand §2 forbidden)`
4. `fix(brand): PodiumCard me-indicator uses left stripe instead of ring-4`
5. `fix(brand): onboarding-tour backdrop without blur (spec §15)`
6. `fix(brand): replace brutal-tag JSX occurrences with .chip primitive`

---

## 5. Postup práce

1. **Vytvor 3 branches** z `main`:
   - `fix/pko-contrast-sweep`  (PR-A)
   - `fix/pko-border-sweep`    (PR-B)
   - `fix/pko-brutalism-kill`  (PR-C)

2. Choď cez **PR-A** celý, open PR, počkaj na review + CI.

3. Keď PR-A je merged do `main`, rebase PR-B na `main` (niektoré súbory pr-a-chytil zinc + border na rovnakých riadkoch) a dokonči PR-B.

4. Keď PR-B merged, rebase PR-C a dokonči.

Dôvod sekvencie: PR-A má najväčší plošný diff (100+ súborov) — chceme to mať v main skoro, aby PR-B/C neriešili neprimerané merge conflicts.

Alternatíva (ak máš istotu že codemods sa neprekrývajú): pracuj paralelne, ale ak dôjde ku konfliktu, PR-A vyhráva (má content-hash tests).

---

## 6. Per-commit checklist (prilep do commit-msg template)

Pred každým `git commit`:

- [ ] `pnpm lint` pass
- [ ] `pnpm typecheck` pass
- [ ] Ak menený CSS/primitives → `pnpm test` pass
- [ ] Ak menená stránka/komponent → lokálne otvorené na http://localhost:3000, overené desktop 1440 + mobile 390 (Chrome DevTools responsive)
- [ ] Spätne overiť `01-BRAND-MANUAL.md` §14 checklist (žiadne hex outside palette, žiadne border≥2, žiadne uppercase, žiadne font-weight 800/900 mimo `[data-skin="core"]`)

---

## 7. Ako reportovať späť

Keď skončíš PR-A/B/C:

- Vlož PR URL do PR description ako „Fixes F-001, F-002, ...".
- Do PR body prilož pred/po screenshot (min 1 route per PR).
- Označ `@decision-needed` findings (F-028, F-029, F-030, F-038, F-039) ako **unchanged** v PR description — nech reviewer vie že to nie je prehliadnuté.
- Ak narazíš na nový finding mimo backlog, **napíš do `_ux-findings.md` ako F-048+** (append-only), ale **neopravuj ho v tomto PR** — patrí do ďalšieho cyklu.

---

## 8. Ak sa niekde zasekneš

- Konflikt spec vs. reality: `01-BRAND-MANUAL.md` vyhráva (per brief §8).
- Ak codemod zmení niečo čo nechceš (napr. test snapshot strings) — revert ten jeden súbor manuálne, neshrink codemode scope.
- `--accent-2` v `[data-skin="core"]`: nechaj tam. Modifikuješ iba pko-default use.
- City-scene (`components/city-scene.tsx`): **neriešiť** v týchto 3 PR. Je to samostatný epic E4 v `docs/pko-redesign/04-BACKLOG.md`. Iba skontroluj že CSS filter stopgap stále funguje pod pko.

---

## 9. Čo je mimo týchto PR

Zaznamenané v reporte ale **nerieš** (backlog / separátne):

- F-020 expense side of F-004 (po PR-C sa to vyrieši automaticky)
- F-021 XP ring thickness (POLISH)
- F-023 finance-quiz rose-900 fine-tune (PR-A už čiastočne)
- F-024 landing 3-CTA (spec-conform, iba poznámka)
- F-025 hero chip row (POLISH)
- F-027 landing H1 split (POLISH)
- F-031 city-scene arcade look (E4 epic)
- F-032 coming-soon-banner full-review (follow-up audit)
- F-047 miasto expired-card opacity (MINOR — do next sprint)
- F-028, F-029, F-030 (decision-needed, nie implementation)
- F-038, F-039 (nav height + active-link — decision-needed)

---

**Keď začneš: otvor `_ux-findings.md` a čítaj F-001 až F-047 v celku. Potom sa pustí do PR-A.**

Poslední prosba: **žiadne half-finished implementácie**. Ak niektorý finding nestihneš, nechaj ho do PR-D / next cycle. Lepšie 3 kompletné PR než 4 rozrobené.
