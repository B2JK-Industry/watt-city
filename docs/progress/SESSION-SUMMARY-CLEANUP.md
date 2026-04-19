# Session summary — UX audit cleanup

**Date**: 2026-04-19
**Branch**: `watt-city-cleanup` off `watt-city@a932911` (post-V3+V4 merge)
**Final head**: see `git log --oneline watt-city..watt-city-cleanup`
**Baseline**: 461 tests · Final: **502 tests** (+41 net-new) · Prod build green
**PR**: not opened — branch pushed for human review

---

## Scope — 5 issues from `docs/ux-audit/REPORT-2026-04-19.md`

### ✅ Issue 1 — Slovak game titles leaking (commit `2809053`)

`GAMES` catalog titles, taglines, descriptions, `building.role` + `CATEGORY_LABELS` rewritten in Polish (canonical). Every consumer that reads `game.title` directly (landing cards, leaderboard, sin-slavy, city-scene) now shows PL. Per-game dict namespaces in `lib/locales/{pl,uk,cs,en}.ts` still win via `localizedTitle`; these are the safety-net for direct reads.

Audit-specified titles shipped: `finance-quiz`→"Quiz finansowy", `memory-match`→"Gra pamięciowa", `word-scramble`→"Litery w chaosie", `stock-tap`→"Kurs akcji", `energy-dash`→"Energetyczny sprint", `budget-balance`→"Budżet domowy", `power-flip`→"Przełącznik mocy", `currency-rush`→"Pary walutowe", `math-sprint`→"Sprint matematyczny".

Tests +5 (title map + 15-phrase Slovak-canary scan + CATEGORY_LABELS PL + `localizedTitle` contract).

### ✅ Issue 2 — CITY_TIERS residue "Drewniana" on dashboard (commit `64e4341`)

`TierUpToast` `titleByTier` table ("Drewniana chata" / "Altus Tower" / "Varso Tower" etc.) fired on every level-up and leaked the deleted V1 vocabulary back to users.

- `components/tier-up-toast.tsx` — `titleByTier` now optional; added `levelWord` prop for 4-lang "Poziom N" / "Рівень N" / "Úroveň N" / "Level N".
- `app/layout.tsx` — dropped the 9-row tier-name map. Headline EN "Tier up!" → "Level up!". Toast now shows just `"Poziom {tier}"`.

Varso Tower reference preserved only in `/o-platforme`'s LEVEL_UNLOCKS ladder per audit scope.

Tests +12 (file-level scan: layout.tsx has none of the 10 forbidden tier nouns; toast still mounted; `levelWord` contract active).

### ✅ Issue 3 — PostGameBreakdown never mounted (commit `d254f57`)

`components/post-game-breakdown.tsx` existed since V2 R3.4; zero game clients imported it. `/api/score` returned `multBreakdown` but nothing rendered it, so the `v2_post_game_modal` flag controlled nothing user-visible.

- `components/games/round-result.tsx` — single shared mount point for all 9 evergreens + 12 AI clients. Imports + mounts `<PostGameBreakdown>` when `state.result.multBreakdown` is non-null + we have an awarded amount. 120ms defer so Confetti paints first.
- `/api/score` — gates `multBreakdown` emission via `isFlagEnabled("v2_post_game_modal", user)`. Flag-off → null → legacy card path.
- `ScoreSuccess` type extended with optional nullable `multBreakdown` + `resources` + `capped`.

Tests +5 (file-level guards: imports, JSX gate, flag check, type contract, component export).

### ✅ Issue 4 — V4.6 parent observer was reverted (commit `1103f5a`)

Inventory check: all V4.6 files present on current tree (revert was reversed via V3v4 cherry-pick then merged). The missing piece was a **UI entry point** — backend route `POST /api/rodzic/code` existed, `/profile` had no button to call it.

- `components/parent-invite-card.tsx` NEW — "Generuj kod" button, 24h expiry countdown, copy-to-clipboard, re-issue link. 4-lang copy.
- `app/profile/page.tsx` — mounts `<ParentInviteCard>` after `ProfileEdit`.
- `docs/decisions/005-cleanup-parent-observer.md` — ADR documenting the revert→restore timeline + the gap + minimum-scope fix.

Tests +10 (file inventory + profile mount wire + POST-to-route target + end-to-end redis flow issue→redeem→linked). Pre-existing 8 parent-link unit tests still green.

### ✅ Issue 5 — Nav discoverability for V4 pages (commit `94d34b1`)

Four V4 pages 200-reachable but absent from nav: `/dla-szkol`, `/nauczyciel`, `/rodzic`, `/pko`.

- `components/site-nav.tsx` — new optional `role?: "kid" | "teacher" | "parent" | "anon"` prop. Role-specific link appended:
  - anon → "Dla szkół" → `/dla-szkol`
  - teacher → "Moje klasy" → `/nauczyciel`
  - parent → "Dziecko" → `/rodzic`
  - kid → unchanged (Miasto · Gry · Liga · O platformie)
- `app/layout.tsx` — parallel `isTeacher` + `parentKidUsername` lookups; `navRole` computed with anon/teacher/parent/kid precedence; passed to SiteNav.
- 4-lang labels inline.

Tests +9 (prop signature, default derivation, each role's link+label, layout wiring, 4-lang coverage).

---

## Test state

- 62 test files, **502 tests** passing (baseline 461 + 41 net-new cleanup tests)
- Typecheck clean
- Prod build green
- No regressions on V2/V3/V4 existing suites

## Commit log

```
94d34b1 fix(cleanup):issue-5 — role-aware nav links for V4 pages
1103f5a fix(cleanup):issue-4 — add ParentInviteCard to /profile (V4.6 entry point)
d254f57 fix(cleanup):issue-3 — mount PostGameBreakdown in RoundResult
64e4341 fix(cleanup):issue-2 — drop V1 tier-name table from TierUpToast
2809053 fix(cleanup):issue-1 — translate GAMES catalog to Polish
bc391a1 docs(cleanup): kickoff — 5 UX audit issues
```

## Branch state

- HEAD: `94d34b1`
- Base: `a932911` on `watt-city` (V3+V4 merged)
- `main` untouched. `watt-city` untouched — cleanup work isolated on `watt-city-cleanup`.
- No force-pushes. No deploys.

Next human action: review the 6 commits, open PR against `watt-city`, merge on approval. Vercel auto-deploys on push to `watt-city`.

## Known follow-ups (out of cleanup scope)

- The hero body on `/` anonymous landing still narrates "od górniczej chaty w Nikiszowcu do Varso Tower" — audit permits Varso in that context as marketing copy for the anonymous visitor. Logged-in surfaces are fully clean.
- `localizedTitle` fallback now returns Polish canonical, but some call sites could migrate to dict-pass-through for better UK/CS/EN coverage. Tests guard against SK regression.
- RoundResult callers still pass default `lang="pl"` (not threaded from page's detected lang). PostGameBreakdown modal will show PL copy for UK/CS/EN users until callers thread `lang` through. Non-regression; modal is legible in PL.
- `/pko` remains without a dedicated nav link — the audit listed it but scope was "add discoverability for pages that have it documented as shipped". The `/pko` mock is a Phase 4.2 placeholder; leaving unlinked is intentional (teacher/demo path is via `/dla-szkol`).
