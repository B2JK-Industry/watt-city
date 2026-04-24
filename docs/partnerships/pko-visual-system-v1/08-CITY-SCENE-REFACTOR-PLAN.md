# Phase 4.6 — `city-scene.tsx` Refactor Plan

`components/city-scene.tsx`: 1 679 LOC, **229 hex literal occurrences across 73 unique values**. The single largest blocker for skin themability in the repo.

---

## §1 — Three paths

### A. Quick hack: CSS filter `hue-rotate() saturate()`
- Effort: **1 h**
- Implementation:
  ```css
  :root[data-skin="pko"] .city-scene-svg { filter: hue-rotate(220deg) saturate(0.6); }
  ```
- Pros: zero-touch in source code.
- Cons: filter affects everything including text, mascots, alerts. Yellow → navy works, but green/red/orange semantic colours go off (✓ becomes desaturated, the moon glow turns gray-blue, etc.). Aesthetics: **poor**. Not acceptable for production banking aesthetic.
- Verdict: **REJECT**. Suitable only for last-minute demo if PR-3 slips.

### B. Semantic role extraction (RECOMMENDED)
- Effort: **8–16 h** (estimated 12 h based on the 73 unique values; mid-range applies because most colours cluster).
- Implementation: define 6 CSS variables, replace each hex literal with `var(--scene-*)`. The SVG semantics (sky, ground, building primary/secondary, window-lit, accent) collapse 73 unique hex → 6 vars. Skin-aware via `:root[data-skin="pko"]` resetting the 6 vars to navy palette.
- Pros: skinable, future-proof, no filter artefacts, no extra asset. The same SVG renders correctly under both skins.
- Cons: dev time + careful visual QA per slot.
- Verdict: **DEFAULT**.

### C. New SVG by illustrator
- Effort: 2–3 days illustrator + 2 h integration + visual sign-off.
- Pros: hand-tuned SKO aesthetic; opportunity to also restyle building shapes (replace neo-brutalist windows with banking iconography).
- Cons: budget, lead time, dependency on PKO BP brand approval.
- Verdict: deferred to v1.1 once PKO partnership lands. v1 ships **path B**.

---

## §2 — Token plan (path B)

The 6 semantic CSS variables (confirmed in `04-DESIGN-TOKENS.json color.scene.*`):

| Var | Default (core) | PKO skin | Role |
|-----|----------------|----------|------|
| `--scene-sky-top` | `#02021a` | `#003574` | Top of sky gradient |
| `--scene-sky-bottom` | `#2a1458` | `#001E4B` | Bottom of sky gradient + ground top |
| `--scene-ground` | `#0a0a0f` | `#172B4D` | Ground / cobble base |
| `--scene-building-primary` | `#fde047` | `#FFFFFF` | Building body fill (lit silhouette) |
| `--scene-building-secondary` | `#22d3ee` | `#3074D5` | Building accent stripe / windows-off |
| `--scene-window-lit` | `#facc15` | `#DB912C` | Warm lit window |

Add to `app/globals.css :root` (defaults) and `app/globals-pko.css :root[data-skin="pko"]` (override).

---

## §3 — Mapping the 73 unique hex values to the 6 roles

Top hex distribution from `grep -oE "#[0-9a-fA-F]{6}" components/city-scene.tsx | sort | uniq -c | sort -rn`:

| Hex | Outputs | Mapped role |
|-----|---------|--------------|
| `#0a0a0f` | 98 | `--scene-ground` (deepest ground / black layer) |
| `#fde047` | 28 | `--scene-window-lit` (warm window) |
| `#22d3ee` | 5 | `--scene-building-secondary` (cyan accents) |
| `#a3e635` | 4 | `--scene-window-lit` (lime crane lights — keep warm under PKO) |
| `#fde68a` | 3 | `--scene-window-lit` (moon glow stop) |
| `#f97316`, `#f59e0b`, `#ec4899`, `#b45309`, `#155e75`, `#064e3b` | 3 each | `--scene-building-secondary` (mixed accents — collapse to navy-300) |
| `#fffbe6`, `#cbd5e1`, `#8b5cf6`, `#78350f`, `#6366f1`, `#4338ca`, `#3f3f46`, `#38bdf8`, `#1e1b4b`, `#0f172a`, `#0c4a6e` | 2 each | building bodies / window patterns → split between `--scene-building-primary` and `--scene-building-secondary` per visual role |
| `#fef3c7`, `#fcd34d`, `#fbbf24`, `#fb7185`, `#facc15`, `#f8fafc`, `#f43f5e`, `#f1f5f9`, … (40+ singletons) | 1 each | per-context map: warm yellows → `--scene-window-lit`, cool blues → `--scene-building-secondary`, white/light → `--scene-building-primary`, very-dark → `--scene-ground` |

