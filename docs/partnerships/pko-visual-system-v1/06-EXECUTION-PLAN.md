# Phase 4.4 — Execution Plan

30+ položiek, presné `file:line`, before/after, hodinové odhady, rollback. Rozdelené do **3 PRs**:

- **PR-1: Tokens + globals shield** — small, low-risk, mechanical. ~6 h.
- **PR-2: Component overrides + nav/footer** — medium, visual review needed. ~12 h.
- **PR-3: city-scene refactor** — largest single change. ~12 h. Independent of PR-2.

---

## PR-1: Tokens + globals shield (≈6 h)

### 1. `app/globals.css` — append import

| Field | Value |
|-------|-------|
| Lines | end of file (after line 543) |
| Effort | 0.25 h |
| Tests | `pnpm vitest run lib/pko-skin.test.ts` |
| Rollback | delete the import line |

**Before** (line 543, end of file):
```css
.brutal-tag {
  /* ... existing ... */
}
```

**After** — append:
```css
.brutal-tag {
  /* ... existing ... */
}

/* === SKO × Watt City PKO skin layer === */
@import "./globals-pko.css";
```

### 2. `app/globals-pko.css` — new file

| Field | Value |
|-------|-------|
| Lines | new file |
| Effort | 0.5 h |
| Source | `cp docs/partnerships/pko-visual-system-v1/04-GLOBALS-PKO.css app/globals-pko.css` |
| Tests | manual viewport check at `/?skin=pko` after env toggle |
| Rollback | `rm app/globals-pko.css` and remove the @import line |

### 3. `lib/theme.ts:75–89` — confirm PKO_THEME tokens align

| Field | Value |
|-------|-------|
| Lines | 75–89 |
| Effort | 0.25 h |
| Tests | `lib/pko-skin.test.ts` (already modified) |
| Rollback | git checkout `lib/theme.ts` |

**Before** (current):
```ts
export const PKO_THEME: ThemeTokens = {
  id: "pko",
  brand: "SKO × Watt City",
  brandShort: "SKO",
  colors: {
    accent: "#003574",
    accentInk: "#ffffff",
    background: "#001E4B",
    surface: "#003574",
    ink: "#ffffff",
  },
  // ...
};
```

**After**: matches verified tokens — confirm exact hex strings. **No code change**, only verify against `04-DESIGN-TOKENS.json`. (Update test snapshots if they fix prior approximations.)

### 4. `lib/pko-skin.test.ts` — fix expected hex values

| Field | Value |
|-------|-------|
| Lines | wherever existing assertions for accent/bg/surface live |
| Effort | 0.5 h |
| Tests | the test file itself |
| Rollback | git checkout |

**Before** (typical assertion in the file, current modified state):
```ts
expect(theme.colors.accent).toBe("#003574");  // was approximated value previously
```

**After**: confirm `#003574`, `#001E4B`, `#FFFFFF` (uppercase consistency). No further code change needed — `lib/theme.ts:76` already shows `#003574`.

### 5. `lib/pko-junior-mock.test.ts` — verify

| Field | Value |
|-------|-------|
| Effort | 0.25 h |
| Tests | the file itself |

Similar — verify hex strings match `04-DESIGN-TOKENS.json`.

### 6. `app/layout.tsx:56` — viewport themeColor

| Field | Value |
|-------|-------|
| Lines | 55–60 |
| Effort | 0.5 h |
| Tests | manual: open mobile Safari, check status-bar color when SKIN=pko |
| Rollback | revert to single `themeColor` value |

**Before**:
```ts
export const viewport = {
  themeColor: "#fde047",
  // ...
};
```

**After** — make it skin-aware via `generateViewport`:
```ts
export async function generateViewport() {
  const theme = resolveTheme();
  return {
    themeColor: theme.id === "pko" ? "#003574" : "#fde047",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  };
}
```

(Drop the static `viewport` const.)

### 7. `app/layout.tsx:122–140` — extend `skinVars`

| Field | Value |
|-------|-------|
| Lines | 122–140 |
| Effort | 0.5 h |
| Tests | open `/` with SKIN=pko, inspect computed `--accent` on `<html>` |
| Rollback | git checkout |

The current code injects `--accent`, `--background`, etc. inline. With `globals-pko.css` shielding via `:root[data-skin="pko"]`, the inline injection becomes belt-and-suspenders. **No removal recommended** (defence in depth — if `globals-pko.css` fails to load, inline still works). **Effort 0.5 h** = audit only.

