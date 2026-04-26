# Sprint E — sunset, čisté preklady, viditeľný progress (Pass-8)

**Vstup:** product-visionar live UX review nasadenej main vetvy (HEAD `c864c98`, deploy `pcze6tm7s`) cez 7 screenshotov × 6 routes.
**Cieľ:** 6 ticketov ktoré dotiahnu Pass-7 deferred + 4 nové incidenty z live review (R-05 redo, R-09 redo, R-10-bis i18n, copy/visual sync).
**Skin:** `pko` default. Core skin nesmie zaregistrovať žiadnu zmenu.
**Reviewer:** product visionar. Schválim PR-L keď: walkthrough 0 axe-core findings, vizuálny diff pre/post potvrdí 4 fix-y, e2e i18n test je zelený.

> **Branding pravidlá** (AGENTS.md): no `border-2+`, no hard-offset shadows, no `uppercase` headings, no `font-extrabold`, no arbitrary `rounded-[Npx]`, no nové hex mimo design tokens. Použiť primitives `.btn`, `.card`, `.chip`, `.section-heading`, `.t-*`.

---

## 0 · Pre-flight

```bash
git status                                # clean (origin/main = c864c98)
git log --oneline -5                      # potvrď c864c98 ako HEAD
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test  # baseline: 715/715 vitest, 0 errors
WALKTHROUGH_LABEL=pre-pr-l pnpm test:walk # baseline 56 routes / 0 a11y
```

Po každom E-XX commit-e re-run `pnpm test:walk` + `pnpm test:walk:diff` → zmena len na očakávaných routách.

---

## E-01 · R-05 redo — sunset twilight scene s lit-on-play (CRITICAL)

**Čo užívateľ povedal** (5 explicit rozhodnutí počas live review):
1. Daylight verzia z PR-J nezostáva — chce **twilight**
2. Stupeň tmy: **slnko tesne za obzorom** (sunset, nie plná noc, nie dusk)
3. Mechanika lights: **lit-on-play per-building** (zahráš game-X → rozsvietia sa okná v budove ktorá hru reprezentuje)
4. Hero výška: **medzi** (~390px viewBox, nie 460 ani 320)
5. Spodek silueta v Katowice backdrop: **ostáva**

**Centrálna metafora:** "Slnko zapadá nad Katovicami. Pouličné lampy sa zapínajú. Tvoje budovy ostávajú tmavé — kým nezahráš ich hru, žiadne svetlá vo vnútri."

**Súbor:**
- `components/city-skyline-hero.tsx` (kompletný redesign render path; PR-J shipnul daylight verziu, replace celý SVG body)
- `app/globals.css` (`.city-skyline-hero-root` scope už existuje z PR-K — len doplniť dark-friendly token overrides)
- `lib/building-catalog.ts` (zachovať farby PKO palety, ale add per-building `litWindowColor` field pre lit-on-play efekt)

### E-01-A: SVG canvas — 4 vrstvy (390px viewBox)

ViewBox `0 0 1800 390` (place of 460 v PR-J). Aspect ratio 4.62:1 — širší banner, menej vertikálneho priestoru ale dramatickejšia lineární kompozícia.

**LAYER 1 — Sunset sky:**
```svg
<defs>
  <linearGradient id="sunset-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1e3a8a" />     <!-- deep navy zenith -->
    <stop offset="35%" stop-color="#5b21b6" />    <!-- royal purple band -->
    <stop offset="65%" stop-color="#db5a3a" />    <!-- coral horizon glow -->
    <stop offset="85%" stop-color="#fbbf24" />    <!-- amber sun glow -->
    <stop offset="100%" stop-color="#7c2d12" />   <!-- dark earth band -->
  </linearGradient>
  <radialGradient id="sun-disk-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.95" />
    <stop offset="40%" stop-color="#fbbf24" stop-opacity="0.6" />
    <stop offset="100%" stop-color="#db5a3a" stop-opacity="0" />
  </radialGradient>
  <radialGradient id="moon-soft" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.4" />
    <stop offset="100%" stop-color="#fffbeb" stop-opacity="0" />
  </radialGradient>
  <radialGradient id="lamp-pool-warm" cx="50%" cy="100%" r="55%">
    <stop offset="0%" stop-color="#fde047" stop-opacity="0.55" />
    <stop offset="100%" stop-color="#fde047" stop-opacity="0" />
  </radialGradient>
  <radialGradient id="lit-window-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.9" />
    <stop offset="100%" stop-color="#fef3c7" stop-opacity="0" />
  </radialGradient>
  <pattern id="cobble-warm" width="22" height="14" patternUnits="userSpaceOnUse">
    <rect width="22" height="14" fill="#3f2f24" />
    <rect x="2" y="2" width="7" height="3" fill="#5c4434" opacity="0.7" />
    <rect x="12" y="7" width="7" height="3" fill="#5c4434" opacity="0.7" />
    <line x1="0" y1="7" x2="22" y2="7" stroke="#2a1e15" stroke-width="0.4" />
  </pattern>
</defs>
<rect width="1800" height="390" fill="url(#sunset-sky)" />
```

