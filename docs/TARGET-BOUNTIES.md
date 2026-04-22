# Target bounties — ETHSilesia 2026

> **OUTCOME (2026-04-22)**: ETHSilesia 2026 concluded on 17–19 April.
> **Watt City took 1st place on the PKO Gaming track.** The other
> tracks listed below are preserved as pre-event targeting context;
> treat every "Win probability" / "Killer demo move" cell as historical.
> Post-event follow-ups, PKO partnership path and web3-submission
> outputs live in `docs/progress/` (session logs 2026-04-19 → 2026-04-22)
> and `docs/web3/SUBMISSION.md`.

What we aimed to win, how Watt City fit each track, and what happened.

## Event basics

- **Where**: spinPLACE, Katowice
- **When**: 17–19 April 2026 (hackathon); 16–19 April (full conference)
- **Total prize pool**: 30,000+ PLN (across all tracks)
- **Format**: in-person + remote submissions, judged by sponsor representatives
- **Bonus**: hackathon participants get free conference ticket

Sources:
- Main site: [ethsilesia.pl](https://ethsilesia.pl/)
- Registration: [luma.com/ethsilesiahackathon](https://luma.com/ethsilesiahackathon)
- Article: [ETHSilesia 2026: Where Blockchain Meets the Real World](https://ethwarsaw.substack.com/p/ethsilesia-2026-where-blockchain)
- University announcement: [us.edu.pl/student](https://us.edu.pl/student/en/komunikaty/ethsilesia-2026-konferencja-warsztaty-hackathon/)

## Tracks targeted (in priority order; frozen pre-event)

> **Note**: prize amounts and exact track names were best-known estimates at drafting time. Gaming track outcome is confirmed (1st place); other tracks' final placements are not recorded here.

### 🥇 PRIMARY — PKO XP: Gaming (PKO Bank Polski) — **WON** 🏆

| Field | Value |
|---|---|
| Sponsor | PKO Bank Polski |
| Prize | 1st place — PKO Gaming track, ETHSilesia 2026 |
| What they wanted | Gamified financial literacy for younger audiences (Gen Z and below) |
| Our angle | **Watt City — re-skin of the existing static SKO product into a daily-game habit-builder.** Shipped on the day: 9 evergreen minigames, daily AI challenge with Hall-of-Fame, 20-slot city map, mortgage flow with real RRSO math, per-class leaderboards, parent observer flow, 4-lang localization, Base Sepolia soulbound medals. Positioned as the engine PKO can drop into the SKO app shell. |
| Outcome | **1st place.** Partnership path with PKO BP innovation team is active; handoff docs for the SKO 2.0 product team are the near-term priority (see README "Future roadmap"). |
| Killer demo move (used on stage) | Live-rotate an AI hra during the pitch, show the city building animate in, take a mortgage, show the credit-score meter tick up. |

### 🥈 SECONDARY — ETHLegal / Law Innovation (University of Silesia partnership)

| Field | Value |
|---|---|
| Sponsor | University of Silesia (Wydział Prawa) |
| Confirmed prize | TBD — typically academic tracks award 2,000–5,000 PLN + research collaboration |
| What they want | Legal/regulatory innovation, often around data protection, smart contracts, consumer protection in PL/EU context |
| Our angle | **Legal-from-day-one privacy receipt** + **GDPR-K for kids' data** + **KNF-aligned financial-product depictions** (we don't pretend to be financial advice; every loan dialog has clear edu-disclaimer). Privacy policy page exists in 4 langs already. |
| Win probability | **Medium**. We'd need to expand the legal angle significantly — talk to the law faculty pre-judging if possible. |
| Killer demo move | Show the `/ochrana-sukromia` page; show the mortgage default dialog with KNF disclaimer; show GDPR Art. 17 deletion working in real time (one click → erased). |

### 🥉 TERTIARY — AI track (sponsor TBD, likely confirmed)

| Field | Value |
|---|---|
| Sponsor | Likely cross-sponsor — Critical Applications or general AI bounty |
| Confirmed prize | Mentioned in article: "AI model training" track |
| What they want | Use of AI models in production (not just as a feature) |
| Our angle | **Production AI pipeline**: Sonnet 4.6 generates daily challenges, Haiku 4.5 ×3 translates in parallel, prompt caching, kind-specific schemas, multi-language locked-numeric structure preservation. Show the architecture in `/o-platforme`. |
| Win probability | **Medium**. Strong technical story but many other AI projects too. |
| Killer demo move | Show the live admin endpoint generating a brand-new game in 30s end-to-end across 4 langs, while running. The "see it being created" moment. |

### 🎯 OPPORTUNISTIC — Tauron Energy

| Field | Value |
|---|---|
| Sponsor | TAURON Polish Energy |
| Confirmed prize | TBD |
| What they want | Energy / sustainability angle, likely Web3-flavored |
| Our angle | We have **3 evergreen energy games** (energy-dash, power-flip, stock-tap) + multiple energy-themed AI challenges (Earth Hour, Pompa ciepła, Fotowoltaika, EV stacja). The Watts resource literally maps to electricity. Building economy includes Mała elektrownia + Fotowoltaika as core producers. |
| Win probability | **Low–medium**. Not our primary fit but the energy literacy angle is strong. |
| Killer demo move | Filter by "energy" buildings; show the Watts production graph; mention Earth Hour event flavor. |

### 🎯 OPPORTUNISTIC — Critical Applications (Infrastructure security)

| Field | Value |
|---|---|
| Sponsor | Critical Applications |
| Confirmed prize | TBD |
| What they want | Infrastructure security, secure systems |
| Our angle | scrypt password hashing, HMAC-signed cookies, no third-party trackers, EU-only data residency, GDPR-compliant deletion. **Security-by-design** is in the architecture from day one. |
| Win probability | **Low**. Too generic; security-track usually wants infra/protocol-level work. |
| Killer demo move | Show `lib/auth.ts` + the privacy page. Less interesting than gameplay, lower priority. |

### 🤔 ASPIRATIONAL — General / Best Overall

| Field | Value |
|---|---|
| Sponsor | ETHSilesia organizers |
| Prize | TBD |
| Win probability | **Low–medium**. Best-overall typically goes to flashy Web3 or strong infrastructure entries. Watt City's strength is product polish + clear partnership story, less so "novel blockchain". |

## Pitch strategy

### What's on the slide deck

1. **Slide 1 — Problem** — Static SKO videos sit unwatched. Kids spend their attention on Brawl Stars / TikTok. PL kids' financial literacy is weak (OECD PISA citation).
2. **Slide 2 — Concept** — Watt City: daily-rotating AI challenges; resource economy; build-and-loan loop = financial literacy by play.
3. **Slide 3 — Live demo** — register → play AI hra → build a building → take mortgage → show city.
4. **Slide 4 — Tech** — Sonnet+Haiku pipeline, Redis-backed leaderboards, 4-lang locked-structure translation, Vercel cron.
5. **Slide 5 — Why PKO wins** — drop-in engine for existing SKO app shell; 6-month pilot proposal; specific D1/D7 retention KPIs we'll prove.

### What ON-PITCH live actions to perform

- Show `/games` city scene with multiple AI buildings
- Click new building → take mortgage → see credit score
- Switch language to UK/CS/EN to show real translation
- Open admin endpoint in second terminal, force-rotate a new theme — judges see it appear in <30s
- Open `/o-platforme` — show the pipeline diagram (we updated it tonight)
- Show `/sin-slavy` archive — medals are permanent, "this is what makes it stick"

### Pre-pitch checklist (all checked on the day)

- [x] Production deploy stable (https://watt-city.vercel.app)
- [x] All 12 AI kinds generated and visible (quiz / scramble / price-guess / true-false / match-pairs / order / memory / fill-in-blank / calc-sprint / budget / chart-read / what-if)
- [x] Sample player seeded via `/api/admin/seed-demo-player` (99% scores across every evergreen game)
- [x] Admin terminal pre-loaded with example rotate command
- [x] `/o-platforme` updated with current pipeline diagram
- [x] Slide deck finalised (Phase 1 backlog 1.9.5)
- [x] 3-min demo script rehearsed (1.9.6)
- [x] Backup plan: pre-recorded screen capture as fallback

## Submission requirements (met on submission)

- Public GitHub repo: ✅ [B2JK-Industry/watt-city](https://github.com/B2JK-Industry/watt-city)
- Live deployment URL: ✅ https://watt-city.vercel.app
- README explaining what the project is: ✅
- Demo video: ✅
- Slide deck: ✅

## Post-event outcomes (actuals)

Gaming track win → the following are the active follow-ups:
- Direct pitch meeting with PKO Bank Polski innovation team — scheduled.
- Pilot proposal (Phase 4 of backlog) — drafting.
- Handoff / audit docs for the web3 layer — precondition for mainnet
  (see `docs/web3/SUBMISSION.md`).

Other tracks:
- ETHLegal / AI / Tauron / Critical Applications — we did not place.
  The legal-privacy posture (GDPR Art. 17 deletion, parent-consent flow,
  KNF-style disclaimers) shipped anyway and is live on production.
- Public GitHub repo + live demo remain as portfolio assets.

## Backup tracks to scan onsite

When at the venue, check the bounty board for:
- Hidden / late-added bounties (often the best-fit ones get added day-of)
- Prize bonuses for using specific protocols (e.g. "+500 PLN if deployed on Base")
- Best newcomer / best student team (we may qualify)
- Audience choice award (vote-based)
- Most-creative-use-of-AI prize (often a sponsor side-prize)

Check booths for:
- Critical Applications (security)
- Tauron (energy)
- PKO (gaming)
- University booth (legal)
- Any new sponsors not in the public list

## What to record after each pitch

After every demo to a booth/judge, note in a shared doc:
- Which judges spoke to (names + roles)
- What specific feedback they gave
- Which feature they liked most
- Which feature they questioned
- Whether they want a follow-up

This is the warm-leads log for post-event outreach, regardless of winning.

---

**Frozen 2026-04-22.** Preserved as the pre-event targeting plan; outcome recorded in the banner at the top. Post-event follow-ups live in `docs/progress/` and the repo README.