### 8. `app/layout.tsx:268–276` — remove pitch tags under PKO skin

| Field | Value |
|-------|-------|
| Lines | 267–277 |
| Effort | 0.5 h |
| Tests | snapshot diff `app/page.tsx` golden + Playwright |
| Rollback | git checkout |

**Before**:
```tsx
<div className="flex flex-wrap gap-2 items-center">
  <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>PKO XP: Gaming</span>
  <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>ETHSilesia 2026</span>
  <span className="brutal-tag" style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}>Katowice · PL</span>
</div>
```

**After**:
```tsx
{theme.id !== "pko" && (
  <div className="flex flex-wrap gap-2 items-center">
    <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>PKO XP: Gaming</span>
    <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>ETHSilesia 2026</span>
    <span className="brutal-tag" style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}>Katowice · PL</span>
  </div>
)}
```

(Pitch artifacts only show on the core skin.)

### 9. `app/layout.tsx:280–283` — disclaimer styling

| Field | Value |
|-------|-------|
| Lines | 280–283 |
| Effort | 0.25 h |

**Before**:
```tsx
<p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
  ⚠️ {theme.disclaimer}
</p>
```

**After**:
```tsx
<p className={
  theme.id === "pko"
    ? "text-[12px] text-[var(--sko-text-secondary)]"
    : "text-[11px] font-bold uppercase tracking-wider text-amber-400"
}>
  {theme.id === "pko" ? "" : "⚠️ "}{theme.disclaimer}
</p>
```

### 10. `public/manifest.webmanifest` → `app/manifest.ts`

| Field | Value |
|-------|-------|
| Effort | 1 h |
| Tests | manual PWA install on Android Chrome / iOS Safari |
| Rollback | revert file rename |

The current `public/manifest.webmanifest` has hardcoded `theme_color: "#fde047"`. Convert to `app/manifest.ts` (Next 16 supports `MetadataRoute.Manifest`) and resolve theme dynamically:
```ts
import type { MetadataRoute } from "next";
import { resolveTheme } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  const theme = resolveTheme();
  return {
    name: theme.brand,
    short_name: theme.brandShort,
    theme_color: theme.colors.accent,
    background_color: theme.colors.background,
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    start_url: "/",
    display: "standalone",
  };
}
```

(Read `node_modules/next/dist/docs/manifest.md` first per AGENTS.md — Next 16 may have a different export shape.)

---

## PR-2: Component overrides + nav/footer (≈12 h)

### 11. `components/site-nav.tsx:87` — header border

| Lines | 87 |
|-------|-----|
| Effort | 0.25 h |

**Before**: `className="w-full border-b-[3px] border-[var(--ink)] sticky top-0 z-20 bg-[var(--background)]"`
**After** (rely on `globals-pko.css §7` shield, no source change). Effort accounts for visual verification.

### 12. `components/site-nav.tsx:92–101` — brand chip

| Lines | 92–101 |
|-------|--------|
| Effort | 0.5 h |

**Before**: `border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black ... uppercase`
**After** (skin-aware className):
```tsx
<span
  className={
    "inline-flex items-center justify-center w-9 h-9 font-black text-base " +
    (theme.id === "pko"
      ? "border border-[var(--sko-border-light)] rounded-md font-bold normal-case"
      : "border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)]")
  }
  style={{ background: theme.colors.accent, color: theme.colors.accentInk }}
>
  {theme.brandShort}
</span>
<span className={theme.id === "pko" ? "" : "uppercase"}>{theme.brand}</span>
```

### 13. `components/site-nav.tsx:137` — username badge

| Lines | 137 |
|-------|-----|
| Effort | 0.25 h |

**Before**: `<span className="font-bold uppercase tracking-tight">{username}</span>`
**After** — drop `uppercase` under PKO. Use class `font-bold tracking-tight` and rely on shield.

### 14. `components/cashflow-hud.tsx:218` — HUD container

| Lines | 217–219 |
|-------|---------|
| Effort | 1 h |

**Before**:
```tsx
<div
  className="border-[3px] border-[var(--ink)] shadow-[4px_4px_0_0_var(--ink)] bg-[var(--surface)]"
  style={{ borderColor: severityColor }}
>
```

