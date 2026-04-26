# Sprint F — IA cleanup, vizuálna parita, tier coherence (Pass-9)

**Vstup:** product-visionar live UX review po Sprint E shipnutí, 4 screenshoty z `/loans/compare`, `/games`, `/miasto`, dashboard.
**Cieľ:** odstrániť redundant page (`/loans/compare`), opraviť outline-only render CityScene, vyriešiť produktovú inkonzistenciu (Brzy lockované vs už dostupné), zjednotiť tier/level confusion (city level 3 vs XP tier 4).
**Skin:** `pko` default. Core skin nesmie zaregistrovať žiadnu zmenu.
**Reviewer:** product visionar. Schválim PR-N keď: walkthrough 0 axe-core findings, /loans/compare už neexistuje (alebo redirect), CityScene render solid colors, dashboard tier confusion vyriešená.

> **Branding pravidlá** (AGENTS.md): no `border-2+`, no hard-offset shadows, no `uppercase` headings, no `font-extrabold`, no arbitrary `rounded-[Npx]`, no nové hex mimo design tokens.

---

## 0 · Pre-flight

```bash
git status                                # clean (post Sprint E merge)
git log --oneline -5                      # potvrď že posledný commit je Sprint E PR-L
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test  # baseline gates
WALKTHROUGH_LABEL=pre-pr-n pnpm test:walk # baseline
```

---

## F-01 · `/loans/compare` ako standalone — DELETE + inline integration (CRITICAL)

**Čo užívateľ povedal:** "toto je zbytočna stranka ... porovnanie požiček ma byt sučastou srtanky ohladom hypotek predsa ... zamysli sa"

**Súčasný stav:**
- `/loans/compare` je standalone page s KNF disclaimer + slider + segments + table (`mortgage` Najlevnejší / `kredyt konsumencki` Pozor) + "Vzít" CTA per row.
- Site-nav má 5. link "Půjčky" → /loans/compare.
- `/miasto` Hypotéka panel je separate komponent (MortgageCard) ktorý ukazuje **iba mortgage** quote (bez porovnania).
- Vzniká **dvojitý codepath** + IA redundancy: hypotéka logika existuje na 2 miestach, user nevidí porovnanie pri reálnom úvero-take momente (na /miasto), ale len keď klikne random nav link.

**Product reasoning:** porovnanie pôžičiek je **rozhodovací nástroj** pre konkrétny use case (chcem si vziať úver). Tento moment vzniká **na /miasto** (potrebujem cash na budovu → otvorím Hypotéka panel). Standalone page bez kontextu je **navigation dead-end** — user tam náhodne klikne, vidí porovnanie bez situácie, neví prečo to potrebuje.

**Súbory:**
- `app/loans/compare/page.tsx` (DELETE alebo prepísať na redirect)
- `components/site-nav.tsx` (remove "Pożyczki/Půjčky/Loans" navLinks entry — pridanú v PR-J)
- `components/watt-city/watt-city-client.tsx` (MortgageCard → wrap LoanComparison inline; toto je **deferred E-06 z Pass-8**, teraz aktivovať)
- `components/loan-comparison.tsx` (variant="inline" už existuje z PR-J E-03; doplniť `defaultProduct` filter ak chýba)
- `lib/locales/{pl,uk,cs,en}.ts` (remove `nav.loans` key — už nepotrebný)

### F-01-A: Inline LoanComparison v MortgageCard

