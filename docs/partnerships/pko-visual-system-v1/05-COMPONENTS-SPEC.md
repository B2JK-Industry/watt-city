# Phase 4.3 — Components Spec

15 komponentov pre SKO skin. Každý: ASCII anatomy → purpose → states → tokens → 20–50 LOC CSS → breaking change note.

CSS snippety predpokladajú, že `globals-pko.css` (Phase 4.1) je naimportovaný a `<html data-skin="pko">` je nastavený. Ak komponent v repe už existuje a `globals-pko.css` ho prekrýva, snippet tu je **referenčný** (kontrolujte vs. existing class names).

---

## C1 — Button

### Anatomy

```
+----------------------------------+
|  [icon]  Otwórz konto            |
+----------------------------------+
   ↑       ↑                     ↑
   gap 8   sentence-case label    radius 10px 0 (asym, top-left+bottom-right)
```

### Purpose
Primary action trigger. Banking aesthetic: solid navy fill, no border, asymetrický corner (`10px 0`) je PKO signature.

### Variants (6)
- `.btn .btn-primary` — solid navy, white text, primary CTA.
- `.btn .btn-ghost` — transparent fill + 1px white outline (na navy BG) alebo 1px navy outline (na paper).
- `.btn .btn-secondary` — `background: var(--sko-white); color: var(--sko-navy-700); border: 1px solid var(--sko-border)`.
- `.btn .btn-danger` — solid `--sko-danger`, biely text. Reserved pre destruktívne akcie (cancel loan, delete account).
- `.btn .btn-icon` — circular `border-radius: 9999px`, square padding `12px`, no label.
- `.btn .btn-cta-hero` — variant pre hero (1× page), `font-size: 18px; padding: 14px 24px`.

### States (default / hover / focus / active / disabled / loading)

| State | Visual change |
|-------|---------------|
| default | navy bg, soft shadow `0 3px 6px rgba(0,0,0,.16)` |
| hover | bg → `--sko-navy-500`, shadow → `--sko-shadow-lg` (`0 8px 24px rgba(0,30,75,.18)`) |
| focus-visible | outline `3px solid var(--sko-navy-300); outline-offset: 2px` (existing `:focus-visible` rule sufficient) |
| active | bg → `#002E78` (deeper navy), shadow back to `card` |
| disabled | bg → `--sko-border`, color → `--sko-text-muted`, cursor `not-allowed` |
| loading | spinner replaces icon, label dim 0.6 opacity, pointer-events: none |

### Tokens used

`--sko-navy-700`, `--sko-navy-500`, `--sko-shadow-card`, `--sko-shadow-lg`, `--sko-radius-md-asym`, `--sko-font-sans`, `--sko-dur-base`, `--sko-ease-material`.

### CSS (already in `04-GLOBALS-PKO.css §4.1`)

```css
:root[data-skin="pko"] .btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 16px;
  border: none;
  border-radius: 10px 0 10px 0;
  background: var(--sko-navy-700);
  color: var(--sko-white);
  font-family: var(--sko-font-sans);
  font-weight: 600; font-size: 14px;
  letter-spacing: 0; text-transform: none;
  text-decoration: none;
  box-shadow: var(--sko-shadow-card);
  cursor: pointer;
  transition: background 300ms cubic-bezier(.4,0,.2,1), box-shadow 200ms ease;
}
:root[data-skin="pko"] .btn:hover  { background: var(--sko-navy-500); box-shadow: var(--sko-shadow-lg); }
:root[data-skin="pko"] .btn:active { background: #002E78; box-shadow: var(--sko-shadow-card); }
:root[data-skin="pko"] .btn:disabled { background: var(--sko-border); color: var(--sko-text-muted); box-shadow: none; cursor: not-allowed; }
```

### Breaking changes
- Border drops `3px` → `none`. Hover stops translating. Asymetrický corner môže prekvapiť ak existujúce snapshots fixujú symetrický 12px radius.
- Tests: `lib/pko-skin.test.ts` musí fixnúť expected CSS values (radius `10px 0 10px 0`, weight 600 namiesto 800).

---

## C2 — Card / Panel

### Anatomy

