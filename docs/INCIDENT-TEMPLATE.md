# Incident — TEMPLATE (Phase 5.4.5)

> Copy this file into `docs/incidents/YYYY-MM-DD-<slug>.md` when something
> breaks. Every filled-in incident gets a 1-week follow-up to verify
> mitigation stuck.

## Summary

- **When**: YYYY-MM-DD HH:MM Europe/Warsaw
- **Duration**: HH:MM → HH:MM (X minutes)
- **Severity**: P0 / P1 / P2 / P3
  - P0 — the whole app is down or data loss occurred
  - P1 — critical feature (rotation, ledger, mortgage) is broken for > 10%
  - P2 — one flow degraded or slow for > 30 min
  - P3 — cosmetic or content issue with a workaround
- **Detected by**: on-call alert / user report / admin dashboard / other
- **Affected**: what players experienced (games missing, builds failing,
  balance stuck…)

## Timeline (UTC)

| Time | What happened |
|---|---|
| HH:MM | First symptom |
| HH:MM | Alert fired |
| HH:MM | Investigation began |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Confirmed back to normal |

## Root cause

One or two paragraphs describing what actually went wrong. Be specific
about the faulty assumption or code path.

## Impact

- Player accounts affected (estimate)
- Data integrity: OK / partial loss / full rollback
- Monetary impact: none (no real money in the game; note applies when PKO
  mirror is live)

## Mitigation

Exactly what was done to stop the bleeding. Reference commit shas if a
code fix was deployed.

## Follow-ups

- [ ] Item 1 (owner, due date)
- [ ] Item 2 (owner, due date)

Include at minimum:
- [ ] Add a test covering this failure mode
- [ ] Update docs/OPERATIONS.md if the runbook missed this case
- [ ] Review the alert that fired (or didn't) — tune threshold if needed

## Lessons learned

- What we already knew: …
- What surprised us: …
- What we're doing differently: …

## Links

- Commit that introduced the regression (if known): `abc1234`
- Fix commit: `def5678`
- Alert thread / issue link: …