**Slnko (tesne nad horizontom, nie disc — len silný glow):**
```svg
<g transform="translate(1500, 280)">
  <!-- big radial halo behind horizon -->
  <ellipse rx="220" ry="80" fill="url(#sun-disk-glow)" />
  <!-- thin disk sliver visible above horizon -->
  <ellipse cx="0" cy="-8" rx="58" ry="14" fill="#fef3c7" opacity="0.85" />
</g>
```

**Mesiac (top-left, slabý — slnko je dominant):**
```svg
<g transform="translate(180, 60)">
  <circle r="48" fill="url(#moon-soft)" />        <!-- gentle halo -->
  <circle r="22" fill="#fffbeb" opacity="0.6" />  <!-- soft moon disk -->
</g>
```

**Hviezdy (top 30% canvasu len, ~12 dots):**
```svg
{STARS_DUSK.map((s, i) => (
  <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fffbeb" opacity={s.o} />
))}
// const STARS_DUSK: y range 10..115 (top 30% z 390)
```

**LAYER 2 — Distant Katowice silhouette (mid-depth, dark):**
```svg
<polygon
  points="0,260 60,240 100,220 140,250 180,230 220,200 260,210 300,180
          320,160 340,140 360,160 380,180 410,200 440,180 460,170
          480,200 500,210 540,170 580,180 620,210 660,180 700,200
          740,210 770,180 790,140 815,120 830,140 855,170 880,200
          910,180 940,200 980,170 1020,200 1060,180 1100,200 1140,170
          1180,180 1220,200 1260,170 1300,200 1340,180 1380,200 1420,170
          1460,200 1500,180 1540,200 1580,180 1620,200 1660,180 1700,200
          1740,180 1800,200 1800,310 0,310"
  fill="#1c1917"
  opacity="0.75"
/>
{/* Spodek (~810-860, x=815..855) — UFO-shaped ellipse on top */}
<ellipse cx="835" cy="125" rx="40" ry="14" fill="#1c1917" opacity="0.8" />
<ellipse cx="835" cy="115" rx="22" ry="10" fill="#1c1917" opacity="0.85" />
```

Spodek profil (UFO arena Katowice): centrálna pozícia, dvojvrstvová ellipse imituje "klobúk" (priestorová strecha). License-OK ako landmark silhouette.

**LAYER 3 — Foreground buildings (powered + lit-on-play):**

Modify `BuildingSilhouette` (city-skyline-hero.tsx existing function):
```tsx
function BuildingSilhouette({
  slot, level, glyph, roof, body, label, gameId, hasPlayed,
}: {
  slot: SlotDef; level: number; glyph: string;
  roof: string; body: string; label: string;
  gameId: string;          // NEW — link to lib/games.ts entry
  hasPlayed: boolean;      // NEW — true if player has any score on this building's game
}) {
  const levelScale = Math.min(1, 0.7 + level * 0.05);  // PR-J spec
  const h = slot.h * levelScale;
  const y = slot.y + slot.h - h;
  const roofH = h * 0.2;
  const bodyH = h - roofH;
  const litColor = hasPlayed ? "#fef3c7" : "#1c1917";
  const litOpacity = hasPlayed ? 0.85 : 0.3;
  return (
    <g aria-label={`${label} L${level}${hasPlayed ? " · zapnutá" : " · vypnutá"}`} filter="url(#bldg-shadow)">
      {/* body */}
      <rect x={slot.x} y={y + roofH} width={slot.w} height={bodyH} fill={body} stroke="#1c1917" strokeWidth="0.5" strokeOpacity="0.7" />
      {/* roof */}
      <polygon points={`${slot.x},${y + roofH} ${slot.x + slot.w / 2},${y} ${slot.x + slot.w},${y + roofH}`} fill={roof} />
      {/* lit-on-play windows — 2x2 grid */}
      {Array.from({ length: 4 }).map((_, i) => {
        const wx = slot.x + 6 + (i % 2) * (slot.w - 14);
        const wy = y + roofH + 8 + Math.floor(i / 2) * (bodyH - 14);
        return (
          <rect
            key={i}
            x={wx} y={wy} width={6} height={6}
            fill={litColor}
            opacity={litOpacity}
          />
        );
      })}
      {/* glyph centred on body */}
      <text x={slot.x + slot.w / 2} y={y + roofH + bodyH * 0.6}
            textAnchor="middle"
            fontSize={Math.min(36, slot.w * 0.45)}
            fill={hasPlayed ? "white" : "#3f3f46"}
            opacity={hasPlayed ? 1 : 0.6}>
        {glyph}
      </text>
      {/* L badge bottom-left */}
      <text x={slot.x + 4} y={y + roofH + bodyH - 4}
            fontSize="14" fontWeight="700"
            fill="white"
            style={{ paintOrder: "stroke", stroke: "#1c1917", strokeWidth: 2.5 }}>
        L{level}
      </text>
      {/* lit-on-play warm glow halo around building when hasPlayed=true */}
      {hasPlayed && (
        <ellipse
          cx={slot.x + slot.w / 2}
          cy={y + roofH + bodyH * 0.5}
          rx={slot.w / 1.5}
          ry={bodyH / 1.5}
          fill="url(#lit-window-glow)"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
```