V `components/watt-city/watt-city-client.tsx` MortgageCard funcii (~riadok 620-810) **nahradiť celý JSX render** wrapperom:
```tsx
import { LoanComparison } from "@/components/loan-comparison";
import { compareLoans } from "@/lib/loans";

function MortgageCard({ resources, loans, creditScore, onChange, dict, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [principal, setPrincipal] = useState<number>(500);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [rows, setRows] = useState<LoanComparisonRow[] | null>(null);

  // Re-fetch comparison on principal/term change (debounced — reuse pattern z LoanComparison)
  const fetchAbort = useRef<AbortController | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshRows = useCallback((p: number, t: number) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      if (fetchAbort.current) fetchAbort.current.abort();
      const ac = new AbortController();
      fetchAbort.current = ac;
      try {
        const r = await fetch(`/api/loans/compare?principal=${p}&termMonths=${t}`, { signal: ac.signal });
        const j = await r.json();
        if (j.ok) setRows(j.rows);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setRows(null);
      }
    }, 200);
  }, []);

  useEffect(() => () => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    if (fetchAbort.current) fetchAbort.current.abort();
  }, []);

  // Initial load on open
  useEffect(() => { if (open && rows === null) refreshRows(principal, termMonths); }, [open, rows, principal, termMonths, refreshRows]);

  return (
    <section className="card p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{dict.mortgageTitle}</h2>
        <button className="btn btn-ghost text-xs" onClick={() => setOpen((v) => !v)}>
          {open ? dict.collapse ?? "Zavřít" : dict.mortgageOpen}
        </button>
      </header>
      <p className="text-sm text-[var(--ink-muted)]">{dict.mortgageBody}</p>

      {open && rows && (
        <LoanComparison
          rows={rows}
          lang={lang}
          principal={principal}
          termMonths={termMonths}
          variant="inline"
          onPrincipalChange={(p) => { setPrincipal(p); refreshRows(p, termMonths); }}
          onTermChange={(t) => { setTermMonths(t); refreshRows(principal, t); }}
          onTakeSuccess={async () => { setOpen(false); await onChange(); }}
        />
      )}

      {/* Active loan list zostáva — passes through */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold mb-1">{dict.loansTitle}</h3>
        {/* ... existing active loans render ... */}
      </div>
    </section>
  );
}
```

**LoanComparison primitive treba upraviť** (`components/loan-comparison.tsx`):
- Pridať props `onPrincipalChange?: (p: number) => void` + `onTermChange?: (t: number) => void` + `onTakeSuccess?: () => Promise<void>`
- Pri `variant="inline"`: skryť KNF disclaimer card (parent MortgageCard má vlastný), použiť parent slider state cez controlled props
- Slider + segments ostávajú visible — len prepojené cez parent callbacks namiesto vlastný `router.replace`

### F-01-B: DELETE `/loans/compare` route

**2 možnosti:**
- **A) Hard delete** — `rm app/loans/compare/page.tsx` + `rm app/loans/compare/` + add 301 redirect rule
- **B) Redirect-only stub** — replace page.tsx s `redirect("/miasto#hypoteka")`

**Odporúčanie:** **(B) redirect** — zachová bookmarks ak ich niekto má, plus deep-link `/loans/compare` z tutoriálu (onboarding-tour.tsx step 4) ostane funkčný. Kód:
```tsx
// app/loans/compare/page.tsx
import { redirect } from "next/navigation";
export default function LoansCompareRedirect() {
  redirect("/miasto#hypoteka");
}
```

A v `app/miasto/page.tsx` MortgageCard parent obaliť `<section id="hypoteka">` aby anchor scroll fungoval.

### F-01-C: Remove "Půjčky" nav link

V `components/site-nav.tsx` riadky 89-94 (navLinks array) **odstrániť** entry pridanú v PR-J:
```tsx
// remove this line:
{ href: "/loans/compare", label: t.loans },
```

Plus odstrániť `nav.loans` keys z `lib/locales/{pl,uk,cs,en}.ts` (už unreachable).

### F-01-D: Update tutoriál CTA

V `components/onboarding-tour.tsx` step 4 (CTA "Otevřít porovnávačku") zmeniť `href` z `/loans/compare` na `/miasto#hypoteka`. Per-Lang updatuj ak treba label.

### F-01 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `04-miasto.png` | Hypotéka panel obsahuje slider + segments + table mortgage+konsumencki (full LoanComparison inline) |
| Manual smoke | Klik na pôvodný link `/loans/compare` → redirect na `/miasto#hypoteka` (anchor scroll na Hypotéka panel) |
| Nav | Site-nav má 4 linky (Městečko, Hry, Liga, O platformě) — žiadne "Půjčky" |
| Tutorial step 4 | CTA "Porovnat úvěry" otvorí /miasto#hypoteka (panel auto-expanded ak `?build` query param alebo similar) |
| Tests | Vitest + Playwright tests ktoré referovali /loans/compare → updated na /miasto#hypoteka |

