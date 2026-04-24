# PKO-style redesign — index

Dokumentácia kompletnej **vizuálnej** prestavby Watt City do minimalistického štýlu [pkobp.pl](https://www.pkobp.pl/).

> **Rozsah:** iba dizajn — farby, typografia, komponenty, rozloženie, tiene, ikony, animácie.
> Backend, dátové modely, herná logika, routing, API, DB schéma — **nemenia sa**.
> Žiadny feature nepribúda, žiadny feature neodchádza. Len vizuál.

## Cieľové publikum

Tento balík je **odovzdávka pre FE vývojára** (resp. dizajnéra + FE dvojicu). Je zámerne presný a bez dvojznačností — čítateľ nemusí doklikávať zdrojové CSS banky.

## Súbory v tomto priečinku

| Súbor | Čo obsahuje | Pre koho |
|---|---|---|
| `00-README.md` | Tento prehľad | Všetci |
| `01-BRAND-MANUAL.md` | Tonalita, vizuálny jazyk, pravidlá, DO/DON'T | Dizajnér + FE |
| `02-DESIGN-TOKENS.md` | Presné hodnoty: farby, typografia, spacing, radius, shadow, motion — v CSS/TS/JSON | FE (copy-paste ready) |
| `03-COMPONENTS.md` | Spec každého komponentu: anatómia, stavy, varianty | FE |
| `04-BACKLOG.md` | Ticketovaný implementačný backlog (5 epicov, ~45 tiketov) | FE + PM |
| `05-MIGRATION-NOTES.md` | Pasce, SKO-revert lekcie, pre-merge checklist | FE + reviewer |

## Kľúčové zistenia z analýzy pkobp.pl

- **Primárna farba je navy `#003574`, NIE red.** (Častá mylná predstava.)
- Accent pre predajné CTA = **teplá oranžová `#db912c`** (nie červená).
- Paleta má iba **13 farieb** — extrémna disciplína.
- Font rodina: vlastný webfont `pkobp` (nie je verejne licencovateľný) — používame **Inter** ako otvorenú náhradu s rovnakou metrikou.
- Border-radius: **10 px** na tlačidlá a karty, **0** na inputy a tabuľky.
- Tiene: iba dva štýly — `0 0 0 1px #e5e5e5` (1 px outline shadow) a `0 3px 6px #00000029` (mäkký drop).
- Žiadne neon, žiadne hrubé obrysy, žiadne hard-offset tiene, žiadne `uppercase` nadpisy.

## Kontext — prečo teraz a prečo inak ako minule

V apríli 2026 bol pokus `SKO visual system` revertnutý komitom `e97b732` ako **directionally wrong**. Hlavné príčiny zlyhania sú zhrnuté v `05-MIGRATION-NOTES.md`. Kľúčové:

1. SKO postavilo dark-mode navy-on-navy dashboard. pkobp.pl je **light-mode, white-first**.
2. CSS `:root[data-skin="pko"]` shield **nedokáže** prebiť Tailwind arbitrárne utility (`border-[3px]`, `shadow-[6px_6px_0_0_var(--ink)]`). Tie majú rovnakú špecificitu a vyhrajú za runu. Brutalizmus sa musí mazať **z JSX zdroja**, nie prekrývať CSS-om.
3. Placeholder maskot vyzeral ako „broken image" — radšej nič než náhrada.

Tento redesign tieto lekcie explicitne rieši (viď `04-BACKLOG.md` epic E1 + E2).

## Ako pracovať s backlogom

1. Začni `04-BACKLOG.md` a vezmi **E0** (príprava tokenov) — blokuje všetko ostatné.
2. Paralelizovateľné epicy: **E2** (brutalizmus-remove v JSX) a **E3** (nové komponentové primitívy).
3. `05-MIGRATION-NOTES.md` má pre-merge checklist — prejsť pred každým PR.
4. Všetky tikety majú akceptačné kritériá. Testy sú existujúce (vitest 635, Playwright 13) — netreba pridávať, treba zachovať zelené.