**After** — replace inline border-color with data-attribute, rely on shield + spec C11:
```tsx
<div
  className="cashflow-hud border-[3px] border-[var(--ink)] shadow-[4px_4px_0_0_var(--ink)] bg-[var(--surface)]"
  data-severity={hud.alertLevel}
  style={hud.alertLevel === "ok" ? undefined : { borderColor: severityColor }}
>
```

(Adds `cashflow-hud` className so spec selector matches; under PKO skin shield, the brutalist border drops to 1px and severity color shifts to border-left via `[data-severity]` attribute.)

### 15. `components/cashflow-hud.tsx:286–289` — Rescue CTA

| Lines | 285–290 |
|-------|---------|
| Effort | 0.5 h |

**Before**: inline `border-2 border-[var(--ink)] bg-[var(--neo-yellow,#fde047)] ... hover:translate-x-[-1px] hover:translate-y-[-1px]`

**After** — replace with `.btn .btn-primary`:
```tsx
<Link
  href="/miasto?build=mala-elektrownia"
  className="btn btn-primary text-[12px] mt-1"
>
  ⚡ {copy.rescueBuild}
</Link>
```

(Under PKO skin, the ⚡ emoji can stay — it's an interface icon mid-message, not brand chrome.)

### 16. `components/cashflow-hud.tsx:333` — Watt chip

| Lines | 322–340 |
|-------|---------|
| Effort | 0.5 h |

Replace inline neon-pink/lime backgrounds with semantic classes. Leverage spec C8 + skin tokens.

### 17. `components/tier-up-toast.tsx:62` — toast container

| Lines | 60–86 |
|-------|-------|
| Effort | 1 h |

**Before**: brutal yellow card with `🎉` emoji.

**After** — skin-aware:
```tsx
const isPko = /* from theme.id, lifted via context or prop */;
return (
  <div
    role="status"
    className={
      isPko
        ? "toast toast-tier-up fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,26rem)]"
        : "fixed bottom-24 ... card p-4 ... shadow-[6px_6px_0_0_var(--ink)] bg-[var(--accent)] text-[#0a0a0f] border-[var(--ink)] motion-safe:animate-[tier-up-enter_420ms_cubic-bezier(0.2,0.9,0.2,1.2)]"
    }
  >
    {!isPko && (<div className="absolute inset-0 pointer-events-none overflow-hidden"><Confetti count={20} /></div>)}
    <div className="relative flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {isPko ? (
          <span aria-hidden className="inline-block w-6 h-6 rounded-full bg-[var(--sko-accent-orange)]" />
        ) : (
          <span className="text-2xl" aria-hidden>🎉</span>
        )}
        <div className="flex flex-col">
          <strong className={isPko ? "text-sm" : "uppercase tracking-wider text-xs"}>{headline}</strong>
          <span className={isPko ? "text-base font-bold" : "text-sm font-black"}>
            {word} {tier}{customTitle ? ` — ${customTitle}` : ""}
          </span>
        </div>
      </div>
      <button className="text-xs font-bold underline" onClick={() => setVisible(false)}>{dismissLabel}</button>
    </div>
  </div>
);
```

Add `skin: SkinId` prop and pass from `app/layout.tsx`.

### 18. `components/resource-bar.tsx:40` — chip border + per-resource colour

| Lines | 38–50 |
|-------|-------|
| Effort | 0.5 h |

Add `data-resource={k}` attribute on `<li>` and remove `style={{ borderColor: def.color }}` under PKO skin (spec C8 selector handles per-resource coloring via tokens).

### 19. `lib/resources.ts` — skin-aware resource colors

| Lines | wherever `RESOURCE_DEFS[k].color` is set |
|-------|--------|
| Effort | 1 h |

Add `colorByskin: { core: string, pko: string }` field to each resource def; the bar reads from current skin. Or simpler: `lib/resources.ts` exports `RESOURCE_DEFS_PKO` and the bar selects.

### 20. `lib/building-catalog.ts` — skin-aware palette

| Lines | each entry's `bodyColor` / `roofColor` |
|-------|------|
| Effort | 2 h |

Same approach as resources. Building palette under PKO skin should use the 6-color scene palette from `08-CITY-SCENE-REFACTOR-PLAN.md §3`.

### 21. `app/page.tsx:99–106` — landing tag chips

| Lines | 99–106 |
|-------|--------|
| Effort | 0.25 h |

Wrap in `theme.id !== "pko"` (same pattern as item 8 — pitch artifacts).

### 22. `app/page.tsx:111–115` — hero callout `<span>` styling

| Lines | 111–115 |
|-------|--------|
| Effort | 0.5 h |

These are inline chips with `border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)]`. Rely on shield (auto-handled by §7).

### 23. `app/page.tsx:214` — section heading

| Lines | 214 |
|-------|-----|
| Effort | 0.1 h |

`brutal-heading` class — already overridden by `globals-pko.css §3`. No source change.

### 24. `lib/pdf-report.tsx` — PDF font + layout

| Lines | wherever `<View style>` sets bg/border |
|-------|----|
| Effort | 1.5 h |

`@react-pdf/renderer` ignores web CSS. Need to swap font via `Font.register({ family: "Inter", src: "/fonts/Inter-Regular.ttf" })` and pass colors from theme. Effort accounts for adding light navy theme to the PDF Layout component.

### 25. `lib/pitch-pdf.tsx` — pitch deck PDF

| Lines | similar |
|-------|---------|
| Effort | 1 h |

Lower priority — pitch deck is internal artifact; keep core skin or branch on `SKIN=pko` to use SKO version.

### 26. `public/icons/*.svg` — SKO variants of icon-192/icon-512

| Files | `public/icons/icon-192-pko.svg`, `icon-512-pko.svg` (new) |
|-------|---|
| Effort | 1 h |

Create navy SKO icon variants. Manifest item 10 above selects the variant by skin.

### 27. `app/layout.tsx:50–52` — icons metadata

| Lines | 50–52 |
|-------|-------|
| Effort | 0.25 h |

**After**:
```ts
icons: {
  icon: theme.id === "pko" ? "/icons/icon-192-pko.svg" : "/icons/icon-192.svg",
  apple: theme.id === "pko" ? "/icons/icon-192-pko.svg" : "/icons/icon-192.svg",
},
```

Move to `generateMetadata` since it depends on resolveTheme().

### 28. `components/onboarding-tour.tsx` — onboarding modal copy + style

| Effort | 1.5 h |
|--------|-------|

Copy comes from `09-VOICE-AND-COPY-PL.md §Onboarding`. Style follows spec C4 (Modal). Verify modal entrance animation is 200ms ease (not brutal pop-in).

### 29. `components/coming-soon-banner.tsx` + `app/page.tsx` content-machine banner

| Lines | wherever a "Content Machine Phase 2" banner exists |
|-------|---|
| Effort | 0.25 h |

Hide under PKO skin: `{theme.id !== "pko" && <ComingSoonBanner ... />}`.

### 30. `components/dashboard.tsx:194, 260, 273, 275, 304, 311` — brutal-heading + tracking + border

| Effort | 1 h |
|--------|-----|

These are auto-handled by shield + spec; visual review only.

---

## PR-3: city-scene refactor (≈12 h)

### 31. `components/city-scene.tsx` — extract 73 hex → 6 semantic vars

| Lines | 117–end |
|-------|---------|
| Effort | 8 h (refactor) + 2 h (visual QA per skin) + 2 h (Playwright snapshot updates) |
| Tests | `e2e/city-scene-skin.spec.ts` (new), visual diff against approved baseline |
| Rollback | git checkout (single commit) |

See `08-CITY-SCENE-REFACTOR-PLAN.md` for the mapping table.

---

## Effort totals

| PR | Hours |
|----|-------|
| PR-1 (tokens + shield) | 6 |
| PR-2 (component overrides + nav/footer + manifest + PDFs + icons) | 12 |
| PR-3 (city-scene refactor) | 12 |
| QA buffer (Playwright golden, mobile Safari, axe) | 4 |
| **Total** | **34 h** (≈ 4–5 dev days) |

---

## Cross-PR rollback strategy

PR-1 is reversible by single revert (only `app/globals.css` and `app/globals-pko.css` change page rendering; theme.ts is already production-stable).

PR-2 is reversible per-component (each commit isolated to one component file).

PR-3 is the highest-risk single change (city-scene refactor). Recommendation: feature-flag behind `NEXT_PUBLIC_PKO_CITYSCENE_V2=1` for the first sprint; tear out flag after 1 week of green.
