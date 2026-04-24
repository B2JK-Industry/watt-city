# Component Spec

Spec pre každý komponent ktorý redesign zasiahne. Každý má: anatómiu, stavy, varianty, DO/DON'T, a konkrétnu cestu v repe.

> Konvencia: **Default = light skin (`pko`)**. Staré neo-brutalist štýly sú zachované pod `[data-skin="core"]` ako legacy.

---

## 1. Button — `.btn`, `.btn-*`

**Zdrojový súbor:** `app/globals.css` riadky 176–218.

### Anatómia
```
┌──────────────────────┐
│  [icon]  Label       │   padding 12 × 20, min-height 44
└──────────────────────┘
   ↑ radius 10         ↑
   ↑ border/shadow-line
```

### Varianty

| Variant | Trieda | Pozadie | Text | Border | Shadow | Kedy |
|---|---|---|---|---|---|---|
| Primary (navy) | `.btn` | `--accent` | biely | none | `elev-line` on hover | default akcia |
| Sales (orange) | `.btn .btn-sales` | `--sales` | biely | none | `elev-line` on hover | registrácia, CTA s cenou |
| Secondary (outline) | `.btn .btn-secondary` | transparent | `--accent` | `1px solid var(--accent)` | none | vedľajšia akcia |
| Ghost (text-only) | `.btn .btn-ghost` | transparent | `--accent` | none | underline on hover | v toolbar / v tabuľkách |
| Danger | `.btn .btn-danger` | transparent | `--danger` | `1px solid var(--danger)` | none | delete, logout confirm |
| Disabled | `:disabled` | — | — | — | — | opacity 0.5, `cursor-not-allowed` |

### Veľkosti

| Size | Font | Padding X | Height |
|---|---|---|---|
| `sm` | 14 | 14 | 36 |
| `md` (default) | 16 | 20 | 44 |
| `lg` | 18 | 24 | 52 |

### Stavy

- **Default:** vyplnený / outline podľa variantu
- **Hover:** primary → `--accent-hover` bg; sales → `--sales-hover` bg; secondary → `--surface-2` bg; ghost → underline
- **Focus-visible:** `outline: 2px solid var(--accent); outline-offset: 2px`
- **Active:** `transform: translateY(1px)` (iba primary/sales)
- **Loading:** spinner 16×16 + text fade to 0.7 opacity
- **Disabled:** `opacity: 0.5; pointer-events: none`

### DO
- ✅ Jediný `.btn` (primary alebo sales) na viewport sekciu
- ✅ Ikona vľavo od textu, 16×16 px, `currentColor`
- ✅ Ak má loading stav, zachovať šírku (spinner namiesto textu, nie skrátiť)

### DON'T
- ❌ `uppercase` text
- ❌ `font-weight: 800/900` (max 600)
- ❌ `box-shadow: Npx Npx 0 0 var(--ink)` hard-offset
- ❌ `border-[3px]` alebo väčšie
- ❌ Gradient bg

---

## 2. Card — `.card`

**Zdroj:** `app/globals.css` riadky 164–174.

### Default (pko)
```css
.card {
  background: var(--surface);
  border: 1px solid var(--line);        /* bolo: 3px solid --ink */
  border-radius: 10px;                   /* bolo: 14px */
  box-shadow: none;                      /* bolo: 6px 6px 0 0 --ink */
  padding: 24px;                         /* nový default */
}
.card:hover {
  border-color: var(--accent);           /* jemná akcentová reakcia */
  box-shadow: var(--shadow-soft);
}
```

### Varianty

| Variant | Trieda | Kedy |
|---|---|---|
| Plain | `.card` | Statický info box |
| Interactive | `.card.card--interactive` | Celá karta klikateľná — pridaj `role="link"`, focus ring |
| Elevated | `.card.card--elevated` | Modal content, floating panels |
| Sales | `.card.card--sales` | Produktová ponuka — pridaj overline `#promocja` tag v TL rohu |

---

## 3. Input — `.input`