```
+----------------------------------------+
|  Header (optional, 16px bottom)        |
|  ────────────────────────────          | ← border-light divider, ak header
|  Body                                  |
|  Body line 2                           |
|                                        |
|  [optional footer button row]          |
+----------------------------------------+
   ↑                                     ↑
   border 1px #E5E5E5                   radius 10px
   shadow 0 3px 6px rgba(0,0,0,.16)
   padding 24px (md) | 16px (sm)
```

### Purpose
Container pre content blocks (building info, leaderboard, dashboard widgety).

### Variants (5)
- `.card` — default surface (navy-700 on dark, white on paper).
- `.card-alt` — surface 2 (navy-500 on dark) — pre nested cards.
- `.card-flat` — `box-shadow: var(--sko-shadow-outline)` (1px outline len, no drop), pre nested cards do iného card.
- `.card-cta` — accent border-left `4px solid var(--sko-accent-orange)` pre highlighting.
- `.card-danger` — `border-left: 4px solid var(--sko-danger)` pre warning panely (kredit risk).

### Tokens used
`--sko-navy-700`, `--sko-white`, `--sko-border-light`, `--sko-radius-md`, `--sko-shadow-card`, `--sko-shadow-outline`, `--sko-space-6`.

### CSS (in §4.2 of globals-pko)

```css
:root[data-skin="pko"] .card {
  background: var(--sko-navy-700);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: var(--sko-radius-md);
  box-shadow: var(--sko-shadow-card);
  padding: var(--sko-space-6);
}
:root[data-skin="pko"][data-mode="light"] .card {
  background: var(--sko-white);
  border: 1px solid var(--sko-border-light);
  color: var(--sko-ink);
}
:root[data-skin="pko"] .card-flat {
  box-shadow: var(--sko-shadow-outline);
}
:root[data-skin="pko"] .card-cta { border-left: 4px solid var(--sko-accent-orange); }
:root[data-skin="pko"] .card-danger { border-left: 4px solid var(--sko-danger); }
```

### Breaking changes
- Border `3px` → `1px` solves visual weight; expect snapshot churn.
- Padding rises (default WC `1rem` ≈ 16px → PKO `24px`) — hero cards may overflow on `xs` viewport. Fix per-card with `.card.compact { padding: 16px; }`.

---

## C3 — Input field

### Anatomy

```
Label (12px #636363, weight 500, top-aligned, 4px below)
+----------------------------------------+
| Placeholder text                       |  ← input height 44px (banking std)
+----------------------------------------+
Helper text (11px #818181, 4px above)     ← optional
Error text (11px #B91C1C, 4px above)       ← when invalid
```

### Purpose
Single-line text input pre login, registráciu, code redemption, search.

### States
- default — `border: 1px solid #D5D5D5`
- focus — `border-color: #003574; outline: 2px solid #004C9A; outline-offset: 0`
- error — `border-color: #B91C1C; box-shadow: 0 0 0 1px #B91C1C inset`
- disabled — `bg: #F2F2F2; cursor: not-allowed; color: #818181`

### Tokens
`--sko-border`, `--sko-navy-700`, `--sko-navy-500`, `--sko-danger`, `--sko-radius-xs`, `--sko-text-secondary`, `--sko-text-muted`.

### CSS (already in §4.3)

```css
:root[data-skin="pko"] .input {
  background: var(--sko-white); color: var(--sko-ink);
  border: 1px solid var(--sko-border);
  border-radius: var(--sko-radius-xs);
  padding: 11px 13px;
  font-size: 16px; font-weight: 400;
  font-family: var(--sko-font-sans);
  box-shadow: none;
  transition: border-color 200ms ease;
}
:root[data-skin="pko"] .input:focus {
  outline: 2px solid var(--sko-navy-500);
  outline-offset: 0;
  border-color: var(--sko-navy-700);
  transform: none; box-shadow: none;
}
:root[data-skin="pko"] .input.input-error {
  border-color: var(--sko-danger);
  box-shadow: inset 0 0 0 1px var(--sko-danger);
}
:root[data-skin="pko"] .input:disabled,
:root[data-skin="pko"] .input[aria-disabled="true"] {
  background: var(--sko-surface); color: var(--sko-text-muted); cursor: not-allowed;
}
```

### Breaking changes
- 16px font-size (banking std for kid readability) means existing `text-sm` (14px) inputs widen. Confirm in `app/login/page.tsx`.
- Focus ring is now solid colour (`outline 2px`) — the brutal `transform: translate(-1px,-1px)` is gone.

