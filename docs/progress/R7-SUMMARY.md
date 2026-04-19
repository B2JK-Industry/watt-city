# R7 — Loans & bankruptcy (phase-boundary report)

**Commits**: `7030c94` (R7.3) · `f24d4e7` (R7.2)
**Status**: ✅ MUST-SHIP complete, 318+ tests passing
**Review anchors resolved**: HIGH-8

---

## R7.3 — Restructuring (commit `7030c94`, **HIGH-8**)

- New `restructureCity(state, now)` replaces the harsh V1 `bankructwoReset` (kept as deprecated export for legacy callers).
- Rules (HIGH-8):
  - Keep T1-T3 buildings (Domek + starter elektrownia + sklepik + biblioteka + bank + huta etc). Seize only T4+.
  - Credit score drops to `20` (not `0` like V1) so the player has standing to rebuild.
  - **REFUSES** while `isInWattRescueGrace(state, now)` (BLOCKER-1 composite — can't restructure a city that's just losing power; the HUD amber rescue CTA resolves it first).
  - **REFUSES** when `state.classroomMode === true`; teacher-mode deployments surface a red-alert banner via `classroomRebalanceDeadline()` (72h) instead.
- Mentor-help 0% APR loan (HIGH-8 recovery lifeline):
  - Available after 2nd missed payment, once per 30 days (cooldown in `state.mentorHelp.lastUsedAt`).
  - Principal = heaviest active monthly payment; 3-month term; 0% APR.
  - Also refuses during watt-rescue grace (fix deficit first — the lesson).
- `PlayerState` extensions: `classroomMode?: boolean`, `mentorHelp?: { lastUsedAt, usageCount }`.
- Analytics: `+2` kinds (`city_restructured`, `mentor_help_issued`).
- Tests: +12 across eligibility/refusal/cooldown/classroom paths.

## R7.2 — KNF disclaimers (commit `f24d4e7`)

- `components/knf-disclaimer.tsx` — two variants: `variant="card"` full aside + `variant="inline"` paragraph.
- Copy framing (KNF / UOKiK consumer-protection tone):
  - "⚠️ To gra edukacyjna" lead — inescapable pedagogical frame.
  - RRSO explainer: "pokazuje prawdziwy koszt kredytu rocznie".
  - Footnote: "Czytaj umowę, pytaj dorosłych, nie spieszyj się".
- 4-lang copy (pl/uk/cs/en).
- Wired into the existing loan-quote modal on `/miasto`. Component is stable so future loan surfaces (mentor-help UI, catalog page) will drop it with one-line changes.

## R7.1 — Loan catalog & eligibility (shipped earlier via R2.2 + Phase 2.6)

- `LOAN_CONFIGS` + `quoteMortgage` + `quoteLoan` + `takeLoan` live from Phase 2.6 and intact in V2 refactor.
- V2 additions already in R2.2: `projectedCashflow(state, days)`, `activeLoanRisk(state, now, 7)` — consumed by the R2.3 HUD amber banner.
- **Deferred** per session scope: R7.1.3 loan-comparison tool (explicitly in DEFER list).

## Hand-off to R9

R9 consumes:
- `isInWattRescueGrace` (R2.1) — required check before any restructuring or mentor-help issuance.
- `state.classroomMode` — schools set this via admin; R9.3 rollout should consider classroom cohorts separately.
- `state.mentorHelp` — schema change already live; R9.1 migration treats it as default-null on legacy records.

## Known follow-ups from R7

- R7.1.3 loan-comparison tool (side-by-side RRSO / monthly / total-interest across products) — DEFERRED.
- Classroom mode currently binary; a future refinement could add teacher-assigned class IDs for cohort analytics.
- Mentor-help UI surface (modal with one-tap trigger) not yet wired — API + eligibility helpers are ready.

---

**Next**: R9.1 (shipped), R9.2 (shipped), R9.3.1 (shipped).