**Zdroj:** `app/globals.css` riadky 220–235.

### Default (pko)
```css
.input {
  background: var(--surface);
  border: 1px solid var(--line);     /* bolo: 3px solid --ink */
  color: var(--foreground);
  border-radius: 0;                  /* pkobp.pl uses 0 on inputs */
  padding: 12px 16px;
  width: 100%;
  font-weight: 400;                  /* bolo: 600 */
  box-shadow: none;                  /* bolo: 4px 4px 0 0 --ink */
  transition: border-color 120ms ease;
  min-height: 44px;
}
.input:hover { border-color: var(--ink-muted); }
.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);   /* prebratý pattern z pkobp.pl */
}
.input:disabled {
  background: var(--surface-2);
  color: var(--ink-subtle);
  cursor: not-allowed;
}
.input[aria-invalid="true"] {
  border-color: var(--danger);
}
```

### Anatómia formulárového poľa

```
┌─────────────────────────────┐
│ Label (t-body-sm, ink-muted) │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  input                  │ │   height 44
│ └─────────────────────────┘ │
│ Helper / error (t-caption)   │
└─────────────────────────────┘
```

Gap label↔input: 6 px. Gap input↔helper: 4 px.

### DO
- ✅ Label **nad** poľom (nie placeholder-only)
- ✅ Error: ikona ⚠ + text — nikdy iba farba

### DON'T
- ❌ Placeholder ako label
- ❌ Rounded inputy (ostré 0 px je pkobp look)
- ❌ Float labels

---

## 4. Chip / Tag — `.chip`, `.brutal-tag`

**Zdroj:** `app/globals.css` riadky 237–249 (`.chip`), 532–543 (`.brutal-tag`).

### Redesign rozhodnutie

- `.chip` — zostáva pill tvaru, ale **bez brutalism**:
  ```css
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-muted);
    box-shadow: none;
    transition: all 120ms ease;
  }
  .chip:hover { border-color: var(--accent); color: var(--accent); }
  ```
- `.brutal-tag` — **zmazať** použitie z JSX, nahradiť `.chip` alebo `.t-overline span`. Trieda zostane v CSS pod `[data-skin="core"]`.

---

## 5. Navigation — `components/site-nav.tsx`

**Zdroj:** `components/site-nav.tsx` (199 riadkov).

### Target vzhľad (pkobp.pl)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Watt City]  Klient indywidualny ▾  Dla szkół  Oferta  Pomoc   🔍  [Zaloguj się]  [Otwórz konto] │
└──────────────────────────────────────────────────────────────────────┘
   height 72                                                       sticky top-0 z-10
