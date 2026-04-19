# Research partnership opportunities — Phase 10.3

> Non-engineering catalogue. Agents do not execute partnership
> agreements; this is a pipeline document for the operator / founder /
> head-of-partnerships.

## 10.3.1 — University research partnership

**Goal**: a D30-retention vs financial-knowledge-gain study run by a
Polish university, using anonymised Watt City data.

### Targets
- **SGH Warsaw School of Economics** — Behavioural Economics
  Department; Prof. Dr. hab. Jakub Jurecki has published on
  gamification of personal finance.
- **University of Warsaw — Faculty of Psychology** — Digital
  Learning cluster.
- **AGH Kraków — Computer Science** — for ML-side collaboration on
  AI-pipeline content quality.

### Scaffolding we've already shipped

- First-party analytics (Phase 5.3) stores per-user event streams.
- Achievement + lifetime-stats derivatives already computed.
- GDPR Art. 20 export endpoint (`/api/me/export`) means we can answer
  a parent's "please don't include my child" request cleanly.

### What we still need

- Anonymisation step (scrub usernames to stable hashes per study).
- IRB approval at the partner university.
- A data-processing agreement (DPA) template.
- Research dataset export endpoint: filter → anonymise → dump.

## 10.3.2 — Anonymised research dataset

When 10.3.1 lands, publish an anonymised slice on Zenodo or OSF with a
Creative Commons license. Useful for:
- Replication of the study.
- Financial-literacy research by other teams.
- Potential citations that help the pilot program's funding pitch.

Open question: should we prefer CC-BY (maximal reuse) or CC-BY-NC
(non-commercial only, safer against predatory ML training)? Revisit
with legal.

## 10.3.3 — Conference talks

### Polish
- **Mobile Trends Awards** (Kraków) — November annually. "Finance
  games for kids in the PKO partnership era."
- **Złoty Bankier** (Katowice / Warsaw) — May annually. Ideal forum
  for the PKO-partnership narrative.
- **SECURITECH PL** — present Phase 6.1 + 6.3 GDPR-K security
  architecture.

### EU / EN
- **GamesBeat Summit** (USA) — pitch Watt City as a Polish
  financial-edu case study.
- **Bett Show London** — EdTech focus; education-specific audience.
- **SIX5 Stockholm** — Nordic fintech crowd; cross-pollination with
  PKO BP's Swedish peers.

## Outreach playbook

Don't ask until we have: (a) a 3-minute demo video of Watt City,
(b) a one-pager PDF with the numbers, (c) a named agent / operator who
owns the partnership.

Cold email template lives at `docs/partnerships/OUTREACH.md` (TODO —
write this when a partnership is imminent).

## What NOT to partner on (hard nos)

- Ad-tech integrations.
- Walled-garden data sharing with any platform (Facebook, TikTok,
  Snap).
- Anything that requires us to ship a tracker onto kids' devices.
- Crypto-exchange co-marketing — even with a legitimate partner, the
  kid-product fit is wrong.
