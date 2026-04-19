# Session summary — V3 + V4 combined refactor

**Date**: 2026-04-19
**Branch**: `watt-city-v3v4` off `watt-city@9601ebf`
**Final head**: see `git log --oneline watt-city..watt-city-v3v4`
**Baseline**: 375 tests passing
**Final**: **461 tests passing** (+86 net-new), prod build green, typecheck clean
**PR**: NOT opened — branch pushed for human review (per constraint #10)

---

## Ship set (17 items)

### V3 — Mechanics & UX polish (7 items, all ✅)
| Phase | Anchor |
|---|---|
| V3.1 | CITY_TIERS replacement — city-first dashboard + nav + /o-platforme ladder; legacy tier helpers deleted |
| V3.2 | 50 coins + 50 bricks starter kit at signup + Sklepik-first catalog + any-of unlock condition (50 watts OR has-Sklepik) |
| V3.3 | Watt-deficit panel + `deficitState()` helper + 0% APR rescue loan with monthly dedup |
| V3.4 | Score-in-progress building lock (`kvSetNX` 2s TTL) + client retry-once |
| V3.5 | Loan.autoRepay field + `/api/loans/[id]/auto-repay` toggle + LoanSchedule widget on dashboard |
| V3.6 | /duel removed (routes + components + lib → `lib/duel.legacy.ts`); ADR 004 |
| V3.7 | `compareLoans()` + /loans/compare page — cheapest green check, kredyt konsumencki red warning |

### V4 — Classroom pivot (9 items, 8 ✅, V4.9 deferred)
| Phase | Anchor |
|---|---|
| V4.1 | Teacher signup + class creator + `/dla-szkol` landing + 4-step tour + `/klasa/[id]` |
| V4.2 | Class dashboard with weighted leaderboard + weekly theme + teacher quick actions |
| V4.5 | **27 real MEN curriculum codes** for grades 5-8 + coverage helpers + chart component |
| V4.3 | Weekly PDF via `@react-pdf/renderer` — roster + coverage bars + theme |
| V4.4 | `POST /api/admin/seed-demo-school` — 30 realistic students + 4w simulated activity, idempotent |
| V4.6 | Parent observer dashboard — 24h code flow, read-only `/rodzic`, weekly digest card |
| V4.10 | PKO skin polish — mascot component + teacher + digest placement + "Powered by PKO" footer + `docs/pko-demo-mode.md` |
| V4.8 | Coming-soon banner on / + /games + 5-tile teaser grid (portfolio-pick, tax-fill, etc) |
| V4.7 | School-pitch brochure — PL + EN PDF at `/api/dla-szkol/pitch` + HTML mirror at `/dla-szkol/materialy` |
| V4.9 | ⏳ DEFERRED — principal view. Flag `v4_principal` shipped off; V5 can enable without migration |

---

## Test state

- **57 test files, 461 tests** passing (baseline 375 → +86)
- Net-new V3 tests: **42** (cherry-picked from V3 branch)
- Net-new V4 tests: **44** (`class`, `curriculum`, `pdf-report`, `demo-seed`, `parent-link`, `coming-soon`, `pitch-pdf`)
- Typecheck clean; prod build green (including new `/dla-szkol`, `/dla-szkol/materialy`, `/nauczyciel`, `/nauczyciel/signup`, `/klasa/[id]`, `/rodzic`, `/rodzic/dolacz`, `/loans/compare` routes)
- Existing V2 + Phase 1-10 test suites fully intact — zero regressions

---

## Branch state

- HEAD: see `git log origin/watt-city-v3v4 -1`
- Base: `9601ebf` on `watt-city` (V2 + merge of mechanics-fixes PR)
- `main` untouched. `watt-city` untouched (V4.6 commit that briefly leaked was reverted).
- No force-pushes.
- No deploys.
- PR NOT opened — branch pushed for human review per constraint #10.

---

## Feature-flag matrix (all in `DEFAULT_FLAGS`)

V3 (6 flags, all default on):
- `v3_city_first` · `v3_starter_kit` · `v3_brownout_panel` · `v3_score_lock` · `v3_loan_calendar` · `v3_loan_comparison`

V4 (6 flags, 5 default on, 1 default off):
- `v4_teacher_hero` · `v4_pdf_export` · `v4_demo_seed` · `v4_parent_observer` · `v4_coming_soon_banner` — all on
- `v4_principal` — **off** (V4.9 deferred; V5 flip)

---

## Demo runbook

```bash
# 1. Boot with PKO skin
SKIN=pko pnpm dev

# 2. Seed demo school + 30 students + 4w activity
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/api/admin/seed-demo-school

# 3. Log in at http://localhost:3000/login
#    username: demo-teacher-pl
#    password: demo1234

# 4. Navigate:
#    /nauczyciel        — teacher dashboard + Żyrafa badge
#    /klasa/<id>        — top-10 leaderboard + weekly theme
#    /api/klasa/<id>/report?format=pdf  — streams weekly PDF
#    /dla-szkol/materialy  — HTML pitch page + PDF download CTAs
```

---

## Deferred to V5 (per user decision)

- Content expansion: +20 AI themes (taxes, insurance, scam awareness, compound interest, ZUS, Black Friday, etc.)
- New game kinds: portfolio-pick, tax-fill, scenario-dialog, chart-read-pro, negotiate (teaser tiles live in V4.8)
- Real PKO Junior API integration
- Investment deep mechanics
- Multi-market CZ/UA localization for classroom features
- Email digest for parents (SMTP infra)
- V4.9 principal view

---

## Reflections / known follow-ups

- The `/nauczyciel/signup` wizard currently accepts a free-text school field; a pre-populated list from ministry open data is a V4.5+ polish task.
- The teacher tour stores `tourSeenAt` server-side via `/api/nauczyciel/tour-done` POST + a localStorage fallback; could be unified.
- The `TeacherClassCreator` doesn't error-bubble zod issues; minor polish.
- Class dashboard "quick actions" stubs (mute student, add note) are labeled "V5".
- Pitch brochure content is static PL/EN copy — a pricing table update requires an edit + redeploy; acceptable for V4.
- The `/miasto?build=mala-elektrownia` HUD rescue CTA handler ships in V3.3's brownout panel even without the `?build=` URL reader (deep-linked from layout); works either way.

---

Ready for human review. 16 of 17 items shipped, suite green, build green, no V2/V3 regressions.