```

### Špecifikácia

- `background: var(--surface)`, `border-bottom: 1px solid var(--line)`, height 72 px desktop / 56 px mobile
- Logo vľavo, nav stred, akcie vpravo
- Nav link: `color: var(--ink-muted)`, hover: `color: var(--accent)` (nie underline)
- Aktívna položka: `color: var(--accent)` + 2 px spodná navy čiara
- **Mega-menu** na `Klient indywidualny`: otvára sa pod navbarom, full-width dropdown s 3 stĺpcami, shadow `elev-soft-lg`, prechod 200 ms
- Mobile: hamburger → full-screen drawer, slide from right, `bg-surface`, položky `t-h5`

### Úprava role-aware logiky

Zachovať `role` prop a všetky existujúce vetvy (`anon`, `kid`, `teacher`, `parent`). Meníme **iba vizuál**, nie ktoré linky sa zobrazujú.

---

## 6. Bottom tabs — `components/bottom-tabs.tsx`

**Zdroj:** 68 riadkov.

### Target (mobile only)

- `background: var(--surface)`, `border-top: 1px solid var(--line)`, height 64 + safe-area
- 4 taby: Město, Gry, Ranking, Profil
- Aktívny tab: ikona + text `--accent`; neaktívny `--ink-muted`
- Ikony 24 × 24, text 11 px, weight 500
- **Žiadne** hard-offset shadows, **žiadne** brutalism bordery

---

## 7. Dashboard + Landing hero — `app/page.tsx`, `components/dashboard.tsx`

### Anonymná landing (pôvodné `app/page.tsx` 220 riadkov)

Sekcie zhora nadol:

| # | Sekcia | Vzhľad |
|---|---|---|
| 1 | Hero | `bg: var(--surface)`, max-w-1280, padding `section-y`. H1 `t-display`, podtitulok `t-body-lg`. Primary CTA `Otwórz konto` + Secondary `O platformie`. |
| 2 | „Czego potrzebujesz?" grid | 4 karty produktov (hry / miasto / kredit / friends) — `.card.card--interactive`, ikona 48 × 48 v TL rohu, overline tag, H3 nadpis, 2-riadkový popis, šípka v BR rohu |
| 3 | Kalkulačka kreditu | Jediná karta, `.card.card--elevated`, 2-stĺpcový layout: vľavo slidery, vpravo rata + CTA |
| 4 | IKO-like app promo | 2-stĺpcový: vľavo copy + CTA, vpravo screenshot mobile app |
| 5 | News / Aktuality | 3 horizontálne karty, každá: obrázok 4:3 | text blok, metadata `t-body-sm`, H4 titul |
| 6 | City scene preview | Existujúci `<CityScene interactive={false} compact />` — **ale farby rekalibrovať** (viď epic E4) |
| 7 | Footer | Viď bod 8 |

### Logged-in dashboard

Zachovať existujúcu štruktúru (`<CityScene interactive>` + game grid + leaderboard preview + city-level card). Redesign je **iba vizuálny**: karty, tlačidlá, typografia — všetko cez nové primitívy.

### DON'T
- ❌ Meniť akú komponentu renderujeme — logika routingu zostáva
- ❌ Pridávať alebo odoberať sekcie

---

## 8. Footer (4-vrstvový)

Neexistuje zatiaľ samostatný komponent — zavedieme `components/site-footer.tsx`.

### Vrstva 1 — Action bar
4 veľké pill tlačidlá v 4-stĺpcovom gride: `Umów spotkanie | Znajdź placówkę | Napisz do nas | Zadzwoń`.

### Vrstva 2 — Kurzy (len na landing page)
Kompaktná tabuľka CHF / USD / GBP / EUR. `font-variant-numeric: tabular-nums`, pravé zarovnanie čísel.

### Vrstva 3 — Link columns
5 stĺpcov, každý: H5 nadpis + ~6 linkov. Linky `t-body-sm`, `color: var(--ink-muted)`, hover `var(--accent)`.

### Vrstva 4 — Legal bar
`bg: var(--surface-2)`, padding 24 px. Copyright vľavo, social ikony vpravo (22×22, filled variant, `color: var(--ink-muted)`).

---

## 9. CashflowHUD — `components/cashflow-hud.tsx`

**Zdroj:** 341 riadkov.

- Karta `.card.card--elevated`
- Grid 3× (watts / coins / watts yield)
- Nadpis každého bloku: `t-overline` `text-ink-muted`
- Hodnota: `t-h3` `text-foreground`, `tabular-nums`
- Delta indikátor: `+12 /h` `text-success` alebo `-3 /h` `text-danger`, s ikonou šípky
- Hover delta flash (`@keyframes hud-delta-flash` už existuje) — **zachovať**, ale zmeniť farbu z `--neo-lime` na `--success`

---

## 10. Loan comparison — `components/loan-comparison.tsx`

**Zdroj:** 229 riadkov.

### Target — tabuľka v pkobp.pl štýle

- Žiadne karty okolo riadkov — jedna flat tabuľka
- Header row: `bg: var(--surface-2)`, weight 700
- Data row: `border-top: 1px solid var(--line)`, hover `bg: var(--surface-2)`
- Aktívny vybraný variant: `border-left: 3px solid var(--sales)` (jediné miesto kde sales akcent, lebo je to „odporúčané")
- Čísla: `tabular-nums`, pravostranné

---

## 11. City-scene — `components/city-scene.tsx`

**Zdroj:** 1679 riadkov SVG + React.

### Stratégia redesignu

City-scene je monolitný SVG s 73+ hardcoded hex farbami (z reverted SKO commitu PR-3 vieme, že sa to už skúšalo redukovať na 6 semantic vars — a spôsobilo to neon-saturovaný výsledok).

**Nová stratégia:**
1. Extrahovať farby do 8 semantic buckets: `sky`, `building-primary`, `building-secondary`, `roof`, `window`, `road`, `detail-warm`, `detail-cool`.
2. Každý bucket má navy/warm/cool ladený odtieň (nie neon).
3. Implementovať cez CSS premenné na root `<svg>` elemente, nie cez Tailwind utility.

### Konkrétne farby (návrh)

```css
[data-skin="pko"] .city-scene {
  --sc-sky: #e8f0f9;            /* veľmi svetlá navy */
  --sc-building-primary: #d8dde5;
  --sc-building-secondary: #c4ccd8;
  --sc-roof: #a7b0bf;
  --sc-window: #f9d97a;          /* mierne teplé, diskrétne */
  --sc-road: #6b7280;
  --sc-detail-warm: #db912c;     /* akcent — PKO orange, len 3% plochy */
  --sc-detail-cool: #003574;     /* akcent — PKO navy */
}
```

### Epicové riešenie

Toto je samostatný epic **E4** v backlogu (veľká práca — 3–5 dní).

---

## 12. Mascot — `components/pko-mascot.tsx`

**Zdroj:** 47 riadkov.

### Rozhodnutie: komponent dočasne **nerenderuje nič**.

```tsx
export default function PkoMascot() {
  const theme = resolveTheme();
  if (!theme.mascot) return null;    // ← nový guard
  return <div aria-label={theme.mascot.label} dangerouslySetInnerHTML={{ __html: theme.mascot.svg }} />;
}
```

Žiaden fallback placeholder. Dôvod: SKO revert commit explicitne povedal „radšej nič než broken-image placeholder".

---

## 13. Cookie consent — `components/cookie-consent.tsx`

**Zdroj:** 107 riadkov.

- Fixed bottom, full-width, `bg: var(--surface)`, `border-top: 1px solid var(--line)`, shadow `elev-soft-lg`
- Padding 24 px
- 2 riadky textu max + 3 tlačidlá rovnakej veľkosti: `Akceptuj` (primary), `Odrzuć` (secondary), `Ustawienia` (ghost)
- **Žiadny dark-pattern** — tlačidlá rovnakej váhy

---

## 14. Toast / Notifications

**Zdroje:** `tier-up-toast.tsx`, `new-game-toast.tsx`, `notification-bell.tsx`.

- Pozícia: bottom-center (mobile), top-right (desktop)
- `bg: var(--surface)`, `border: 1px solid var(--line)`, radius 10, shadow `elev-soft`
- Ikona 20 × 20 vľavo, text uprostred, close × vpravo
- Max-width 360 px
- Entrance: `translateY(8px) → 0` 200 ms `cubic-bezier(.4,0,.2,1)` + opacity 0 → 1
- Auto-dismiss 5 s, pauza na hover

---

## 15. Modals, Drawers

Existuje distribuovane (onboarding, delete account, profile edit). Zaviesť jedinú spec:

- **Backdrop:** `background: rgba(0,0,0,0.5)`, fade-in 200 ms
- **Container:** `bg: var(--surface)`, radius 16 px, shadow `elev-soft-lg`, max-w 560 px
- **Header:** H3 nadpis + close icon button, border-bottom `1px solid var(--line)`
- **Body:** padding 32, `t-body`
- **Footer:** border-top, padding 16 24, akcie vpravo

---

## 16. Loader / Spinner

- SVG krúžok 24 × 24, stroke 2 px `var(--accent)`, 75% arc, rotácia 1 s linear
- Väčšia variant 40 × 40 pre full-page načítanie, wrapped v `.card`

---

## 17. Podium / Leaderboard — `components/dashboard.tsx`

**Zdroj:** line/row primitives v `globals.css` 275–291.

### Redesign

- Podium-tile: `border: 1px solid var(--line)`, radius 10, shadow `elev-line`. Top-3 majú `--accent` ľavý border 4 px (rank indikátor).
- Leaderboard row: `border-bottom: 1px solid var(--line)`, hover `bg: var(--surface-2)`
- Me-row: subtílne `bg: rgba(0, 53, 116, 0.04)` (navy 4%), nie pruhované pattern

---

## 18. Form widgets (Slider, Checkbox, Radio, Toggle)

Aktuálne pravdepodobne používajú browser defaults alebo Tailwind arbitrary styling. Sjednotiť spec:

### Slider (používa sa v kalkulačke)
- Track: 4 px výšky, `bg: var(--line)`, radius full
- Fill: `bg: var(--accent)`
- Thumb: 20 × 20, biele, `border: 1px solid var(--accent)`, shadow `elev-soft`

### Checkbox
- 18 × 18, `border: 1px solid var(--ink-muted)`, radius 4
- Checked: `bg: var(--accent)`, biela check ikona

### Radio
- 18 × 18, kruh, `border: 1px solid var(--ink-muted)`
- Selected: vnútorný 8 × 8 kruh `var(--accent)`

### Toggle (on/off switch)
- Track 36 × 20, radius 10
- Thumb 16 × 16
- On: track `var(--accent)`, thumb biely; Off: track `var(--line)`, thumb biely

---

## 19. Badges (`.new-badge`, `.hot-badge`)

**Zdroj:** `app/globals.css` 296–327.

- Nahradiť hard-offset shadow & brutal border za `elev-line` + radius pill
- `.new-badge` bg `var(--accent)` navy, text biely, `t-overline`
- `.hot-badge` bg `var(--sales)` orange, text biely, `t-overline`

---

## 20. Section heading — `.brutal-heading`

**Zdroj:** `app/globals.css` 512–528.

### Redesign

Komplet premenovať na `.section-heading` (class `.brutal-heading` zachovať pre `[data-skin="core"]`). Nový štýl:

```css
.section-heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  color: var(--accent);
  font-weight: 700;
  font-size: 32px;
  line-height: 40px;
}
.section-heading::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 32px;
  background: var(--sales);  /* jeden orange accent pixel */
  border-radius: 2px;
}
```

Čistý vertikálny akcent, nie zaplnený štvorec.

---

## Prehľad zásahov

```
components/
├─ site-nav.tsx           ★ redesign (epic E3)
├─ bottom-tabs.tsx        ★ redesign (epic E3)
├─ dashboard.tsx          ★ refactor classes (E2)
├─ city-scene.tsx         ★★ farebný refactor SVG (E4)
├─ city-skyline-hero.tsx  ★ farby (E4)
├─ cashflow-hud.tsx       ★ refactor classes (E2)
├─ loan-comparison.tsx    ★ refactor classes + tabuľka (E2)
├─ loan-schedule.tsx      ★ refactor (E2)
├─ pko-mascot.tsx         ★ early-return null (E3)
├─ cookie-consent.tsx     ★ redesign (E3)
├─ tier-up-toast.tsx      ★ refactor (E2)
├─ new-game-toast.tsx     ★ refactor (E2)
├─ notification-bell.tsx  ★ refactor (E2)
├─ auth-form.tsx          ★ refactor (E2)
├─ onboarding-tour.tsx    ★ refactor (E2)
├─ delete-account-button.tsx ★ refactor (E2)
├─ site-footer.tsx        ★ NEW (E3)
└─ games/*                ★ hromadný refactor (E5)

app/
├─ layout.tsx             ★ skin switch default, font loader
├─ page.tsx               ★ landing redesign (E3)
└─ globals.css            ★★ tokeny + primitívy (E0, E1)

lib/
├─ theme.ts               ★ rozšírenie tokens (E0)
└─ pko-skin.test.ts       ★ update testov (E0)
```