---

## F-02 · CityScene `/games` outline-only render — restore solid colors (CRITICAL)

**Čo užívateľ povedal:** "tento vizual je silne tragicky ... pozri sa ako je robena domovska stranka s vizualom mestečka čo sa tyka obrazkov a inšpiruj sa"

**Súčasný stav** (screenshot 23.20.12):
- `/games` "Tvé Katovice" CityScene SVG renderuje budovy ako **outline-only wireframe** (tenké navy obrysy budov bez solid fill)
- Pôvodný dizajn (z screenshotu PR-J) mal solid colors: PKO BP banka modrá, knižnica béžová, Solar Farm zelená, Drukarnia fuchsia, atď.
- 3 AI buildings vpravo majú solid scaffolding — ale 9 evergreen buildings sú prázdne biele s line-art

**Root cause hypotézy:**
1. Pass-8 E-02 WattMeter `!important` overrides možno collateral broke `[fill=...]` pre building bodies (`!important` na .watt-meter-bg kaskáda?)
2. Pass-7 PR-J R-02 mass-broaden override pre `[fill="#xxx"]` retintnul VŠETKY building bodies na rovnaký token → neutral grey + filter brightness → biele
3. Pass-8 E-04 sunset opt-in v CityScene compact prepol render path → pozadie je teraz tmavé sunset, ale building fills neboli updated → vzniknul mismatch

**Súbory:**
- `components/city-scene.tsx` (BUILDING_PLAN buildings render path)
- `app/globals.css:212-316` (city-scene-root pko overrides — audit či nepretínajú building bodies)
- `components/city-preview.tsx` (referenčný light render z landing — inšpirácia)

### F-02-A: Diagnostika — git blame + visual diff

```bash
# Trace which commit changed building body fill behavior
git log --oneline --all -- app/globals.css | head -10
git diff c864c98..HEAD -- app/globals.css | grep -A 3 "fill"
git diff c864c98..HEAD -- components/city-scene.tsx | head -50
```

Výsledky audit pridať do PR-N description ako "PR-K/PR-L delta affecting building fills".

### F-02-B: Restore solid colors

**Inšpirácia z `components/city-preview.tsx`** (landing page render):
```tsx
// city-preview.tsx renders building cards via Tailwind classes:
<div className={`${g.building.roof} border-b border-[var(--line)] h-5`} />
<div className={`${g.building.body} h-[calc(100%-1.25rem)] relative ...`}>
  {/* glyph + name */}
</div>
```

`g.building.roof` + `g.building.body` v `lib/games.ts` sú Tailwind class strings (`bg-blue-500`, `bg-amber-200`, atď). Toto pripravuje building cards v solid colors **bez SVG**.

**Pre CityScene** (ktorá je SVG-based) musíme zachovať SVG render ale **garantovať solid fill**:
1. Identifikovať ktorý CSS rule v globals.css vybílel building bodies (audit cez F-02-A)
2. Buď scoped exception, alebo (safer) **úplne vyňať pko skin filter z .city-scene-root** a používať per-building explicit hex fills v JSX (nie cez attribute selector overrides)

**Možnosť A — surgical scoped exception** (low risk):
```css
/* app/globals.css — pridať za existing R-02 + E-02 blocks */
:where([data-skin="pko"]) .city-scene-root [data-building-body="true"] {
  /* Building body rect must always render its inline fill, regardless of
   * mass-overrides above. data-attribute selector beats class+attribute. */
  fill: var(--building-fill, currentColor) !important;
}
```

V `city-scene.tsx` `BuildingSlot` / `BuildingPlan.draw()` pridať `data-building-body="true"` na main body `<rect>` a inline style `--building-fill: #xxxx`:
```tsx
<rect
  data-building-body="true"
  x={x} y={top} width={w} height={h}
  fill="#fde047"
  style={{ "--building-fill": "#fde047" } as React.CSSProperties}
/>
```

