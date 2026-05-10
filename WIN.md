# Watt City — ETHSilesia 2026 Win Postmortem

**Result:** 1st place, **PKO XP: Gaming track** (sponsored by PKO Bank Polski) at ETHSilesia 2026, Katowice, **2026-04-19**.

**Prize:** 10 000 PLN. **Continuation:** post-hackathon partnership conversations with PKO BP active.

Live: https://watt-city.vercel.app · Repo: https://github.com/B2JK-Industry/watt-city

---

## What Watt City is (one paragraph)

Watt City is gamified financial education for kids ages 9–14. Players earn resources from minigames, build a 20-slot city, take a learning-mortgage on a Domek (cottage), and learn how RRSO/APR work without ever touching real money. **The kicker that won the bounty:** it's not a fixed library of games — it's a *generator* of games. A Sonnet/Haiku rotation ships a fresh evergreen minigame every hour, so the platform never feels stale. Pitched to PKO BP as an SKO 2.0 (school savings account) partnership prototype.

---

## What won (one sentence)

**Trojan-horse pivot:** every other team in the PKO Gaming track built *a game*. Watt City built *a generator of games*. Same visual surface as competitors, categorically different product underneath. Judges saw the rotation in 5 seconds and got the difference without a slide.

---

## What made the difference (applicable to next hackathons)

### 1. The 5-second visual meta

"Games regenerate every day" wasn't told — it was *shown*. Open the app, watch the rotation tile, get it. No deck, no narration, no setup. Judges who can see your category in 5 seconds remember you; judges who need 5 minutes don't.

If your meta isn't visually demonstrable in 5 seconds, the meta is wrong.

### 2. Substrate-level pivot inside the track

The PKO Gaming track had >5 teams all building "games for kids." The win was deciding to operate at a different layer — not "another game" but "the engine that produces games." Substrate strategy works when:

- Track has >5 teams in the same category (signal of inflation)
- Meta is visually demonstrable in 5–10 seconds
- A scaled version of your product would *contain* what your competitors built

When it doesn't apply: small tracks (<5 teams) or metas that need infra you can't build in a weekend.

### 3. Sponsor brand surface > SDK depth

PKO's brand colors (light navy + orange) became the default skin. The app *looked* like a PKO product, not a third-party demo with a PKO logo bolted on. Strict palette + spacing rules in `AGENTS.md` prevented visual drift across PRs.

Sponsors don't need you to use 11 of their APIs. They need to be able to imagine your product on their landing page.

### 4. One primary user, never "platform"

A 9–14 year old who wants to learn finance through minigames. Not "platform for kids + parents + teachers + administrators + regulators." Pitches that mention 3+ user types lose to pitches that mention one.

### 5. Demo with zero onboarding

Click → play → leaderboard. No reading, no signup gates blocking the first action, no "watch this 90-second tutorial." If a judge has to read to use it, you've already lost.

### 6. Single-branch `main` workflow

No long-lived feature branches, no merge drama. Sprint D shipped over a weekend because every change went into `main` immediately, gated by tests. PR queues are a luxury hackathons can't afford.

### 7. Robustness over speed (Daniel's hard rule)

> "až do kedy už nebudeš vediet najst chyby"

No quick-fix hacks. Test-fix-test cycles until errors stop appearing. Time isn't the constraint; correctness is. Watt City shipped with **635 vitest across 80 files + 13 Playwright specs / ~600 E2E assertions** because the rule was "fix it right or don't fix it."

The trade-off: you ship fewer features, but the features you ship don't blow up in front of judges.

### 8. Continuity beyond the hackathon

The win was an entry ticket, not a trophy. Post-hackathon: PKO partnership track active, deployment continuing on `main`. Hackathons that produce abandoned repos are forgettable; hackathons that produce ongoing partnerships are how you build a track record.

---

## What didn't matter

- **Smart contract complexity** — Watt City is a no-web3 product. Judges in non-web3 sponsor tracks don't reward you for unnecessary blockchain.
- **AI model showcasing** — the Sonnet/Haiku rotation is *internal*; users see games, not "powered by Claude" badges.
- **Long-form documentation** — `docs/` has 20+ files; nobody read them. The README and the live demo carried the pitch.
- **Mobile-native code** — Capacitor was wired in, but the win came from the PWA on a borrowed Chromebook at the booth.

---

## Stack that won

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Vercel deploy, server actions, fast iteration |
| Frontend | React 19.2 | Latest hooks, strict purity rules **relaxed to warn** for this repo (see `feedback_eslint_react19.md`) |
| State / queue | Upstash Redis | SADD-backed idempotency for ledger writes; cron + on-render lazy fallback |
| Hosting | Vercel Hobby tier | Cron at 1h granularity satisfies hourly rotation; rotation has 3 converging triggers (external pinger + Vercel Cron + on-render lazy backstop) — see `docs/decisions/001-hourly-rotation-on-hobby.md` |
| Testing | Vitest + Playwright | 635 unit / 80 files + 13 e2e specs / ~600 assertions |
| i18n | 4 locales × 423 keys, zero drift | Caught at CI gate |
| Linting | ESLint with React 19.2 rules relaxed | Strict purity rules `warn` instead of `error` per repo norm |
| Mobile | Capacitor | Wired but not the demo path; PWA carried the booth |

---

## Numbers

- **635 / 635** unit tests passing across 80 files
- **13 Playwright specs / ~600 E2E assertions**
- **81 API routes**
- **76 static pages**
- **4 locales × 423 keys** (zero drift)
- **20-slot city map** with earn-to-unlock gating
- **7 resources** in append-only ledger (⚡ 🪙 🧱 🪟 🔩 💾 💵)
- **Hourly AI rotation** of evergreen minigames (Sonnet/Haiku)
- **9 evergreen games** preserved at `xp-arena-final-v1.0` tag (pre-Watt-City baseline)

---

## Files / surfaces a future audit should read first

If you want to understand HOW Watt City works in 30 minutes:

1. `README.md` — the pitch and the current shipped state
2. `app/page.tsx` and `app/miasto/` — the homepage and the city map (the two surfaces judges saw)
3. `docs/decisions/001-hourly-rotation-on-hobby.md` — the ADR for the hourly AI rotation triple-trigger
4. `docs/SKO-VISION.md` — the partnership story for PKO BP
5. `app/api/rotate-if-due/route.ts` — single-flight idempotent rotation endpoint
6. `AGENTS.md` — strict visual rules (palette, spacing) that kept the PKO brand consistent across PRs
7. `docs/RETRO-TEMPLATE.md` — sprint retro template (process discipline that supported the test-fix-test loop)

---

## What ships in v2 (post-hackathon)

- **PKO BP partnership integration** — formal SKO 2.0 prototype handoff
- **Mortgage learning module deeper math** — RRSO/APR sandbox, no real money
- **Native mobile via Capacitor** — currently wired, not yet the demo path
- **Per-classroom teacher dashboards** — class mode (already has admin shortcut for E2E)
- **Audit feature** — deferred from Sprint D per `project_sprint_d_shipped.md` (R-10 audit deferred)

---

## Lessons applied at the next hackathon (ETHPrague 2026)

The **substrate strategy** + **5-second visual meta** + **single-branch + robustness over speed** patterns from Watt City directly informed Siren (the ETHPrague 2026 dual-track winner — see Siren's `WIN.md` if you have access). Different domain (web3 reputation vs financial education for kids), same playbook layer.

If you're starting a new hackathon project: read this file, then ask for each row in "What made the difference" — *do we have an equivalent?* If you're missing more than two, the project doesn't have Watt City strength yet.