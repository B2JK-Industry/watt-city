/* Research step — picks a theme + angle + difficulty for today's challenge.
 *
 * The pool has ~16 themes across finance and energy, each bound to a game
 * kind. A daily bucket selects one theme; within each theme a rotating
 * angle gives Claude a concrete slant (e.g., Inflation → today's focus is
 * the real-rate gap on savings deposits). Difficulty also rotates
 * (easy → medium → hard) so players face a gradient across weeks, not the
 * same level forever.
 *
 * The point: even when a theme cycles back two weeks later, the (angle,
 * difficulty, date) triple is different, the prompt pushes Claude to
 * produce fresh scenarios, and the result feels like a new game.
 */

export type SeedKind =
  | "quiz"
  | "scramble"
  | "price-guess"
  | "true-false"
  | "match-pairs"
  | "order"
  | "memory"
  | "fill-in-blank"
  | "calc-sprint"
  | "budget-allocate"
  | "what-if"
  | "chart-read";
export type SeedDifficulty = "easy" | "medium" | "hard";

// Phase 2.2.3 metadata — every theme carries an age target + subject tag to
// let the admin + themed-weeks filter rotations by curriculum area.
export type SubjectTag =
  | "savings"
  | "credit"
  | "investing"
  | "taxes"
  | "energy"
  | "budgeting"
  | "payments"
  | "insurance"
  | "realestate"
  | "everyday";

export type AgeRange = "9-12" | "13-15" | "16-19" | "any";

export type ResearchSeed = {
  theme: string;
  kind: SeedKind;
  buildingName: string;
  buildingGlyph: string;
  buildingRoof: string;
  buildingBody: string;
  source: string;
  notes: string;
  angles: string[]; // Claude picks a concrete slant per rotation
  difficulty?: SeedDifficulty; // filled in by pickResearchSeed based on day
  // Phase 2.2.3: optional; default to "any" / "everyday" when absent.
  age?: AgeRange;
  subject?: SubjectTag;
};