Toto **vynúti** že body rect vždy ukáže svoj fill, bez ohľadu na pko mass-override v globals.css.

**Možnosť B — kompletný refactor** (higher risk, bigger PR):
- Refactor CityScene aby každý building drawing function returnoval `<g>` s className `building-body--<gameId>`
- V globals.css definovať per-building light + sunset variants
- Toto by zladilo všetky 3 surfaces (CityPreview landing, CityScene games, CitySkylineHero miasto) na rovnaký dizajn jazyk

**Pre Pass-9 odporúčam (A)** — quick fix bez veľkého refactoru. (B) ako Pass-10.

### F-02-C: Per-building solid color audit

Po F-02-B fix overiť že **každá z 9 evergreen buildings** + **3 AI scaffolding** + **construction site** má visible solid body. Walkthrough screenshot diff pre/post:

```bash
WALKTHROUGH_LABEL=post-pr-n pnpm test:walk
diff <(jq '.[].building_visible_count' tmp/walkthrough-shots/pre-pr-n/_findings.json) \
     <(jq '.[].building_visible_count' tmp/walkthrough-shots/post-pr-n/_findings.json)
```

### F-02 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `09-games.png` | Vidno solid colored buildings (PKO BP modrá, knižnica béžová, Solar Farm zelená, atď.), žiadny outline-only wireframe |
| Vizuálny diff pre/post | Side-by-side side ukáže solid fills reštaurované |
| axe-core | 0 findings — solid building bodies majú contrast ≥ 3:1 voči background |
| Core skin | `SKIN=core` → /games render unchanged (žiadna regresia) |

---

## F-03 · "Brzy — fáze 2 a dál" inkonzistencia s already-available products (MAJOR)

**Čo užívateľ povedal:** "tu nejak logicky by som si predstavoval aj to porovnanie ... do kedy nebudu ine typy uverov možne"

**Súčasný stav** (screenshot 23.21.27):
- `/miasto` má sekciu **"Brzy — fáze 2 a dál"** so 4 cards lockovaných:
  - 🏬 Leasing (lock icon)
  - 🏪 Revolvingový úvěr (lock icon)
  - ⚠️ Spotřebitelský úvěr (lock icon)
  - 📈 Investiční úvěr (lock icon)
- **ALE** v `/loans/compare` table (po F-01 inline v Hypotéka panel) sa **`kredyt konsumencki` zobrazuje ako už dostupný produkt** s "Vzít" CTA + "Pozor" warning chip.
- Inkonzistencia: na jednom mieste hovoríme "spotřebitelský úvěr je locked / coming soon", na inom "vezmi si ho hneď".

**Plus user otázka:** "do kedy nebudu ine typy uverov možne" — kedy budú implementované Leasing, Revolvingový, Investiční úvěr.

**Súbory:**
- `components/watt-city/watt-city-client.tsx` (Brzy section render — pravdepodobne ~riadok 700+)
- `lib/loans.ts` LOAN_CONFIGS (zoznam implementovaných produktov)
- `lib/locales/*` (copy strings pre Brzy/coming-soon labels)

### F-03-A: Audit "actually available" vs "locked" produktov

V `lib/loans.ts` `LOAN_CONFIGS`:
- `mortgage` ✅ implemented + take API
- `kredyt_obrotowy` ✅ implemented (LOAN_CONFIGS entry exists)
- `kredyt_konsumencki` ✅ implemented (LOAN_CONFIGS entry + take-generic API)
- `leasing` ✅ implemented (LOAN_CONFIGS entry, ale unclear či take flow je live)

A `kredyt_inwestycyjny` je v `ProductLoanType` union ale NIE v `LOAN_CONFIGS` → **single skutočne pending produkt**.

**Konflict:** Brzy section ukazuje 4 lockované produkty, ale **3 z nich (kredyt_obrotowy, kredyt_konsumencki, leasing) sú už v LOAN_CONFIGS**. Iba **kredyt_inwestycyjny** je pending.

