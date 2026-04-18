# Disclaimer copy candidates (Phase 4.3.3)

> **STATUS: COPY DRAFTS FOR PKO COMPLIANCE REVIEW.** None of these are in
> production verbatim; `lib/theme.ts` currently uses short versions. PKO
> compliance will pick the ones that satisfy KNF + internal standards.

## 1. Persistent footer ribbon (every page, every skin)

### Option A — short (current, core skin)
> GRA EDUKACYJNA — to nie są prawdziwe pieniądze. Budynki, kredyty i
> W-dolary istnieją tylko w grze.

### Option B — short (current, PKO skin)
> GRA EDUKACYJNA W PARTNERSTWIE Z PKO BP — waluta w grze (W-dolary) NIE
> jest pieniądzem i NIE może być wymieniona na PLN. Mirror do PKO Junior
> jest opcjonalny i wymaga zgody rodzica.

### Option C — long (for landing page + first-time onboarding)
> Watt City jest grą edukacyjną uczącą dzieci finansów osobistych. Produkty
> pokazane w grze (kredyt hipoteczny, kredyt obrotowy, kredyt konsumencki,
> leasing) są wyłącznie modelami edukacyjnymi i NIE stanowią oferowania
> usług finansowych w rozumieniu ustawy o nadzorze nad rynkiem finansowym.
> Oprocentowanie (APR, RRSO) jest dobrane dla celów dydaktycznych i NIE
> odzwierciedla rzeczywistych produktów PKO BP.

## 2. Mortgage / loan dialog (in-line on every `takeLoan` flow)

### Option A — short
> 💡 RRSO (Rzeczywista Roczna Stopa Oprocentowania) pokazuje PEŁNY koszt
> kredytu w skali roku, w przeciwieństwie do oprocentowania nominalnego.
> W grze nie ma prowizji ani ubezpieczeń, więc RRSO ≈ APR.

### Option B — with KNF note
> ⚠️ To jest model edukacyjny kredytu hipotecznego. Liczby pokazują, jak
> formuła amortyzacji wpływa na ratę i łączne odsetki — nie są propozycją
> konkretnego produktu finansowego. Źródła: KNF, kalkulatory bankowe 2026.

## 3. "Mirror to PKO Junior" flow (Phase 4.2.3)

### Option A — opt-in checkbox label
> Chcę przenieść wybraną część mojego Watt City cashflow do konta PKO
> Junior. Rozumiem, że mirror NIE zużywa moich W-dolarów w grze — jest
> tylko sygnałem dla mojego rodzica / opiekuna do ewentualnego przelewu
> z jego rzeczywistego konta.

### Option B — confirmation modal body
> Twoje dziecko zarobiło X W$ w Watt City podczas nauki finansów. Jeśli
> chcesz, możesz przelać Y PLN ze swojego konta do PKO Junior dziecka.
> Watt City pokazuje tę informację jako sugestię edukacyjną — decyzja
> jest Twoja.

## 4. Comments feed (archived AI games, Phase 3.5.3)

### Option A — reminder above comment box
> Komentarze są publicznie widoczne. Nie udostępniaj imienia, nazwiska,
> adresu ani zdjęć. Obraźliwe komentarze zostaną ukryte przez moderację.

## 5. Bankructwo dialog (Phase 2.6.6)

### Option A
> ⚠️ Uwaga: BANKRUCTWO zresetuje Twoje miasto do Tier 1. Stracisz
> wszystkie budynki (poza Domkiem) i scoring spadnie do 0. W prawdziwym
> życiu bankructwo ma znacznie poważniejsze konsekwencje — ta operacja
> w grze pokazuje TYLKO jedną z możliwych ścieżek. Kliknij tylko jeśli
> rozumiesz, że Twoja gra zostanie zresetowana.

## 6. Real-money allowance feature (Phase 3.4.6, deferred)

### Option A — opt-in, parent-controlled
> Watt City może SUGEROWAĆ (nie automatycznie przekazywać) tygodniową
> kieszonkowkę w oparciu o aktywność Twojego dziecka w grze. Pozwoli to
> powiązać realne nagrody z nauką finansów. Przelew zawsze wymaga Twojego
> ręcznego potwierdzenia w aplikacji PKO.

---

## Open questions for PKO compliance

1. Czy potrzebujemy tłumaczeń tych disclaimerów do PKO-approved wording,
   czy powyższe drafty są akceptowalne?
2. Jaka jest czcionka / rozmiar / kolor wymagany przez KNF dla ostrzeżeń
   finansowych w grze dla dzieci? (Obecnie używamy `text-amber-400` +
   `uppercase` + `text-[11px]`.)
3. Czy disclaimer opcja B dla skinu PKO wymaga także podania adresu
   siedziby PKO BP i numeru KRS?
4. Jak często musimy odświeżać zgodę użytkownika na disclaimer — raz,
   raz na 12 miesięcy, przy każdym wejściu w kredyt?
