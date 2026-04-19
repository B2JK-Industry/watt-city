# Demo-polish kickoff — 2026-04-19

**Base**: `watt-city@a932911` + 5 cleanup cherry-picks (audit issues 1-5)
**Branch**: `watt-city-demo-polish`
**Audit**: `docs/ux-audit/REPORT-2026-04-19.md`
**Cleanup reference**: `docs/progress/SESSION-SUMMARY-CLEANUP.md`
**Baseline**: 502 tests passing · `pnpm build` green

## Scope — 8 items for PKO demo readiness

D1. `/dla-szkol` marketing content (hero, value props, compliance badges, PP section, CTAs, download)
D2. V4.3 weekly PDF export verification + polish
D3. V4.5 curriculum alignment UI surfacing (chart + picker + PDF integration)
D4. Demo seed 1-click button (`/dla-szkol/demo` → `POST /api/dla-szkol/demo/start` → auto-login)
D5. Kid 4-step onboarding tour (welcome → resources → buildings → loans)
D6. Animation polish (confetti, count-up, tier-up celebration, HUD delta flash) with `prefers-reduced-motion`
D7. Feature flag ramp — all V2/V3/V4/V5 flags to `on`
D8. `SKIN=pko` verification + polish

Ship order strict: D1 → D8. Commit per item. Smoke test after each.

## Smoke — at start

Applied 5 cleanup cherry-picks (2809053 + 64e4341 + d254f57 + e592c31 + a411f6e). Suite 502/502 green. Prod build clean. Ready for D1.
