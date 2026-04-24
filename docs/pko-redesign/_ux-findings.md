# PKO Redesign — UX Findings (Round 2)

**Reviewer:** UX / vizuálny audit (static-code + dev-server probe)
**Date:** 2026-04-24
**Scope:** `SKIN=pko` default (svetlý, navy + orange). Priority routes 1–12 per brief §5.
**Method:** grep anti-patterns per `01-BRAND-MANUAL.md` §14 + `02-DESIGN-TOKENS.md` palette lock + `03-COMPONENTS.md` spec + dev server page reads (http://localhost:3000). Screenshots nie sú produkované — Playwright screenshot tool nie je v toolkite; nahrádzam presnou `file:line` referenciou + viewport popisom. Ak dev-pipeline neskôr pridá headless screenshoty, vložiť do `_findings-screenshots/F-xxx.png`.

---

## Súhrn

| Severity   | Počet |
|---|---|
| CRITICAL   | 8 |
| MAJOR      | 28 |
| MINOR      | 6 |
| POLISH     | 2 |
| OUT-OF-SCOPE / @decision-needed | 3 |
| **Spolu**  | **47** |

### Top-3 red-flag témy

1. **Dark-skin farebné residue všade.** `text-zinc-300/400` (60+ výskytov), `text-amber-300/400`, `text-rose-*` / `bg-rose-*`, `text-emerald-*` / `bg-emerald-*` ako semantic success/danger, inline `#0a0a0f` hex. Všetky tieto boli navrhnuté pre dark bg `#0a0a0f`. Na `#ffffff` padajú pod 3:1 contrast. Toto je *jeden* field-of-changes (find-and-replace na palette tokens), ale aktuálne má 100+ výskytov v codebase — rozložených naprieč dashboard / games / static pages. **Toto je sweeping blocker pred PR merge.**

2. **`border-[var(--ink)]` (= čierna 1px) je default namiesto `var(--line)` (svetlá šedá).** 40+ výskytov — karty, avatary, achievement cards, inputs, dropdown, toast, o-platforme, dla-szkol, sin-slavy, miasto, profile, friends, notification-bell, language-switcher. Brand manual §7 je jednoznačný: „Default line: `1px solid #e5e5e5`." Čierne 1px borders na white vyzerajú ako brutalism, iba subtler. Toto je druhá veľká sweeping zmena.

3. **`--accent-2` undefined v pko + gradienty ubiquitous** — XP progress ring a 8+ progress barov cez game clients používajú `from-[var(--accent)] to-[var(--accent-2)]`. Okrem toho brand manuál explicitne zakazuje všetky gradienty. Obe veci naraz. Quick-kill: solid `bg-[var(--accent)]`.

### Poradie opravy (návrh)

**Sprint-1 (blocker / merge gate) — 3 focused PRs:**

- **PR-A: Contrast-sweep** → F-001, F-002, F-010 (zinc-300/400 → ink-muted; emerald/rose → success/danger with `color-mix` backdrops; axe-core must come back clean)
- **PR-B: Border-sweep** → F-033, F-041, F-044, F-046 (`border-[var(--ink)]` → `border-[var(--line)]` globálne + upgrade inputov na `.input` kde sa kreslia rúčne)
- **PR-C: Brutalism residue + `--accent-2` kill** → F-004, F-005, F-006, F-015, F-009 (watt-deficit-panel rewrite, ring-4 → 1-px indicator, remove all `bg-gradient-*`, drop `backdrop-blur` z onboarding-tour)

**Sprint-2 (pre-prod):** F-003, F-007, F-008, F-011, F-013, F-016, F-017, F-019, F-022, F-026, F-027, F-035, F-036, F-037, F-042, F-045, F-047.

**Backlog / E4:** F-018, F-020, F-021, F-023, F-024, F-031 (city-scene full 8-bucket refactor).

**@decision-needed (product/design owner):** F-028 (mega-menu), F-029 (4-layer footer), F-030 (mobile drawer), F-038 (nav height 64 vs spec 72/56), F-039 (active-link underline missing).

---

## Legenda severity

- **CRITICAL** — kontrast < 3 : 1, stránka nepoužiteľná na mobile, explicitný porušenie AGENTS.md checklistu
- **MAJOR** — kontrast < 4.5 : 1 body, forbidden brand pattern (gradient/blur/amber), `--accent-2` undefined leak
- **MINOR** — inkonzistentnosť, drobný mismatch voči spec
- **POLISH** — nice-to-have nad rámec spec

---

## F-001 — CRITICAL — `text-zinc-400` metadata text nečitateľný na bielej

**Kde:** globálne. Viditeľné najmä na `/` (logged-in dashboard), `/login`, `/register`, `/games`, `/leaderboard`, `/profile`, `/profile/[username]`, `/friends/[username]`, `/games/*`, `/consent/[token]`. Desktop 1440 + mobile 390.

**Ako reprodukovať:**
1. http://localhost:3000/login — pozri pod H1 „Zaloguj się" riadok `{t.loginBody}` (napr. „Wróć do gry").
2. Po prihlásení http://localhost:3000/ — hore „Witaj z powrotem", pod XP ringom „XP" + `{progressPct}%`, „Top silesia" empty text.

**Čo vidím:** text je sivý zinc-400 `#a1a1aa`, body copy je 14 px, na bielom pozadí vyzerá ako placeholder. Na 1440 sa čita na max. 60 cm odstup; na 390 pod slnkom nepoužiteľné.

**Čo očakávam:** per `01-BRAND-MANUAL.md` §5 + §12, muted text = `#636363` (`var(--ink-muted)`), contrast 5.7:1 ✅.

**Kontrast nameraný (WCAG):** `#a1a1aa` na `#ffffff` ≈ **2.83:1** — fails 4.5 pre body, fails 3.0 pre large.

**Root-cause guess:** E2 refactor sweep nezachytil `text-zinc-*` variants mimo game-client paths. Výskyty:
- `app/login/page.tsx:18, 21`
- `app/register/page.tsx:18, 21`
- `app/consent/[token]/page.tsx:22`
- `app/games/page.tsx:74, 97 (text-zinc-300), 115`
- `app/profile/[username]/page.tsx:64, 90`
- `app/profile/page.tsx:111`
- `app/friends/[username]/page.tsx:39, 127`
- `components/dashboard.tsx:86, 125, 129, 166, 215, 241, 246, 281, 312`
- `components/watt-city/watt-city-client.tsx:298, 521, 607, 680, 782`
- `components/games/ai-quiz-client.tsx:85`, plus 10+ ďalších game clientov
- `app/nauczyciel/page.tsx:33, 39 (text-zinc-300)`
- `app/dla-szkol/page.tsx:263, 313, 386, 412 (všetky text-zinc-300)`

**Navrhovaný fix:** find-and-replace `text-zinc-400` → `text-[var(--ink-muted)]`, `text-zinc-300` → `text-[var(--ink-muted)]`. Nepoužívať len jeden replace (zinc-300 je ešte nečitateľnejšie — F-002). Po oprave znova pustiť axe-core (`pnpm test:a11y`).

---

## F-002 — CRITICAL — `text-zinc-300` ako body-paragraph (prakticky neviditeľné)

**Kde:** `/dla-szkol`, `/nauczyciel`, `/games` aside card, niekoľko game-clientov, `components/games/ai-*-client.tsx` explanation odseky.

**Čo vidím:** po AI-quiz odpovedi sa zobrazí vysvetlenie odpovede bledo-šedým textom, prakticky pozadie. `/dla-szkol` intro odsek na landing má `text-lg text-zinc-300` — úplne mimo čitateľnosti.

**Kontrast:** `#d4d4d8` na `#ffffff` ≈ **1.59:1** — HARD FAIL pre AA aj AAA. Educational content je KĽÚČOVÉ pre /dla-szkol message, toto je content-destroying bug.

**Root-cause:** rovnaký sweep miss ako F-001.

**Výskyty (core):**
- `app/dla-szkol/page.tsx:263` (hero intro odsek), `:313` (karta popis), `:386`, `:412`
- `app/nauczyciel/page.tsx:39`
- `app/games/page.tsx:97`
- `components/dashboard.tsx` (nepriamo cez classes)
- `components/games/ai-quiz-client.tsx:145` (explanation)
- `components/games/ai-chartread-client.tsx:176`
- `components/games/ai-truefalse-client.tsx:145`
- `components/games/ai-whatif-client.tsx:125`
- `components/games/finance-quiz-client.tsx:145`

**Navrhovaný fix:** `text-zinc-300` → `text-[var(--foreground)]` pre hero/intro odseky (default body), alebo `text-[var(--ink-muted)]` pre metadata. **Vysvetlenia odpovedí v kvízoch** = default body black (`foreground`), aby to mal pedagogický sense.

---

## F-003 — CRITICAL — Hex leak `#0a0a0f` v inline-style mimo `core` skin gate

**Kde:** default pko skin, viditeľné na `/games`, `/leaderboard`, `/o-platforme`, po-game breakdown modal, v game round-result screene.

**Ako reprodukovať:**
1. `/games` desktop — vedľa H1 „Gry Watt City" vidíš dve labely s `background: var(--accent); color: #0a0a0f`. Na pko `--accent` = navy `#003574`, text `#0a0a0f` ≈ black = navy bg + black text = **nečitateľný tag**.

**Kontrast:** `#0a0a0f` na `#003574` ≈ **1.9:1** — fails.

**Spec:** tagy na navy background majú byť biele (per spec §4 chip + `03-COMPONENTS.md` §4 „chip:hover color accent" + §20 section-heading uses sales `::before` accent, nie text=black on navy).

**Výskyty:**
- `app/games/page.tsx:62, 69` — oba `brutal-tag` inline style
- `app/leaderboard/page.tsx:48` — tag
- `app/o-platforme/page.tsx:29, 35, 41` — tri tagy
- `components/games/round-result.tsx:171, 172` — `bg-[#0a0a0f] text-[var(--accent)] border-[#0a0a0f]` (arbitrary hex v classe)
- `components/post-game-breakdown.tsx:133` — CTA color `#0a0a0f` na danger bg

**Navrhovaný fix:**
- `color: "#0a0a0f"` na `--accent` bg → `color: "var(--accent-ink)"` (= #fff v pko, #0a0a0f v core — funguje obidva skíny).
- Round-result `bg-[#0a0a0f]` → `bg-[var(--foreground)]` alebo refactor preč z arbitrary hex.

Navyše týmto opravou zmizne `.brutal-tag` z JSX (viď F-014).

---

## F-004 — CRITICAL — `watt-deficit-panel` porušuje 3 brand pravidlá naraz

**Kde:** akákoľvek stránka logged-in ktorá má `player.wattDeficitSince > 0`. Sticky banner pod navom (desktop 1440 aj mobile 390).

**Ako reprodukovať:** dev fallback — zaregistruj nový účet, postav budovy, nechaj `wattDeficit` narastať (alebo pre audit stačí čítať kód).

**Čo vidím (po čítaní kódu):** `components/watt-deficit-panel.tsx:158`:
```tsx
className="sticky top-[144px] sm:top-16 z-[30] border-b-[3px] border-[var(--ink)] bg-amber-500/20 backdrop-blur"
```

Porušenia:
1. `border-b-[3px]` — `AGENTS.md` hovorí „No `border-[Npx]` with N ≥ 2". HARD VIOLATION.
2. `backdrop-blur` — `01-BRAND-MANUAL.md` §2 „Čo sa NIKDY nesmie objaviť: Glassmorphism, blur, backdrop-filter". HARD VIOLATION.
3. `bg-amber-500/20` — `#f59e0b` s alpha 0.2, amber nie je v palete (`02-DESIGN-TOKENS.md` §1). Mimo 13-farebného tokenu. Navyše na bielej @ 20% ≈ `#fdead0` — text `--ink` (čierny) dáva 7:1 OK, ale *účel* bola „alert tone" — toto vyzerá ako dekorácia.
4. Inline `style={{ borderColor: "var(--danger)" }}` — konflikt s `border-[var(--ink)]` v className. Finálne poradie: CSS border-color vyhrá inline, ale číta sa ako kód-smell.

**Navrhovaný fix:** prepísať na:
```tsx
className="sticky top-[144px] sm:top-16 z-[30] border-b border-[var(--danger)] bg-[var(--surface-2)]"
```
(1 px border, `surface-2` pozadie = #f9f9f9, danger border riadok = alert-typické bez brutalism).

Alebo agresívnejšie: použiť `elev-line` + ľavý 4 px sales/danger „stripe" (ako spec §17 robí pre me-row).

---

## F-005 — CRITICAL — `var(--accent-2)` undefined v pko skine, ale referenced by gradient ring + progress bars

**Kde:** XP progress ring `/` logged-in (dashboard), a progress bary v minimálne 6 game clientoch.

**Ako reprodukovať:** `/` (logged-in) → XP ring má definovať `<linearGradient id="ring">` s 2 stops — `var(--accent)` + `var(--accent-2)`. V pko skin `--accent-2` nie je definované (`02-DESIGN-TOKENS.md` §1 neobsahuje). CSS fallback: `currentColor` alebo `unset` → browser prekreslí zvlášť podľa renderer-a. V Chromium `linearGradient stop` s prázdnym stopColor môže spadnúť na čiernu.

**Výskyty:**
- `components/dashboard.tsx:120` — `<stop offset="100%" stopColor="var(--accent-2)" />`
- `components/games/finance-quiz-client.tsx:95` — `bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]`
- `components/games/stock-tap-client.tsx:239`
- `components/games/power-flip-client.tsx:173`
- `components/games/energy-dash-client.tsx:255`
- `components/games/word-scramble-client.tsx:148`
- `components/games/math-sprint-client.tsx:181`
- `components/games/currency-rush-client.tsx:198`

**Navrhovaný fix:**
- Buď pridať `--accent-2` do `app/globals.css :root[data-skin="pko"]` ako `var(--sales)` alebo druhý navy shade — ale to je feature creep.
- **Preferovaný fix per F-006:** gradient preč vôbec (brand manual zakazuje gradienty). Nahraď `bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]` → `bg-[var(--accent)]`. XP ring: zmaž `<defs><linearGradient>…</linearGradient></defs>` a použí `stroke="var(--accent)"`.

---

## F-006 — MAJOR — Gradienty v 9+ komponentoch (brand forbid)

**Kde:** všetky game clienty s progress barmi + dashboard cards + city-preview.

**Brand rule:** `01-BRAND-MANUAL.md` §2: „Čo sa NIKDY nesmie objaviť: Gradienty (lineárne, radiálne, mesh — žiadne)".

**Výskyty:**
- `components/games/finance-quiz-client.tsx:95`
- `components/games/stock-tap-client.tsx:239` — `from-emerald-400 via-[var(--accent)] to-[var(--accent-2)]` (3-stop gradient + emerald)
- `components/games/power-flip-client.tsx:173` — same 3-stop
- `components/games/energy-dash-client.tsx:255` — same; `:277` „bg-gradient-to-br from-emerald-400/30 to-emerald-600/20"
- `components/games/word-scramble-client.tsx:148`
- `components/games/math-sprint-client.tsx:181`
- `components/games/currency-rush-client.tsx:198`
- `components/games/budget-balance-client.tsx:113, 162`
- `components/games/memory-match-client.tsx:241` — `repeating-linear-gradient` pozadie
- `components/dashboard.tsx:235` — `bg-gradient-to-br ${game.accent}` pre game-emoji chip (accent string z GAME def)
- `components/city-preview.tsx:30, 54` — `repeating-linear-gradient` ako texture fill
- `app/dla-szkol/page.tsx:360` — `background: linear-gradient(135deg, var(--accent), var(--accent))` (same color both stops — equivalent to solid, ale napísané ako gradient)

**Navrhovaný fix:**
- Progress bary: solid `bg-[var(--accent)]` (navy fill).
- Dashboard game-emoji chip: solid `bg-[var(--surface-2)]` + emoji 32 px.
- City-preview repeating-gradient texture: zameniť za single-tone SVG pattern alebo iba `bg-[var(--surface-2)]`.
- `app/dla-szkol` no-op gradient: replace by `background: var(--accent)` (tautológia).

---

## F-007 — MAJOR — Dashboard H1 nie navy, nie `t-h1` spec

**Kde:** logged-in `/` — dashboard welcome card.

**Kód:** `components/dashboard.tsx:89`:
```tsx
<h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
  {username}
</h1>
```

**Spec konflikt:**
- `01-BRAND-MANUAL.md` §5: „Nadpisy **vždy** `#003574` (navy), nie čierna."
- `02-DESIGN-TOKENS.md` §5: `t-h1` = 40/48 px 700. H1 sa volá cez utility classes `.t-h1`, nie cez tailwind `text-3xl` (30px) / `sm:text-4xl` (36px).

**Reálny vzhľad:** čierny bold username, bez navy, na white card. Bez visual hierarchy voči všetkému ostatnému čo je navy.

**Výskyt podobnej chyby:**
- `app/login/page.tsx:17` — `<h1 className="text-2xl font-bold">` (no navy, no `t-h*`)
- `app/register/page.tsx:17` — same

**Navrhovaný fix:**
```tsx
<h1 className="t-h1 text-[var(--accent)]">
  {username}
</h1>
```
Login/register: `t-h3 text-[var(--accent)]` (na 480px karte je `t-h1` príliš).

---

## F-008 — MAJOR — Leaderboard 1st/2nd/3rd rank badge tone je unreadable

**Kde:** `/leaderboard` tabuľka, v riadkoch top-3 mimo podium.

**Kód:** `app/leaderboard/page.tsx:15-20`:
```ts
function rankBadge(rank: number): { icon: string; tone: string } | null {
  if (rank === 1) return { icon: "🥇", tone: "text-amber-300" };
  if (rank === 2) return { icon: "🥈", tone: "text-zinc-200" };
  if (rank === 3) return { icon: "🥉", tone: "text-amber-700" };
  ...
}
```

**Kontrast na white:**
- `text-amber-300` `#fcd34d` → ratio **1.7:1** ❌
- `text-zinc-200` `#e4e4e7` → ratio **1.3:1** ❌ — prakticky neviditeľné
- `text-amber-700` `#b45309` → ratio 5.2:1 ✅ (OK)

**Navyše:** ikony sú emoji (🥇🥈🥉), ktoré samy nesú farbu — `text-amber-300` na emoji je redundantný (emoji fotograficky prekreslí text color via underline/shadow only). To znamená: CSS tone robí zbytočný UX šum.

**Navrhovaný fix:** zrušiť `tone` field alebo nastaviť iba `opacity-80` pre rank > 3. Ak chceme visual highlight top-3, pridajme `t-overline text-[var(--accent)]` k badge label, nie farebný emoji.

---

## F-009 — MAJOR — PodiumCard `ring-4 ring-offset-4` (quad-border for me)

**Kde:** `/leaderboard` — pokiaľ si ja medzi top-3, moja podium tile má 4 px ring + 4 px offset.

**Kód:** `app/leaderboard/page.tsx:189`:
```tsx
${isMe ? "ring-4 ring-[var(--danger)] ring-offset-4 ring-offset-[var(--background)]" : ""}
```

**Porušenie:** `ring-4` = 4px ring, `AGENTS.md` checklist „No `border-[Npx]` with N ≥ 2, no native `border-2..9`" — ring nie je striktne border, ale spec intent (§7 borders: „Maximum 1 px") je jednoznačný. Tiež `ring-[var(--danger)]` = červená — semantic mismatch (me-indikátor, nie error).

**Navrhovaný fix:**
```tsx
${isMe ? "border-l-[4px] border-[var(--accent)]" : ""}
```
alebo:
```tsx
${isMe ? "elev-line" : ""}  /* 1px outline in accent */
```
a navy, nie red. „ty" indikátor pod menom už zobrazuje danger-colored text — jeden farebný markér stačí.

---

## F-010 — MAJOR — Emerald/rose semantic colors namiesto `var(--success)` / `var(--danger)`

**Kde:** všetky game clienty (correct/wrong odpovede), stock-tap delta, budget-balance indikátor, parent-client error.

**Spec konflikt:** `02-DESIGN-TOKENS.md` §12 rýchla referencia: „Success badge → `color: var(--success)`; Error state → `color: var(--danger)`". Success = #2e7d49, danger = #c0342b. Emerald/rose je dark-skin residue.

**Kontrast rose na white:**
- `text-rose-300` `#fda4af` → 1.9:1 ❌
- `text-rose-200` `#fecdd3` → 1.4:1 ❌
- `text-rose-400` `#fb7185` → 2.6:1 ❌
- `var(--danger)` `#c0342b` → 5.0:1 ✅

**Kontrast emerald na white:**
- `text-emerald-300` `#6ee7b7` → 1.7:1 ❌
- `text-emerald-400` `#34d399` → 2.1:1 ❌
- `var(--success)` `#2e7d49` → 5.1:1 ✅

**Výskyty:**
- `components/games/ai-quiz-client.tsx:107, 109, 130, 131`
- `components/games/ai-truefalse-client.tsx:106, 108, 110, 122, 124, 126, 138, 139`
- `components/games/ai-matchpairs-client.tsx:151, 153, 179, 181`
- `components/games/ai-chartread-client.tsx:148, 150, 169, 170`
- `components/games/ai-whatif-client.tsx:97, 99, 118, 119`
- `components/games/ai-memory-client.tsx:127`
- `components/games/ai-fillblank-client.tsx:117`
- `components/games/ai-price-guess-client.tsx:163, 164`
- `components/games/ai-budget-client.tsx:83, 108, 110`
- `components/games/stock-tap-client.tsx:216, 232, 316, 328`
- `components/games/power-flip-client.tsx:224, 226`
- `components/games/memory-match-client.tsx:230`
- `components/games/budget-balance-client.tsx:113, 144, 145, 162, 184, 201`
- `components/games/word-scramble-client.tsx:170, 172`
- `components/games/energy-dash-client.tsx:210, 277, 278`
- `components/games/fx.tsx:36, 64`
- `components/games/finance-quiz-client.tsx:109, 111, 138, 139`
- `components/games/currency-rush-client.tsx:210`
- `components/parent-client.tsx:101` — `text-rose-400` error row
- `components/notification-bell.tsx:102` — `bg-rose-500` badge

**Navrhovaný fix:** codemod `text-emerald-\d+` → `text-[var(--success)]`, `text-rose-\d+` → `text-[var(--danger)]`, `bg-emerald-\d+/?\d*` → `bg-[color-mix(in_oklab,var(--success)_NN%,transparent)]` alebo `bg-[var(--surface-2)]` + border. Opacity variants (e.g. `bg-emerald-500/15`) nahradiť za nie-transparentné `bg-[var(--surface-2)]` + coloured border.

Ak je to veľa zmien, batch-fix zvlášť po game clientoch v 2 PR-ch; primárne texty v `fx.tsx` / progress/result are highest traffic.

---

## F-011 — MAJOR — `ai-chartread-client.tsx` SVG chart dark-mode colors

**Kde:** `/games/ai/chartread-*` ai-game. Na white-card SVG chart reálne vyzerá rozsypaný.

**Kód: `components/games/ai-chartread-client.tsx:36-79`**:
```tsx
<line ... stroke="#475569" strokeWidth={2} />  /* osi */
<text ... fontSize={14} fontWeight={700} fill="#e2e8f0">...</text>  /* titul */
<text ... fontSize={10} fill="#94a3b8">...</text>  /* axis labels */
<path d={path} fill="none" stroke="#fde047" strokeWidth={3} />  /* data line — žltá */
<circle ... fill="#22d3ee" stroke="#0f172a" />  /* datapoints — cyan */
<circle ... r={3} fill="#fde047" />  /* secondary — yellow */
<text ... fill="#94a3b8">...</text>  /* datapoint labels */
```

**Kontrast na white bg:**
- `#e2e8f0` (title) → 1.3:1 ❌ **úplne neviditeľný titul grafu**
- `#94a3b8` (axis/data labels) → 2.8:1 ❌
- `#fde047` (data line — yellow) → 1.7:1 ❌ — hlavný dátový tok nie je čitateľný
- `#22d3ee` (datapoints — cyan) → 1.8:1 ❌
- `#475569` (axes) → 6.9:1 ✅ (axis OK, ale vyzerá osamotene keď všetko ostatné chýba)

**Spec:** SVG chart by mal používať navy `#003574` pre primary dataset, `#636363` pre labels, `#e5e5e5` pre gridlines. Sales orange iba pre `#promocja`/highlight.

**Navrhovaný fix:** nahradiť hex na:
- osi: `stroke="var(--line)"` (e5e5e5)
- titul: `fill="var(--accent)"` (#003574)
- axis labels: `fill="var(--ink-muted)"` (#636363)
- data line: `stroke="var(--accent)"` (#003574)
- datapoints: `fill="var(--sales)"` (#db912c) + stroke `var(--accent)` (kontrastné 2-tone)

Najvyššie srd pri chartread lebo je to educational content core.

---

## F-012 — MAJOR — `.brutal-tag` stále renderovaný v JSX pod pko skinom

**Kde:** `/games`, `/leaderboard` header tags; iné?

**Spec:** `03-COMPONENTS.md` §4:
> `.brutal-tag` — **zmazať** použitie z JSX, nahradiť `.chip` alebo `.t-overline span`. Trieda zostane v CSS pod `[data-skin="core"]`.

**Čo vidím:** tri miesta používajú `brutal-tag` ako className aj pod pko default:
- `app/games/page.tsx:61, 68`
- `app/leaderboard/page.tsx:47`
- Možno iné — rýchla grep treba.

V globals.css `:where([data-skin="core"]) .brutal-tag { border: 2px solid var(--ink); ... font-weight: 800 }` — pod pko default toto CSS neplatí, čiže `brutal-tag` v JSX rendere ako neštýlovaný `<span>` s inline `background` + `color: #0a0a0f` (viď F-003). Výsledok: žltý/navy label bez borderu, bez uppercase — ale ruka-myšou pridaný inline-hex.

**Navrhovaný fix:** replace `brutal-tag` → `chip` v JSX. CSS ostane pre legacy core.

---

## F-013 — MAJOR — `/games` progress dot `bg-zinc-700` na white

**Kde:** `/games` aside „Buildings map".

**Kód:** `app/games/page.tsx:108-111`:
```tsx
<span className={`inline-block w-2 h-2 rounded-full border border-[var(--ink)] ${
  g.plays > 0 ? "bg-[var(--sales)]" : "bg-zinc-700"
}`} />
```

**Čo vidím:** hrané hry = orange dot, nehrané = tmavošedý `#3f3f46` dot. Semantic OK, ale color zinc je outside palette; môže byť `bg-[var(--ink-subtle)]` (#b7b7b7) = neutrálnejší.

**Navrhovaný fix:** `bg-zinc-700` → `bg-[var(--ink-subtle)]`. Preferenčne bez hard border `border-[var(--ink)]` — 1 px line-color border stačí.

---

## F-014 — MAJOR — city-preview.tsx používa forbidden patterns

**Kde:** component je use-case na hero cards / comparison screen? Overiť kde sa volá.

**Kód `components/city-preview.tsx:30, 51, 54`:**
```tsx
"repeating-linear-gradient(135deg, rgba(0,0,0,0.2) 0 5px, transparent 5px 10px)"
"repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0 6px, transparent 6px 12px)"
className="mt-3 h-5 rounded-lg border border-[var(--ink)] bg-zinc-700"
```

**Porušenia:**
- `repeating-linear-gradient` — brand § „Bodkované / čiarkované pozadia (repeating patterns)" explicit NO.
- `bg-zinc-700` — outside palette.
- `border border-[var(--ink)]` + `rounded-lg` — kombinácia ostrá čiara + 10px radius je OK, ale `--ink` je čierna. Má byť `var(--line)`.

**Navrhovaný fix:** gradient preč, replace za plain `bg-[var(--surface-2)]` + 1px inset border. Zinc-700 → `bg-[var(--line)]`.

---

## F-015 — MAJOR — `onboarding-tour.tsx` backdrop-blur-sm na modal backdrope

**Kde:** prvý-login onboarding modal (celá aplikácia), teacher onboarding tour.

**Kód:** `components/onboarding-tour.tsx:171`:
```tsx
className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 motion-safe:animate-[fade-in_200ms_ease-out]"
```

**Spec:** `03-COMPONENTS.md` §15: „Backdrop: `background: rgba(0,0,0,0.5)`, fade-in 200 ms." Žiadny blur.

**Brand:** §2 forbids backdrop-filter výslovne.

**Navrhovaný fix:** odstrániť `backdrop-blur-sm`, ponechať `bg-black/60` (alebo presne `bg-[rgba(0,0,0,0.5)]` podľa spec).

---

## F-016 — MAJOR — `text-amber-400` na /pko + /consent

**Kde:** `app/pko/page.tsx:99`, `app/consent/[token]/page.tsx:28`.

**Kontrast:** `#fbbf24` (amber-400) na white → **1.9:1** ❌.

Spec navy/orange paleta nemá amber. Má byť `var(--sales)` (= #db912c = orange-500) = **3.1:1** ok pre large text (≥ 18 px bold) per §12. Ak je tento text body-size, lepšie `var(--ink-muted)`.

**Navrhovaný fix:** `text-amber-400` → `text-[var(--sales)]` iba ak text je ≥ 18 px bold, inak `text-[var(--ink-muted)]`.

---

## F-017 — MAJOR — `notification-bell` badge `bg-rose-500 text-white`

**Kde:** site nav notification bell, desktop + mobile.

**Kód:** `components/notification-bell.tsx:102`:
```tsx
<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center bg-rose-500 text-white rounded-full">
```

**Porušenie:**
- `bg-rose-500` outside palette. Má byť `bg-[var(--danger)]`.
- `font-bold` (weight 700) v 10 px — brand manual §5 max 700 OK pre micro, ale `t-micro` je 400. 10 px bold je trochu aggressive.

**Navrhovaný fix:** `bg-rose-500` → `bg-[var(--danger)]`. Font weight 600 ak má byť legible.

---

## F-018 — MAJOR — `sin-slavy/page.tsx` + podium use `bg-zinc-300`

**Kde:** Hall of fame (`/sin-slavy`) — `bg-zinc-300` ako podium fill pri lines 123, 238, 320. Tiež leaderboard silver podium `bg-zinc-300` line 84.

**Palette:** zinc-300 = `#d4d4d8` — outside palette. Bol by OK ak by sa použil ako `var(--surface-2)` (#f9f9f9), ale zinc-300 je trochu sýtejší.

**Navrhovaný fix:** `bg-zinc-300` → `bg-[var(--surface-2)]`. Pre podium silver medailu sa to stratí oproti zlatej — lepšie dať `bg-[var(--ink-subtle)]` (#b7b7b7) alebo pridať 1px `var(--line)` border; testovať vizuálne.

---

## F-019 — MAJOR — Dashboard leaderboard border `border-[var(--border)]/60` ≈ neviditeľné

**Kde:** dashboard home, „Top silesia" card, zoznam top-5.

**Kód:** `components/dashboard.tsx:172`:
```tsx
className={`flex items-center justify-between py-2 border-b border-[var(--border)]/60 last:border-b-0 ...`}
```

**Problém:** `--border` maps na `--line` (`#e5e5e5`). `/60` = 60% opacity na white ≈ `#efefef` — prakticky invisible divider. Spec §7 default line = plné `#e5e5e5`.

**Navrhovaný fix:** `border-[var(--border)]/60` → `border-[var(--line)]`. Odstrániť /60 opacity — 1 px #e5e5e5 je zámerne subtle, ďalšia opacity ho zabije.

---

## F-020 — MAJOR — Mobile deficit-panel na `bg-amber-500/20` je invisible

**Kde:** mobile 390, logged-in in deficit. Spojenie F-004.

**Dôsledok F-004:** po odstránení `backdrop-blur` (brand rule), zostane `bg-amber-500/20` ≈ ľahké broskyňovo-krémové pozadie na bielej. Text `font-semibold tracking-tight` je default `--foreground` (čierny) → contrast fair, ale *alert signalizácia* sa kompletne stratí. Mobile user nebude vedieť že je v kritickom stave.

**Navrhovaný fix:** banner-level: `bg-[color-mix(in_oklab,var(--danger)_12%,white)]` — teplá červenkastá; alebo `bg-[var(--surface-2)]` + left stripe 4 px `--danger`. Severity poradie: červená > žltá pre deficit alert.

---

## F-021 — MINOR — Dashboard XP ring 8px stroke na 96×96 canvas

**Kde:** `components/dashboard.tsx:96-123`. SVG viewBox 120×120, stroke 8 px, rendered at 96×96 (so logical stroke ~6.4 px). Ring + ring-bg = cca 13 px tučný kruh.

**Spec:** žiadny explicitný spec pre progress-ring thickness, ale duch PKO redesign = subtle, 1 px lines. Tučný ring s gradientom pôsobí ako dark-skin neo-brutalism.

**Navrhovaný fix:** stroke 4 px + radius vykompenzovať (52 → 56), bez gradientu (viď F-005). Alebo replace ring za horizontal progress bar pod stat grid.

---

## F-022 — MINOR — `bg-[var(--surface-2)]/60` header row leaderboard

**Kde:** `app/leaderboard/page.tsx:114`: `<thead className="bg-[var(--surface-2)]/60 text-xs text-zinc-400">`.

**Problém:** `surface-2` je `#f9f9f9`; opacity /60 = prakticky biela. thead header by mal byť kontrastný voči data rows. Plus `text-zinc-400` — fails contrast.

**Navrhovaný fix:** `bg-[var(--surface-2)]` (full opacity) + `text-[var(--ink-muted)]` + `font-semibold`.

---

## F-023 — MINOR — `finance-quiz-client.tsx` `bg-rose-900/30` + `border-rose-500/60`

**Kde:** `components/games/finance-quiz-client.tsx:111, 139`.

**Hex:** rose-900 = `#881337`, na 30% opacity na white ≈ `#dec2ca` — sivoružové pozadie. Ok vizuálne, ale spec semantic → `var(--danger)`. Component má dve svoje varianty (pred/po submission) a používa dark-mode rose všade.

**Navrhovaný fix:** rose-900/30 → `bg-[color-mix(in_oklab,var(--danger)_8%,white)]`, border-rose-500/60 → `border-[var(--danger)]`. Zároveň emerald-900/30 → success-mix. Viď F-010 bulk fix.

---

## F-024 — MINOR — Landing CTA row má 3 tlačidlá, ale orange je iba 1 (OK) — POTVRDENÉ spec

**Kde:** `/` anon, `app/page.tsx:131-141`.

**Overenie spec §10:** `PRIMARY SALES 1× na obrazovku, SECONDARY bez limitu, TEXT-LINK inline`. Máme: `btn btn-sales`, `btn btn-secondary`, `btn btn-ghost`. Vyhovuje.

**POLISH pripomienka:** `btn-ghost` je 3. v rade — pre brand tone „akcia je jediná" to číta ako 3 akcie. Zvažte či `Games` ghost nie je skôr nav link (presunúť do secondary nav alebo pod hero).

**Severity:** MINOR (spec conformant ale pôsobí tripartite).

---

## F-025 — POLISH — Hero chip row (track/event/place) vs section heading

**Kde:** `/` anon, `app/page.tsx:99-102`.

**Čo vidím:** 3 chipy rad za sebou ako nadpis-preview. Pôsobí skromne, ale `01-BRAND-MANUAL.md` §5 overline spec uses tracking 1.65px + uppercase. `.chip` class (per §4 redesign) je teraz pill s `font-weight: 500` + `padding: 4px 12px` — zjemnené. V kombinácii s `t-display` H1 pod ním sú OK.

**Poznámka:** keď bude dashboard dostávať 1-prize orange CTA (F-007), toto nepridáva noise. Nechať.

---

## F-026 — MAJOR — Post-game breakdown CTA inline #0a0a0f

**Kde:** `components/post-game-breakdown.tsx:133`:
```tsx
style={{ background: "var(--danger)", color: "#0a0a0f" }}
```

**Porušenie:** color #0a0a0f = tmavá-čierna, na danger red bg → ratio cca 3.3:1 — fails 4.5 body.

**Navrhovaný fix:** `color: "white"` alebo `"var(--accent-ink)"`. Danger s čiernym textom je zlý pattern.

---

## F-027 — POLISH — Landing H1 split: „generate watts. build house"

**Kde:** `/`, `app/page.tsx:103-107`.

**Čo vidím:** H1 has 2 span farieb — navy + foreground — miešanie zvýrazní keywords. Spec neodporuje. Alebo nie?

**Brand §5:** „Nadpisy **vždy** `#003574` (navy), nie čierna". Ale `span` v H1 je highlight token — toto je editorial license. POLISH, nie bug.

**Navrhovaný fix:** žiadny akútny, možno reconsider ak black=not-navy zraňuje predpoklad „všetky H = navy".

---

## F-028 — OUT-OF-SCOPE — Mega-menu pod „Klient indywidualny" neimplementovaný

**Brief §E:** „Mega-menu pod „Klient indywidualny" → **neimplementované**. Chce to biznis, alebo je jednoduchý nav OK?"

**Recommendation:** @decision-needed. Pre gra-produkt stačí dropdown (teacher/parent/kid), mega-menu je overkill. Ak spec je B2B-partner-drive, potom áno.

---

## F-029 — OUT-OF-SCOPE — 4-vrstvový footer neimplementovaný

**Brief §F:** layer 1 (4 pill buttons), layer 2 (kurzy tabuľka), layer 3 (5 link stĺpcov) všetky backlog `E3-04`.

**Recommendation:** @decision-needed. Pre edukačnú hru ktorá nie je banka, plný 4-vrstvový footer je kognitívne misleadning (user si myslí že si pôžičiava peniaze od PKO). Minimálny footer + disclaimer je safer UX choice.

---

## F-030 — OUT-OF-SCOPE — Mobile drawer hamburger neimplementovaný

**Brief §E:** „Mobile drawer (full-screen slide-in) — momentálne iba horizontálny scroll bar pod nav."

**Recommendation:** @decision-needed. Pre kids (<16) je hamburger familiar z mobile apps. Pre teacher/parent user-base je OK. Ak je site-nav mobile cramped > 3 roles-links, hamburger áno.

---

## F-031 — MAJOR — City-scene pôsobí arcade, nie PKO (CSS filter stopgap)

**Brief §C** otvára otázku: „Ak „stále vyzerá arcade" → potrebujeme skutočný 8-bucket refactor (tiket E4-02/03)."

**Čo vidím (po čítaní `components/city-scene.tsx` header):** 1679 riadkov SVG, hardcoded palette: `#fde047` (neon yellow), `#22d3ee`, `#0a0a0f` (čierny stroke na všetkom), `#f59e0b`, `#b45309`, `#92400e`, `#f8fafc`, `#fffbe6`, `#07071a`, `#02021a`, etc. CSS filter `saturate(.55) brightness(.95)` v pko skinu znižuje saturáciu ale **neriadi hue** — čierne stroky zostávajú čierne (brutalism look), žltá sa mení na bežovú, cyan na šedomodrú.

**Subjective:** na bielom body surface vyzerá scéna ako mierne vyblednutá neo-brutalism arcade, nie ako súčasť PKO disciplinovaného povrchu. „Disruption" z brief §J je precízny popis.

**Navrhovaný fix:** E4 refactor. Brief potvrdzuje že to je veľký kus práce — ale čím skôr tým lepšie, pretože city-scene je centerpiece na `/`, `/miasto`, `/games` — 3 z top-5 routes.

---

## F-032 — MINOR — `coming-soon-banner` contrast (rýchla kontrola)

**Kde:** `components/coming-soon-banner.tsx`. Zobrazuje sa na `/` + `/games`. Treba overiť či body text nepoužíva zinc.

**Action:** prečítať komponent (nebol ešte prečítaný v tomto audite). Flag ako follow-up.

---

---

## F-033 — CRITICAL — `border-[var(--ink)]` (= čierna 1px) ako default namiesto `var(--line)`

**Kde:** ubiquitous — karty v `/o-platforme`, `/dla-szkol`, `/sin-slavy`, `/profile`, `/friends/[username]`, `/parent/[username]`, `/nauczyciel/signup`, `/class/[code]`, `/miasto`, `/ochrana-sukromia`. Plus kľúčové komponenty: `language-switcher`, `notification-bell`, `tier-up-toast`, `dashboard` Stat card, `round-result`, `city-level-card`, a všetky `components/games/ai-*-client.tsx` voľby/karty.

**Spec konflikt:** `01-BRAND-MANUAL.md` §7 jednoznačne: „Default line: `1px solid #e5e5e5`." Ďalej: „Maximum 1 px. Žiadne 2 px, 3 px, 4 px bordery." V pko skin `--ink = #000000`, `--line = #e5e5e5`. Takže `border-[var(--ink)]` = čistá čierna aj keď 1 px = vizuálne stále brutalism.

**Výskyty (40+, neúplný zoznam):**
- `app/profile/page.tsx:61, 101`
- `app/profile/[username]/page.tsx:77`
- `app/parent/[username]/page.tsx:53, 116`
- `app/friends/[username]/page.tsx:63`
- `app/nauczyciel/signup/page.tsx:72, 81, 95, 107, 118`
- `app/class/[code]/page.tsx:60, 75`
- `app/ochrana-sukromia/page.tsx:182, 206`
- `app/o-platforme/page.tsx:131, 146, 223, 362, 381, 400, 402, 420`
- `app/dla-szkol/page.tsx:332, 358, 391`
- `app/sin-slavy/page.tsx:129, 244, 326`
- `app/miasto/page.tsx:430`
- `app/games/page.tsx:108`
- `components/tier-up-toast.tsx:62`
- `components/city-level-card.tsx:113, 145`
- `components/notification-bell.tsx:98, 111, 113`
- `components/language-switcher.tsx:44, 54`
- `components/dashboard.tsx:304`
- `components/theme-proposals-client.tsx:81, 102`
- `components/class-dashboard.tsx:205`
- `components/web3/medal-gallery.tsx:134, 200`
- `components/games/round-result.tsx:105, 172`
- `components/games/memory-match-client.tsx:218, 245`
- `components/games/ai-quiz-client.tsx:117`
- `components/games/ai-truefalse-client.tsx:103, 119`
- `components/games/ai-matchpairs-client.tsx:149, 177`
- `components/games/ai-chartread-client.tsx:157`
- `components/games/ai-whatif-client.tsx:106`
- `components/games/ai-memory-client.tsx:125`
- `components/games/ai-order-client.tsx:123, 137, 146`
- `components/games/ai-calcsprint-client.tsx:122`

**Navrhovaný fix:** globálny codemod `border-[var(--ink)]` → `border-[var(--line)]`. Tam kde bol `/40` / `/30` / `/20` opacity, zostaví `var(--line)` plnú (#e5e5e5 je dosť tlmené ďalšia opacity nepotrebuje). Kde bol border spojený s hover (language-switcher, round-result), prehodnotiť hover state — spec §4 `.chip:hover { border-color: var(--accent); }`.

Toto je single-largest sweep po F-001/F-010 — ale aj single-highest leverage fix: karta ktorá má `card p-5 border-[var(--ink)]` po fixe vyzerá ako PKO (tlmená sivá 1px line), pred fixom ako SKO-brutalism-lite.

---

## F-034 — MAJOR — `border-dashed border-[var(--ink)]` — explicit forbidden pattern

**Kde:** `components/web3/medal-gallery.tsx:200`:
```tsx
className="flex items-center justify-between border border-dashed border-[var(--ink)] rounded p-2 gap-2"
```

**Spec konflikt:** `01-BRAND-MANUAL.md` §2 „Bodkované / čiarkované pozadia (repeating patterns)" — dashed/dotted borders patria do tejto kategórie. Brutalism residue.

**Navrhovaný fix:** `border-dashed border-[var(--ink)]` → `border border-[var(--line)]` (plná subtle čiara). Ak je to placeholder/empty state, pridať `bg-[var(--surface-2)]` pre diferenciáciu.

---

## F-035 — CRITICAL — `/marketplace` tier-gate text `text-amber-300` nečitateľný

**Kde:** `/marketplace` pre user s tier < 7 (čo je zrejme väčšina early users). Desktop + mobile.

**Kód:** `app/marketplace/page.tsx:92`:
```tsx
<div className="card p-6 text-sm text-amber-300">🔒 {copy.tierGate}</div>
```

**Kontrast:** `#fcd34d` na bielej karte = **1.7:1** — HARD FAIL. Jediná informácia ktorú user dostane („Giełda aktywna od Tier 7...") je prakticky neviditeľná. User netuší prečo je stránka prázdna.

**Navrhovaný fix:** `text-amber-300` → `text-[var(--foreground)]`. Uzamknutie naznačí 🔒 emoji + optional chip `.chip` „Tier T{tier}" pred textom. Semantic lock je už v emoji.

---

## F-036 — MAJOR — `tier-up-toast` čierny text na navy pozadí

**Kde:** `components/tier-up-toast.tsx:62`:
```tsx
className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,26rem)] card p-4 flex flex-col gap-2 bg-[var(--accent)] text-[var(--foreground)] border-[var(--ink)] ..."
```

**Problém:** `bg-[var(--accent)]` (`#003574` navy) + `text-[var(--foreground)]` (`#000000` čierna) = ratio **1.57:1** ❌. Celebration toast = najhlasnejší UI moment hry, ale text je *menej čitateľný* ako na obyčajnej karte.

**Spec:** `03-COMPONENTS.md` §14 Toast: „`bg: var(--surface)`, `border: 1px solid var(--line)`" — biele pozadie, navy/ink text. Nikdy nie inverzné (navy-bg + white-text) pre toast — toto je CTA invariant.

**Navrhovaný fix:**
```tsx
className="... bg-[var(--surface)] text-[var(--foreground)] border-[var(--line)] elev-soft"
```
Pridať ľavý 4px `--accent` stripe alebo confetti burst pre visual celebration bez contrast kompromisu. Dismiss button: `t-body-sm text-[var(--accent)]` underline.

---

## F-037 — MAJOR — `city-level-card` grid badge inline `#0a0a0f` + `border-[var(--ink)]`

**Kde:** `components/city-level-card.tsx:113-114`:
```tsx
<span
  className="text-[11px] font-mono font-bold border border-[var(--ink)] px-2 py-0.5"
  style={{ background: gridColor, color: "#0a0a0f" }}
>
  ⚡ {watts.net > 0 ? "+" : ""}{watts.net}
</span>
```

**Porušenia:**
1. Inline `color: "#0a0a0f"` outside palette (F-003 general)
2. `border border-[var(--ink)]` čierna 1px (F-033 general)
3. `font-mono font-bold` mixed s `t-micro` spec 11 px 400 — weight mismatch
4. `background: gridColor` je dynamicky `--danger` / `--success` / `--accent` — `color: "#0a0a0f"` na `var(--success)` (#2e7d49) = 5.4:1 OK, na `var(--danger)` (#c0342b) = 4.1:1 FAIL at 11px. Pri menšom size limit je 3:1 (large text ≥18 pre large). 11 px nie je large → 4.5 threshold.

**Navrhovaný fix:**
```tsx
<span
  className="text-[11px] font-mono font-semibold tabular-nums rounded-sm px-2 py-0.5"
  style={{ background: gridColor, color: "var(--accent-ink)" }}  /* #fff */
>
```
Biely text na farebnom bg → ≥5:1 na všetkých troch variantoch. Border preč (pill + farebný bg = dostatočne viditeľné).

---

## F-038 — MAJOR — Site-nav height `h-16` (64 px) vs spec 72 desktop / 56 mobile

**Kde:** `components/site-nav.tsx:88`:
```tsx
<nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center ...">
```

**Spec:** `03-COMPONENTS.md` §5 „height 72 px desktop / 56 px mobile" a v `06-UX-REVIEW-BRIEF.md` §E spec explicitne pýta: „Výška 72 desktop / 56 mobile — pôvodne bola `h-16` (64px). Má zmysel meniť?"

**Navrhovaný fix:** ak spec vyhrá (BRAND > CODE per brief §8), zmeniť na:
```tsx
className="... h-[72px] sm:h-[56px] flex ..." /* alebo naopak */
```
@decision-needed — niekto potrvdí že 72/56 split nie je chyba v spec. Pre PKO-bank-like vibe je 72 px vhodnejšie ako 64.

---

## F-039 — MAJOR — Aktívny nav link nemá 2px spodnú navy čiaru (spec §5)

**Kde:** `components/site-nav.tsx:104-112`:
```tsx
{navLinks.map((l) => (
  <Link ...
    className="tap-target text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
  >
    {l.label}
  </Link>
))}
```

**Spec:** `03-COMPONENTS.md` §5 „Aktívna položka: `color: var(--accent)` + 2 px spodná navy čiara". Momentálne tu nie je žiadna logika pre active — iba hover color change. Visual anchor „kde som na stránke" chýba.

**Navrhovaný fix:** potrebuje `usePathname()` v client wrapperi (alebo server `params`) na porovnanie. Potom:
```tsx
const active = pathname.startsWith(l.href);
className={`tap-target relative ${active ? "text-[var(--accent)]" : "text-[var(--ink-muted)] hover:text-[var(--accent)]"} transition-colors ${active ? "after:absolute after:bottom-[-16px] after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]" : ""}`}
```
Poznámka: 2px spodná čiara je výnimka z „max 1 px" (spec §7), pretože ide o stav, nie vizuálny rámik. Akceptuje sa.

---

## F-040 — MAJOR — `ochrana-sukromia` + `o-platforme` footer border `var(--ink)/30`

**Kde:**
- `app/ochrana-sukromia/page.tsx:182`: `<footer className="text-xs text-zinc-400 border-t border-[var(--ink)]/30 pt-4">`
- `app/o-platforme/page.tsx:362`: `<footer className="text-xs text-zinc-400 border-t border-[var(--ink)]/30 pt-4 flex flex-wrap gap-4">`

**Porušenia:** double-hit — `text-zinc-400` (F-001) + `border-[var(--ink)]/30` (F-033 variant). `#000000/30` = ≈ `#b4b4b4` na white, ktoré je skoro ako `--ink-subtle` (b7b7b7) ale o chlp tmavšie. Semantic error: divider token je `--line`, nie opacity na čiernej.

**Navrhovaný fix:** `text-zinc-400 border-t border-[var(--ink)]/30` → `t-caption text-[var(--ink-muted)] border-t border-[var(--line)]`.

---

## F-041 — MAJOR — `/dla-szkol` has multiple `border-[var(--ink)]` cards + icons

**Kde:** `app/dla-szkol/page.tsx:332, 358, 391`.
Samples:
- L332: `className="w-10 h-10 rounded-xl border border-[var(--ink)] bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xl flex items-center justify-center"` — number-badge s navy bg + foreground (black) = invisible číslo (F-036 pattern).
- L358: `className="aspect-video rounded-xl border border-[var(--ink)] p-6 flex items-center justify-center text-center"` — empty placeholder box, čierny border.
- L391: `className="border border-[var(--ink)]/40 rounded p-3 flex flex-col gap-1"` — list card.

**Dôsledok:** `/dla-szkol` je marketing landing pre teachers. Čierne 1px borders a navy-bg/black-text chipy vytvárajú SKO-lite feel, nie banku-like presnosť.

**Navrhovaný fix:** L332 — `text-[var(--foreground)]` → `text-[var(--accent-ink)]` (=biela). L358 — remove border, použiť `bg-[var(--surface-2)]`. L391 — border → `var(--line)`.

---

## F-042 — MAJOR — `parent/[username]` avatar + row borders + zinc text

**Kde:** `app/parent/[username]/page.tsx:53, 116`:
- L53: `<div className="w-12 h-12 border border-[var(--ink)] rounded ...">` — kid avatar, čierny box.
- L116: `<li key={e.id} className="flex justify-between border-b border-[var(--ink)]/20 pb-1 last:border-0">` — transaction row divider, čierna/20.

Plus zinc-400 text (F-001) + o-platforme-style chips.

**Navrhovaný fix:** avatar `border-[var(--line)]` + `rounded-full` (pill per spec §7). Row divider `border-[var(--line)]` plná.

---

## F-043 — MAJOR — `/nauczyciel/signup` používa manuálne inputy namiesto `.input`

**Kde:** `app/nauczyciel/signup/page.tsx:72, 81, 95, 107, 118`:
```tsx
<input className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded" ... />
<textarea className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded font-mono" ... />
```

**Porušenia:**
1. `rounded` (= 4 px) — spec §7 Input = `0 px` radius (ostré, pkobp look).
2. Border `var(--ink)` = čierny (F-033).
3. Padding 3/2 — `.input` primitive by bol 12/16 px + min-height 44 (spec §3 components).
4. `rounded font-mono` na verification-code textarea vyzerá ako custom widget, nie pkobp-grade.

**Navrhovaný fix:** všetky `className` nahradiť `className="input"`. Ak textarea potrebuje `font-mono`, `<textarea className="input font-mono">` (pod `.input` base, font-mono utility override).

---

## F-044 — MAJOR — `/o-platforme` štýl masívne porušuje spec

**Kde:** `app/o-platforme/page.tsx` — 6+ inštancií `border border-[var(--ink)]` + inline hex (F-003) + chips bez proper palette.

**Sample:** L223:
```tsx
<span className="flex-shrink-0 w-14 h-14 rounded-xl border border-[var(--ink)] bg-[var(--accent)] text-[var(--foreground)] font-semibold text-lg flex flex-col items-center justify-center">
```
= navy bg + black text + čierny border = unreadable emoji-badge.

**Dôsledok:** `/o-platforme` je hlavný landing ak user klikne „O platforme" z landing page CTA. First-impression page.

**Navrhovaný fix:** všetky `text-[var(--foreground)]` na `bg-[var(--accent)]` zmeniť na `text-[var(--accent-ink)]` (= biely). Všetky `border-[var(--ink)]` → `border-[var(--line)]`. Tiež odstrániť inline `#0a0a0f` z L29, 35, 41 (viď F-003).

---

## F-045 — MAJOR — `language-switcher` brutalism hover translate

**Kde:** `components/language-switcher.tsx:44`:
```tsx
className="inline-flex items-center gap-1.5 h-9 px-2.5 border border-[var(--ink)] rounded-lg bg-[var(--surface)] font-bold text-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
```

**Porušenia:**
1. `hover:-translate-x-0.5 hover:-translate-y-0.5` — brutalism lift pattern (press-animation). Brand manual §11 motion: „Žiadne bounce, žiadne spring, žiadne parallax. Všetko lineárne alebo material-ease." Translate na hover je brutalism signature.
2. `border border-[var(--ink)]` + `rounded-lg` — F-033.
3. `font-bold text-sm` — tlačidlo by malo byť `btn btn-secondary btn-sm`, nie custom styling s bold.

**Navrhovaný fix:** prepísať na `.btn .btn-secondary .btn-sm` triedy. Nič nemeniť hover (spec §1 button hover = `--surface-2` bg change).

L54 (dropdown): `rounded-xl border border-[var(--ink)] bg-[var(--surface)] p-1.5` → `rounded-md border-[var(--line)] bg-[var(--surface)] elev-soft p-1.5`.

---

## F-046 — MAJOR — `notification-bell` dropdown čierny outline + zinc text

**Kde:** `components/notification-bell.tsx:98, 111, 113`:
- L98: bell button `border border-[var(--ink)] bg-[var(--surface)] rounded` — black 1px border on icon-button.
- L111: dropdown panel `card p-2 bg-[var(--surface)] border border-[var(--ink)]` — black border.
- L113: header `<header className="flex ... text-xs text-zinc-400 border-b border-[var(--ink)]/30 mb-1">` — zinc text + black/30 divider.

**Navrhovaný fix:** bell → `.btn-ghost` or simple `w-8 h-8 rounded-md` without black border (focus ring covers focus state). Dropdown → add `elev-soft`, remove black border. Header → `text-[var(--ink-muted)] border-[var(--line)]`.

---

## F-047 — MINOR — `/miasto` expired-card has opacity-overloaded styling

**Kde:** `app/miasto/page.tsx:430`:
```tsx
className="border border-[var(--ink)]/30 bg-[var(--surface)]/40 rounded p-3 flex flex-col gap-1 opacity-70"
```

**Problém:** `bg-[var(--surface)]/40` = bielá pri 40% opacity → rendered ako body background (pretože parent je white). Div bez bg. Potom `border-[var(--ink)]/30` + `opacity-70` → skoro neviditeľná karta. Triple-dimming.

**Navrhovaný fix:** `bg-[var(--surface-2)] border-[var(--line)] opacity-60 rounded-md p-3 ...`. `surface-2` #f9f9f9 dá minimálny kontrast voči parent surface; opacity-60 je dosť.

---

## Ešte nezreviduované (follow-up)

- `/duel` - brief §5 nezahŕňa, plus `nav nie ukazuje link; dict keys zachované pre back-compat` (per site-nav comment) — redakčne dead route.
- `/propose-theme`, `/pko` — static / experimental pages, nizka priorita.
- `/class/[code]` — teacher classroom detail — zobrazený iba border pattern (F-033), plná UX review follow-up.
- `/status` — status page, nie core UX.
- Deep-dive do jednej hry (ai-quiz alebo energy-dash) — zatiaľ iba border/gradient/color patterns katalogizované. Play-through test by odhalil timing/animation/focus issues (backlog).
- Mobile portrait 320 px smallest-screen test — audit sa primárne zameral na 390. Treba overiť či `min-[380px]` / `min-[420px]` gates v site-nav neodhaľujú missing states.
- Real Playwright screenshots — tool nie je dostupný v tomto toolkite. Po nasadení screenshot helpera by `_findings-screenshots/F-001.png` atď. dramaticky zlepšili akciu FE dev-a. Medzi tým tento report popisuje stav presne `file:line` + viewport refs.
- Reduced-motion pass — `globals.css` deklaruje `prefers-reduced-motion: reduce` → duration 0.01ms; manuálne overiť že `motion-safe:animate-*` wrappery sa rešpektujú vo všetkých 50+ výskytoch.

---

_Koniec reportu (F-001 až F-047)._