---

## C4 — Modal / Dialog

### Anatomy

```
Overlay (rgba(0,30,75,.5), no blur)
   |
   +-- Dialog (max-w 480px, centered, radius 16px, shadow lg)
        |
        +-- Header
        |    Title (24px weight 700, sentence case)
        |    Close button (X, top-right, 32×32 icon-only btn)
        +-- Body
        |    Body copy (14–16px, line-height 1.5)
        +-- Footer
             [Cancel ghost] [Confirm primary]   (right-aligned, gap 8)
```

### Purpose
Modal confirmations (delete, link parent, accept terms).

### States
- entrance — `opacity 0 → 1` (200ms), `transform: translateY(8px) → 0` (200ms ease)
- exit — reverse 150ms ease

### Tokens
`--sko-shadow-lg`, `--sko-radius-lg`, `--sko-navy-700` (overlay tint), `--sko-white` (surface).

### CSS

```css
:root[data-skin="pko"] .modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0, 30, 75, 0.5);
  display: grid; place-items: center;
  animation: sko-fade-in 200ms ease both;
}
:root[data-skin="pko"] .modal-dialog {
  background: var(--sko-white); color: var(--sko-ink);
  border-radius: var(--sko-radius-lg);
  box-shadow: var(--sko-shadow-lg);
  max-width: 480px; width: calc(100% - 32px);
  padding: 24px; display: flex; flex-direction: column; gap: 16px;
  animation: sko-modal-enter 200ms cubic-bezier(.4,0,.2,1) both;
}
:root[data-skin="pko"] .modal-header { display: flex; justify-content: space-between; align-items: center; }
:root[data-skin="pko"] .modal-title { font-size: 24px; font-weight: 700; line-height: 1.2; }
:root[data-skin="pko"] .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
@keyframes sko-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sko-modal-enter { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

### Breaking changes
- WC core má brutal pop-in s overshoot. PKO version je clean fade + small slide. Tests: any e2e that fixes the keyframe name needs swap.

---

## C5 — Toast / Notification (5 variants)

### Anatomy

```
+--------------------------------------+
| [icon] Title (14px weight 700)    [X]|
|        Body line (12–14px)            |
+--------------------------------------+
   ↑
   border-left 4px (variant color)
   shadow lg, radius md, white surface
