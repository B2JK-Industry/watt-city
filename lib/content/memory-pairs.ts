import type { Lang } from "@/lib/i18n";

export type MemoryPair = {
  concept: string;
  definition: string;
};

const PL_PAIRS: MemoryPair[] = [
  { concept: "RRSO", definition: "Rzeczywisty roczny koszt kredytu" },
  { concept: "ETF", definition: "Fundusz indeksowy notowany na giełdzie" },
  { concept: "Inflacja", definition: "Spadek siły nabywczej pieniądza" },
  { concept: "Dywersyfikacja", definition: "Rozłożenie ryzyka inwestycji" },
  { concept: "BLIK", definition: "Polski system płatności mobilnych" },
  { concept: "Procent składany", definition: "Odsetki od odsetek w czasie" },
  { concept: "Fundusz awaryjny", definition: "Płynna rezerwa 3–6 miesięcy" },
  { concept: "Obligacja", definition: "Pożyczka dla państwa lub firmy z oprocentowaniem" },
  { concept: "Akcja", definition: "Udział we własności firmy" },
  { concept: "Hipoteka", definition: "Długoterminowy kredyt zabezpieczony nieruchomością" },
  { concept: "IKE", definition: "Indywidualne Konto Emerytalne (3. filar)" },
  { concept: "IKZE", definition: "Konto emerytalne z ulgą w PIT" },
  { concept: "WIBOR", definition: "Międzybankowa stawka referencyjna PLN" },
  { concept: "Podatek Belki", definition: "19 % od zysków kapitałowych" },
  { concept: "NBP", definition: "Narodowy Bank Polski — polski bank centralny" },
  { concept: "KNF", definition: "Komisja Nadzoru Finansowego" },
];

const UK_PAIRS: MemoryPair[] = [
  { concept: "APR", definition: "Річна реальна ставка з усіма комісіями" },
  { concept: "ETF", definition: "Біржовий фонд, що відстежує індекс" },
  { concept: "Інфляція", definition: "Зниження купівельної спроможності грошей" },
  { concept: "Диверсифікація", definition: "Розподіл ризику між активами" },
  { concept: "Monobank", definition: "Український мобільний банк" },
  { concept: "Складний відсоток", definition: "Відсотки на відсотки з часом" },
  { concept: "Подушка безпеки", definition: "Ліквідний резерв на 3–6 місяців" },
  { concept: "ОВДП", definition: "Облігації внутрішньої державної позики" },
  { concept: "Акція", definition: "Частка у власності компанії" },
  { concept: "Іпотека", definition: "Довгостроковий кредит під нерухомість" },
  { concept: "ФОП", definition: "Фізична особа-підприємець" },
  { concept: "НБУ", definition: "Національний банк України" },
  { concept: "SEPA", definition: "Єдина зона платежів у євро (ЄС)" },
  { concept: "ПДФО", definition: "Податок на доходи фізичних осіб (18 %)" },
  { concept: "Дія", definition: "Державний цифровий застосунок" },
  { concept: "Обліков. ставка", definition: "Ключова ставка НБУ" },
];

const CS_PAIRS: MemoryPair[] = [
  { concept: "RPSN", definition: "Roční procentní sazba nákladů úvěru" },
  { concept: "ETF", definition: "Indexový fond obchodovaný na burze" },
  { concept: "Inflace", definition: "Pokles kupní síly peněz" },
  { concept: "Diverzifikace", definition: "Rozložení rizika investic" },
  { concept: "DIP", definition: "Dlouhodobý investiční produkt (od 2024)" },
  { concept: "Složené úročení", definition: "Úroky z úroků v čase" },
  { concept: "Nouzová rezerva", definition: "Likvidní rezerva 3–6 měsíců" },
  { concept: "Dluhopis", definition: "Půjčka státu či firmě s kuponem" },
  { concept: "Akcie", definition: "Podíl na vlastnictví společnosti" },
  { concept: "Hypotéka", definition: "Dlouhodobý úvěr zajištěný nemovitostí" },
  { concept: "ČNB", definition: "Česká národní banka" },
  { concept: "2T repo", definition: "Hlavní sazba ČNB" },
  { concept: "Stavební spoření", definition: "Státem dotované spoření" },
  { concept: "Srážková daň", definition: "15 % z kapitálových zisků" },
  { concept: "SIPO", definition: "Soustředěné inkaso plateb obyvatelstva" },
  { concept: "OSVČ", definition: "Osoba samostatně výdělečně činná" },
];

const EN_PAIRS: MemoryPair[] = [
  { concept: "APR", definition: "Annual Percentage Rate incl. fees" },
  { concept: "ETF", definition: "Exchange-Traded index Fund" },
  { concept: "Inflation", definition: "Decline in money's purchasing power" },
  { concept: "Diversification", definition: "Spreading investment risk" },
  { concept: "Compound interest", definition: "Interest earning interest over time" },
  { concept: "Emergency fund", definition: "Liquid reserve for 3–6 months" },
  { concept: "Bond", definition: "Loan to government or company paying interest" },
  { concept: "Stock (share)", definition: "Ownership stake in a company" },
  { concept: "Mortgage", definition: "Long-term loan backed by real estate" },
  { concept: "Index fund", definition: "Fund tracking a market index cheaply" },
  { concept: "SEPA", definition: "EU single euro transfer standard" },
  { concept: "UCITS", definition: "EU-regulated investment fund format" },
  { concept: "Dividend", definition: "Company profit paid to shareholders" },
  { concept: "Leverage", definition: "Using borrowed money to invest" },
  { concept: "FIRE", definition: "Financial Independence, Retire Early" },
  { concept: "Ponzi", definition: "Fraud paying old investors with new money" },
];

const POOLS: Record<Lang, MemoryPair[]> = {
  pl: PL_PAIRS,
  uk: UK_PAIRS,
  cs: CS_PAIRS,
  en: EN_PAIRS,
};

export function memoryPairsFor(lang: Lang): MemoryPair[] {
  return POOLS[lang];
}

export const MEMORY_PAIRS = PL_PAIRS;
export const PAIRS_PER_ROUND = 8;
