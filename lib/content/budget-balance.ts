import type { Lang } from "@/lib/i18n";

export type BudgetTarget = {
  id: "needs" | "savings" | "investments" | "fun";
  label: string;
  hint: string;
  min: number;
  max: number;
  emoji: string;
};

export type BudgetScenario = {
  id: string;
  title: string;
  persona: string;
  income: number;
  currency: string;
  localeTag: string;
  targets: BudgetTarget[];
  takeaway: string;
};

const PL_SCENARIOS: BudgetScenario[] = [
  {
    id: "pl-student",
    title: "Student — 2000 zł/mies",
    persona:
      "Studiujesz w Katowicach, mieszkasz w akademiku. Pracujesz na pół etatu i chcesz zacząć inwestować.",
    income: 2000,
    currency: "zł",
    localeTag: "pl-PL",
    targets: [
      { id: "needs", label: "Potrzeby", hint: "Akademik, jedzenie, transport, szkoła", min: 45, max: 65, emoji: "🏠" },
      { id: "fun", label: "Zabawa", hint: "Piwo, kino, gry, wyjazdy", min: 10, max: 25, emoji: "🎮" },
      { id: "savings", label: "Oszczędności", hint: "Fundusz awaryjny — cel 3× miesięczne wydatki", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Inwestycje", hint: "ETF, IKE — długi horyzont", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "Nawet przy małym dochodzie zasada pay-yourself-first działa: 10 % do oszczędności i 5 % do IKE/ETF kiedy mieszkasz tanio to ogromna przewaga w dorosłości.",
  },
  {
    id: "pl-first-job",
    title: "Pierwsza praca — 5500 zł/mies",
    persona: "Pierwszy etat po studiach. Wynajem w Katowicach, bez auta ani dzieci.",
    income: 5500,
    currency: "zł",
    localeTag: "pl-PL",
    targets: [
      { id: "needs", label: "Potrzeby", hint: "Czynsz, jedzenie, dojazdy, rachunki", min: 40, max: 55, emoji: "🏠" },
      { id: "fun", label: "Zabawa", hint: "Gastronomia, wolny czas, ubrania", min: 15, max: 30, emoji: "🎮" },
      { id: "savings", label: "Oszczędności", hint: "Fundusz awaryjny 6 miesięcy", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Inwestycje", hint: "Regularne ETF, IKE/IKZE — emerytura", min: 10, max: 20, emoji: "📈" },
    ],
    takeaway:
      "Bez zobowiązań, oszczędzanie 20–25 % dochodu to złoty standard. ETF z 20-tki potrafi zrobić cuda do 60-tki — czas jest twoim największym aktywem.",
  },
  {
    id: "pl-family",
    title: "Rodzina + hipoteka — 11 000 zł/mies",
    persona:
      "Gospodarstwo z dochodem 11 000 zł, hipoteka, małe dziecko. Budżet jest napięty.",
    income: 11000,
    currency: "zł",
    localeTag: "pl-PL",
    targets: [
      { id: "needs", label: "Potrzeby", hint: "Hipoteka, jedzenie, dojazdy, dziecko, ubezpieczenia", min: 55, max: 70, emoji: "🏠" },
      { id: "fun", label: "Zabawa", hint: "Rodzinne wolne chwile, hobby", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Oszczędności", hint: "Fundusz awaryjny + rezerwa na remonty", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Inwestycje", hint: "Emerytura + przyszłe wykształcenie dziecka", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "Nawet przy stałych kosztach (hipoteka) warto trzymać min. 10 % na oszczędności i 5 % na inwestycje. Konsekwencja bije „będę oszczędzać gdy zostanie”.",
  },
  {
    id: "pl-freelancer",
    title: "Freelancer IT — 12 000 zł/mies",
    persona: "B2B kontrakt, nieregularne zlecenia. Musisz sobie sam płacić ZUS i podatek.",
    income: 12000,
    currency: "zł",
    localeTag: "pl-PL",
    targets: [
      { id: "needs", label: "Potrzeby + podatki/ZUS", hint: "Czynsz, jedzenie, ZUS, podatek, koszty działalności", min: 50, max: 65, emoji: "🏠" },
      { id: "fun", label: "Zabawa", hint: "Restauracje, wyjazdy, subskrypcje", min: 10, max: 25, emoji: "🎮" },
      { id: "savings", label: "Oszczędności", hint: "6–12 miesięcy na wypadek przestoju", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Inwestycje", hint: "IKE, IKZE, ETF — bez ZUS-u emerytalnego wiele zależy od ciebie", min: 10, max: 20, emoji: "📈" },
    ],
    takeaway:
      "Jako samozatrudniony masz wyższy przychód, ale musisz robić to co etat robi za ciebie: emerytura, ubezpieczenie, rezerwa na przestój. IKZE daje ulgę w PIT.",
  },
  {
    id: "pl-senior",
    title: "Doświadczony pracownik — 15 000 zł/mies",
    persona: "Menedżer 40+ lat, dzieci na studiach, 10 lat do emerytury.",
    income: 15000,
    currency: "zł",
    localeTag: "pl-PL",
    targets: [
      { id: "needs", label: "Potrzeby", hint: "Dom, jedzenie, pomoc dzieciom, ubezpieczenia", min: 40, max: 55, emoji: "🏠" },
      { id: "fun", label: "Zabawa", hint: "Wakacje, restauracje, hobby", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Oszczędności", hint: "Stabilna rezerwa na emeryturę", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Inwestycje", hint: "IKE max, IKZE, dywersyfikacja — 10 lat do emerytury", min: 15, max: 30, emoji: "📈" },
    ],
    takeaway:
      "Ostatnia dekada przed emeryturą to moment aby zmaksymalizować IKE/IKZE i zrównoważyć portfel (więcej obligacji, mniej ryzyka). ZUS daje tylko bazę.",
  },
];

const UK_SCENARIOS: BudgetScenario[] = [
  {
    id: "uk-student",
    title: "Студент — 12 000 грн/міс",
    persona:
      "Вчишся в Києві, живеш у гуртожитку. Підробляєш, хочеш почати відкладати.",
    income: 12000,
    currency: "грн",
    localeTag: "uk-UA",
    targets: [
      { id: "needs", label: "Потреби", hint: "Гуртожиток, їжа, транспорт, навчання", min: 50, max: 70, emoji: "🏠" },
      { id: "fun", label: "Розваги", hint: "Кіно, кафе, друзі", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Заощадження", hint: "Подушка безпеки — ціль 3× міс. витрат", min: 5, max: 15, emoji: "💰" },
      { id: "investments", label: "Інвестиції", hint: "ОВДП, ETF — довгий горизонт", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "У нестабільні часи навіть 5 % у валютних ОВДП — великий крок. Головне — почати звичку.",
  },
  {
    id: "uk-first-job",
    title: "Перша робота — 35 000 грн/міс",
    persona: "Перша повноцінна позиція. Знімаєш квартиру, без машини й дітей.",
    income: 35000,
    currency: "грн",
    localeTag: "uk-UA",
    targets: [
      { id: "needs", label: "Потреби", hint: "Оренда, їжа, транспорт, комуналка", min: 45, max: 55, emoji: "🏠" },
      { id: "fun", label: "Розваги", hint: "Ресторани, дозвілля, одяг", min: 15, max: 25, emoji: "🎮" },
      { id: "savings", label: "Заощадження", hint: "Подушка безпеки на 6 місяців", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Інвестиції", hint: "ОВДП валютні, ETF через Interactive Brokers", min: 10, max: 20, emoji: "📈" },
    ],
    takeaway:
      "Без зобов'язань — це ідеальний час починати FIRE-підхід. 20–25 % заощаджень, валютні ОВДП для хеджування.",
  },
  {
    id: "uk-fop",
    title: "ФОП IT — 90 000 грн/міс",
    persona: "ФОП 3-ї групи, IT-аутсорс. Нестабільний дохід, сам собі пенсія.",
    income: 90000,
    currency: "грн",
    localeTag: "uk-UA",
    targets: [
      { id: "needs", label: "Потреби + податки", hint: "Оренда, їжа, 5 % податку, ЄСВ, бухгалтер", min: 40, max: 55, emoji: "🏠" },
      { id: "fun", label: "Розваги", hint: "Ресторани, подорожі, підписки", min: 10, max: 25, emoji: "🎮" },
      { id: "savings", label: "Заощадження", hint: "6–12 міс. подушка — нестабільність", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Інвестиції", hint: "ОВДП валютні + ETF — сам собі пенсійний фонд", min: 15, max: 25, emoji: "📈" },
    ],
    takeaway:
      "ФОП = вищий дохід, але сам собі пенсія і сам собі страховка. Хороша подушка та валютні активи критичні.",
  },
  {
    id: "uk-family",
    title: "Сім'я + іпотека — 60 000 грн/міс",
    persona: "Подружжя, маленька дитина, іпотека в гривні. Зарплата двох.",
    income: 60000,
    currency: "грн",
    localeTag: "uk-UA",
    targets: [
      { id: "needs", label: "Потреби", hint: "Іпотека, їжа, дитина, транспорт, комуналка", min: 55, max: 70, emoji: "🏠" },
      { id: "fun", label: "Розваги", hint: "Дозвілля, хобі", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Заощадження", hint: "Подушка + ремонти", min: 10, max: 15, emoji: "💰" },
      { id: "investments", label: "Інвестиції", hint: "Валютні ОВДП, освітні заощадження дитини", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "Навіть з іпотекою — мінімум 10 % на подушку. В умовах валютних ризиків частина у USD/EUR-деномінованих активах обов'язкова.",
  },
  {
    id: "uk-senior",
    title: "Досвідчений IT-менеджер — 150 000 грн/міс",
    persona: "Тімлід у великій компанії, 35+ років, дві дитини школярі.",
    income: 150000,
    currency: "грн",
    localeTag: "uk-UA",
    targets: [
      { id: "needs", label: "Потреби", hint: "Будинок, їжа, школи, авто, страхування", min: 35, max: 50, emoji: "🏠" },
      { id: "fun", label: "Розваги", hint: "Відпустки, ресторани", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Заощадження", hint: "Стабільна подушка + освіта дітей", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Інвестиції", hint: "Диверсифікація — ETF глобальні, ОВДП, нерухомість", min: 15, max: 30, emoji: "📈" },
    ],
    takeaway:
      "З таким доходом критично диверсифікувати валюти й ринки. Не тримайте все в одній країні чи одній валюті.",
  },
];

const CS_SCENARIOS: BudgetScenario[] = [
  {
    id: "cs-student",
    title: "Student — 12 000 Kč/měs",
    persona: "Studuješ v Praze, bydlíš na koleji. Občas brigáda, chceš začít spořit.",
    income: 12000,
    currency: "Kč",
    localeTag: "cs-CZ",
    targets: [
      { id: "needs", label: "Potřeby", hint: "Kolej, jídlo, MHD, škola", min: 45, max: 65, emoji: "🏠" },
      { id: "fun", label: "Zábava", hint: "Pivo, kino, koncerty, výlety", min: 10, max: 25, emoji: "🎮" },
      { id: "savings", label: "Spoření", hint: "Nouzová rezerva — cíl 3× měsíční výdaje", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Investice", hint: "ETF přes XTB/Fio, DIP — dlouhý horizont", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "I při nízkém příjmu se pay-yourself-first vyplatí: 10 % na spoření + 5 % do ETF když bydlíš levně = velká výhoda v dospělosti.",
  },
  {
    id: "cs-first-job",
    title: "První práce — 35 000 Kč/měs",
    persona: "První plný úvazek po škole. Nájem v Praze/Brně, bez auta a dětí.",
    income: 35000,
    currency: "Kč",
    localeTag: "cs-CZ",
    targets: [
      { id: "needs", label: "Potřeby", hint: "Nájem, jídlo, MHD, energie", min: 40, max: 55, emoji: "🏠" },
      { id: "fun", label: "Zábava", hint: "Restaurace, volný čas, oblečení", min: 15, max: 30, emoji: "🎮" },
      { id: "savings", label: "Spoření", hint: "Nouzová rezerva 6 měsíců", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Investice", hint: "Pravidelné ETF, DIP — důchod", min: 10, max: 20, emoji: "📈" },
    ],
    takeaway:
      "Bez závazků cílej na 20–25 % úspor. ETF pravidelně koupené od 20 dělají v 60 zázraky — čas je tvá největší zbraň.",
  },
  {
    id: "cs-osvc",
    title: "OSVČ — 80 000 Kč/měs",
    persona: "IT freelancer, paušální výdaje 60 %. Sám si řešíš zdravotní a sociální pojištění.",
    income: 80000,
    currency: "Kč",
    localeTag: "cs-CZ",
    targets: [
      { id: "needs", label: "Potřeby + daně/SP", hint: "Nájem, jídlo, ZP, SP, daň, účetní", min: 45, max: 60, emoji: "🏠" },
      { id: "fun", label: "Zábava", hint: "Restaurace, cestování, předplatné", min: 10, max: 25, emoji: "🎮" },
      { id: "savings", label: "Spoření", hint: "6–12 měsíců — prostoje jsou realita", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Investice", hint: "DIP, ETF — sám sobě důchodové fondy", min: 10, max: 20, emoji: "📈" },
    ],
    takeaway:
      "OSVČ = vyšší příjem, ale sám si děláš to, co zaměstnavatel. Důchod přes státní systém bude malý — DIP + ETF povinnost.",
  },
  {
    id: "cs-family",
    title: "Rodina + hypotéka — 70 000 Kč/měs",
    persona:
      "Pár s malým dítětem, hypotéka v Praze. Oba pracují — příjem domácnosti.",
    income: 70000,
    currency: "Kč",
    localeTag: "cs-CZ",
    targets: [
      { id: "needs", label: "Potřeby", hint: "Hypotéka, jídlo, dítě, MHD, energie, pojištění", min: 55, max: 70, emoji: "🏠" },
      { id: "fun", label: "Zábava", hint: "Rodinný volný čas, hobby", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Spoření", hint: "Nouzová rezerva + rezerva na opravy", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Investice", hint: "DIP, stavební spoření, vzdělání dítěte", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "I s hypotékou — minimum 10 % na spoření a 5 % na investice. Konzistence poráží „začnu až se zdaří“.",
  },
  {
    id: "cs-senior",
    title: "Zkušený IT — 120 000 Kč/měs",
    persona: "Senior software engineer, 40+, dvě děti na SŠ. 15 let do důchodu.",
    income: 120000,
    currency: "Kč",
    localeTag: "cs-CZ",
    targets: [
      { id: "needs", label: "Potřeby", hint: "Bydlení, jídlo, děti, auto, pojištění", min: 35, max: 50, emoji: "🏠" },
      { id: "fun", label: "Zábava", hint: "Dovolené, restaurace, hobby", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Spoření", hint: "Stabilní rezerva + vzdělání dětí", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Investice", hint: "DIP max, ETF diverzifikace", min: 15, max: 30, emoji: "📈" },
    ],
    takeaway:
      "Posledních 15 let před důchodem je čas maxovat DIP a vyvážit portfolio (víc dluhopisů, méně akcií). Důchodkový systém je zoufalý.",
  },
];

const EN_SCENARIOS: BudgetScenario[] = [
  {
    id: "en-student",
    title: "Student — €600/month",
    persona: "Uni student in Katowice on Erasmus. Dorm, part-time job, starting to save.",
    income: 600,
    currency: "€",
    localeTag: "en-GB",
    targets: [
      { id: "needs", label: "Needs", hint: "Dorm, food, transport, school", min: 50, max: 70, emoji: "🏠" },
      { id: "fun", label: "Fun", hint: "Coffee, cinema, trips, friends", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Savings", hint: "Emergency fund — target 3× monthly expenses", min: 5, max: 15, emoji: "💰" },
      { id: "investments", label: "Investments", hint: "UCITS ETF, long horizon", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "Even on a tight student budget, starting the habit matters more than the amount. €30/mo in a MSCI World ETF at 20 beats €300/mo at 40.",
  },
  {
    id: "en-first-job",
    title: "First job — €2000/month",
    persona: "First full-time role. Rent shared, no car, no kids.",
    income: 2000,
    currency: "€",
    localeTag: "en-GB",
    targets: [
      { id: "needs", label: "Needs", hint: "Rent, food, transport, utilities", min: 40, max: 55, emoji: "🏠" },
      { id: "fun", label: "Fun", hint: "Dining, free time, clothes", min: 15, max: 30, emoji: "🎮" },
      { id: "savings", label: "Savings", hint: "6-month emergency fund", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Investments", hint: "Regular ETF DCA, pension", min: 10, max: 20, emoji: "📈" },
    ],
    takeaway:
      "Without obligations, 20–25 % savings is a golden standard. ETFs starting from 20 make wonders by 60 — time is your biggest asset.",
  },
  {
    id: "en-remote",
    title: "Remote dev — €5000/month",
    persona: "Software engineer for a US company, living in Poland. Higher income, different taxes.",
    income: 5000,
    currency: "€",
    localeTag: "en-GB",
    targets: [
      { id: "needs", label: "Needs", hint: "Rent, food, transport, utilities, equipment", min: 35, max: 50, emoji: "🏠" },
      { id: "fun", label: "Fun", hint: "Dining, travel, subscriptions", min: 10, max: 25, emoji: "🎮" },
      { id: "savings", label: "Savings", hint: "12-month emergency fund — job market volatility", min: 15, max: 25, emoji: "💰" },
      { id: "investments", label: "Investments", hint: "Pension, UCITS ETFs, real estate savings", min: 15, max: 30, emoji: "📈" },
    ],
    takeaway:
      "High income = high saving discipline needed. Lifestyle inflation is the #1 killer of FIRE plans. Automate investments so willpower isn't tested.",
  },
  {
    id: "en-family",
    title: "Family + mortgage — €4000/month",
    persona: "Couple with a small child, mortgage in a mid-sized European city.",
    income: 4000,
    currency: "€",
    localeTag: "en-GB",
    targets: [
      { id: "needs", label: "Needs", hint: "Mortgage, food, transport, childcare, insurance", min: 55, max: 70, emoji: "🏠" },
      { id: "fun", label: "Fun", hint: "Family leisure, hobbies", min: 10, max: 20, emoji: "🎮" },
      { id: "savings", label: "Savings", hint: "Emergency fund + home repair reserve", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Investments", hint: "Pension + child's future", min: 5, max: 15, emoji: "📈" },
    ],
    takeaway:
      "Even with mortgage obligations, keep at least 10 % for savings and 5 % for investments. Consistency beats 'I'll save when some is left over'.",
  },
  {
    id: "en-fire",
    title: "FIRE path — €3500/month",
    persona: "Tech worker pursuing Financial Independence. Minimalist lifestyle, aggressive savings.",
    income: 3500,
    currency: "€",
    localeTag: "en-GB",
    targets: [
      { id: "needs", label: "Needs", hint: "Low rent, basic groceries, transport", min: 25, max: 40, emoji: "🏠" },
      { id: "fun", label: "Fun", hint: "Minimal — experiences over things", min: 5, max: 15, emoji: "🎮" },
      { id: "savings", label: "Savings", hint: "Full emergency fund — freedom buffer", min: 10, max: 20, emoji: "💰" },
      { id: "investments", label: "Investments", hint: "Aggressive ETF DCA — target 25× annual expenses", min: 35, max: 55, emoji: "📈" },
    ],
    takeaway:
      "FIRE math: if you invest 50 % of income in a 7 % real-return portfolio, you're financially independent in ~17 years. Save rate > income.",
  },
];

const POOLS: Record<Lang, BudgetScenario[]> = {
  pl: PL_SCENARIOS,
  uk: UK_SCENARIOS,
  cs: CS_SCENARIOS,
  en: EN_SCENARIOS,
};

export function budgetScenariosFor(lang: Lang): BudgetScenario[] {
  return POOLS[lang];
}

export const SCENARIOS = PL_SCENARIOS;
export const XP_CAP = 160;