**Drop shadow filter** v defs:
```svg
<filter id="bldg-shadow">
  <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.45" />
</filter>
```

**LAYER 4 — Cobble street + 5-7 lampy:**
```svg
<!-- 3-zone ground -->
<rect x="0" y="306" width="1800" height="3" fill="#1c1917" opacity="0.8" />     <!-- grass strip -->
<rect x="0" y="309" width="1800" height="68" fill="url(#cobble-warm)" />        <!-- cobblestone road -->
<rect x="0" y="377" width="1800" height="13" fill="#3f2f24" />                  <!-- sidewalk -->

<!-- 6 streetlights (lit, warm) -->
{[150, 450, 750, 1050, 1350, 1650].map((x, i) => (
  <g key={i} transform={`translate(${x}, 309)`}>
    <ellipse cx="0" cy="0" rx="55" ry="14" fill="url(#lamp-pool-warm)" />     <!-- pool of light -->
    <line x1="0" y1="0" x2="0" y2="-46" stroke="#1c1917" strokeWidth="2.5" />
    <circle cx="0" cy="-50" r="8" fill="#1c1917" />
    <circle cx="0" cy="-50" r="4" fill="#fde047" />
    <circle cx="0" cy="-50" r="14" fill="#fde047" opacity="0.3" />
  </g>
))}
```

### E-01-B: Per-building lit-on-play data flow

**Source of truth:** `bestScore > 0` per game ID. Aggregate v server component a pass down do `CitySkylineHero`:

V `app/miasto/page.tsx` (server) pridať:
```tsx
import { getGame } from "@/lib/games";
import { gameLeaderboard } from "@/lib/leaderboard";

const gameStates = await Promise.all(
  player.buildings.map(async (b) => {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry?.gameId) return { catalogId: b.catalogId, hasPlayed: false };
    // bestScore from per-user store (not leaderboard) — ak existuje stat
    const stat = player.gameStats?.[entry.gameId];
    return { catalogId: b.catalogId, hasPlayed: (stat?.plays ?? 0) > 0 };
  })
);

<CitySkylineHero
  buildings={player.buildings}
  lang={lang}
  gameStates={gameStates}  // NEW prop
/>
```

V `lib/building-catalog.ts` zaviazať každú catalog entry na gameId (ak ešte nie je):
```ts
export type BuildingCatalogEntry = {
  catalogId: string;
  // … existing fields
  gameId?: string;  // NEW — link to lib/games.ts (only for buildings tied to a mini-game)
  // ...
};
```

V `CitySkylineHero` props:
```tsx
type Props = {
  buildings: PlayerState["buildings"];
  lang: Lang;
  gameStates: { catalogId: string; hasPlayed: boolean }[];  // NEW
  emptyStateCta?: string;
};
```

V render path lookup `hasPlayed` per slot a pass do `BuildingSilhouette`.

### E-01-C: CSS scope adjustments

V `app/globals.css` upraviť existing `.city-skyline-hero-root` block (z PR-K) — odstrániť light bg + outline (nepotrebné, scéna je teraz tmavá):
```css
:where([data-skin="pko"]) .city-skyline-hero-root {
  background: transparent;            /* SVG fills full canvas with sunset gradient */
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
:where([data-skin="pko"]) .city-skyline-hero-root .city-skyline-empty-overlay {
  background: linear-gradient(180deg, rgba(28, 25, 23, 0.6), rgba(28, 25, 23, 0.85));
  color: #fffbeb;
}
:where([data-skin="pko"]) .city-skyline-hero-root .city-skyline-empty-overlay p {
  color: #fffbeb;
}
:where([data-skin="core"]) .city-skyline-hero-root {
  /* core legacy — keep night sky from inline SVG defs */
}
```

### E-01-D: Storytelling overlay copy update

`NIGHT_COPY` z PR-J (twilight wording) ostáva, ale **uprav timing referenciu**:
```tsx
const SUNSET_COPY: Record<Lang, { title: string; body: string }> = {
  pl: {
    title: "Słońce zachodzi nad Katowicami",
    body: "Lampy się zapalają — Twoje budynki jeszcze nie. Zagraj minigrę, żeby zaświecić okna w odpowiedniej budowli.",
  },
  uk: {
    title: "Сонце сідає над Катовіце",
    body: "Ліхтарі загораються — твої будинки ще ні. Зіграй міні-гру, щоб засвітити вікна в потрібній будівлі.",
  },
  cs: {
    title: "Slunce zapadá nad Katovicemi",
    body: "Lampy se rozsvěcují — tvé budovy ještě ne. Zahraj minihru, ať se rozsvítí okna v té správné budově.",
  },
  en: {
    title: "Sun sets over Katowice",
    body: "Lamps are coming on — your buildings aren't. Play a mini-game to light up the windows of the matching building.",
  },
};
```