> The mapping is mechanical (semantic role determines var) but each replacement requires a visual sanity check — a yellow that's *not* a window (e.g. moon glow) might prefer a different role. Allocate 2 h of QA against the 9-building snapshot.

---

## §4 — Refactor procedure

### Step 1 — declare vars (5 min)
Add to `app/globals.css :root` and `app/globals-pko.css :root[data-skin="pko"]` per §2 table above.

### Step 2 — sweep replacement (60 min)
A scripted pass (use a one-off `node` script or careful sed):

```bash
# DRY-RUN FIRST. Map each hex via sed; commit to a branch and visually review.
node tools/refactor-city-scene-colors.mjs
```

The script:
1. Reads `components/city-scene.tsx`.
2. Walks every `fill="#xxxxxx"`, `stroke="#xxxxxx"`, `stopColor="#xxxxxx"`, `style.background`/`style.fill`.
3. Looks up the hex in a manual map (per §3 table); replaces with the var.
4. Writes the new file.

Manual map JSON (≈73 entries) lives at `tools/city-scene-color-map.json`. Reviewer auditable.

### Step 3 — visual QA (3 h)
Per slot id (1–9), open `/miasto` in core + PKO skin, screenshot, diff against pre-refactor baseline.

### Step 4 — Playwright snapshot updates (1 h)
`e2e/city-scene.spec.ts` snapshots will diff. Approve diffs that match the 6-variable mapping; investigate any unexpected change.

### Step 5 — light tweak pass (2 h)
After visual QA, you'll likely want to:
- Tone down `--scene-window-lit` opacity by 5 % under skin (PKO orange is more saturated than core yellow).
- Adjust ground gradient stops to be longer (PKO navy ramp is narrower than core black-to-purple).

---

## §5 — Verification checklist

1. `grep -c "#[0-9a-fA-F]\\{6\\}" components/city-scene.tsx` returns ≤ 12 (only edge cases like moon stops with fixed alpha gradient stops should remain).
2. Toggling `data-skin="pko"` in DevTools repaints the entire scene without page reload.
3. No two adjacent buildings have identical hex when rendered (palette breadth preserved).
4. `prefers-reduced-motion` short-circuits the crane animation (already handled via global rule).
5. `axe` reports 0 contrast violations against the SVG `<text>` children (`L1`/`L2`/etc. building labels).

---

## §6 — Open risks

- **Wider hex set than 73:** the audit counted unique hex literals via `grep`. If `#fff` (3-char form) or HSL declarations exist, they're missed. Pre-refactor: re-grep with `\#[0-9a-fA-F]{3,8}` to catch them.
- **Hardcoded `style="background: #07071a"` on the wrapper (`city-scene.tsx:119`).** This must move to a CSS class so the skin var resolves. Currently inline = unthemable.
- **`<defs>` gradient stop opacities:** the moon glow uses `stopOpacity="0.8"` etc. Those stay; only the colour stops are themed.

---

## §7 — Effort summary

| Step | Hours |
|------|-------|
| Var declarations | 0.1 |
| Hex → var sweep (script + map) | 1 |
| Visual QA (9 slots × 2 skins) | 3 |
| Playwright snapshot updates | 1 |
| Tweaks + light follow-up | 2 |
| Inline-style → class refactor (wrapper bg) | 0.5 |
| Buffer | 1.4 |
| **Total** | **9 h** (within the 8–16 estimate; default 12 includes review cycles) |

PR-3 ships when this passes visual review on both skins.
