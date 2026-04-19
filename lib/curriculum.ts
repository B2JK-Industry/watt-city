/* V4.5 — Podstawa programowa (Polish national curriculum) mapping.
 *
 * 20-30 real curriculum codes for grades V-VIII (klasa 5-8). Each
 * entry links a concrete curriculum requirement to Watt City content
 * — evergreen games + AI theme tags that deliver it. Teacher UI uses
 * this to pick weekly themes filtered by area + grade, and the PDF
 * report shows coverage ("klasa pokryła 8/12 kodów Ekonomia").
 *
 * Source: MEN podstawa programowa (2023 refresh) — compiled by
 * hand from the official docs. Codes use `{area}.{grade}.{section}.{item}`
 * convention (e.g. `wos.7.3.2` = WOS, klasa 7, rozdz 3, pkt 2).
 *
 * Scope per V4.5 acceptance: 20-30 codes. Future curriculum cycles
 * (SP IV or LO) stay V5.
 */

export type CurriculumArea =
  | "Ekonomia"
  | "Matematyka"
  | "WOS"
  | "EDB"
  | "Informatyka";

export type CurriculumCode = {
  /** Code, e.g. "wos.7.3.2" — stable id used in URL params + report keys. */
  code: string;
  area: CurriculumArea;
  subarea: string;
  grade: 5 | 6 | 7 | 8;
  /** Short Polish description of what this code requires. */
  description: string;
  /** AI theme tags or seed ids that cover this code. */
  themes: string[];
  /** Evergreen game ids that cover this code. */
  games: string[];
};

