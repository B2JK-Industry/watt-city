# UX review brief — PKO redesign post-implementation

**Pre koho:** UX dizajnér / tester preberá post-refactor build (`SKIN=pko` default) a reportuje vizuálne + interakčné nedostatky. Implementácia je hotová (E0–E6, 82 tiketov) ale vizuálne polish chýba — toto je round 2.

**Rozsah:** iba vizuál, interakcia, copy-in-context. **Nie** backend, logika, routing, i18n texty.

---

## 1. Setup

```bash
# Default skin = pko (svetlý, navy + orange)
pnpm dev   →  http://localhost:3000

# Porovnanie s legacy neo-brutalist skinom
SKIN=core pnpm dev
```

**Účty na prihlásenie** (dev in-memory fallback):
- vytvor si cez `/register` nový — birth year > 2010 aktivuje rodičovský flow
- existujúci seed users: pozri `docs/` (ak nie sú — registruj).

**Viewporty na test:**
- Desktop **1440×900** (primary)
- Tablet **768×1024**
- Mobile **390×844** (iPhone 14)
- Malý mobile **320×568** (fallback floor)

**Prehliadače:** Chrome (baseline), Firefox, Safari. Ignoruj IE.

---

## 2. Čo očakávame že nájdeš (a kde to ide najpravdepodobnejšie sedieť)

### A. **Kontrasty a čitateľnosť**
- Text `text-zinc-*` / `text-amber-*` / `text-rose-*` pozostatky — boli navrhnuté pre dark skin, na bielej môžu byť nečitateľné.
  - Suspect files: `components/dashboard.tsx`, `components/cashflow-hud.tsx`, herné komponenty
  - Report: kde je kontrast < 4.5:1 voči white bg
- Chip/badge hodnoty, ktoré sa „stratili" vo svetlom móde.
- Tooltips, disabled states.

### B. **Inline style farby + hex leaks**
Niektoré komponenty mali inline-style hex (`#0a0a0f`, `#fbbf24`, atď.), ktoré hromadný strip nepokryl.
- Suspect files: `app/leaderboard/page.tsx`, `app/sin-slavy/page.tsx`, `components/city-level-card.tsx`
- Report: každá farba mimo palety v `02-DESIGN-TOKENS.md` §1

### C. **City-scene panoráma**
- Aktuálne pod pko skinom beží iba CSS filter `saturate(.55) brightness(.95)` (stopgap — 1679-line SVG refactor bol mimo time-budget).
- Ako to reálne pôsobí? Lepšie / rovnako zlé / horšie než core?
- Hoveruj budovy — building-link glow teraz navy, nie yellow.
- Mobile zoom/pan?
- Ak „stále vyzerá arcade" → potrebujeme skutočný 8-bucket refactor (tiket E4-02/03).

### D. **Hierarchia CTA na landing page (`/`)**
- Má byť **1 primary orange** (Register/Otwórz konto), zvyšok secondary/ghost.
- Skontroluj či niekde nie sú 2 oranžové tlačidlá vedľa seba.
- Secondary a ghost buttony — rozlíšiteľné?

### E. **Site-nav**
- Výška 72 desktop / 56 mobile — pôvodne bola `h-16` (64px). Má zmysel meniť?
- Aktívny link — momentálne iba hover color. Má mať spodnú čiaru? (spec §5)
- Mega-menu pod „Klient indywidualny" → **neimplementované**. Chce to biznis, alebo je jednoduchý nav OK?
- Mobile drawer (full-screen slide-in) — momentálne iba horizontálny scroll bar pod nav. Je to dosť, alebo chce hamburger drawer?

### F. **Footer**
- Layer 1 (4 action pill buttons) — **neimplementované**, backlog tiket E3-04
- Layer 2 (kurzy tabuľka) — **neimplementované**
- Layer 3 (5 link stĺpcov) — **neimplementované**
- Current footer má iba legal + social linky. Treba plný 4-vrstvový footer, alebo je minimálny OK pre tento produkt (hra, nie banka)?

