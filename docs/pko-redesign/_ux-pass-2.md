# UX Pass 2 — Senior dizajn audit (2026-04-25)

> Driver: user feedback z screenshot session. Round 1 pokryl SS1–SS12 (commit `d2aaeca`).
> Tento dokument zachytáva ďalšie pozorovania ako _návrhy_ — niektoré aplikované v PR
> následujúcom za týmto, niektoré flag-ované ako produktové rozhodnutia.

## Aplikované v tomto PR (round 2)

| ID | Kde | Zmena |
|---|---|---|
| P-01 | `/login`, `/register` | H1 → `t-h2 text-accent`; body → `t-body text-foreground`; pridaný compliance trust-strip (GDPR-K · KNF / UOKiK · EU-hosted) |
| P-02 | `/` landing hero body | `text-[var(--ink-muted)]` → `text-[var(--foreground)]` (rovnaký pattern ako SS6 fix na `/o-platforme`) |

## Návrhy / observácie (nie aplikované — vyžadujú dohodu)

### A. **Landing hero je text-heavy, chýba vizuál**
**Dnes:** veľký H1 + body + 3 CTA + 4 game-tiles + side karta s top-3 city. Žiadny obrázok / illustration / scene preview hore.
**Návrh:** vpravo v hero (kde je teraz top-3 cities karta) **mini city-scene preview** + pod ním top-3 cities ako menšia karta. City-scene = okamžite ukáže "ako tá hra vyzerá".
**Trade-off:** city-scene je 1679 LOC SVG, render-cost. Riešenie: použiť `compact` mode + non-interactive.

### B. **Dashboard "Recent games" sekcia chýba alebo je spojená**
**Dnes:** dashboard má CityLevelCard → grid (welcome+ring | TopSilesia) → CitySkylineHero → LoanSchedule → atď.
Chýba **"Last played"** strip — 3 chips s posledne hranými hrami a ich rekordom (rýchly re-engagement).
**Návrh:** medzi grid a CitySkylineHero pridať horizontálnu chip-row "Naposledy" s 3 game thumbnails + best score.

### C. **Empty states sú iba text**
**Dnes:** Top-Silesia empty = `<p>{d.topEmpty}</p>`. /friends empty = malý text. /achievements empty = N/A.
**Návrh:** emoji-led empty states s CTA. Príklad TopSilesia: `🏆 Buď prvním! → Zahrej minihru`. Friends: `👥 Pozvi prvního → Zkopírovat odkaz`.

### D. **/games hub aside "Buildings map" je list bez vizuálnej hierarchy**
**Dnes:** bullet list s emoji dot + game name + chip s duration. Plain.
**Návrh:** card-grid (3-col desktop) s game thumbnail + best score + duration chip. Plus "Recommended ★" badge na hre s 0 plays.

### E. **/leaderboard tabuľka data-dense, chýba "your row" sticky**
**Dnes:** Tabuľka 50 hráčov. Ja-row má farebný highlight, ale ak som mimo top-50 alebo scrollnem dole, neviem kde stojím.
**Návrh:** sticky bottom-bar so štatistikami "Ty: #54 · 320 W · do top-50 chýba 440 W". Mobile-friendly.

### F. **/o-platforme veľmi dlhý — chýba TOC / sticky section nav**
**Dnes:** 7+ veľkých sekcií, 1 obrazovka rolovať na hľadanie konkrétneho topicu.
**Návrh:** sticky vedľa obsahu (desktop) alebo collapsible top (mobile) nav: Myšlienka · Veda · Ako · Pipeline · Tím · Sponzori. Alebo aspoň anchor-friendly H2 IDs.

### G. **Avatar emoji v profile nie je personalizovateľný v UI**
**Dnes:** `avatarFor(state.profile?.avatar)` vyberie avatar z catalogu; ProfileEdit umožňuje zmeniť. Ale avatar v dashbord/leaderboard nepopisuje player vibe (vidíme len 2-letter initials z mojho LeaderboardCard fixu).
**Návrh:** uniformné použitie `avatarFor()` glyphu naprieč: dashboard top-card, TopSilesia karta, /friends, /profile. Konzistencia + osobnosť.

### H. **Cookie consent banner — UX dark-pattern check**
**Dnes:** 1 button "Rozumiem" + 1 ghost link "Více". Per spec §13 by mali byť 3 buttons rovnakej váhy. Aktuálne ok pre "iba essentials" cookies, ale UX vyzerá ako klasický "agree-only" dark pattern.
**Návrh:** doplniť **"Žiadne tracking cookies"** subtitle banneru, aby user vedel že nemusí "súhlasiť s ničím tracking-related". Súčasný copy už hovorí "No trackers" — len ho zvýrazniť.