### F-03-B: Refresh roadmap status

Možnosť 1: **Odstrániť 3 už-implementovaných z Brzy section**, ostáva len Investiční úvěr + iné non-loan features (Panel rodiče, Režim třídy, Obchod mezi hráči, Mirror do PKO Junior).

Možnosť 2: **Reshape** Brzy sekciu na **per-feature status**:
- Available now: kredyt_obrotowy, kredyt_konsumencki, leasing → presunúť do LoanComparison table
- Coming soon (with date): kredyt_inwestycyjny → "Q3 2026"
- Future phase: Panel rodiče, Režim třídy, Obchod, Mirror → "Phase 2"

**Odporúčanie:** Možnosť **1**. Brzy sekcia má byť **future-only**, aktuálne dostupné produkty patria do LoanComparison table (která je teraz inline v Hypotéka panel po F-01).

### F-03-C: Implementation

V `components/watt-city/watt-city-client.tsx` Brzy section block:
```tsx
const COMING_SOON: { id: string; emoji: string; titleKey: string }[] = [
  // Removed: leasing, revolvingový (kredyt_obrotowy alias), spotřebitelský (kredyt_konsumencki)
  // — všetky 3 sú dostupné v LoanComparison inline.
  { id: "kredyt-inwestycyjny", emoji: "📈", titleKey: "investmentLoanTitle" },
  { id: "panel-rodice", emoji: "👨‍👩‍👧", titleKey: "parentPanelTitle" },
  { id: "rezim-tridy", emoji: "🏫", titleKey: "classModeTitle" },
  { id: "obchod-hraci", emoji: "🏪", titleKey: "p2pMarketplaceTitle" },
  { id: "mirror-pko", emoji: "🪞", titleKey: "mirrorPkoJuniorTitle" },
];
```

Add per-Lang labels do `lib/locales/*` pre nové `titleKey` strings.

### F-03-D: Optional — pridať timing badge

Pre každú Brzy card pridať drobný "Q3 2026" / "Phase 2" badge:
```tsx
<span className="chip text-[10px]">Q3 2026</span>
```

PO musí potvrdiť timing (interný roadmap) — ak nemá timing, badge `"Phase 2"` ako placeholder.

### F-03 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `04-miasto.png` | "Brzy" section neobsahuje Leasing, Revolvingový úvěr, Spotřebitelský úvěr (dostupné v LoanComparison). Iba Investiční + non-loan features |
| Manual smoke | LoanComparison inline (po F-01) ukazuje 4 produkty: mortgage, kredyt_obrotowy, kredyt_konsumencki, leasing — všetky majú "Vzít" CTA + per-product warning chip |
| Copy consistency | Žiadny produkt sa neukáže v 2 sekciách (raz "available", raz "coming soon") |

---

## F-04 · Tier confusion — city level 3 vs XP tier 4 (MAJOR)

**Čo užívateľ povedal:** "tu maš že tve mesto ma level 3 ale XP mam na urovni 4 ... to je nejake divne premysli logiku a ked tak zmen"

**Súčasný stav** (screenshot 23.22.29 — dashboard):
- **TVÉ MĚSTO** karta: tier ring s číslom **3** (city level z buildings, computed `cityLevelFromBuildings`)
- **asadsa Elektrický starosta/starostka** karta: tier ring s číslom **XP 4 (53%)** (XP tier z accumulated Watts)
- **2 čísla, 2 ringy, 2 rôzne ranking systémy** — ale obidve používajú rovnakú vizuálnu primitívu (tier ring) → user nevidí rozdiel medzi "level mesta" a "tier hráča"

**Background z `lib/city-level.ts:1-19`:**
> "V1 had three parallel progression numbers (XP-based level, tier via sqrt(sum of building levels), credit score). V2 keeps only two: city level (derived purely from buildings) and credit score."

Takže V2 redukoval z 3 na 2 metriky, ale v UI sa **stále zobrazujú 2 paralelné rebríčky** — city level + XP tier. Pre 9-14 user je to konfúzne.

