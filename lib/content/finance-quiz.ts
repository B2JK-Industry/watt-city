export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const FINANCE_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Čo je to RRSO pri úvere?",
    options: [
      "Ročná úroková sadzba bez poplatkov",
      "Celkové ročné percentuálne náklady vrátane poplatkov",
      "Poplatok za predčasné splatenie",
      "Minimálna mesačná splátka",
    ],
    correctIndex: 1,
    explanation:
      "RRSO (Roczna Rzeczywista Stopa Oprocentowania) zahŕňa úrok aj všetky poplatky — je to skutočná cena úveru.",
  },
  {
    id: "q2",
    prompt:
      "Koľko % mesačného príjmu odborníci odporúčajú odkladať minimálne?",
    options: ["1–2 %", "5–10 %", "10–20 %", "50 %+"],
    correctIndex: 2,
    explanation:
      "Pravidlo 50/30/20: ~20 % príjmu na úspory a splátky dlhu. Kto začína, môže ísť od 10 %.",
  },
  {
    id: "q3",
    prompt: "Čo znamená diverzifikácia portfólia?",
    options: [
      "Nákup čo najlacnejších akcií",
      "Rozloženie investícií do viacerých aktív / sektorov",
      "Používanie pákového efektu",
      "Pravidelné vyberanie zisku",
    ],
    correctIndex: 1,
    explanation:
      "Diverzifikácia znižuje riziko — keď padne jeden sektor, iné môžu rásť a vyrovnať stratu.",
  },
  {
    id: "q4",
    prompt: "Čo je to núdzový rezervný fond?",
    options: [
      "Dlhodobá investícia do dlhopisov",
      "Pôžička od rodiny pre prípad núdze",
      "Likvidná rezerva 3–6 mesačných výdavkov",
      "Poistenie zodpovednosti",
    ],
    correctIndex: 2,
    explanation:
      "Núdzový fond = peniaze okamžite dostupné (sporiaci účet) na pokrytie 3–6 mesiacov bežných výdavkov.",
  },
  {
    id: "q5",
    prompt: "Ktoré tvrdenie o zloženom úročení je pravdivé?",
    options: [
      "Funguje iba pri vysokých sumách",
      "Úroky sa počítajú iba z pôvodnej istiny",
      "Úroky sa pripočítavajú k istine a ďalej úročia",
      "Je rovnaké ako jednoduché úročenie",
    ],
    correctIndex: 2,
    explanation:
      "Zložené úročenie = úroky z úrokov. Čas je váš najväčší spojenec — preto začínajte sporiť skoro.",
  },
  {
    id: "q6",
    prompt: "Čo je PKO BLIK kód určený na?",
    options: [
      "Prihlásenie do bankovníctva",
      "Jednorazové platby a výbery z bankomatu",
      "Overenie totožnosti v obchode",
      "Prevod do zahraničia",
    ],
    correctIndex: 1,
    explanation:
      "BLIK je poľský mobilný platobný systém — 6-ciferný jednorazový kód na platbu alebo výber hotovosti.",
  },
  {
    id: "q7",
    prompt: "Aký je hlavný rozdiel medzi debetnou a kreditnou kartou?",
    options: [
      "Debetka má vždy vyššie poplatky",
      "Kreditka čerpá z vlastných peňazí, debetka z úveru",
      "Debetka čerpá z účtu, kreditka z úveru banky",
      "Niet rozdielu, len dizajn",
    ],
    correctIndex: 2,
    explanation:
      "Debetná = vaše vlastné peniaze na účte. Kreditná = požičiavate si od banky a splácate.",
  },
  {
    id: "q8",
    prompt: "Čo je to inflácia?",
    options: [
      "Rast reálnej hodnoty peňazí",
      "Pokles cien tovarov a služieb",
      "Pokles kúpnej sily peňazí v čase",
      "Fixná úroková sadzba centrálnej banky",
    ],
    correctIndex: 2,
    explanation:
      "Inflácia = za rovnakú sumu si zajtra kúpite menej. Preto sú úspory pod vankúšom stratové.",
  },
  {
    id: "q9",
    prompt: "Čo sú ETF fondy?",
    options: [
      "Štátne dlhopisy s fixným výnosom",
      "Koše aktív obchodované na burze (indexové fondy)",
      "Poistenie pre investorov",
      "Kryptomenové peňaženky",
    ],
    correctIndex: 1,
    explanation:
      "ETF (Exchange-Traded Fund) sleduje index (napr. S&P 500) — lacný, diverzifikovaný, obchodovateľný ako akcia.",
  },
  {
    id: "q10",
    prompt: "Koľko rokov maximálne trvá reklamácia chybného tovaru v EÚ?",
    options: ["6 mesiacov", "1 rok", "2 roky", "5 rokov"],
    correctIndex: 2,
    explanation:
      "Smernica EÚ garantuje minimálne 2-ročnú zodpovednosť predajcu za vady spotrebného tovaru.",
  },
  {
    id: "q11",
    prompt: "Čo je PKO IKO?",
    options: [
      "Firemný účet pre živnostníkov",
      "Mobilná bankingová aplikácia PKO Bank Polski",
      "Krypto peňaženka s kartou",
      "Typ hypotekárneho úveru",
    ],
    correctIndex: 1,
    explanation:
      "IKO je mobilná apka PKO — platby, BLIK, prevody, výbery z bankomatu QR kódom, správa účtov.",
  },
  {
    id: "q12",
    prompt: "Čo znamená IKE v poľskom dôchodkovom systéme?",
    options: [
      "Indywidualne Konto Emerytalne — dobrovoľný dôchodkový účet s daňovou výhodou",
      "Individuálna krypto investícia",
      "Spoločenský dôchodok od štátu",
      "Typ kreditnej karty pre seniorov",
    ],
    correctIndex: 0,
    explanation:
      "IKE je 3. pilier v PL — investuješ po zdanení, pri výbere po 60 nezaplatíš kapitálovú daň 19 %. Podobný princíp: IKZE.",
  },
  {
    id: "q13",
    prompt: "Aký minimálny vek je na založenie Konto dla Młodych v PKO?",
    options: ["10 rokov", "13 rokov", "18 rokov", "21 rokov"],
    correctIndex: 1,
    explanation:
      "PKO Konto dla Młodych je pre 13–17 ročných — s IKO apkou, BLIK-om a zdarma prevodmi. Od 18 sa automaticky mení na štandardný účet.",
  },
  {
    id: "q14",
    prompt:
      "Koľko maximálne vieš v Poľsku investovať do IKE za rok 2026?",
    options: [
      "1 500 zł",
      "~15 000 zł (3-násobok priemernej mzdy)",
      "Bez limitu",
      "50 000 zł",
    ],
    correctIndex: 1,
    explanation:
      "IKE limit je ~3× priemerná mesačná mzda, pre 2026 to je približne 15 000 zł. IKZE má nižší limit, ale iné daňové výhody.",
  },
  {
    id: "q15",
    prompt: "Koľko % elektriny v Poľsku produkujú v roku 2025 stále uhoľné elektrárne?",
    options: ["~15 %", "~35 %", "~55 %", "~85 %"],
    correctIndex: 2,
    explanation:
      "Poľsko je v EÚ extrém — stále ~55 % elektriny z uhlia. Cieľ EÚ je postupne tento podiel znižovať, napr. cez OZE a jadro.",
  },
  {
    id: "q16",
    prompt: "Čo znamená WIBOR v hypotékach?",
    options: [
      "Medzibankový úrokový benchmark, na ktorom závisí sadzba",
      "Poplatok za predčasné splatenie",
      "Typ poistenia nehnuteľnosti",
      "Minimálny vlastný vklad",
    ],
    correctIndex: 0,
    explanation:
      "WIBOR = Warsaw Interbank Offered Rate. Variabilná sadzba hypoték býva WIBOR 3M/6M + marža banky. Od 2025 ho nahrádza WIRON.",
  },
  {
    id: "q17",
    prompt: "Koľko reálnej úrokovej sadzby dostaneš, ak banka ponúka 5 % a inflácia je 6 %?",
    options: ["+5 %", "+1 %", "−1 %", "−11 %"],
    correctIndex: 2,
    explanation:
      "Reálna sadzba = nominálna − inflácia. 5 − 6 = −1 %. Tvoje peniaze na lokate strácajú kúpnu silu, aj keď rastú.",
  },
  {
    id: "q18",
    prompt: `Čo je „Bezpieczny Kredyt 2 %" v Poľsku?`,
    options: [
      "Úver pre malé firmy so štátnou dotáciou",
      "Štátom dotovaná hypotéka pre mladých do 45 rokov",
      "Kreditná karta pre študentov",
      "Dlhopis vydaný ministerstvom financií",
    ],
    correctIndex: 1,
    explanation:
      "Bezpieczny Kredyt 2 % bol program dotácie prvej hypotéky — štát doplácal úrok nad 2 %. Od 2024 sa menila dostupnosť, ale princíp pomoci mladým v kúpe bývania trvá.",
  },
];

export const QUESTIONS_PER_ROUND = 5;
export const XP_PER_CORRECT = 20; // 5 × 20 = 100 max per round