### I. **Watts/coins/bricks resource bar — chýba kontext**
**Dnes:** ResourceBar v sticky header zobrazuje 4 čísla. User nevidí čo znamenajú bez najdenia tooltipu.
**Návrh:** každý resource ikona + krátky label pod ňou (`⚡ Watts 320` namiesto len `⚡ 320`). Alebo na hover ukázať yield-per-hour.

### J. **City-scene tap targets**
**Dnes:** budovy v city-scene majú SVG `<a>` tap zone, ale na mobile sú malé (~80x100 px reach area). 44x44 minimum WCAG splňujú, ale sú tesne.
**Návrh:** zvýšiť building hit-rect na min 60x80 alebo pridať invisible padding. Alebo pridať visual hover hint (border on touch).

### K. **Tier-up toast — celebration moment**
**Dnes:** confetti + krátka karta. Pozícia bottom-24 left-1/2. Solid navy bg + biele text + accent border.
**Návrh:** dramatickejší vstup (scale 0 → 1 + bounce-easing), big tier number, "Nový dom!"-style headline. Aktuálne nie celebračný, viac "info notification".

### L. **Game choice z anonymous landing → /register flow**
**Dnes:** Anonymous user na `/` vidí 4 game tiles ale klik na ne ide na `/games/<id>` ktoré ho asi presmeruje na /login.
**Návrh:** na anonymous landing tiles by mali viesť na "preview/demo" alebo direct-register prompt, nie unauth /games/<id>. Reduce friction.

### M. **Marketplace tier-gate copy**
**Dnes:** `🔒 {copy.tierGate}` = "Giełda aktywna od Tier 7 (odblokujesz budując Stację kolejową)."
**Návrh:** doplniť **progress bar**: "Tier 3/7 → 4 buildings to go". User vidí ako blízko je, motivácia hrať.

### N. **Navigation: chýba "Pomoc" / FAQ / Tutorial**
**Dnes:** v site-nav nie je položka pomoc/FAQ. OnboardingTour spustí sa raz pri prvom logine. User ktorý zabudol ako sa hrá nemá kam.
**Návrh:** v site-nav pridať "Tutorial" položku (alebo v footri Help columne — už máme Help so {compareLoans, faq, contact}). Aktivovať `OpenTutorialButton` v nav alebo dropdown profile.

### O. **Color: `--ink-subtle` (#b7b7b7) je placeholder color, často mis-used**
**Dnes:** Vstupy placeholders majú správnu farbu. Ale niekoľko miest používa `--ink-subtle` na "disabled label" → kontrast 2:1 fail (našli sme cez axe). Po SS-fixe to nie je problém, ale **hodnota tokenu je nebezpečná pre body content**.
**Návrh:** pridať CSS guard (lint rule alebo PR review check): "`--ink-subtle` iba pre placeholder, nie pre rendered content".

### P. **Brand discipline: "Akcia je iba raz" pravidlo**
**Dnes:** `01-BRAND-MANUAL.md` §10 hovorí "PRIMARY SALES 1× na obrazovku". Audit v PR-A skontroloval landing — máme `btn-sales` (1) + `btn-secondary` + `btn-ghost`. ✓
Ale nikde v kódovej base nie je **lint rule** ktorý by zabránil regression. Niekto pridá druhý `btn-sales` na rovnakú stránku, nikto si nevšimne.
**Návrh:** vitest test `lib/brand-rule.test.ts` ktorý parse-uje JSX a counta `.btn-sales` výskyty per route. Fail ak > 1 v najvyššom-úroveňovom node.

### Q. **Brand: nikde nepoužívame PKO grafickú maskot / fotografiu**
**Dnes:** spec povedala "mascot=null, kým PKO nedodá asset". Aktuálne fotografia v hero je 0. Iba decorative emoji v chips.
**Návrh:** **flag pre PKO product-side**: doručiť 1 hero foto (kid v škole + tablet) pre landing + 1 photo per audience (kids/teachers/parents). Dovtedy emoji-only je OK ale "neuteří" feel.

---

## Súhrn

- **Aplikované round-1 (SS1–SS12):** 12 fixov, commit `d2aaeca`. Pokrýva všetky user-flagged screenshoty.
- **Aplikované round-2 (P-01–P-02):** 2 polish fixes, tento commit.
- **Návrhy A–Q:** 17 ďalších observácií. Z toho:
  - **Quick wins (môžem aplikovať teraz):** A (hero city-scene), B (recent games strip), C (empty states), D (/games card grid), I (resource bar labels), L (anon CTA flow), M (tier progress bar)
  - **Vyžaduje produktové rozhodnutie:** F (TOC), N (FAQ position), Q (PKO mascot)
  - **Vyžaduje dataset/asset:** G (avatar), J (city tap targets), K (tier-up animation)
  - **Engineering hardening:** H (cookie copy), O (token guard), P (brand lint)

**Odporúčanie pre ďalší krok:** zoberiem 4–5 quick wins (A, B, C, I, M) a urobím PR-3. Ostatné flagujem v reporte na produktový review.