### E-01-E: Mobile portrait (390 viewport)

Pre `<sm` (≤640px) compact:
- Skip Katowice silhouette (krát Spodek)
- 3 lampy namiesto 6
- Mesiac top-left zostáva (malý, 28px)
- viewBox neuprav, len skry layery cez CSS `display:none` na child `<g class="dusk-backdrop">`

### E-01 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `04-miasto.png` | Vidno sunset gradient, slnko za obzorom, mesiac top-left, Spodek silueta, 6 lámp s warm halo, cobble street; 0+ vypnutých budov (dark windows) |
| Walkthrough `04-miasto-played.png` | Test seed: hráč má score na 3 budovách → tie 3 majú lit windows + warm halo, ostatné dark |
| axe-core | 0 findings; overlay text WCAG AA na sunset gradient |
| Mobile screenshot | Compact varianta — žiadne overflow, žiadne čierne pozadie cez celý viewport |
| Core skin | `SKIN=core` → /miasto vyzerá identicky ako PRED PR-L |

---

## E-02 · R-09 redo — WattMeter úplne neviditeľný (CRITICAL)

**Čo užívateľ vidí** (live review screenshot 19.04.04, `/games`): pod 9 evergreen budovami v CityScene **žiadne žlté progress bary**. PR-J + PR-K spec popisoval: rename className `.watt-meter`, scoped exception z .city-scene-root retint, "empty state 4% sliver pri score=0". **Zjavne neimplementované alebo override regression.**

**Súbor:**
- `components/city-scene.tsx` (`WattMeter` komponent ~riadok 1638)
- `app/globals.css` (overrides — overiť že `.watt-meter-bg` selector beats attribute selectors)

### E-02-A: Diagnostika — overiť čo PR-K skutočne shipnul

```bash
git show c864c98 -- components/city-scene.tsx | grep -A 10 "WattMeter"
git show c864c98 -- app/globals.css | grep -A 5 "watt-meter"
```

Ak chýba `.watt-meter` className v JSX **alebo** ak CSS rules majú nižšiu specificity ako attribute overrides (riadky 305-316 globals.css) — fix below.

### E-02-B: Refactor

V `city-scene.tsx`:
```tsx
function WattMeter({ x, y, w, value, cap }: { x: number; y: number; w: number; value: number; cap: number }) {
  if (cap <= 0) return null;
  const pct = Math.min(1, value / cap);
  const empty = pct === 0;
  return (
    <g className="watt-meter" data-empty={String(empty)}>
      <rect className="watt-meter-bg" x={x} y={y} width={w} height={8} rx={2} />
      <rect
        className="watt-meter-fill"
        x={x + 1} y={y + 1}
        width={empty ? Math.max(6, (w - 2) * 0.06) : (w - 2) * pct}
        height={6}
      />
      <text
        className="watt-meter-label"
        x={x + w / 2} y={y + 18}
        textAnchor="middle" fontSize={7} fontWeight={600}
      >
        {value} / {cap} W
      </text>
    </g>
  );
}
```

V `app/globals.css` pridať NA KONIEC city-scene block (po existing R-02 rules):
```css
/* E-02: WattMeter — explicit class-based selectors that BEAT the
 * .city-scene-root attribute overrides (specificity 0,1,1 > 0,0,2,1).
 * Required because PR-G G-01 broaden retintnul #0a0a0f → light grey,
 * which made the meter background invisible. */
.city-scene-root .watt-meter-bg {
  fill: #1e1b4b !important;     /* deep navy bg — high contrast on light scene */
  stroke: #1e1b4b !important;
  stroke-width: 1;
}
.city-scene-root .watt-meter-fill {
  fill: #fde047 !important;     /* PKO yellow — explicit override */
  transition: width 0.4s ease-out;
}
.city-scene-root .watt-meter[data-empty="true"] .watt-meter-fill {
  fill: #fef3c7 !important;     /* light cream — empty bar still visible */
  opacity: 0.7;
}
.city-scene-root .watt-meter-label {
  fill: var(--ink-muted);
  font-family: ui-monospace, monospace;
  letter-spacing: 0.02em;
  pointer-events: none;
}
.city-scene-root .watt-meter[data-empty="true"] .watt-meter-label {
  opacity: 0.5;
}
/* Counter parent .city-scene-root filter — keep meter at full saturation */
:where([data-skin="pko"]) .city-scene-root .watt-meter {
  filter: saturate(2.85) brightness(0.65) contrast(1.08);
}
```

**`!important` je tu obhájiteľný** — `.watt-meter-bg` je sémanticky brand-fixed indicator, NIE general scene element. PR-G mass override je necielená; class-based exception zachovava obe.

### E-02-C: AI buildings WattMeter

