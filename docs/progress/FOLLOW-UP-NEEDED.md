# V2 Refactor — follow-ups (explicitly deferred)

Everything in this file was OUT OF SCOPE for the autonomous V2-refactor session by the operator's explicit instruction. Each entry names what, why deferred, and what unblocks it.

> **Reconciliation 2026-04-22** (commit `5dd81e0`): none of the V2-refactor
> R4–R9 items in this doc were closed by the 2026-04-21/22 production-readiness
> work. Items that shipped on 2026-04-22 (IP-based rate limiting, SMTP adapter,
> mortgage-default state machine, bot protection, Web3 mint + parent consent,
> mobile touch targets 44×44, `middleware.ts` → `proxy.ts` rename) are tracked
> in `docs/SECURITY-AUDIT-2026-04-19.md` and the Phase-1/7 sections of
> `SKO-BACKLOG.md`, not here.

---

## R4 — Streaks & daily-special

**Deferred because**: not a MUST-SHIP item for PKO demo. Every streak-ladder implementation has to be re-balanced against the HIGH-4 `×3` cap that now ships, so doing it in the same session would have compounded untested multiplier interactions.
**Unblocks with**: a design pass on the streak multiplier ladder under the `×3` cap (what's base? how do daily/weekly tiers interact with building multipliers?).

## R5 — Duel reframe (speed-bonus, moderation, rename)

**Deferred because**: HIGH-5 (in-flight duel versioning + drain procedure), HIGH-6 (AI scenario moderation + human-reviewed PL→UK/CS/EN), HIGH-7 (speed-bonus inversion to "read carefully" curve) collectively require 1+ day of design & content work. Also explicit in the session prompt's DEFER list.
**Unblocks with**: the moderation pipeline from HIGH-6 shipping; scenario pool from MEDIUM-17 being curated offline; HIGH-7 decision on speed-bonus shape.

## R6.2, R6.3 — Building catalog extensions

**Deferred because**: MUST-SHIP scope covered the existing 15-entry catalog (R6.1 shipped pre-session). R6.2 civic unlocks (MEDIUM-13 pedagogical moments) and R6.3 happiness penalty both need content + playtest.
**Unblocks with**: pedagogical copy (MEDIUM-13 first-unlock modal per civic building) + happiness model design.

## R7.1.3 — Loan comparison tool

**Deferred because**: explicit in DEFER list. The loan-quote surface already shows RRSO / monthly / total interest on the single-product quote; side-by-side comparison adds UX but not review-blocking pedagogy.
**Unblocks with**: design decision on comparison UX (table vs stacked cards), then straightforward frontend work.

## R8.4, R8.5 — Animations & sound

**Deferred because**: MUST-SHIP UI is functional without animations; MEDIUM-16 accessibility pass would need to land first to respect `prefers-reduced-motion` on every new animation. Also explicit in DEFER list.
**Unblocks with**: R8.6 accessibility baseline (MEDIUM-16 — reduced-motion respect, keyboard nav, screen reader labels, AA contrast, independent toggles).

## R9.3.4 — V1 sunset

**Deferred because**: sunset criteria can't be validated in one session — they require (a) 8 weeks elapsed, (b) zero V1 users 14 consecutive days, (c) V2 error rate <0.1% for 14 days, (d) one full monthly duel reset observed, (e) PKO partnership checkpoint. Per MEDIUM-14 this is criteria-based, not time-based. The VOCAB-AUDIT `docs/VOCAB-AUDIT-v2.md` is the gate doc — every `redirect` row must be completed or re-classified before R9.3.4 fires.
**Unblocks with**: all 5 criteria met + VOCAB-AUDIT "redirect" table emptied.

## R9.4 — GDPR-K / parental-consent

**Deferred because**: requires human legal sign-off, revised ToS / Privacy Policy copy, a triggered re-consent flow for existing <13 users on first V2 login, PKO legal sign-off on duel scenarios + loan language. Can't ship autonomously.
**Unblocks with**: legal review engagement + counsel sign-off. HIGH-10 in the review doc; spec lives there.

---

## Minor follow-ups (mechanical)

- Per-game client wiring for `PostGameBreakdown` modal — API returns `multBreakdown`; each game client needs to read it and render `<PostGameBreakdown>` on submit-success. Mechanical one-file-per-game PR.
- Dict-key population for `dashboard.multFactors.building.<id>` — falls back to `labelFallback` today but native translation per building would be nicer.
- V1 `titleForLevel` / `tierForLevel` removal — gated on R9.3.4 sunset per VOCAB-AUDIT §2.1.
- `TierUpToast` → `LevelUpToast` rename — scheduled for after R3.2 dashboard swap (V1 ring still renders; component can migrate when the V1 ring is removed).
- AI-pipeline system prompt rename "XP Arena" → "Watt City" in `lib/ai-pipeline/generate.ts` — tracked in VOCAB-AUDIT §3, low priority.
- Mentor-help one-tap UI (modal + trigger) — API ready (`issueMentorHelp`, `mentorHelpEligibility`), UI not wired.
- ~~Classroom mode UI + teacher-onboarding — API fields ready (`state.classroomMode`, `classroomRebalanceDeadline`), surface not wired.~~ ✅ superseded — V4 classroom surface shipped (`/dla-szkol`, `/klasa/[id]`, teacher signup wizard). Audit next steps in ux-audit report.
- Conversion-rate computation from ledger (BLOCKER-2 ideal) — current default 0.5× per deprecated key is conservative but static. An offline admin tool can populate `xp:migration:v2:rates` with ledger-derived medians.
- Reset BLOCKER-1 HUD copy if/when deficit feature flag `v2_cashflow_hud` is flipped off — hide the rescue CTA with the HUD, don't surface it elsewhere (would be confusing).