### G. **Formuláre**
- `/register` + `/login`:
  - Label nad input? Error state čitateľný?
  - Placeholder farba = `--ink-subtle` (#b7b7b7) — dosť kontrastu?
  - Select element (birth year) vyzerá natívne — chce vlastný styling?
- Profile edit, marketplace, propose-theme — rovnaké flow overiť.

### H. **Tabuľky**
- `loan-comparison.tsx`, `loan-schedule.tsx` — mali byť flat pkobp.pl štýl (border-bottom rows, no cards). Skontroluj.
- `leaderboard-row` — hover highlight subtle enough?
- Čísla pravo-zarovnané, tabular-nums všade?

### I. **Toast + modal**
- `tier-up-toast`, `new-game-toast`, `notification-bell` dropdown
- `cookie-consent` banner
- `onboarding-tour`, `teacher-onboarding-tour` modals
- Entry animácia teraz bez opacity (kvôli axe). Cíti sa to poškodené?

### J. **Dashboard (logged-in `/`)**
- Komplexný surface — mnoho kariet, resource bar, game grid, leaderboard preview, city-level-card.
- Report: vizuálna hierarchia (čo priťahuje oko ako prvé?)
- Vertikálny rytmus medzi sekciami.
- City-scene uprostred — pôsobí ako centerpiece alebo disrupcia?

### K. **Edge cases**
- Prázdne stavy (no games, no notifications, no friends)
- Dlhé stringy (username `averyveryverylongname`, long game title)
- Error states (network fail, 404 page, 500 page)
- Loading skeletons (ak existujú)

### L. **Accessibility manual pass** (complementary to axe-core)
- Tab order na každej stránke — logický?
- Focus ring viditeľný 2px navy + offset?
- Screen reader (VoiceOver/NVDA) — landmark labels, button names OK?
- Zoom 200% — layout nestráca funkcionalitu?
- Reduced motion — animácie vypnuté? (`System Preferences → Accessibility → Display → Reduce motion`)

---

## 3. Čo **neriešiť** (mimo skop)

- ❌ Zmena textov (CTA, labels, errors) — i18n dictionaries fixné
- ❌ Pridávanie/uberanie features
- ❌ Herná logika, routing, DB, API
- ❌ Pridávanie nových komponentov (reuse existujúcich primitives)
- ❌ Nová ikonografia (Lucide knižnica môže neskôr, nie teraz)
- ❌ Mascot / logo / fotografia — čaká sa na partner-side asset delivery
- ❌ Dark-mode pko variant — follow-up epic
- ❌ Skin toggle UI (cookie-based) — follow-up

Ak narazíš na niečo z vyššie, **flagni** ale **neopravuj** — patrí to do samostatného backlogu.

---

## 4. Formát reportu

Vytvor súbor `docs/pko-redesign/_ux-findings.md` so štruktúrou:

```markdown
## F-001 — [CRITICAL / MAJOR / MINOR / POLISH] Krátky názov

**Kde:** `/cesta/k/stránke` — desktop 1440 / mobile 390
**Ako reprodukovať:** 1. krok, 2. krok, 3. klik
**Čo vidím:** (screenshot — priloženie do `_findings-screenshots/F-001.png`)
**Čo očakávam:** podľa `03-COMPONENTS.md` §X má byť Y
**Root cause guess:** `components/foo.tsx:42` používa `text-zinc-400` ktoré v light skine má kontrast 2.1:1
**Navrhovaný fix:** nahradiť za `text-[var(--ink-muted)]` (= #636363, kontrast 5.7:1)
**Severity:** CRITICAL (blocks merge) / MAJOR (fix pred prod) / MINOR (sprint +1) / POLISH (nice-to-have)
```

### Severity rubric

| Severita | Kritérium |
|---|---|
| **CRITICAL** | Rozbité UX — unusable feature, kontrast < 3:1, stránka nepoužiteľná na mobile |
| **MAJOR** | Viditeľný vizuálny bug, kontrast < 4.5:1 body text, porušený brand manuál (neon farba, hard-offset shadow) |
| **MINOR** | Inkonzistencia (dva štýly tej istej komponenty), drobný mismatch voči specu |
| **POLISH** | Nápad na vylepšenie nad rámec specu (animácia, empty state copy) |

---

## 5. Priorita trasy

Projdi v tomto poradí — začni na najviditeľnejšom:

1. **Anonymná landing** (`/`) — najkritickejšia first-impression
2. **Register + Login** (`/register`, `/login`) — conversion-critical
3. **Logged-in dashboard** (`/`) — najhustejší surface
4. **Město** (`/miasto`) — city-scene je vizuálny risk
5. **Games hub** (`/games`) + jedna hra do hĺbky
6. **Leaderboard** (`/leaderboard`) — tabuľka
7. **Marketplace** (`/marketplace`) — cards grid
8. **Profile** (`/profile`)
9. **Friends** (`/friends`)
10. **Teacher flow** (`/nauczyciel`, `/class/[code]`) — menej traffic ale tiež redesign
11. **Parent flow** (`/rodzic`)
12. **Static pages** (`/o-platforme`, `/ochrana-sukromia`, `/sin-slavy`) — najmenší traffic

---

## 6. Deliverables

Pred ukončením reportu:

- [ ] `docs/pko-redesign/_ux-findings.md` — všetky findingy v štruktúre §4
- [ ] `docs/pko-redesign/_findings-screenshots/` — screenshots per finding ID
- [ ] Súhrn v hlavičke `_ux-findings.md`:
  - celkový počet findingov per severita
  - 3 najväčšie red-flag témy
  - návrh poradia opravy (čo ide do prvého sprintu, čo do backlog)
- [ ] **Nie** commity — iba markdown + screenshoty. FE team urobí fixy v samostatnom PR.

---

## 7. Koľko to bude trvať

- **Quick pass** (1 dizajnér, 2 hodiny) — top 5 routes desktop-only, ~15 findingov, surface level
- **Full pass** (1 dizajnér, 1 deň) — všetkých 12 routes desktop + mobile, ~40 findingov
- **Thorough pass** (1 dizajnér + 1 tester, 2 dni) — full + edge cases + a11y manual + i18n variants, ~80 findingov

Odporučená minimum: **Full pass**.

---

## 8. Kontakt pri nejasnosti

Ak `_ux-findings.md` report vyžaduje rozhodnutie ktoré patrí product/design owner-ovi (napr. „má byť sekcia H výraznejšia?") — označ severity **POLISH** a pridaj `@decision-needed`. Neblokuj review kvôli týmto veciam.

Priorita zdrojov pri konflikte spec vs. reality:
`01-BRAND-MANUAL.md` > `02-DESIGN-TOKENS.md` > `03-COMPONENTS.md` > aktuálny kód.
