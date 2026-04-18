export type MemoryPair = {
  concept: string;
  definition: string;
};

export const MEMORY_PAIRS: MemoryPair[] = [
  { concept: "RRSO", definition: "Ročné percentuálne náklady úveru" },
  { concept: "ETF", definition: "Indexový fond obchodovaný na burze" },
  { concept: "Inflácia", definition: "Pokles kúpnej sily peňazí v čase" },
  { concept: "Diverzifikácia", definition: "Rozloženie rizika investícií" },
  { concept: "BLIK", definition: "Poľský systém mobilných platieb" },
  { concept: "Zložené úročenie", definition: "Úroky z úrokov v čase" },
  { concept: "Núdzový fond", definition: "Likvidná rezerva 3–6 mesiacov" },
  { concept: "Dlhopis", definition: "Pôžička štátu alebo firme s úrokom" },
  { concept: "Akcia", definition: "Podiel na vlastníctve firmy" },
  { concept: "Hypotéka", definition: "Dlhodobý úver zabezpečený nehnuteľnosťou" },
];

export const PAIRS_PER_ROUND = 8;
