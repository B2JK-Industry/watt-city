# SKO × Watt City — Visual System v1

**Verzia:** v1.0 (production-ready spec)
**Dátum:** 2026-04-24
**Author:** Senior Product Designer (PKO Junior / Revolut / Kahoot lineage)
**Predchádzajúce:** `docs/partnerships/PKO-BRAND-MANUAL-v0.1.md` (approximated), `PKO-BRAND-MANUAL-v0.2.md` (verified draft).
**Pilot, ktorý sa nepodaril:** `pilot/sko-skin-v0.2` git branch — colour swap only, neo-brutalist tvary ostali.

## Prečo v1 a nie v0.3 manual

v0.1 a v0.2 boli **brand manuály** (PDF-style narrácie). Tento adresár je **executable design system** — každý súbor okrem `01–03` (audit/inventory) je code-applicable bez ďalšieho prepisovania:

- `04-GLOBALS-PKO.css` → `cp` do `app/globals-pko.css`, importnúť za `globals.css`.
- `04-DESIGN-TOKENS.json` → Style Dictionary input pre Figma / iOS / Android.
- `06-EXECUTION-PLAN.md` → 30+ presných `file:line` zmien, hours estimate, rollback per item.

## Súbory

| # | Súbor | Účel | Output formát |
|---|-------|------|----------------|
| 00 | `00-INDEX.md` | Tento súbor | navigácia |
| 01 | `01-PKO-AUDIT-RAW.md` | Čo sme stiahli z `pkobp.pl`, `pkobp.pl/junior`, `sko.pkobp.pl` 2026-04-24, citácia URL + výskyt | tabuľka tokens |
| 02 | `02-WATT-CITY-BRUTALISM-INVENTORY.md` | Každý neo-brutalist artifact v repe, `file:line`, kategorizovaný | tabuľka |
| 03 | `03-PKO-VS-WATT-CITY-GAP.md` | Dimension-by-dimension gap (15+ riadkov) | tabuľka |
| 04 | `04-DESIGN-TOKENS.json` | Style Dictionary tokens, source-of-truth | JSON |
| 04 | `04-GLOBALS-PKO.css` | Production override, `:root[data-skin="pko"]` | CSS, copy-paste-ready |
| 05 | `05-COMPONENTS-SPEC.md` | 15 komponentov: anatomy + states + tokens + 20–50 LOC CSS | spec + code |
| 06 | `06-EXECUTION-PLAN.md` | 30+ položiek `file:line`, before/after, hours, rollback | checklist |
| 07 | `07-LANDING-HERO-REDESIGN.md` | `app/page.tsx` redesign — banking-clean hero | layout spec + code |
| 08 | `08-CITY-SCENE-REFACTOR-PLAN.md` | 73 unique hex / 229 výskytov v `city-scene.tsx`, 3 cesty + odporúčanie | refactor plan |
| 09 | `09-VOICE-AND-COPY-PL.md` | Polish copy deck: 20 buttons, 10 errors, 5 empty states, 5 tier-up, 3 onboarding | copy |
| 10 | `10-VALIDATION-REPORT.md` | Evidence checklist, 15+ brutalism overrides before/after, 5–10 risk points, hodinová tabuľka | self-audit |

## Závislosti

- v1 je **mount-point** (`<html data-skin="pko">`); core skin neupravuje.
- `lib/theme.ts` ostáva ako env-driven router (verified pri tomto auditu, zachovaný kontrakt).
- Žiadny PKO proprietárny asset (font `pkobp`, logo „skarbonka", `Żyrafa Lokatka` vector) nie je v tomto pakete — všetky majú **SUBSTITUTE** + **TODO PKO BP brand team** flag v `10-VALIDATION-REPORT.md`.