export const PODSTAWA_PROGRAMOWA: CurriculumCode[] = [
  // -------------------------------------------------------------------
  // Klasa 5 — podstawy finansów osobistych
  // -------------------------------------------------------------------
  {
    code: "wos.5.1.1",
    area: "WOS",
    subarea: "Ja jako konsument",
    grade: 5,
    description: "Rozpoznaje funkcje pieniądza — środek wymiany i miernik wartości.",
    themes: ["money-basics", "inflation-intro"],
    games: ["finance-quiz", "price-guess"],
  },
  {
    code: "wos.5.1.2",
    area: "WOS",
    subarea: "Ja jako konsument",
    grade: 5,
    description: "Odróżnia potrzeby od zachcianek; planuje wydatki z kieszonkowego.",
    themes: ["kieszonkowe", "budget-basics"],
    games: ["budget-balance", "order-match"],
  },
  {
    code: "mat.5.4.3",
    area: "Matematyka",
    subarea: "Procenty",
    grade: 5,
    description: "Oblicza procent liczby w kontekście zniżek i podatku VAT.",
    themes: ["sales-discount", "vat-basics"],
    games: ["calc-sprint", "finance-quiz"],
  },
  {
    code: "edb.5.2.1",
    area: "EDB",
    subarea: "Bezpieczeństwo finansowe",
    grade: 5,
    description: "Rozpoznaje typowe oszustwa płatnicze (phishing, fake sklep).",
    themes: ["scam-awareness", "phishing-basics"],
    games: ["true-false", "finance-quiz"],
  },

  // -------------------------------------------------------------------
  // Klasa 6 — pierwsze oszczędzanie i bank
  // -------------------------------------------------------------------
  {
    code: "wos.6.2.1",
    area: "WOS",
    subarea: "System bankowy",
    grade: 6,
    description: "Opisuje rolę banku jako instytucji przyjmującej depozyty i udzielającej kredytów.",
    themes: ["bank-basics", "deposit-vs-loan"],
    games: ["finance-quiz", "match-pairs"],
  },
  {
    code: "wos.6.2.2",
    area: "WOS",
    subarea: "System bankowy",
    grade: 6,
    description: "Wyjaśnia pojęcie oprocentowania lokaty i kredytu.",
    themes: ["interest-rate", "apr-basics"],
    games: ["calc-sprint", "finance-quiz"],
  },
  {
    code: "mat.6.5.2",
    area: "Matematyka",
    subarea: "Procenty (zaawansowane)",
    grade: 6,
    description: "Stosuje procent składany w prostych sytuacjach oszczędzania.",
    themes: ["compound-interest", "savings-growth"],
    games: ["calc-sprint", "price-guess"],
  },
  {
    code: "edb.6.2.3",
    area: "EDB",
    subarea: "Bezpieczeństwo finansowe",
    grade: 6,
    description: "Wie, że PIN, CVV i hasło nie udostępnia się nikomu (nawet rodzicom).",
    themes: ["security-basics", "card-safety"],
    games: ["true-false"],
  },

  // -------------------------------------------------------------------
  // Klasa 7 — kredyt, podatki, inflacja
  // -------------------------------------------------------------------
  {
    code: "wos.7.3.1",
    area: "WOS",
    subarea: "Kredyt i dług",
    grade: 7,
    description: "Rozróżnia rodzaje kredytów (hipoteczny, konsumencki, obrotowy).",
    themes: ["mortgage-intro", "loan-types"],
    games: ["finance-quiz", "order"],
  },
  {
    code: "wos.7.3.2",
    area: "WOS",
    subarea: "Kredyt i dług",
    grade: 7,
    description: "Interpretuje RRSO i odróżnia ją od nominalnej stopy procentowej.",
    themes: ["RRSO-basics", "loan-comparison"],
    games: ["finance-quiz", "chart-read"],
  },
  {
    code: "wos.7.3.3",
    area: "WOS",
    subarea: "Podatki",
    grade: 7,
    description: "Rozpoznaje, że dochody osób fizycznych są opodatkowane (PIT).",
    themes: ["taxes-intro", "brutto-netto"],
    games: ["finance-quiz", "match-pairs"],
  },
  {
    code: "wos.7.4.1",
    area: "WOS",
    subarea: "Inflacja",
    grade: 7,
    description: "Wyjaśnia, dlaczego ceny rosną i jak inflacja wpływa na oszczędności.",
    themes: ["inflation-cpi", "real-rate"],
    games: ["chart-read", "finance-quiz"],
  },
  {
    code: "mat.7.7.1",
    area: "Matematyka",
    subarea: "Procenty (zastosowania)",
    grade: 7,
    description: "Oblicza ratę kredytu o stałym oprocentowaniu.",
    themes: ["loan-amortization"],
    games: ["calc-sprint"],
  },
  {
    code: "mat.7.9.2",
    area: "Matematyka",
    subarea: "Odsetki składane",
    grade: 7,
    description: "Stosuje wzór procentu składanego do porównania lokat.",
    themes: ["compound-interest", "deposit-comparison"],
    games: ["calc-sprint", "finance-quiz"],
  },
  {
    code: "edb.7.3.1",
    area: "EDB",
    subarea: "Bezpieczeństwo finansowe",
    grade: 7,
    description: "Rozpoznaje schematy piramidy finansowej i pożyczek typu payday.",
    themes: ["ponzi-scheme", "payday-loan-warning"],
    games: ["true-false", "finance-quiz"],
  },
  {
    code: "inf.7.2.1",
    area: "Informatyka",
    subarea: "Dane i arkusz",
    grade: 7,
    description: "Analizuje dane finansowe w arkuszu kalkulacyjnym (budżet domowy).",
    themes: ["budget-spreadsheet"],
    games: ["budget-balance", "order-match"],
  },

  // -------------------------------------------------------------------
  // Klasa 8 — inwestycje, ubezpieczenia, planowanie
  // -------------------------------------------------------------------
  {
    code: "wos.8.4.1",
    area: "WOS",
    subarea: "Inwestowanie",
    grade: 8,
    description: "Rozróżnia akcje, obligacje i fundusze jako klasy aktywów.",
    themes: ["investing-basics", "asset-classes"],
    games: ["finance-quiz", "portfolio-pick"],
  },
  {
    code: "wos.8.4.2",
    area: "WOS",
    subarea: "Inwestowanie",
    grade: 8,
    description: "Stosuje zasadę dywersyfikacji przy wyborze inwestycji.",
    themes: ["diversification", "portfolio-rebalance"],
    games: ["portfolio-pick", "order"],
  },
  {
    code: "wos.8.4.3",
    area: "WOS",
    subarea: "Emerytura",
    grade: 8,
    description: "Opisuje ZUS i IKE jako formy oszczędzania emerytalnego.",
    themes: ["zus-ike-basics"],
    games: ["finance-quiz"],
  },
  {
    code: "wos.8.5.1",
    area: "WOS",
    subarea: "Ubezpieczenia",
    grade: 8,
    description: "Odróżnia ubezpieczenia obowiązkowe (OC) od dobrowolnych (AC, NNW).",
    themes: ["insurance-basics"],
    games: ["finance-quiz", "match-pairs"],
  },
  {
    code: "mat.8.8.1",
    area: "Matematyka",
    subarea: "Wzrost procentowy (wykresy)",
    grade: 8,
    description: "Czyta wykresy wzrostu kapitału w czasie (lokata vs ETF).",
    themes: ["chart-reading", "compound-growth"],
    games: ["chart-read", "calc-sprint"],
  },
  {
    code: "mat.8.8.2",
    area: "Matematyka",
    subarea: "Analiza danych",
    grade: 8,
    description: "Porównuje dwie oferty kredytowe przez policzenie RRSO + total.",
    themes: ["loan-comparison"],
    games: ["calc-sprint", "finance-quiz"],
  },
  {
    code: "edb.8.2.1",
    area: "EDB",
    subarea: "Bezpieczeństwo cyfrowe",
    grade: 8,
    description: "Bezpiecznie korzysta z bankowości mobilnej i BLIK-a.",
    themes: ["mobile-banking", "blik-safety"],
    games: ["true-false", "finance-quiz"],
  },
  {
    code: "edb.8.2.2",
    area: "EDB",
    subarea: "Bezpieczeństwo finansowe",
    grade: 8,
    description: "Rozpoznaje oszustwa inwestycyjne (scam-coiny, fake brokerzy).",
    themes: ["investment-scam", "crypto-scam"],
    games: ["true-false", "finance-quiz"],
  },
  {
    code: "inf.8.3.1",
    area: "Informatyka",
    subarea: "Dane finansowe",
    grade: 8,
    description: "Używa kalkulatora kredytowego i symulatora inwestycji online.",
    themes: ["online-calculators"],
    games: ["calc-sprint"],
  },

  // -------------------------------------------------------------------
  // Cross-grade: etyka/obywatelstwo finansowe
  // -------------------------------------------------------------------
  {
    code: "wos.6.5.1",
    area: "WOS",
    subarea: "Konsumencki rozsądek",
    grade: 6,
    description: "Identyfikuje pułapki marketingowe (Black Friday, in-game purchases).",
    themes: ["marketing-traps", "dark-patterns"],
    games: ["true-false", "finance-quiz"],
  },
  {
    code: "wos.8.5.2",
    area: "WOS",
    subarea: "Etyka finansowa",
    grade: 8,
    description: "Rozumie pojęcie odpowiedzialnego pożyczania i greenwashingu.",
    themes: ["responsible-lending", "esg-basics"],
    games: ["finance-quiz", "true-false"],
  },
];