```

### Variants
- `info` — border-left `--sko-navy-300`, icon ⓘ
- `success` — border-left `--sko-success`, icon ✓
- `warning` — border-left `--sko-warning`, icon ⚠
- `danger` — border-left `--sko-danger`, icon ✕
- `tier-up` — border-left `--sko-accent-orange`, gold dot icon, no emoji (was `🎉`)

### CSS

```css
:root[data-skin="pko"] .toast {
  position: relative;
  background: var(--sko-white); color: var(--sko-ink);
  border: 1px solid var(--sko-border-light);
  border-left: 4px solid var(--sko-navy-300);
  border-radius: var(--sko-radius-md);
  box-shadow: var(--sko-shadow-lg);
  padding: 12px 16px; display: flex; gap: 12px; align-items: flex-start;
  font-family: var(--sko-font-sans); font-size: 14px;
  animation: sko-toast-in 200ms cubic-bezier(.4,0,.2,1) both;
}
:root[data-skin="pko"] .toast.toast-success { border-left-color: var(--sko-success); }
:root[data-skin="pko"] .toast.toast-warning { border-left-color: var(--sko-warning); }
:root[data-skin="pko"] .toast.toast-danger  { border-left-color: var(--sko-danger); }
:root[data-skin="pko"] .toast.toast-tier-up { border-left-color: var(--sko-accent-orange); }
:root[data-skin="pko"] .toast-title { font-weight: 700; }
@keyframes sko-toast-in { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

### Breaking changes
- `tier-up-toast.tsx:62` currently `bg-[var(--accent)]`. Under skin → fully white surface, navy border-left, no `🎉` emoji. Need to remove the emoji span at line 70 conditionally on skin (`theme.id === "pko"`).

---

## C6 — Top Nav (desktop + mobile)

### Anatomy

**Desktop (≥640px):**
```
+----------------------------------------------------------------------------+
| [Logo chip] SKO × Watt City    Miasto · Gry · Liga · O nás   [Lvl][User] |
+----------------------------------------------------------------------------+
   ↑                              ↑                            ↑
   navy bg #003574               sentence case nav links      level ring + chip
   border-bottom 1px #E5E5E5     hover color #DB912C
```

**Mobile (<640px):** primary row + secondary scrollable nav row.

### Tokens
`--sko-navy-700` (bg), `--sko-border-light` (border), `--sko-accent-orange-light` (hover link).

### CSS

```css
:root[data-skin="pko"] header.site-nav {
  background: var(--sko-navy-700); color: var(--sko-white);
  border-bottom: 1px solid rgba(255,255,255,.08);
}
:root[data-skin="pko"] header.site-nav a:hover {
  color: var(--sko-accent-orange-light);
}
:root[data-skin="pko"] .nav-brand-chip {
  background: var(--sko-white); color: var(--sko-navy-700);
  border: none; border-radius: var(--sko-radius-sm);
  box-shadow: none; font-weight: 700; text-transform: none;
}
```

### Breaking changes
- Brand chip swaps from yellow-bg+navy-text to white-bg+navy-text (logo lockup). When PKO ships official Lokatka, chip becomes background image.
- `border-b-[3px]` → `1px` via §7 shield.

---

## C7 — Bottom Tabs (mobile only)

### Anatomy

```
+----------------------------------------+
| [icon]  [icon]  [icon]  [icon]  [icon] |
| Miasto  Gry     Liga    Klasa    Ja    |
+----------------------------------------+
   ↑
   navy-700 bg, height 56px + safe-area-inset-bottom
   active tab: orange icon + label, white = inactive
```

### Tokens
`--sko-navy-700`, `--sko-accent-orange`, `--sko-white`, `--sko-text-muted`.

### CSS

```css
:root[data-skin="pko"] .bottom-tabs {
  background: var(--sko-navy-700); color: var(--sko-white);
  border-top: 1px solid rgba(255,255,255,.08);
  padding-bottom: env(safe-area-inset-bottom);
}
:root[data-skin="pko"] .bottom-tabs a { color: rgba(255,255,255,.65); }
:root[data-skin="pko"] .bottom-tabs a[aria-current="page"] { color: var(--sko-accent-orange); font-weight: 600; }
```

### Breaking changes
- Active state colour from yellow → orange, smoother contrast vs navy bg.

---

## C8 — ResourceBar chip

### Anatomy

```
+----------+
| ⚡ 1 234 |   ← per-resource icon + value, 12px font, padding 4 10
+----------+
   ↑
   border 1px var(--sko-border-light)
   bg var(--sko-navy-500) under PKO skin
   border-radius 9999px (capsule)
```

### Per-resource colour (from `tokens.json color.resource`)
- ⚡ Watts → `#DB912C` (orange-light)
- 🪙 Coins → `#CC7A09` (orange)
- 🧱 Bricks → `#8B4513` (terracotta DESIGN-CALL)
- 💵 W$ Cash → `#2E7D49` (success green)

### Tokens
`--sko-navy-500`, `--sko-border-light`, `--sko-radius-full`.

### CSS

```css
:root[data-skin="pko"] .resource-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: var(--sko-navy-500);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: var(--sko-radius-full);
  font-size: 12px; font-weight: 600; color: var(--sko-white);
  font-family: var(--sko-font-mono); font-variant-numeric: tabular-nums;
}
:root[data-skin="pko"] .resource-chip[data-resource="watts"] { color: var(--sko-accent-orange-light); }
:root[data-skin="pko"] .resource-chip[data-resource="coins"] { color: var(--sko-accent-orange); }
:root[data-skin="pko"] .resource-chip[data-resource="bricks"] { color: #B97A3D; }
:root[data-skin="pko"] .resource-chip[data-resource="cash"] { color: #4ADE80; }
```

### Breaking changes
- `border-2` → `1px`. The `border-color: def.color` inline style in `resource-bar.tsx:42` should be removed under skin (Phase 6 execution plan adds skin-aware path).

---

## C9 — Progress / Level ring

### Anatomy
40×40 ring, conic gradient progress, navy track.

### Tokens
`--sko-accent-orange`, `--sko-navy-700`.

### CSS (in §5)

```css
:root[data-skin="pko"] .level-ring {
  --size: 40px;
  width: var(--size); height: var(--size);
  border-radius: 9999px; border: none; box-shadow: none;
  background: conic-gradient(var(--sko-accent-orange) calc(var(--p,0) * 1%), rgba(255,255,255,.18) 0);
  display: inline-grid; place-items: center; position: relative;
}
:root[data-skin="pko"] .level-ring::before {
  content: ""; position: absolute; inset: 4px;
  background: var(--sko-navy-700); border-radius: 9999px;
}
:root[data-skin="pko"] .level-ring > span { position: relative; font-size: 12px; font-weight: 700; color: var(--sko-white); }
```

### Breaking changes
- Drops `3px 3px 0 0` shadow + 2px border. `level` text is now 12px weight 700 (was `0.78rem` 900).

---

## C10 — Building card (for `/miasto`)

### Anatomy

```
+----------------------------------+
| [building SVG glyph]              | ← top icon
|                                   |
| Sklepik Lv 3                      | ← font 18px weight 700
| ⚡ -2/h  🪙 +12/h                 | ← yields, mono tabular
|                                   |
| [Ulepsz za 240 W$ ▶]              | ← btn-primary
+----------------------------------+
```

### Tokens
`.card`, `.btn`, `.resource-chip`, `--sko-radius-md`.

### Custom CSS

```css
:root[data-skin="pko"] .building-card {
  background: var(--sko-navy-700); color: var(--sko-white);
  border: 1px solid rgba(255,255,255,.08); border-radius: var(--sko-radius-md);
  box-shadow: var(--sko-shadow-card);
  padding: 16px; display: flex; flex-direction: column; gap: 8px;
}
:root[data-skin="pko"] .building-card-glyph {
  height: 80px; display: grid; place-items: center;
  background: var(--sko-navy-500); border-radius: var(--sko-radius-sm);
  font-size: 48px;
}
:root[data-skin="pko"] .building-card-yields {
  display: flex; gap: 8px; font-family: var(--sko-font-mono); font-size: 12px;
}
```

---

## C11 — CashflowHUD

### Anatomy

```
Mobile bottom strip OR tablet+ top-right dock
+--------------------------------------------------+
| Saldo  1 230 W$  +12/h        [⚡+8 lime chip]  [X] |
| ──────────────────────────────────────────────────  |
| (optional banner — deficit warning + rescue CTA)    |
+--------------------------------------------------+
```

### Tokens
`--sko-shadow-lg` (lift), `--sko-navy-700` (surface), `--sko-white` (foreground), variant border-left for severity.

### CSS

```css
:root[data-skin="pko"] .cashflow-hud {
  background: var(--sko-navy-700); color: var(--sko-white);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: var(--sko-radius-md);
  box-shadow: var(--sko-shadow-lg);
  font-family: var(--sko-font-mono);
}
:root[data-skin="pko"] .cashflow-hud[data-severity="critical"] { border-left: 4px solid var(--sko-danger); }
:root[data-skin="pko"] .cashflow-hud[data-severity="warn"]     { border-left: 4px solid var(--sko-warning); }
:root[data-skin="pko"] .cashflow-hud[data-severity="info"]     { border-left: 4px solid var(--sko-navy-300); }
:root[data-skin="pko"] .cashflow-hud .deficit-banner {
  background: rgba(185,28,28,.16); border-top: 1px solid rgba(255,255,255,.10);
  padding: 8px 12px; font-size: 12px;
}
```

### Breaking changes
- Drops `border-[3px] shadow-[4px_4px_0_0]` (`cashflow-hud.tsx:218`). The §7 shield handles it; `06-EXECUTION-PLAN` adds an alternate semantic class.

---

## C12 — Leaderboard row

### Anatomy

```
| #1 [avatar] PlayerName     1 234 W   [Lvl 7]  |
| #2 [avatar] PlayerName       980 W   [Lvl 6]  |
| #3 [avatar] You            ★  870 W   [Lvl 5]  |  ← .leaderboard-row-me
```

### CSS

```css
:root[data-skin="pko"] .leaderboard-row {
  display: grid; grid-template-columns: 32px 32px 1fr auto auto;
  gap: 12px; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--sko-border-light);
  color: var(--sko-white); font-size: 14px;
}
:root[data-skin="pko"] .leaderboard-row-rank { font-weight: 700; color: var(--sko-text-secondary); }
:root[data-skin="pko"] .leaderboard-row-me {
  background: rgba(48,116,213,.12);
  border-left: 4px solid var(--sko-navy-300);
}
:root[data-skin="pko"] .leaderboard-row-value {
  font-family: var(--sko-font-mono); font-variant-numeric: tabular-nums;
  font-weight: 700;
}
```

### Breaking changes
- Diagonal yellow stripe (`leaderboard-row-me` v core) → solid navy-300 tint. Cleaner readability.

---

## C13 — Mortgage calculator

### Anatomy
Dvojstĺpcový form: vstupy vľavo (kvota, doba, úroková sadzba), výstupy vpravo (mesačná splátka, total cost, schedule preview).

### Custom CSS

```css
:root[data-skin="pko"] .mortgage-calc {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  background: var(--sko-white); color: var(--sko-ink);
  border-radius: var(--sko-radius-md); padding: 24px;
  box-shadow: var(--sko-shadow-card);
}
@media (max-width: 640px) { :root[data-skin="pko"] .mortgage-calc { grid-template-columns: 1fr; } }
:root[data-skin="pko"] .mortgage-calc-result {
  background: var(--sko-navy-700); color: var(--sko-white);
  border-radius: var(--sko-radius-md); padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
:root[data-skin="pko"] .mortgage-calc-result .value {
  font-size: 32px; font-weight: 700; font-family: var(--sko-font-mono);
}
:root[data-skin="pko"] .mortgage-calc-result .unit { font-size: 14px; color: rgba(255,255,255,.65); }
```

### Breaking changes
- Form uses light-mode (white background, navy ink) even on dark page. Banking convention: forms = light surface.

---

## C14 — AI chat bubble

### Anatomy

```
[Lokatka avatar]  Co dziś chcesz oszczędzać?
                  ────────────────────────
                  Powiedz mi swój cel.

                                                 +-----+
                                                 | Cel |
                                                 +-----+
```

### CSS

```css
:root[data-skin="pko"] .chat-bubble-bot {
  background: var(--sko-navy-500); color: var(--sko-white);
  border-radius: 16px 16px 16px 4px;
  padding: 12px 16px; max-width: 70%;
  align-self: flex-start;
  font-size: 14px; line-height: 1.5;
}
:root[data-skin="pko"] .chat-bubble-user {
  background: var(--sko-white); color: var(--sko-ink);
  border-radius: 16px 16px 4px 16px;
  padding: 12px 16px; max-width: 70%;
  align-self: flex-end;
  font-size: 14px; line-height: 1.5;
}
:root[data-skin="pko"] .chat-bubble-bot[data-mascot="lokatka"]::before {
  content: ""; display: inline-block; width: 24px; height: 24px;
  background: url('/icons/lokatka-avatar.svg') no-repeat center / contain;
  margin-right: 8px; vertical-align: middle;
}
```

### Breaking changes
- Lokatka avatar 24×24 inline assumes asset exists at `/icons/lokatka-avatar.svg`. **TODO:** PKO BP brand team supplies. Until then, fallback `<span>L</span>` 24×24 navy disc.

---

## C15 — `.brutal-tag` → SKO chip (explicit replacement)

### Anatomy
Pill chip 12px font, 4×10 padding, navy fill, white text, capsule radius.

### Already in `globals-pko.css §3`

```css
:root[data-skin="pko"] .brutal-tag {
  display: inline-flex;
  background: var(--sko-navy-500);
  color: var(--sko-white);
  border: none;
  border-radius: 9999px;
  font-size: 12px; font-weight: 600;
  padding: 4px 10px;
  text-transform: none;
  letter-spacing: 0.02em;
  box-shadow: none;
}
```

### Breaking changes
- `.brutal-tag` v core skin používa per-element inline `style.background: var(--neo-cyan)` (footer chips). Pod PKO skin sa neon background **nepresadí** keď je inline style — preto v `06-EXECUTION-PLAN` riadok pre `app/layout.tsx:268–276` removuje tieto chipy úplne (pitch artifacts) namiesto pokusu prefarbiť.

---

## Summary

15 komponentov, každý:
- max 50 LOC CSS (minimal viable)
- explicitne riešia **breaking change** voči core skinu
- referencujú design tokens z §1 (`globals-pko.css`)

Akýkoľvek nový komponent v repe by mal najprv kompozíciu existing primitives (`.card`, `.btn`, `.input`) skúsiť pred vytvorením vlastnej skin override.