`LiveAiBuilding` v city-scene.tsx volá `WattMeter` pre `aiGame.cap > 0`. Zmena E-02-B sa autom. propaguje aj na AI slots.

### E-02 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `09-games.png` | Vidno žltý/cream progress bar pod každou z 9 evergreen + 3 AI buildings |
| Vitest | Nový `components/watt-meter.test.tsx` — render with cap=0 returns null, cap=100 value=0 renders empty cream sliver, cap=100 value=50 renders 50% yellow |
| axe-core | 0 findings — yellow `#fde047` na navy `#1e1b4b` má contrast ≥ 7:1 |
| Vizuálny diff | Side-by-side `pre-pr-l/games.png` vs `post-pr-l/games.png` — bars sú visible |

---

## E-03 · i18n hardcoded strings — game.title, product types, AI metadata (CRITICAL)

**Čo užívateľ vidí** (live review na CS lang, screenshoty 19.04.15 + 19.10.01):
- `/leaderboard` tabs: **"Quiz finansowy", "Sprint matematyczny", "Budžet domowy", "Gra pamięciowa", "Pary walutowe", "Litery w chaosie"** — všetko PL napriek `cs` cookie
- `/leaderboard` AI challenge card: **"Karta kredytowa vs debetowa"** — PL
- `/loans/compare` table "Produkt" stĺpec: **"mortgage", "kredyt konsumencki"** — EN/PL raw type IDs
- `/games` "Mapa budov" tabuľka: niektoré CS, niektoré PL mix

**Root cause:** PR-K adresoval cookie/cache layer (`revalidatePath` + reload guard). Ale **zdroj** stringov je hardcoded:
- `lib/games.ts` — `title: "Energetyczny sprint"` (single PL string per game, žiadny per-Lang map)
- `lib/games.ts` — `name: "Silesia Solar Farm"` (single string per building)
- `components/loan-comparison.tsx:302` `{row.type.replace(/_/g, " ")}` — renderuje raw type ID (`"mortgage"`, `"kredyt_konsumencki"`)
- AI challenge envelopes — generated content, žiadny per-Lang fallback

**Súbory:**
- `lib/games.ts` (refactor `title` + `building.name` na per-Lang map)
- `lib/locales/{pl,uk,cs,en}.ts` (pridať `games.<gameId>.title` keys)
- `components/loan-comparison.tsx:302` (use translated product label)
- `lib/loans.ts` (pridať `LOAN_PRODUCT_LABELS: Record<ProductLoanType, Record<Lang, string>>`)
- `lib/ai-pipeline/publish.ts` alebo wherever AI envelopes carry titles (pridať per-Lang title field)

### E-03-A: Refactor `lib/games.ts` GameMeta

```ts
// lib/games.ts
import type { Lang } from "@/lib/i18n";

export type GameMeta = {
  id: string;
  title: Record<Lang, string>;          // CHANGED from string
  emoji: string;
  building: {
    name: Record<Lang, string>;          // CHANGED from string
    glyph: string;
    shape: "tall" | "wide";
    body: string;
    roof: string;
  };
  // ... existing fields
};

export const GAMES: GameMeta[] = [
  {
    id: "energy-dash",
    title: {
      pl: "Energetyczny sprint",
      uk: "Енергетичний спринт",
      cs: "Energetický sprint",
      en: "Energy sprint",
    },
    emoji: "⚡",
    building: {
      name: {
        pl: "Silesia Solar Farm",
        uk: "Силезька сонячна ферма",
        cs: "Slezská solární farma",
        en: "Silesia Solar Farm",
      },
      // ... rest
    },
    // ...
  },
  // ... 8 more games
];
```

**Refactor consumers** (každé miesto kde sa volá `g.title`):
- `app/leaderboard/page.tsx:107` `{g.emoji} {g.title}` → `{g.emoji} {g.title[lang]}`
- `app/leaderboard/page.tsx:85, 162` `t.gameBody.replace("{title}", game.title)` → `game.title[lang]`
- `app/page.tsx:41, 90, 180` → `g.title[lang]`
- `app/sin-slavy/page.tsx:114` → `g.title[lang]`
- `app/games/page.tsx:39` → `g.title[lang]`
- `app/games/ai/[id]/page.tsx:96` `<h1>{game.title}</h1>` → `<h1>{game.title[lang]}</h1>`

**Building names** (stringy ako "PKO Tower" sú často brand assets — netreba prekladať VŠETKY, ale aspoň "Silesia Solar Farm" → "Slezská solární farma"). Per-game decision v PR.

### E-03-B: Loan product labels

V `lib/loans.ts` pridať:
```ts
export const LOAN_PRODUCT_LABELS: Record<ProductLoanType, Record<Lang, string>> = {
  mortgage: {
    pl: "Hipoteka",
    uk: "Іпотека",
    cs: "Hypotéka",
    en: "Mortgage",
  },
  kredyt_obrotowy: {
    pl: "Kredyt obrotowy",
    uk: "Оборотний кредит",
    cs: "Provozní úvěr",
    en: "Working capital loan",
  },
  kredyt_konsumencki: {
    pl: "Kredyt konsumencki",
    uk: "Споживчий кредит",
    cs: "Spotřebitelský úvěr",
    en: "Consumer loan",
  },
  leasing: {
    pl: "Leasing",
    uk: "Лізинг",
    cs: "Leasing",
    en: "Leasing",
  },
};
```

