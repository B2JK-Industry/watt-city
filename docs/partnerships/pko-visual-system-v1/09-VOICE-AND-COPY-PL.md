# Phase 4.7 — Voice & Copy Deck (Polish)

Source for register: `01-PKO-AUDIT-RAW.md §1.8`.

Hard rules (under SKO skin):
- Sentence case everywhere (žiadny ALL-CAPS okrem akronymov: SKO, PKO, RODO).
- Tykanie pre dieťa (`Otwórz`, `Sprawdź`), vykanie pre rodiča/učiteľa (`Państwo`, `Państwa`).
- Žiadne emoji ako brand prvok (interné UI ikony cez SVG, nie emoji v copy).
- Krátke vety: priemer ≤ 14 slov.
- Polish-specific glyphs: ą ć ę ł ń ó ś ź ż — font (`Inter`) ich pokrýva.
- „W-dolary" je in-game mena. **Nikdy** ich nepomenovať „pieniądze". Vždy s prefixom „W-" alebo sufixom „W$".

---

## 1. Button labels (20)

| # | Skin | Label | Kontext |
|---|------|-------|---------|
| 1 | both | Załóż konto | Hero CTA, register |
| 2 | both | Zaloguj się | Login |
| 3 | both | Wyloguj | Logout |
| 4 | both | Sprawdź | Verify field, generic confirm |
| 5 | both | Graj | Open game |
| 6 | both | Buduj | Place building |
| 7 | both | Ulepsz | Upgrade building |
| 8 | both | Anuluj | Modal cancel |
| 9 | both | Zapisz | Save form |
| 10 | both | Zamknij | Close dialog |
| 11 | pko-only | Otwórz konto SKO | Marketing-style CTA pre rodiča |
| 12 | pko-only | Zobacz, jak działa | Secondary hero CTA |
| 13 | pko-only | Połącz konto z rodzicem | Parent linking |
| 14 | both | Zacznij od nowa | Reset / restart |
| 15 | both | Pokaż więcej | "Show more" |
| 16 | both | Wróć | Back |
| 17 | both | Dalej | Next |
| 18 | both | Wyślij prośbę | Send friend request |
| 19 | pko-only | Pobierz raport (PDF) | Parent dashboard |
| 20 | both | Zaproś nauczyciela | Teacher invite |

> Core skin alternatives: `12 → "Zobacz demo"`, `19 → "Pobierz raport rodzica"` — fewer banking-formal terms.

---

## 2. Error messages (10)

| # | Field / scenario | Copy (PL) |
|---|-------------------|-----------|
| 1 | Empty username | Wpisz nazwę użytkownika. |
| 2 | Username taken | Ta nazwa jest zajęta. Spróbuj innej. |
| 3 | Wrong password | Hasło jest nieprawidłowe. |
| 4 | Network error | Nie można połączyć się z serwerem. Spróbuj za chwilę. |
| 5 | CSRF / session expired | Twoja sesja wygasła. Zaloguj się ponownie. |
| 6 | Build → not enough resources | Brakuje Ci {N} {resource}. Zagraj minigrę, żeby je zdobyć. |
| 7 | Loan → LTV too high | Kredyt zbyt duży w stosunku do dochodu. Zmniejsz kwotę albo dłuższy okres spłaty. |
| 8 | Friend request blocked (privacy) | Ten gracz nie przyjmuje próśb od nieznajomych. |
| 9 | Form validation min-length | Pole musi mieć co najmniej {N} znaków. |
| 10 | Generic 500 | Coś poszło nie tak. Odśwież stronę albo spróbuj za chwilę. |

> Tone: konkrétny problém + konkrétny next step. Žiadny „Oops!", žiadne „Sorry, this is on us". Banking norm.

---

## 3. Empty states (5)

| # | Stránka | Headline | Body | CTA |
|---|---------|----------|------|-----|
| 1 | `/miasto` (no buildings) | Twoje miasto czeka na pierwszy budynek. | Zagraj pierwszą minigrę, żeby otrzymać Sklepik. | [Graj minigry] |
| 2 | `/leaderboard` (anon) | Liga jest jeszcze pusta. | Zaloguj się, żeby pojawić się w rankingu. | [Zaloguj się] |
| 3 | `/games` (no AI rotation) | Brak nowych wyzwań AI w tej chwili. | Następne wyzwanie pojawi się jutro o 8:00. | — |
| 4 | `/rodzic` (no linked kid) | Nie masz jeszcze połączonego konta dziecka. | Wpisz kod, który dziecko ma w swoim profilu. | [Wpisz kod] |
| 5 | `/nauczyciel` (no class) | Nie masz jeszcze klasy. | Stwórz klasę i podziel się kodem z uczniami. | [Stwórz klasę] |

---

## 4. Tier-up / achievement copy (5)

Token: tier-up toast under PKO skin shows clean white card, navy border-left, no `🎉` emoji.

| Tier | Headline | Sub |
|------|----------|-----|
| 1 | Pierwszy poziom! | Twoje miasto rośnie. |
| 3 | Trzeci poziom miasta. | Możesz teraz postawić Bibliotekę. |
| 5 | Piąty poziom miasta. | Liga klasy zna Twoje imię. |
| 7 | Siódmy poziom miasta. | Odblokowano Stadion. |
| 9 | Dziewiąty poziom miasta. | Twoja gra jest dziś w TOP 10 Katowic. |

> Rule: tier-up copy je faktická, žiadny „YEAH!" / „Awesome!". Konkrétne čo sa odomklo.

---

## 5. Onboarding screens (3)

### 5.1 Onboarding for parent (vykanie)

