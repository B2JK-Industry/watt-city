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
  | "order";
export type SeedDifficulty = "easy" | "medium" | "hard";

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
    buildingGlyph: "🪙",
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
export function pickResearchSeed(nowMs: number): ResearchSeed {
  const hourBucket = Math.floor(nowMs / (60 * 60 * 1000));
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
  return ROTATION_POOL.map((base, i) => ({
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