**Súbory:**
- `components/city-level-card.tsx` (TVÉ MĚSTO card, city level z buildings)
- `components/dashboard.tsx:267-296` (XP ring v starosta card)
- `lib/city-level.ts` (cityLevelFromBuildings)
- (XP tier compute — pravdepodobne `lib/xp-tiers.ts` alebo inline v dashboard)

### F-04-A: Product decision — 3 možnosti

**Option A — Unify (single tier):**
- Zachovať len 1 progression number = **city level**
- XP/Watts ostávajú ako stat ("Celkové watty 1 526 W") ale **bez tier ringu**
- Player tier = derived from city level (city level 3 → "Tier 3 hráč")
- **Pros:** najčistejšie, žiadna duplicity, easy to explain ("tvoje mesto rastie = ty rastieš")
- **Cons:** stratíme XP-based motivačnú páku (player tier ≠ city level by V2 design)

**Option B — Re-label + odlišné ikony (default odporúčanie):**
- City level = **"Stupeň města"** + budovami stack icon (žiadny tier ring), value 3
- Player tier = **"Tvůj tier"** + avatar/medal icon, value 4 (53%)
- Tooltip explanation pri prvom view
- **Pros:** zachová oba systémy, vizuálne rozlíšené, no breaking changes
- **Cons:** stále 2 čísla, len ich vizuálne segregujeme

**Option C — Kontextuálne scoping:**
- City level visible LEN na `/miasto` (kde má semantic relevance)
- XP tier visible LEN na `/leaderboard` + dashboard sidebar
- Dashboard hlavná karta = city level only
- **Pros:** clean separation podľa surface
- **Cons:** redesign dashboard layoutu, väčší scope

**Odporúčanie:** **Option B** ako default Pass-9 (low scope, jasné labelling). Option A alebo C ako Pass-10 ak PO chce radikálnejšie unifikovať.

### F-04-B: Implementation (Option B)

V `components/city-level-card.tsx`:
```tsx
// Header
<header className="flex items-baseline gap-2">
  <h3 className="t-overline text-[var(--ink-muted)]">
    {t.cityStageOverline}  // NEW: "Stupeň města" / "Stage of city"
  </h3>
  <span className="text-sm tabular-nums text-[var(--ink-muted)]">
    {t.developmentLevel}: <strong>{city.level}</strong>
  </span>
</header>
// Replace ProgressRing s building-stack icon variant
<BuildingStackBadge level={city.level} progressToNext={city.progressToNext} />
```

V `components/dashboard.tsx` riadok 267-296 (XP ring v starosta card):
```tsx
<header className="flex items-center gap-3">
  <span className="t-overline text-[var(--ink-muted)]">
    {t.playerTierOverline}  // NEW: "Tvůj tier" / "Your tier"
  </span>
</header>
<MedalRing tier={level.tier} pct={level.pct} />
// MedalRing primitive — odlišný vizuál od BuildingStackBadge
```

**Nové primitívy:**
- `<BuildingStackBadge>` — 3 stacked building icons rastúce s level (žiadny ring)
- `<MedalRing>` — kruhový ring s medal icon centered (existing pattern)

**Per-Lang copy keys** v `lib/locales/*`:
- `cityStageOverline` — pl: "Stopień miasta", uk: "Стан міста", cs: "Stupeň města", en: "City stage"
- `developmentLevel` — pl: "Rozwój", uk: "Розвиток", cs: "Rozvoj", en: "Development"
- `playerTierOverline` — pl: "Twój tier", uk: "Твій тир", cs: "Tvůj tier", en: "Your tier"

### F-04-C: Tooltip explanation (one-time onboarding)

Pri prvom render dashboard pridať drobnú card "Co to znamená?":
```tsx
<details className="card p-2 t-body-sm">
  <summary>Co znamenají tato čísla?</summary>
  <p>
    <strong>Stupeň města</strong> roste s každou postavenou budovou.
    <strong>Tvůj tier</strong> roste s počtem zahraných her (Watty).
    Mesto môže byť malé, ale ty môžeš byť skúsený hráč — a opačne.
  </p>
</details>
```

