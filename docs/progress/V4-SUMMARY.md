# V4 — Classroom pivot (phase summary)

**Status**: ✅ V4.1 → V4.8 + V4.10 complete on `watt-city-v3v4`. V4.9 principal view deferred to V5 (scope decision — see below).
**Tests**: baseline 417 (post-V3) → **461 passing** (+44 net-new V4)
**Build**: clean

---

## Ship log

| Phase | What | Key files |
|---|---|---|
| V4.1 | Teacher signup wizard + dashboard + class creator. `/dla-szkol` marketing landing; `/nauczyciel/signup` + `/nauczyciel`; 4-step skippable tour. Single student-per-class invariant, 6-char join codes with collision retry. | `lib/class.ts`, `lib/redis.ts` (+ `sMembers`/`sRem`), `app/api/nauczyciel/*`, `app/api/klasa/[id]/*`, `app/dla-szkol/page.tsx`, `app/nauczyciel/{page,signup/page}.tsx`, `app/klasa/[id]/page.tsx`, `components/teacher-class-creator.tsx`, `components/teacher-onboarding-tour.tsx` |
| V4.2 | Class dashboard hero panel with top-10 leaderboard (weighted `cityLevel × cityValue`), weekly theme + countdown, teacher quick actions. | `components/class-dashboard.tsx`, `lib/class-roster.ts` |
| V4.5 | Podstawa programowa alignment. **27 real MEN curriculum codes** for grades 5-8 across 5 areas (Ekonomia, Matematyka, WOS, EDB, Informatyka), each mapped to AI themes + evergreen game ids. `coverageByArea` drives both the PDF report and the HTML /materialy page. | `lib/curriculum.ts`, `components/curriculum-chart.tsx`, `app/api/klasa/[id]/weekly-theme/route.ts` |
| V4.3 | Weekly PDF export via `@react-pdf/renderer@4.3.1`. Server-side renderToBuffer, Node.js runtime. Sections: header + weekly theme + roster table + top-3 + topics covered (observed themes + games intersected with the week's ledger window) + coverage bars + signature footer. | `lib/pdf-report.tsx`, `app/api/klasa/[id]/report/route.ts` |
| V4.4 | Demo school seed. `POST /api/admin/seed-demo-school` Bearer $ADMIN_SECRET creates `demo-teacher-pl` / `demo1234` + "Szkoła Podstawowa nr 12 — Katowice" + "V.B — Matematyka finansowa" + 30 realistic PL usernames (3/10/15/2 top/mid/casual/inactive) + 4 weeks simulated activity. Idempotent via `xp:demo-seed:v1` sentinel. `DELETE` teardown. | `lib/demo-seed.ts`, `app/api/admin/seed-demo-school/route.ts` |
| V4.6 | Parent observer dashboard. Kid generates 24h code in `/profile` → parent enters on `/rodzic/dolacz` → observer mode at `/rodzic`. Digest card with weekly summary (games, builds, loans, themes). Read-only — no mutation affordance. One kid per parent (MVP). | `lib/parent-link.ts`, `app/api/rodzic/code/route.ts`, `app/api/rodzic/dolacz/route.ts`, `app/rodzic/{page,dolacz/page}.tsx`, `components/parent-digest-card.tsx` |
| V4.10 | PKO skin polish. `SKIN=pko` flag gives navy + red palette, Żyrafa mascot appearing in teacher dashboard corner badge + parent digest corner + footer. "Powered by PKO Bank Polski · SKO 2.0 partnership" explicit strap in footer. `docs/pko-demo-mode.md` operator doc with one-liner boot + screenshot checklist + mascot asset override via `NEXT_PUBLIC_PKO_MASCOT_URL`. | `components/pko-mascot.tsx`, `docs/pko-demo-mode.md`, updates to `app/nauczyciel/page.tsx`, `components/parent-digest-card.tsx`, `app/layout.tsx` |
| V4.8 | "Coming Soon" Content Machine Phase 2 banner on `/` landing and `/games`. Dashed grid of 5 teaser tiles (portfolio-pick, tax-fill, scenario-dialog, chart-read-pro, negotiate). 4-lang copy. | `components/coming-soon-banner.tsx` |
| V4.7 | School-pitch brochure. `/api/dla-szkol/pitch?locale=pl|en` streams a one-page A4 PDF via react-pdf. `/dla-szkol/materialy` is the 4-lang HTML mirror of the same content. Curriculum counts pulled live from `curriculumByArea()` so the numbers never drift. | `lib/pitch-pdf.tsx`, `app/api/dla-szkol/pitch/route.ts`, `app/dla-szkol/materialy/page.tsx` |

## Feature flags

All V4 flags in `DEFAULT_FLAGS` default `on` except `v4_principal` which is `off` (pilots enable explicitly):
- `v4_teacher_hero` · `v4_pdf_export` · `v4_demo_seed` · `v4_parent_observer` · `v4_coming_soon_banner`
- `v4_principal` (off — see below)

## Test state

- 57 test files, **461 tests** passing (baseline 417 after V3 → +44 V4)
- Net-new V4 tests: 44
  - `lib/class.test.ts` (+11)
  - `lib/curriculum.test.ts` (+11)
  - `lib/pdf-report.test.ts` (+2)
  - `lib/demo-seed.test.ts` (+6)
  - `lib/parent-link.test.ts` (+8)
  - `lib/coming-soon.test.ts` (+4)
  - `lib/pitch-pdf.test.ts` (+2)
- Typecheck clean, prod build green, no V2/V3 regressions.

## V4.9 decision — deferred to V5

The principal view (`/dyrektor` aggregate dashboard across multiple classes) requires:
- A new `School` entity with `classIds[]`
- New role system (principal = can view-not-edit peer classes within same school)
- Cross-class leaderboards + curriculum coverage rollup
- Principal signup wizard + email verify

Accepted scope cut because:
1. The core classroom pitch (V4.1-V4.8 + V4.10) already covers a single-school demo, which is the documented pitch surface area per design doc §0 "PKO salesperson ukáže watt-city.vercel.app riaditeľke".
2. The `v4_principal` flag is set `off` in `DEFAULT_FLAGS` so V5 can enable it behind the flag without a data migration.
3. The current `SchoolClass.teacherUsername` already supports multi-class-per-teacher; V5 can layer the principal rollup on top without schema changes.

## Hand-off

V3 + V4 both complete on `watt-city-v3v4`. Next human actions:
1. Review the branch (60+ commits across V3 + V4).
2. Boot demo with `SKIN=pko pnpm dev` + `POST /api/admin/seed-demo-school`.
3. Log in as `demo-teacher-pl` / `demo1234`, click through `/nauczyciel` → `/klasa/[id]` → "Pobierz raport PDF" → verify the PDF downloads.
4. Open `/dla-szkol/materialy` → download the pitch PDF.
5. If all green: open PR against `watt-city` (not main).

See `docs/progress/SESSION-SUMMARY-V3V4.md` for the single-doc session hand-off.