V `components/loan-comparison.tsx:302` zmeniť:
```tsx
import { LOAN_PRODUCT_LABELS } from "@/lib/loans";

<span className="block">{LOAN_PRODUCT_LABELS[row.type][lang]}</span>
```

### E-03-C: AI challenge i18n

AI envelopes generated by LLM pipeline. Možnosti:
1. **LLM generuje 4 lang variants** (most expensive but cleanest — vyžaduje Claude prompt engineering)
2. **Single PL primary + render with `<span lang="pl">`** (a11y signal že text je v inom jazyku, screen reader prepne hlas)
3. **Display "AI Wyzwanie" s neutrálnym labelom** (ignoruje konkrétny title až user otvorí game)

Pre Pass-8 odporúčam **(2)** — minimálny scope, semantically correct. Implementácia:
```tsx
// components/games/ai-challenge-card.tsx alebo wherever
<span lang="pl" title={t.aiTitleFromPolish}>
  {aiEnvelope.title}
</span>
```

V locales pridať `aiTitleFromPolish` ako `<title>` tooltip:
- pl: `"Wyzwanie AI (oryginał)"`
- cs: `"AI výzva (originál v polštině)"`
- atď

### E-03-D: Audit grep — find ostatné hardcoded strings

```bash
grep -rnE "['\"](Quiz finansowy|Sprint matematyczny|Budżet domowy|Gra pamięciowa|Pary walutowe|Litery w chaosie|Energetyczny sprint|Przełącznik mocy|Kurs akcji)['\"]" components app lib | grep -v test | grep -v _fe-fix

grep -rnE "['\"](mortgage|kredyt_konsumencki|kredyt_obrotowy|leasing)['\"]" components app | grep -v test | grep -v lib/loans

grep -rnE "row\.type|game\.title|g\.title|building\.name" components app | grep -v test
```

Audit results (zoznam files + lines kde ostali hardcoded) v PR-L description.

### E-03 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `15-leaderboard.png` (cs) | Tabs: "Energetický sprint, Přepínač síly, Kurz akcií, Domácí rozpočet, Finanční kvíz, Matematický sprint, Paměťová hra, Měnové páry, Slovní zmatek" |
| Walkthrough `15-leaderboard.png` (uk + en + pl) | Per-lang variants OK |
| Walkthrough `06-loans-compare.png` (cs) | "Produkt" col ukáže "Hypotéka" + "Spotřebitelský úvěr" namiesto raw IDs |
| Vitest | Nový `lib/games-i18n.test.ts` — každá `GAMES[i].title` má všetky 4 langs, žiadny null/undefined |
| Vitest | Nový `lib/loans-product-labels.test.ts` — every ProductLoanType key prítomný v LOAN_PRODUCT_LABELS × 4 langs |
| Audit grep | 0 hardcoded strings z spomenutých polských slov mimo `lib/locales/pl.ts` |

---

## E-04 · Copy ↔ visual sync — "🌙 Noc · 22:14" → sunset (MAJOR)

**Čo užívateľ vidí** (`/games` heading, screenshot 19.04.04): heading chip **"🌙 Noc · 22:14"** + subtitle **"Dokud nějakou nezahraješ, budova stojí ve tmě. Po skóre se rozsvíti okna a neonová tabule."** Vizuál `/games` CityScene compact je **light pko** (R-02 fix). Copy hovorí "noc + neón", vizuál hovorí "deň/cream surface" → **kognitívny disonans**.

Po **E-01 implementácii** sa CitySkylineHero stane sunset (slnko za obzorom). Ale `CityScene` na `/games` je **iný komponent** — mal by tiež reflektovať sunset/twilight, alebo minimálne **copy treba zladiť**.

**2 cesty:**
- **A) Sync copy s aktuálnym vizuálom** (light pko skin): `/games` heading "Tvé Katovice · pohodový den" + subtitle "Hraj minihry, aby si rozsvítil okna budov v noci."
- **B) Sync vizuál s copy** (twilight scene aj na `/games`): aplikovať E-01 sunset reskin aj na CityScene compact

**Odporúčanie:** **(B)** — konzistencia v rámci celej app. Twilight ako default time-of-day pre celý "city" surface (`/miasto` skyline-hero + `/games` city-scene + dashboard preview). Neutrálne dekorácie zostávajú PKO.

### E-04-A: Apply sunset to CityScene compact

V `components/city-scene.tsx` adopt rovnaké vrstvy ako E-01 (sunset sky, moon, distant skyline, lamps). ALE: city-scene je interactive (hover na buildings) → keep complexity manageable. Možný **conditional sunset opt-in** cez prop:
```tsx
<CityScene compact aiGames={aiGames} sunset />  // /games hub uses sunset
<CityScene games={cityGames} loggedIn />       // legacy /miasto detail UI keeps current
```