Per-Lang. Auto-dismiss po prvom rozkliknutí (localStorage flag).

### F-04 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `20-dashboard.png` | TVÉ MĚSTO karta používa BuildingStackBadge (NIE tier ring), starosta karta používa MedalRing — vizuálne rozlíšené |
| Walkthrough `20-dashboard.png` | "Stupeň města 3" + "Tvůj tier 4 (53%)" — dva rôzne label slová, žiadne "Level" na oboch miestach |
| axe-core | 0 findings; tooltip má `aria-expanded` |
| Manual smoke | Dashboard pre nového hráča (city level 1, XP tier 1) ukazuje konzistentné labels — nepôsobí to "skipnuté" alebo "duplicate" |

---

## 1 · Acceptance gate

```bash
pnpm typecheck && pnpm lint && pnpm test
WALKTHROUGH_LABEL=post-pr-n pnpm test:walk
pnpm test:walk:diff
pnpm test:e2e ux-fixes && pnpm test:e2e i18n-consistency.spec.ts
```

Manual smoke (live dev):
- `/loans/compare` → redirect na `/miasto#hypoteka` (anchor scroll)
- /miasto Hypotéka panel → klik "Kalkulačka" → vidno full LoanComparison inline (slider + segments + 4-row table)
- /games CityScene → solid colored buildings (no wireframe)
- /miasto Brzy section → 0 loan-typed cards, len Investiční + future features
- Dashboard → "Stupeň města 3" (s building-stack icon) + "Tvůj tier 4" (s medal ring) — vizuálne rozlíšené

---

## 2 · Order of operations (PR-N, 4 commity)

1. **F-04 tier coherence** — najprv (UI primitive split, foundation pre dashboard re-render)
2. **F-02 CityScene solid colors** — quick CSS fix (data-attribute exception)
3. **F-03 Brzy roadmap refresh** — copy + array filter
4. **F-01 LoanComparison inline + delete page** — najväčší scope (refactor MortgageCard + redirect setup + nav cleanup)

---

## 3 · Edge cases / known unknowns

- **F-01 Tutorial step 4** — onboarding-tour.tsx CTA href update; verify že auto-launch tour po register stále funguje
- **F-01 anchor scroll** — `#hypoteka` musí existovať ako `<section id="hypoteka">` v MortgageCard parent. Ak fragment scroll nezafungavá pri SPA navigácii, použiť `useEffect` so scrollIntoView
- **F-02 sunset opt-in collision** — ak F-02 fix data-building-body selector + Sprint E sunset prop konfliktujú, sunset môže prepísať solid fill cez gradient. Treba scoped: sunset prop affects only background, NIE building bodies
- **F-03 timing badge** — "Q3 2026" je placeholder; PO musí potvrdiť reálne dátumy alebo nahradiť "Phase 2" / "TBA"
- **F-04 BuildingStackBadge primitive** — nový komponent treba vyrobiť (3 stacked SVG building icons rastúce s level). Reference inšpirácia: Duolingo skill tree icons. Effort ~30 min
- **Memory** — language switcher cookie cache (Sprint E PR-K) sa musí re-trigger pri F-04 nových dict keys; verify že /api/lang revalidatePath stále funguje

---

## 4 · Reporting back

Po dokončení napíš merge-report v štýle PR-J/K/L correspondence:
- **Per-commit summary** + diff sizes
- **Quality gates** (typecheck/lint/vitest/playwright pass counts)
- **Walkthrough delta** — top 3 vizuálne zmeny + screenshot diffs
- **F-01 IA delta** — pred (5 nav linkov, /loans/compare standalone) ↔ po (4 nav linkov, /loans/compare → redirect)
- **F-02 visual delta** — pred (wireframe) ↔ po (solid colored buildings) screenshot
- **F-04 dashboard layout** — screenshot pred/po, label compare table
- **Open follow-ups** — Pass-10 candidates ak F-02 (B) refactor by bol cleaner long-term, ak F-04 Option A unify by bol future cleanup
