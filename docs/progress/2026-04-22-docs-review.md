# 2026-04-22 — documentation review across all locales + sections

Post-audit sweep of every markdown file (`*.md`) in the repo + the
four i18n locale files + critical `lib/*.ts` docblocks. The trigger
was a "review all docs everywhere, every language, every section"
user request after the production-readiness backlog closed.

## Scope

- **83 markdown files** under the repo root + `docs/**`
  (4 root `*.md`, 23 `docs/*.md`, 28 `docs/progress/*.md`, 5 ADRs,
  4 legal, 4 web3, plus mobile / pwa / ux-audit / briefs / partnerships).
- **4 i18n locales** under `lib/locales/*.ts` (PL reference + UK, CS,
  EN translations; 423 keys each).
- **Critical lib file docblocks**: `session.ts`, `redis.ts`,
  `leaderboard.ts` had no file-level comment — added.
- **Memory index** at `~/.claude/projects/.../memory/` — `project_tests.md`
  refreshed with 2026-04-22 test counts + new spec inventory.

## Methodology

Four subagents ran in parallel on non-overlapping slices:

| Agent | Files | Focus |
|---|---|---|
| A — root + core | README, SECURITY, AGENTS, CLAUDE, `docs/{ARCHITECTURE,OPERATIONS,ECONOMY,SECURITY-AND-COMPLIANCE,SMOKE-TEST,upgrade-playbook,README}.md` | Stale test counts, renamed files (middleware→proxy), new env vars, shipped-vs-pending feature claims |
| B — decisions + web3 + legal | ADRs 001–005, `docs/web3/*.md`, `docs/legal/*.md`, mobile + pwa + briefs + partnerships | Implementation status on ADRs, retention periods vs. code, consent flow accuracy |
| C — i18n quality | `lib/locales/{pl,uk,cs,en}.ts` | Translation quality, typos, calques, placeholder parity |
| D — misc + audits + backlog | SKO-VISION, SKO-BACKLOG, audits, refactor notes, templates, FOLLOW-UP-NEEDED | Items closed by the 2026-04-22 backlog, broken internal links |

Main agent (this one) reviewed lib docblocks directly and authored the
session log + final consolidation.

## Outcomes

### Ground-truth snapshot (before editing)

- Commit `5dd81e0`.
- `pnpm test` → 635/635 across 80 files.
- `pnpm test:e2e` (chromium default) → 587/587 + 2 opt-in skipped.
- `pnpm lint` → 0 errors, 17 warnings.
- `pnpm build` → 76 static pages.
- 79 API routes under `app/api/**`.
- 4 locales × 423 keys (`node scripts/audit-i18n.mjs` → 0 drift).
- Lighthouse (prod, 4 routes): perf 0.96–1.00, a11y 0.95–0.96,
  best-practices 1.00, SEO 1.00.

### i18n translation fixes

Applied by Agent C (safe, native-confidence-only):

- **cs.ts**:
  - `privacyPage.dataFields.statsValue`: typo `posledné` → `poslední`.
  - `dashboard.pathCaption` wrong town name `Kamenice` → `Činžák`
    (aligns with the sibling `tierPathText` in the same file).
- **uk.ts**:
  - `dashboard.pathCaption` + `aboutPage.tierPathText`: invented
    transliteration `Ніковіце` → proper `Nikiszowiec` (Katowice
    district; other locales keep the Latin form).
  - `ai.tFFalseLabel`: `БРЕХНЯ` → `НЕПРАВДА` (neutral T/F opposite of
    `ПРАВДА`).
  - `aboutPage.pipelineSteps[4]`: mixed-script `capнут`, non-word
    `грабельними` → idiomatic `обмежений до 3` / `гральними`.
  - `privacyPage.backHome`: literal `Назад до дому` ("back to the
    house") → `Назад на головну` (matches `footerHome`).

Flagged but left for a native-speaker pass (stylistic calques, not
outright errors): UK `стекаємо категорію`, `пивот`, `наразі`;
CS `capnut`, `hra se samokrmí`, `stackujeme`.

Locale verdict: **pl/en = ok · cs = ok after fixes · uk = needs a
native-speaker polish pass** (no blockers, readable as-is).

### lib docblocks added

- `lib/session.ts` — HMAC cookie design, `SESSION_SECRET ≥ 16` rule,
  no refresh-rotation policy.
- `lib/redis.ts` — dual-mode wrapper, fallback trigger, TTL caveat
  on the in-memory path, `kvSetNX` atomicity guarantee.
- `lib/leaderboard.ts` — ZSET data layout, awardXP single-flight
  lock rationale (cross-referencing the 2026-04-21 race-condition
  fix).

### Documentation drift closed (by Agents A + B + D, to be summarised
after their reports land)

*Pending final subagent reports — will consolidate diffs before
commit.*

## Open items (flagged by agent C, not auto-fixed)

- UK locale needs a native-speaker pass on ~5 stylistic calques.
  Not blockers; the content is comprehensible.
- EN `dashboard.welcome: "Mayor of"` reads as a sentence fragment;
  may be intentional (UI appends city name) but worth eyeballing.
- PL `hero.body` has `od pierwszego Domka` (capital D on a common
  noun) — stylistic choice, flagged for editorial review.

## Follow-up

- After all four agent reports land, sweep their diffs + commit
  once with a single "docs(review): …" message.
- Verify the post-edit tree still passes `pnpm test` + `pnpm lint`.
- Push + confirm Vercel deploy stays green (docs-only, should be
  a no-op for the build pipeline).