Sunset prop adds:
- `defs` so sunset-sky, moon-soft, lamp-pool-warm gradients
- Background fill switch: `bg-[var(--surface-2)]` → `fill="url(#sunset-sky)"` na background rect
- Optional Katowice silhouette + lampy layers

**TICKET SCOPE:** Pre Pass-8 stačí **opt-in sunset na `/games` hub jen** (`compact` mode prop). Plne sunset na všetkých CityScene mountoch je Pass-9.

### E-04-B: Copy update v locales

`lib/locales/{cs,pl,uk,en}.ts` riadok 105:
```ts
// before
gamesHubTime: "🌙 Noc · 22:14",  // cs

// after — dynamic time-of-day OR sunset literal
gamesHubTime: "🌅 Soumrak · 19:42",  // cs sunset
```

Pre PL/UK/EN paralely:
- pl: `"🌅 Zachód słońca · 19:42"`
- uk: `"🌅 Захід сонця · 19:42"`
- en: `"🌅 Sunset · 19:42"`

Subtitle update v `lib/locales/cs.ts:106` (alebo wherever):
- before: `"Dokud nějakou nezahraješ, budova stojí ve tmě. Po skóre se rozsvíti okna a neonová tabule."`
- after: `"Slunce zapadá. Lampy se rozsvěcují, ale tvé budovy ještě ne. Zahraj minihru, ať se rozsvítí okna v té správné budově."`

Per-Lang paralely.

### E-04 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `09-games.png` (cs) | Heading: "🌅 Soumrak · 19:42"; subtitle reflektuje lit-on-play storytelling |
| Vizuálny diff `09-games.png` | Pred (light pko) ↔ po (sunset opt-in) — rozdiel viditeľný, copy sedí s vizuálom |

---

## E-05 · R-10 deferred — i18n e2e Playwright + grep audit (MAJOR)

PR-K shipnul `revalidatePath` + reload guard ako root-cause fix, ale **e2e test + audit defernuté**. Ostáva nedotiahnuté:
- `e2e/i18n-consistency.spec.ts` (nový spec, 4 testy)
- `pnpm grep` audit pre hardcoded strings

E-03 už dotiahne audit pre `games.ts` + `loans.ts`. Pre E-05 stačí dať **Playwright e2e** že language switch je consistent end-to-end:

### E-05-A: Playwright spec

Vytvoriť `e2e/i18n-consistency.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

const LANGS = ["pl", "uk", "cs", "en"] as const;

const NAV_SAMPLE: Record<typeof LANGS[number], string> = {
  pl: "Miasteczko",
  uk: "Містечко",
  cs: "Městečko",
  en: "City",
};

const LOAN_HEADING_SAMPLE: Record<typeof LANGS[number], string> = {
  pl: "Porównaj kredyty",
  uk: "Порівняй кредити",
  cs: "Porovnej půjčky",
  en: "Compare loans",
};

const PRODUCT_LABEL_SAMPLE: Record<typeof LANGS[number], string> = {
  pl: "Hipoteka",
  uk: "Іпотека",
  cs: "Hypotéka",
  en: "Mortgage",
};

for (const lang of LANGS) {
  test(`language ${lang} consistent across nav + /loans/compare`, async ({ page, request }) => {
    // Login as test account (assumes seeded)
    await page.goto("/login");
    await page.getByLabel(/(usuario|nazwa|jméno|name|логін)/i).fill("playwright-i18n");
    await page.getByLabel(/(hasło|heslo|password|пароль)/i).fill("test-pw");
    await page.getByRole("button", { name: /(zaloguj|přihlás|login|увійти)/i }).click();
    await page.waitForURL(/\//);

    // Switch language via API
    await request.post("/api/lang", { data: { lang } });
    await page.reload();

    // Verify nav
    await expect(page.locator("nav").first()).toContainText(NAV_SAMPLE[lang]);

    // Verify /loans/compare body
    await page.goto("/loans/compare");
    await expect(page.getByRole("heading", { name: LOAN_HEADING_SAMPLE[lang] })).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toContainText(PRODUCT_LABEL_SAMPLE[lang]);
  });
}
```

Test sa pridá do existing `playwright.config.ts` projekt-listy.

### E-05-B: CI enforcement

V `.github/workflows/ci.yml` pridať `pnpm test:e2e e2e/i18n-consistency.spec.ts` za existing playwright krok.

### E-05 Quality gates

| Gate | Kritérium |
|------|-----------|
| `pnpm test:e2e i18n-consistency.spec.ts` | 4 zelené testy (pl/uk/cs/en) |
| CI run | i18n test je súčasť mandatory PR check |

---

## E-06 · MortgageCard plný refactor → LoanComparison inline (MINOR, optional)

PR-J spec ponúkal túto cestu, FE konzervatívne patchol existing MortgageCard. Pass-8 je teraz vhodný moment:

**Cieľ:** odstrániť dual mortgage-quote codepath. MortgageCard → wrapper na `<LoanComparison variant="inline" defaultProduct="mortgage" />`.

**Súbory:**
- `components/watt-city/watt-city-client.tsx:620-810` (delete MortgageCard render path, replace with LoanComparison wrapper)
- `components/loan-comparison.tsx` (pridať `defaultProduct?: ProductLoanType` filter prop — render len daný product na inline mode)

### E-06-A: Wrapper

```tsx
// V watt-city-client.tsx, wherever MortgageCard mount je
<LoanComparison
  rows={await compareLoans(500, 24, state, { onlyType: "mortgage" })}
  lang={lang}
  principal={500}
  termMonths={24}
  variant="inline"
  defaultProduct="mortgage"
/>
```

### E-06 Quality gates

| Gate | Kritérium |
|------|-----------|
| Walkthrough `04-miasto.png` | Mortgage panel zobrazuje LoanComparison inline (žiadny duplicate slider/segments) |
| Vitest | Existing MortgageCard tests buď deleted alebo migrated na LoanComparison inline |
| Manual smoke | Vzít úvěr POST identical contract (`/api/loans/take` so `principal` + `termMonths`) |

**Optional — ak FE odhadne >2h dodatočného scope, odložiť na Pass-9.**

---

## 1 · Acceptance gate

```bash
pnpm typecheck && pnpm lint && pnpm test
WALKTHROUGH_LABEL=post-pr-l pnpm test:walk
pnpm test:walk:diff
pnpm test:e2e ux-fixes && pnpm test:e2e i18n-consistency.spec.ts
```

Manual smoke (live dev):
- /miasto → vidno sunset hero, mesiac top-left, slnko za obzorom, Spodek silueta, 6 lámp, vypnuté budovy s dark windows
- Hraj 1 game → spätne /miasto → tá konkrétna budova má **lit windows + warm halo**
- /games → "🌅 Soumrak · 19:42" heading, žltý watt meter pod každou budovou
- /leaderboard → tabs v aktívnom jazyku (CS: "Finanční kvíz", "Matematický sprint", atď.)
- /loans/compare → "Produkt" col: "Hypotéka" namiesto "mortgage"
- Switch lang pl→cs→pl → /miasto, /games, /leaderboard texts kompletne zmenia jazyk

---

## 2 · Order of operations (PR-L, 6 commitov)

1. **E-03 i18n hardcoded strings** — najprv (najmenší vizuálny risk, foundation pre ostatné)
2. **E-02 watt meter** — quick CSS+JSX fix
3. **E-04 copy/visual sync** — locale strings only (žiadny SVG diff zatiaľ)
4. **E-05 e2e i18n test** — overí E-03 + E-04
5. **E-01 R-05 sunset reskin** — najväčší vizuálny diff
6. **E-06 MortgageCard refactor** (optional, ak time-box dovolí)

---

## 3 · Reproducer / debug aids

```bash
# 1. Seed test account with games played (for lit-on-play verification)
node -e "require('./scripts/seed-test-player.mjs')"

# 2. Run dev with PKO skin explicitly
SKIN=pko pnpm dev

# 3. Verify both skins
SKIN=core pnpm test:walk    # core regression check
SKIN=pko pnpm test:walk     # pko forward check
```

---

## 4 · Edge cases / known unknowns

- **Game.title refactor** broke v PR-L môže vplyvniť legacy seed data v Vercel KV (game stat keys používajú game.id, ale potential analytic queries môžu používať title). Audit pred merge.
- **Lit-on-play data** — `player.gameStats?.[gameId].plays` musí existovať pre každého user. Ak chýba, fallback na false (vypnuté). Verify že `lib/player.ts` initializuje `gameStats: {}` pre new accounts.
- **Sunset gradient na mobile** — `#db5a3a` coral horizon môže byť na low-res displeji "agresívne oranžové". Ak QA flagne, znížiť opacity na 0.8 alebo posunúť stop offset.
- **AI title `<span lang="pl">`** — overiť že screen reader (VoiceOver / NVDA) skutočne prepne hlas. Ak nie, fallback na visible "(PL)" suffix label.
- **Spodek copyright** — ostáva user-confirmed safe (silhouette, public landmark). Ak PKO design team flagne, fallback na generic 2-tier ellipse.

---

## 5 · Reporting back

Po dokončení napíš merge-report v štýle PR-J/K correspondence:
- **Per-commit summary** (čo + ktoré súbory + diff size)
- **Quality gates results** (typecheck/lint/vitest/playwright pass counts)
- **Walkthrough delta** — top 3 vizuálne zmeny + screenshot diffs
- **i18n audit results** — table {file, count of hardcoded strings before/after}
- **Lit-on-play smoke test** — výsledky 3 budov pred/po game played
- **Open follow-ups** (E-06 ak deferred, ďalšie hardcoded stringy ak audit ich nájde)