const ROTATION_POOL: Omit<ResearchSeed, "difficulty">[] = [
  {
    theme: "Inflacja w Polsce — realna stopa procentowa",
    kind: "quiz",
    buildingName: "NBP Watch",
    buildingGlyph: "📉",
    buildingRoof: "bg-[var(--neo-pink)]",
    buildingBody: "bg-rose-500",
    source: "nbp.pl CPI miesięcznik",
    notes:
      "Jak inflacja zjada realne zyski z lokat, wpływa na WIBOR/WIRON, zmienia wartość IKE.",
    angles: [
      "realna stopa na lokacie 3M vs inflacja CPI",
      "efekt inflacji na WIBOR/WIRON a rata kredytu hipotecznego",
      "czy 7 % nominalnego zysku to dużo przy 10 % inflacji",
      "obrona przed inflacją — TIPS, akcje, nieruchomości",
    ],
  },
  {
    theme: "Earth Hour — energia wyłączona na godzinę",
    kind: "price-guess",
    buildingName: "Eco Hour",
    buildingGlyph: "🌍",
    buildingRoof: "bg-emerald-400",
    buildingBody: "bg-emerald-600",
    source: "WWF Earth Hour 2026 + Tauron taryfy",
    notes:
      "Szacowanie zużycia energii w gospodarstwie domowym i oszczędności z wymiany na LED.",
    angles: [
      "zużycie typowego gospodarstwa domowego na godzinę w godzinach szczytu",
      "roczna oszczędność przy wymianie 10 żarówek 60 W na LED 9 W",
      "koszt 1 h pracy lodówki klasy A+++ w taryfie G11",
      "ile CO₂ uniknięto wyłączając 1 GW elektrowni węglowej na godzinę",
    ],
  },
  {
    theme: "Pay-day Friday — zasada 50/30/20",
    kind: "price-guess",
    buildingName: "Payday Post",
    buildingGlyph: "💶",
    buildingRoof: "bg-[var(--neo-yellow)]",
    buildingBody: "bg-amber-500",
    source: "PKO Junior / Konto dla Młodych",
    notes:
      "Podział miesięcznego dochodu na potrzeby / rozrywkę / oszczędności.",
    angles: [
      "podział 4500 zł netto: potrzeby / rozrywka / oszczędności",
      "ile na emeryturę dołoży 10 % pensji przez 40 lat przy 5 % realnych",
      "jak zmienia się budżet przy dochodzie 7500 zł vs 4500 zł",
      "koszt prokrastynacji — cena odkładania oszczędzania o 5 lat",
    ],
  },
  {
    theme: "BLIK — kody, przelewy, nowe usługi",
    kind: "scramble",
    buildingName: "BLIK Kiosk",
    buildingGlyph: "⚡",
    buildingRoof: "bg-[var(--neo-cyan)]",
    buildingBody: "bg-sky-500",
    source: "Polski Standard Płatności + PKO IKO",
    notes:
      "Słownik BLIK i e-bankingowy: KOD, PRZELEW, KONTAKTOWE, BANKOMAT, ZGODA...",
    angles: [
      "klasyczny słownik BLIK: KOD, PRZELEW, BANKOMAT, ZGODA",
      "BLIK Cashback + BLIK Raty + BLIK Zagraniczny",
      "e-banking mobilny: PUSH, TOKEN, AUTORYZACJA, BIOMETRIA",
      "terminologia PKO IKO: AUTOBLIK, SZYBKIE, AUTORYZACJA",
    ],
  },
  {
    theme: "IKE vs IKZE — konta emerytalne",
    kind: "quiz",
    buildingName: "Emerytura Hub",
    buildingGlyph: "🏛️",
    buildingRoof: "bg-violet-400",
    buildingBody: "bg-violet-600",
    source: "KNF + nasza emerytura",
    notes:
      "Limity IKE/IKZE 2026, ulga podatkowa, wiek wypłat, kary za wcześniejsze zamknięcie.",
    angles: [
      "limit wpłat IKE 2026 vs IKZE — który wyższy",
      "ulga podatkowa IKZE w PIT — jaka kwota maksymalnie",
      "wiek wypłat bez podatku Belki — 60 (IKE) vs 65 (IKZE)",
      "co się stanie przy zamknięciu IKE po 10 latach — podatek?",
    ],
  },
  {
    theme: "RRSO — prawdziwy koszt kredytu",
    kind: "quiz",
    buildingName: "Credit Tower",
    buildingGlyph: "🏦",
    buildingRoof: "bg-[var(--neo-yellow)]",
    buildingBody: "bg-amber-600",
    source: "KNF ustawa konsumencka",
    notes:
      "Czym RRSO różni się od oprocentowania nominalnego, dlaczego reklama kredytu go musi podać.",
    angles: [
      "RRSO vs oprocentowanie nominalne — co zawiera więcej",
      "prowizja 5 % vs 0 % przy 8 % nominalnej — która tańsza rocznie",
      "reklama kredytu 'od 0 %' — jak czytać RRSO",
      "ubezpieczenie kredytu wpływa na RRSO?",
    ],
  },
  {
    theme: "ETF vs akcje vs obligacje — dywersyfikacja",
    kind: "quiz",
    buildingName: "Portfel Bank",
    buildingGlyph: "📊",
    buildingRoof: "bg-indigo-400",
    buildingBody: "bg-indigo-600",
    source: "GPW + Vanguard edukacja",
    notes:
      "Podstawy inwestowania: ETF (S&P 500, WIG20), obligacje skarbowe, korelacje.",
    angles: [
      "ETF S&P 500 vs pojedyncze akcje PKO — który bardziej zmienny",
      "obligacje skarbowe 10-letnie przy 4 % inflacji — realny zwrot",
      "WIG20 vs S&P 500 — długoterminowy zwrot 10 lat",
      "dywersyfikacja: 100 % akcje vs 60/40 vs 30/70 — ryzyko",
    ],
  },
  {
    theme: "Koszty ogrzewania domu — pompa ciepła vs gaz",
    kind: "price-guess",
    buildingName: "Thermo Dom",
    buildingGlyph: "🏠",
    buildingRoof: "bg-orange-400",
    buildingBody: "bg-orange-600",
    source: "Tauron + NFOŚiGW program Czyste Powietrze",
    notes:
      "Porównanie kosztów ogrzewania 120 m² domu: pompa ciepła, gaz, pellet.",
    angles: [
      "roczny koszt ogrzewania pompą ciepła 120 m² domu",
      "oszczędność przy wymianie pieca gazowego na pompę ciepła",
      "dotacja Czyste Powietrze — maksymalna kwota 2026",
      "koszt 1 MWh ciepła z pompy ciepła vs gazu vs pelletu",
    ],
  },
  {
    theme: "Fotowoltaika + magazyn energii",
    kind: "price-guess",
    buildingName: "Solar Farm",
    buildingGlyph: "☀️",
    buildingRoof: "bg-yellow-400",
    buildingBody: "bg-yellow-600",
    source: "Mój Prąd + Tauron",
    notes:
      "Ekonomia instalacji PV: koszt, autokonsumpcja, zwrot inwestycji, net-billing.",
    angles: [
      "czas zwrotu instalacji 10 kWp przy zużyciu 6000 kWh/rok",
      "net-billing — ile banku energii odbierzesz latem do zimy",
      "koszt 5 kWp + magazyn 10 kWh po dotacji Mój Prąd",
      "autokonsumpcja vs oddawanie do sieci — ekonomia",
    ],
  },
  {
    theme: "Podatki Belki i PIT dla inwestora",
    kind: "quiz",
    buildingName: "Skarbówka",
    buildingGlyph: "📜",
    buildingRoof: "bg-zinc-400",
    buildingBody: "bg-zinc-600",
    source: "MF + deklaracje PIT-38",
    notes:
      "Jak rozliczyć zyski kapitałowe, Belka 19 %, PIT-38, straty z lat poprzednich.",
    angles: [
      "podatek Belki — stawka i od czego",
      "PIT-38 a straty z lat poprzednich — ile można odliczyć",
      "IKE — zwolnienie z Belki po 60. roku życia",
      "ETF zagraniczny vs krajowy — różnice w podatku",
    ],
  },
  {
    theme: "Kredyt hipoteczny — WIBOR vs WIRON vs stały",
    kind: "quiz",
    buildingName: "Hipoteka Hub",
    buildingGlyph: "🏘️",
    buildingRoof: "bg-amber-400",
    buildingBody: "bg-amber-700",
    source: "KNF + kalkulatory bankowe",
    notes:
      "Jak rata kredytu reaguje na WIBOR/WIRON, kiedy warto zamrozić oprocentowanie.",
    angles: [
      "rata 400 000 zł na 25 lat — WIBOR 6M 5 % vs stałe 6,5 %",
      "co się stanie z ratą gdy WIBOR wzrośnie o 2 pp",
      "WIBOR → WIRON — co oznacza dla istniejącego kredytu",
      "wkład własny 10 % vs 20 % — różnica w kosztach",
    ],
  },
  {
    theme: "Terminologia giełdowa (GPW + światowe rynki)",
    kind: "scramble",
    buildingName: "Biurowiec GPW",
    buildingGlyph: "📈",
    buildingRoof: "bg-[var(--neo-yellow)]",
    buildingBody: "bg-yellow-700",
    source: "GPW edukacja",
    notes:
      "Terminy giełdowe: AKCJE, OBLIGACJE, DYWIDENDA, HOSSA, BESSA, SPREAD.",
    angles: [
      "klasyczne pojęcia: AKCJE, OBLIGACJE, DYWIDENDA",
      "stany rynku: HOSSA, BESSA, KOREKTA, KRACH",
      "techniczne: SPREAD, WOLUMEN, KAPITALIZACJA, FLOAT",
      "derywaty: KONTRAKT, OPCJA, FUTURES, SWAP",
    ],
  },
  {
    theme: "Słownik kryptowalut",
    kind: "scramble",
    buildingName: "Crypto Kiosk",
    buildingGlyph: "₿", // distinct from "Kieszonkowe" 🪙
    buildingRoof: "bg-amber-500",
    buildingBody: "bg-amber-700",
    source: "MiCA + edukacja KNF",
    notes:
      "Terminologia krypto: BLOCKCHAIN, PORTFEL, KLUCZ, TRANSAKCJA, PROWIZJA.",
    angles: [
      "podstawy: BLOCKCHAIN, PORTFEL, KLUCZ, ADRES",
      "DeFi: STAKING, SWAP, POOL, YIELD",
      "regulacje EU: LICENCJA, MiCA, WERYFIKACJA, ZGODNOŚĆ",
      "stablecoiny: RESERWA, PEG, AUDYT, EMISJA",
    ],
  },
  {
    theme: "Fundusz awaryjny — ile, gdzie, jak",
    kind: "price-guess",
    buildingName: "Safe Deposit",
    buildingGlyph: "🛟",
    buildingRoof: "bg-sky-400",
    buildingBody: "bg-sky-600",
    source: "PKO + Generali edukacja",
    notes:
      "Jaki fundusz awaryjny mieć, gdzie trzymać, kiedy użyć.",
    angles: [
      "wysokość funduszu: 3× miesięczne wydatki — kwota dla pensji 4500 zł",
      "gdzie trzymać: konto oszczędnościowe vs lokata — roczny zysk",
      "koszt rozpakowania lokaty przed terminem — ile traci",
      "inflacja a fundusz awaryjny — ile realnie ubywa w roku",
    ],
  },
  {
    theme: "Ubezpieczenie zdrowotne NFZ vs prywatne",
    kind: "quiz",
    buildingName: "NFZ Hub",
    buildingGlyph: "🏥",
    buildingRoof: "bg-red-400",
    buildingBody: "bg-red-600",
    source: "NFZ + PZU",
    notes:
      "Różnice między NFZ a prywatnym ubezpieczeniem, czas oczekiwania, zakres.",
    angles: [
      "miesięczna składka prywatnego ubezpieczenia — 200 vs 800 zł",
      "czas oczekiwania na specjalistę NFZ vs prywatnie",
      "leki na receptę — jak działa limit NFZ",
      "ubezpieczenie przy podróżach zagranicznych — EKUZ vs karta",
    ],
  },
  {
    theme: "EV — koszty auta elektrycznego w PL",
    kind: "price-guess",
    buildingName: "EV Stacja",
    buildingGlyph: "🔌",
    buildingRoof: "bg-teal-400",
    buildingBody: "bg-teal-600",
    source: "PSPA + Tauron",
    notes:
      "Koszt 100 km w EV vs benzynie, szybkie ładowanie vs domowe, dotacje.",
    angles: [
      "koszt 100 km w EV (taryfa nocna G12) vs benzyna E10",
      "dotacja Mój Elektryk 2026 — maksymalna kwota",
      "szybkie ładowanie 150 kW DC — koszt 100 km",
      "zasięg auta 60 kWh zimą vs latem — procentowa różnica",
    ],
  },
  {
    theme: "Mity finansowe — prawda czy fałsz",
    kind: "true-false",
    buildingName: "Fakt-Mit Hub",
    buildingGlyph: "✅",
    buildingRoof: "bg-emerald-400",
    buildingBody: "bg-emerald-700",
    source: "PKO edukacja + Komisja Nadzoru Finansowego",
    notes:
      "Szybka seria 8–10 stwierdzeń o finansach: prawda czy fałsz. Każde z krótkim wyjaśnieniem.",
    angles: [
      "popularne mity o lokatach, kredytach i RRSO",
      "mity emerytalne — IKE, IKZE, ZUS",
      "mity giełdowe — short selling, dywidendy, splity",
      "mity podatkowe — Belka, IKE, ulga na dziecko",
    ],
  },
  {
    theme: "Pojęcie ↔ definicja — terminy bankowe",
    kind: "match-pairs",
    buildingName: "Słownik Bank",
    buildingGlyph: "🔗",
    buildingRoof: "bg-violet-400",
    buildingBody: "bg-violet-700",
    source: "Słownik KNF + IKO PKO",
    notes:
      "Spáruj 5–6 pojęć finansowych z ich krótkimi definicjami.",
    angles: [
      "kredyty: RRSO, oprocentowanie nominalne, prowizja, ubezpieczenie",
      "inwestycje: ETF, dywidenda, kapitalizacja, free float",
      "konta: IKE, IKZE, lokata, konto oszczędnościowe",
      "energetyka: kWh, kW, taryfa G11/G12, taryfa nocna",
    ],
  },
  {
    theme: "Chronologia wydarzeń PL gospodarki",
    kind: "order",
    buildingName: "Linia Czasu",
    buildingGlyph: "📅",
    buildingRoof: "bg-orange-400",
    buildingBody: "bg-orange-700",
    source: "NBP + GUS + KNF",
    notes:
      "Zoradiť 5–6 udalostí PL gospodarki podľa dátumu (najstarší prvý).",
    angles: [
      "kluczowe daty PL transformacji (1989, 2004 EU, 2008 kryzys, 2014 SEPA, 2024 IKE limit)",
      "wprowadzenie produktów PKO (Konto, IKO, BLIK, IKE, Bezpieczny Kredyt 2 %)",
      "polityka NBP — stopy procentowe i CPI w czasie",
      "Tauron i transformacja energetyczna PL (węgiel → atom → OZE)",
    ],
  },
  {
    theme: "Ranking kosztów codziennych",
    kind: "order",
    buildingName: "Cennik Hub",
    buildingGlyph: "🛒",
    buildingRoof: "bg-rose-400",
    buildingBody: "bg-rose-700",
    source: "GUS koszyk + Tauron tariffs",
    notes:
      "Zoradiť 5–6 produktów/usług od najtańszego do najdroższego (PL ceny 2026).",
    angles: [
      "ceny żywności w sklepie (mleko, chleb, cukier, mąka, ryż, masło)",
      "rachunki domowe (gaz, prąd, woda, internet, abonament TV)",
      "transport publiczny (ZTM Katowice, PKP Intercity, samolot Wizz)",
      "subskrypcje (Spotify, Netflix, Disney+, Apple TV, HBO Max)",
    ],
  },
  /* ------------------------------------------------------------------------
   * Phase 2.2 — +20 themes (backlog 2.2.1 × 10 + 2.2.2 × 10)
   * ------------------------------------------------------------------------ */
  {
    theme: "Pierwsze mieszkanie — wynajem vs kredyt",
    kind: "what-if",
    buildingName: "Młode M1",
    buildingGlyph: "🗝️",
    buildingRoof: "bg-fuchsia-400",
    buildingBody: "bg-fuchsia-600",
    source: "PKO + Bezpieczny Kredyt",
    notes: "Decyzja: 2500 zł najmu czy 350k kredytu? Wkład, RRSO, elastyczność.",
    angles: [
      "wynajem za 2500 zł/mies vs kredyt 350k z 20% wkładem na 25 lat",
      "mieszkanie z 10% wkładem — ubezpieczenie niskiego wkładu",
      "wynajem okazjonalny — zasady wynajmu dla młodych 20-25 lat",
      "kiedy najem jest tańszy od kredytu (miasto vs wieś)",
    ],
    age: "16-19",
    subject: "realestate",
  },
  {
    theme: "Black Friday — psychologia promocji",
    kind: "true-false",
    buildingName: "Sale Tower",
    buildingGlyph: "🏷️",
    buildingRoof: "bg-rose-400",
    buildingBody: "bg-rose-600",
    source: "UOKiK + Dyrektywa Omnibus",
    notes: "Jak odróżnić prawdziwą promocję od iluzji obniżki.",
    angles: [
      "obowiązek pokazania najniższej ceny z 30 dni (Omnibus)",
      "cena referencyjna — jak naprawdę rozumieć 'rabat 70%'",
      "zakupy impulsywne vs lista życzeń",
      "Black Friday vs Cyber Monday — który tańszy na elektronikę",
    ],
    age: "13-15",
    subject: "everyday",
  },
  {
    theme: "Subskrypcje — ile naprawdę kosztują",
    kind: "calc-sprint",
    buildingName: "Sub Hub",
    buildingGlyph: "🔁",
    buildingRoof: "bg-violet-400",
    buildingBody: "bg-violet-700",
    source: "UOKiK + typowe cenniki 2026",
    notes: "Licz roczny koszt rodziny Spotify, Netflix, HBO, Disney, YouTube Premium.",
    angles: [
      "rodzina Spotify 26 zł × 12 mies",
      "Netflix Premium 67 zł + HBO Max 35 zł + Disney 38 zł",
      "konto student vs standard — ile oszczędza w rok",
      "koszt nieużywanych subskrypcji (ROI analysis)",
    ],
    age: "13-15",
    subject: "budgeting",
  },
  {
    theme: "Dropshipping i e-commerce dla nastolatka",
    kind: "what-if",
    buildingName: "Warehouse Mini",
    buildingGlyph: "📦",
    buildingRoof: "bg-orange-400",
    buildingBody: "bg-orange-600",
    source: "UOKiK + ustawa o VAT",
    notes: "Zaczynasz sprzedaż online — CEIDG? VAT? Zwroty?",
    angles: [
      "działalność nierejestrowana 3499 zł limit 2026",
      "kiedy musisz założyć firmę (CEIDG)",
      "14-dniowy zwrot — twoje obowiązki",
      "VAT przy dropshippingu z Chin",
    ],
    age: "16-19",
    subject: "taxes",
  },
  {
    theme: "Kieszonkowe — jak zarządzać",
    kind: "budget-allocate",
    buildingName: "Domowe M",
    buildingGlyph: "🪙",
    buildingRoof: "bg-yellow-400",
    buildingBody: "bg-yellow-600",
    source: "PKO Junior edukacja",
    notes: "100 zł tygodniowo — podziel na potrzeby/rozrywka/oszczędności.",
    angles: [
      "100 zł na tydzień, 4 tygodnie — zaplanuj prezent 200 zł",
      "zasada 50/30/20 dla kieszonkowego",
      "wpłaty na PKO Junior vs skarbonka",
      "co zrobić z pieniędzmi na urodziny od dziadków (2000 zł)",
    ],
    age: "9-12",
    subject: "savings",
  },
  {
    theme: "Pierwsza praca — umowa i składki",
    kind: "fill-in-blank",
    buildingName: "First Job",
    buildingGlyph: "💼",
    buildingRoof: "bg-sky-400",
    buildingBody: "bg-sky-600",
    source: "ZUS + Kodeks pracy",
    notes: "Umowa o pracę vs zlecenie, składki ZUS, PIT-4.",
    angles: [
      "różnica netto/brutto przy 4500 brutto",
      "umowa zlecenie vs umowa o pracę — różnice w ZUS",
      "ulga dla młodych do 26 roku — kiedy zwolnienie z PIT",
      "pierwszy PIT-37 — zasady i deadline",
    ],
    age: "16-19",
    subject: "taxes",
  },
  {
    theme: "Studia — ROI kierunku",
    kind: "order",
    buildingName: "Uni Building",
    buildingGlyph: "🎓",
    buildingRoof: "bg-indigo-400",
    buildingBody: "bg-indigo-600",
    source: "GUS + badania ELA MNiSW",
    notes: "Pensje absolwentów PL — posortuj kierunki wg zarobków po 5 latach.",
    angles: [
      "IT vs prawo vs medycyna vs filozofia — pensje 5 lat po studiach",
      "kierunki techniczne vs humanistyczne — mediana zarobków",
      "studia dzienne vs zaoczne — ROI kosztów życia",
      "stypendia vs kredyt studencki (BGK)",
    ],
    age: "16-19",
    subject: "investing",
  },
  {
    theme: "OC samochodu — od czego zależy",
    kind: "price-guess",
    buildingName: "Garaż Polis",
    buildingGlyph: "🚗",
    buildingRoof: "bg-red-400",
    buildingBody: "bg-red-600",
    source: "UFG + PZU",
    notes: "Roczne OC — młody kierowca, miasto, moc silnika.",
    angles: [
      "OC dla 18-latka w Katowicach, Corsa 1.2 — kwota roczna",
      "OC doświadczony kierowca 40 lat, BMW 320d — kwota roczna",
      "zniżki bonus-malus — ile % po 5 latach bez szkody",
      "OC vs AC + OC — różnica cenowa",
    ],
    age: "16-19",
    subject: "insurance",
  },
  {
    theme: "Vacation budget — wakacje na 2 tyg.",
    kind: "budget-allocate",
    buildingName: "Beach Hub",
    buildingGlyph: "🏖️",
    buildingRoof: "bg-cyan-400",
    buildingBody: "bg-cyan-600",
    source: "GUS wakacje + linie lotnicze",
    notes: "5000 zł na 2 tyg. — podziel: lot, nocleg, jedzenie, atrakcje.",
    angles: [
      "2 tyg. Hiszpania 5000 zł — lot 1500, nocleg 2000, jedzenie 1000, atrakcje 500",
      "all-inclusive 7000 zł vs samodzielnie 4500 zł — analiza",
      "ubezpieczenie podróżne — jaki procent budżetu",
      "wynajem auta vs transport publiczny",
    ],
    age: "13-15",
    subject: "budgeting",
  },
  {
    theme: "ESG — inwestowanie odpowiedzialne",
    kind: "quiz",
    buildingName: "Green Fund",
    buildingGlyph: "🌱",
    buildingRoof: "bg-green-400",
    buildingBody: "bg-green-600",
    source: "KNF + SFDR",
    notes: "Co oznacza 'fundusz ESG' w UE, skąd pewność ratingu.",
    angles: [
      "SFDR artykuł 8 vs 9 — różnica",
      "greenwashing — 3 red flags",
      "ESG ETF vs zwykły ETF — różnica w zwrocie 10 lat",
      "polskie fundusze z oznaczeniem ESG (PKO, Santander)",
    ],
    age: "16-19",
    subject: "investing",
  },
  {
    theme: "Flip nieruchomości — zysk vs ryzyko",
    kind: "what-if",
    buildingName: "Flip House",
    buildingGlyph: "🔨",
    buildingRoof: "bg-stone-400",
    buildingBody: "bg-stone-600",
    source: "PKO edukacja + GUS ceny nieruchomości",
    notes: "Kupić 250k, remont 60k, sprzedać 380k — czy się opłaca?",
    angles: [
      "250k + 60k remont + 10k opłaty → 380k sprzedaż — netto",
      "PCC 2% i 19% podatek od zysku przy sprzedaży przed 5 latami",
      "ryzyko stagnacji cen 2 lata zamiast 6 miesięcy",
      "flip vs najem długoterminowy — porównanie 5 lat",
    ],
    age: "16-19",
    subject: "realestate",
  },
  {
    theme: "Bezpieczeństwo portfela krypto",
    kind: "match-pairs",
    buildingName: "Crypto Vault",
    buildingGlyph: "🔐",
    buildingRoof: "bg-amber-400",
    buildingBody: "bg-amber-600",
    source: "MiCA + KNF ostrzeżenia",
    notes: "Sparuj pojęcia bezpieczeństwa krypto z ich definicjami.",
    angles: [
      "portfel sprzętowy (Ledger/Trezor) vs hot wallet",
      "seed phrase — zasady przechowywania",
      "phishing na airdrop — 3 red flagi",
      "2FA, biometria, multisig w krypto",
    ],
    age: "16-19",
    subject: "investing",
  },
  {
    theme: "Apple Pay vs Google Pay vs BLIK",
    kind: "true-false",
    buildingName: "Pay Kiosk",
    buildingGlyph: "📱",
    buildingRoof: "bg-gray-400",
    buildingBody: "bg-gray-600",
    source: "PKO IKO + Polski Standard Płatności",
    notes: "Zalety, opłaty, bezpieczeństwo płatności mobilnych.",
    angles: [
      "Apple Pay 0 % prowizji dla klienta, BLIK 0 % — kto płaci",
      "tokenizacja — jak chronione są dane karty",
      "limity transakcji zbliżeniowych bez PIN-u",
      "płatność za granicą: Apple Pay vs Revolut vs BLIK",
    ],
    age: "13-15",
    subject: "payments",
  },
  {
    theme: "Charity i 1,5% podatku",
    kind: "fill-in-blank",
    buildingName: "Fundacja",
    buildingGlyph: "❤️",
    buildingRoof: "bg-pink-400",
    buildingBody: "bg-pink-700",
    source: "MF + ustawa o OPP",
    notes: "Jak przekazać 1,5% podatku OPP, ile to realnie.",
    angles: [
      "1,5% dla OPP — dla kogo maksymalnie",
      "darowizna pieniężna — ile odliczysz od dochodu",
      "różnica OPP vs stowarzyszenie zwykłe",
      "PIT-OP — co tam wpisać",
    ],
    age: "16-19",
    subject: "taxes",
  },
  {
    theme: "Brutto vs netto — gdzie znika 30%",
    kind: "calc-sprint",
    buildingName: "Paysheet",
    buildingGlyph: "🧾",
    buildingRoof: "bg-amber-400",
    buildingBody: "bg-amber-600",
    source: "ZUS + US",
    notes: "PIT + NFZ + składki — oblicz netto z brutto.",
    angles: [
      "4500 brutto → ile netto (12% PIT)",
      "7500 brutto vs 7500 netto — jaka różnica kwotowa",
      "umowa B2B 10000 brutto vs umowa o pracę 10000 brutto",
      "PPK 2% — odlicz od brutto",
    ],
    age: "16-19",
    subject: "taxes",
  },
  {
    theme: "Premia świąteczna — jak ją wydać",
    kind: "what-if",
    buildingName: "Bonus Box",
    buildingGlyph: "🎁",
    buildingRoof: "bg-red-400",
    buildingBody: "bg-red-700",
    source: "PKO + Allegro raport",
    notes: "Masz 3000 zł premii — oszczędzać, inwestować, wydać?",
    angles: [
      "3000 zł na fundusz awaryjny, spłatę kredytu, czy prezent",
      "lata niski vs wysoki priorytet",
      "inflacja a premia — efektywna stopa po roku na lokacie",
      "psychologia gratisu — efekt posiadania",
    ],
    age: "13-15",
    subject: "budgeting",
  },
  {
    theme: "Pożyczka rodzinna — pomoc czy ryzyko",
    kind: "true-false",
    buildingName: "Family Bank",
    buildingGlyph: "👨‍👩‍👧",
    buildingRoof: "bg-pink-400",
    buildingBody: "bg-pink-600",
    source: "PCC + Kodeks cywilny",
    notes: "Zwolnienia z PCC, umowa pisemna, ryzyko relacji.",
    angles: [
      "pożyczka od matki 50 000 zł — PCC czy zwolnienie",
      "kiedy zgłaszać PCC do urzędu (obowiązek 14 dni)",
      "umowa ustna vs pisemna — dowody przy sporze",
      "niezwrócona pożyczka rodzinna — podatek darowizna",
    ],
    age: "16-19",
    subject: "everyday",
  },
  {
    theme: "Karta kredytowa vs debetowa",
    kind: "match-pairs",
    buildingName: "Card Vault",
    buildingGlyph: "💳",
    buildingRoof: "bg-blue-400",
    buildingBody: "bg-blue-600",
    source: "KNF + PKO",
    notes: "Kiedy kredytówka pomaga, kiedy niszczy budżet.",
    angles: [
      "grace period — co oznacza",
      "oprocentowanie zadłużenia na kredytówce (20-25%)",
      "program rabatowy vs cashback — porównanie",
      "chargeback — kiedy można złożyć reklamację",
    ],
    age: "16-19",
    subject: "credit",
  },
  {
    theme: "Restauracja — food cost vs cena",
    kind: "price-guess",
    buildingName: "Bistro",
    buildingGlyph: "🍽️",
    buildingRoof: "bg-orange-400",
    buildingBody: "bg-orange-700",
    source: "Polskie restauracje 2026 + food cost branżowy",
    notes: "Cena kebaba 25 zł — ile kosztuje produkcja?",
    angles: [
      "kebab 25 zł — koszt surowca (mięso + chleb + warzywa)",
      "pizza Margherita 35 zł w lokalu — food cost",
      "kawa latte 15 zł — koszt ziarna + mleka",
      "marża w restauracji — typowe procenty na produkt",
    ],
    age: "9-12",
    subject: "everyday",
  },
  {
    theme: "iPhone deprecjacja 3 lata",
    kind: "chart-read",
    buildingName: "Tech Recycle",
    buildingGlyph: "♻️", // distinct from "Apple Pay vs Google Pay" 📱
    buildingRoof: "bg-zinc-400",
    buildingBody: "bg-zinc-600",
    source: "Apple + allegro.pl raport",
    notes: "Wartość iPhone 15 Pro 2024→2027 — wykres utraty wartości.",
    angles: [
      "iPhone 15 Pro 5999 zł w 2024 — wykres wartości odsprzedaży",
      "Samsung flagship vs iPhone — deprecjacja 3 lata",
      "flagship vs budget — proporcja utraty wartości",
      "Apple Care — czy przedłuża wartość rynkową",
    ],
    age: "13-15",
    subject: "everyday",
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Deterministic pick: same hour-bucket → same theme + angle + difficulty,
// so two publishes inside the same hour converge (idempotent retries). Across
// hours, the pool cycles through ~20 themes; within each theme 4 angles rotate
// (incrementing once per full pool pass ≈ every 20 h); difficulty hashes
// theme + bucket so consecutive hours don't always share a level. Yields
// ~240 distinct (theme, angle, difficulty) combinations before repetition.
//
// `slotOffset` (default 0) lets callers shift the bucket so the 3-slot
// parallel rotation picks DIFFERENT themes even when all slots rotate in the
// same tick — each slot gets a distinct theme because it reads a different
// offset into the pool. The coprime-to-pool-length offsets (0, 7, 13) walk
// different residues so the three slots don't collide on pool wrap-around.
export function pickResearchSeed(
  nowMs: number,
  slotOffset = 0,
): ResearchSeed {
  const hourBucket = Math.floor(nowMs / (60 * 60 * 1000)) + slotOffset;
  const base = ROTATION_POOL[hourBucket % ROTATION_POOL.length];
  const angleIndex =
    Math.floor(hourBucket / ROTATION_POOL.length) % base.angles.length;
  const difficulties: SeedDifficulty[] = ["easy", "medium", "hard"];
  const difficulty =
    difficulties[(hashString(base.theme) + hourBucket) % difficulties.length];
  return {
    ...base,
    notes: `${base.notes}\nAngle: ${base.angles[angleIndex]}\nDifficulty: ${difficulty}`,
    difficulty,
  };
}

// All available themes — useful for admin endpoints that want to force a
// specific pool entry instead of today's calendar-deterministic pick.
export function listResearchSeeds(): ResearchSeed[] {
  return ROTATION_POOL.map((base) => ({
    ...base,
    notes: `${base.notes}\nAngle: ${base.angles[0]}`,
    difficulty: "medium" as SeedDifficulty,
  }));
}

export function pickSeedByName(theme: string): ResearchSeed | null {
  const base = ROTATION_POOL.find((s) => s.theme === theme);
  if (!base) return null;
  return {
    ...base,
    notes: `${base.notes}\nAngle: ${base.angles[0]}`,
    difficulty: "medium",
  };
}

export function pickSeedByIndex(index: number): ResearchSeed | null {
  if (index < 0 || index >= ROTATION_POOL.length) return null;
  const base = ROTATION_POOL[index];
  return {
    ...base,
    notes: `${base.notes}\nAngle: ${base.angles[0]}`,
    difficulty: "medium",
  };
}