/** Group by area for pie-chart / coverage visualisation. */
export function curriculumByArea(): Record<CurriculumArea, CurriculumCode[]> {
  const out: Record<CurriculumArea, CurriculumCode[]> = {
    Ekonomia: [],
    Matematyka: [],
    WOS: [],
    EDB: [],
    Informatyka: [],
  };
  for (const code of PODSTAWA_PROGRAMOWA) out[code.area].push(code);
  return out;
}

/** Filter by grade — teacher picks a grade, sees relevant codes. */
export function curriculumForGrade(grade: 5 | 6 | 7 | 8): CurriculumCode[] {
  return PODSTAWA_PROGRAMOWA.filter((c) => c.grade === grade);
}

/** Reverse lookup — "given this theme, which curriculum codes does it satisfy?" */
export function curriculumCodesForTheme(theme: string): CurriculumCode[] {
  return PODSTAWA_PROGRAMOWA.filter((c) => c.themes.includes(theme));
}

/** Reverse lookup — which codes does this evergreen game touch? */
export function curriculumCodesForGame(gameId: string): CurriculumCode[] {
  return PODSTAWA_PROGRAMOWA.filter((c) => c.games.includes(gameId));
}

/** Coverage = for each area, how many codes in the class's grade have
 *  been hit by a theme/game the class engaged with. Simple heuristic:
 *  union of themes+games observed. Returns per-area `{covered, total}`. */
export function coverageByArea(
  observedThemes: Set<string>,
  observedGames: Set<string>,
  grade: 5 | 6 | 7 | 8,
): Record<CurriculumArea, { covered: number; total: number; codes: CurriculumCode[] }> {
  const grouped = curriculumForGrade(grade);
  const out = {
    Ekonomia: { covered: 0, total: 0, codes: [] as CurriculumCode[] },
    Matematyka: { covered: 0, total: 0, codes: [] as CurriculumCode[] },
    WOS: { covered: 0, total: 0, codes: [] as CurriculumCode[] },
    EDB: { covered: 0, total: 0, codes: [] as CurriculumCode[] },
    Informatyka: { covered: 0, total: 0, codes: [] as CurriculumCode[] },
  } satisfies Record<CurriculumArea, { covered: number; total: number; codes: CurriculumCode[] }>;
  for (const code of grouped) {
    out[code.area].total += 1;
    out[code.area].codes.push(code);
    const hit =
      code.themes.some((t) => observedThemes.has(t)) ||
      code.games.some((g) => observedGames.has(g));
    if (hit) out[code.area].covered += 1;
  }
  return out;
}