| Screen | Title | Body | CTA |
|--------|-------|------|-----|
| 1/3 | Witamy Państwa w SKO × Watt City. | Pokazujemy, jak Państwa dziecko uczy się oszczędzania w grze. Zajmie to minutę. | [Dalej] |
| 2/3 | Co Państwo zobaczą? | Cotygodniowy raport: ile czasu dziecko spędziło w grze, jakie decyzje podjęło, które tematy z podstawy programowej omówiło. | [Dalej] |
| 3/3 | Pierwszy krok. | Dziecko zakłada konto na swoim urządzeniu i podaje Państwu kod. Państwo wpisują kod tutaj. | [Wpisz kod dziecka] |

### 5.2 Onboarding for child 9–11 (tykanie, krátke vety)

| Screen | Title | Body | CTA |
|--------|-------|------|-----|
| 1/3 | Cześć! Tu jest Twoje miasto. | Tutaj możesz zbudować szkołę, sklep, stadion. | [Dalej] |
| 2/3 | Jak działa miasto? | Grasz w minigry → masz Watty i Coiny → budujesz budynki → miasto rośnie. | [Dalej] |
| 3/3 | Twój pierwszy budynek. | Postaw Sklepik. Będzie Ci dawał monety co godzinę. | [Postaw Sklepik] |

### 5.3 Onboarding for child 12–14 (tykanie, viac kontextu)

| Screen | Title | Body | CTA |
|--------|-------|------|-----|
| 1/3 | Witaj w Watt City. | To jest gra o pieniądzach, ale bez prawdziwych pieniędzy. W-dolary istnieją tylko tutaj. | [Dalej] |
| 2/3 | Co się tu liczy? | Cashflow, inwestycje, kredyt. To samo, co Twoi rodzice znają z banku — tylko że tu możesz spróbować na pełnym gazie. | [Dalej] |
| 3/3 | Pierwszy ruch. | Postaw Sklepik za 80 W$. Co godzinę zarobi 12 W$. Ulepszenie podnosi przychód. | [Postaw Sklepik] |

---

## 6. Brand voice rules (summary)

| Rule | Pre dieťa | Pre rodiča / učiteľa |
|------|-----------|------------------------|
| Form | Tykanie (Ty, Twój) | Vykanie (Państwo, Państwa) |
| Sentence case | Yes | Yes |
| Length | ≤ 12 slov / veta | ≤ 16 slov / veta |
| Emoji v copy | Nie (UI icons OK) | Nie |
| Exclamation marks | Ojediinele, max 1 / screen | Žiadne |
| Slang | Nie | Nie |
| Sarcasm / irónia | Nie | Nie |
| Diminutíva | Šetrne ("Sklepik" je in-game názov, nie brand voice) | Žiadne |
| In-game mena | „W-dolary", „W$" | Vždy s disclaimerom „nie są prawdziwe pieniądze" |
| Bank-style terms | Vyhýbať („cashflow" → „przychody i wydatki") | OK („LTV", „kredyt") |

---

## 7. Disclaimers (always-on, sub-copy)

| Where | Copy |
|-------|------|
| Footer | GRA EDUKACYJNA — to nie są prawdziwe pieniądze. (sentence case s SKIP veľkého písmena „GRA EDUKACYJNA" — `06-EXECUTION-PLAN §9` znižuje na sentence case under PKO skin) |
| Footer (PKO skin) | W partnerstwie z PKO Bank Polski. Bez reklam i zakupów w aplikacji. |
| /loans/compare | Symulacja edukacyjna. Realny kredyt podlega ocenie zdolności kredytowej PKO BP. |
| /onboarding parent | Państwa dziecko nie ma dostępu do rzeczywistych funduszy z konta SKO przez tę grę. |
| Cookie banner | Używamy plików cookie tylko do podtrzymania Państwa sesji. Bez śledzenia reklamowego. |

---

## 8. Co preložiť NEBUDEME (zostáva v PL/originálnom tvare)

- **„Skarbonka"** — tradičný PKO termín. Nikdy nepreložiť.
- **„Lokatka"** — meno mascota. Nikdy nepreložiť.
- **„Szkolna Kasa Oszczędności"** + skratka **„SKO"** — oficiálny názov programu. Nikdy nepreložiť.
- **„Dzień Dobry"** — pozdravná fráza pri rannom prihlásení. Necháva sa v PL.
- **„Państwa"** — gramatický tvar vykania. Necháva sa.

---

## 9. Slovak-stack residue check (do vyčistiť)

Repo má aj `app/sin-slavy/page.tsx` (`Sála slávy`) a `app/o-platforme/page.tsx`. Pod PKO skin sú tieto stránky v PL (i18n switch), ale URL slug zostáva slovensky. **DESIGN-CALL:** ponechať URL ako-je (žiadne broken links pre exitujúce ranking screenshots), ale page-content vždy lokalizovaný.

---

## 10. Open copy questions (pre PKO BP brand team)

1. „Złóż wniosek o konto SKO" je oficiálny CTA na `pkobp.pl`. Smieme ho použiť v hero, alebo držať náš edukatívny „Otwórz konto"?
2. „Lokatka" — povolené meno mascota v copy alebo iba ako vizuálny prvok?
3. „W-dolary" vs. „W-dollars" — keď je app v EN locale, ako pomenujeme menu?
4. „Klasa SKO" alebo „klasa szkolna" v leaderboard kontexte?
5. „Awans!" alebo „Nowy poziom" alebo „Poziom up!" — tier-up headline kid voice — čo PKO BP voice guide preferuje?
