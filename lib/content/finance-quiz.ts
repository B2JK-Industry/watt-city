import type { Lang } from "@/lib/i18n";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const PL_QUESTIONS: QuizQuestion[] = [
  {
    id: "pl-rrso",
    prompt: "Czym jest RRSO w kredycie?",
    options: [
      "Roczna stopa oprocentowania bez opłat",
      "Roczna Rzeczywista Stopa Oprocentowania — odsetki + wszystkie opłaty",
      "Opłata za wcześniejszą spłatę",
      "Minimalna rata miesięczna",
    ],
    correctIndex: 1,
    explanation:
      "RRSO zawiera odsetki, prowizje, ubezpieczenia — to prawdziwy koszt kredytu, który można porównać między bankami.",
  },
  {
    id: "pl-save-pct",
    prompt: "Ile procent miesięcznego dochodu eksperci radzą odkładać minimalnie?",
    options: ["1–2 %", "5–10 %", "10–20 %", "50 %+"],
    correctIndex: 2,
    explanation:
      "Zasada 50/30/20: około 20 % dochodu na oszczędności i spłatę długu. Ktoś zaczynający może od 10 %.",
  },
  {
    id: "pl-diversify",
    prompt: "Co oznacza dywersyfikacja portfela?",
    options: [
      "Kupowanie najtańszych akcji",
      "Rozłożenie inwestycji na wiele aktywów i sektorów",
      "Stosowanie dźwigni finansowej",
      "Regularne wypłacanie zysku",
    ],
    correctIndex: 1,
    explanation:
      "Dywersyfikacja zmniejsza ryzyko — gdy jeden sektor spada, inne mogą rosnąć i wyrównać stratę.",
  },
  {
    id: "pl-emergency",
    prompt: "Czym jest fundusz awaryjny (emergency fund)?",
    options: [
      "Długoterminowa inwestycja w obligacje",
      "Pożyczka od rodziny na wszelki wypadek",
      "Płynna rezerwa 3–6 miesięcznych wydatków",
      "Ubezpieczenie OC",
    ],
    correctIndex: 2,
    explanation:
      "Fundusz awaryjny = pieniądze natychmiast dostępne (konto oszczędnościowe) na 3–6 miesięcy kosztów życia.",
  },
  {
    id: "pl-compound",
    prompt: "Które stwierdzenie o procencie składanym jest prawdziwe?",
    options: [
      "Działa tylko przy dużych kwotach",
      "Odsetki liczą się tylko od kapitału początkowego",
      "Odsetki dopisują się do kapitału i dalej procentują",
      "To to samo co procent prosty",
    ],
    correctIndex: 2,
    explanation:
      "Procent składany = odsetki od odsetek. Czas jest twoim największym sojusznikiem — dlatego zaczynaj oszczędzać wcześnie.",
  },
  {
    id: "pl-blik",
    prompt: "Do czego służy kod BLIK?",
    options: [
      "Logowanie do bankowości",
      "Jednorazowe płatności i wypłaty z bankomatu",
      "Weryfikacja tożsamości w sklepie",
      "Przelew zagraniczny",
    ],
    correctIndex: 1,
    explanation:
      "BLIK to polski system mobilny — 6-cyfrowy jednorazowy kod do płatności lub wypłaty gotówki.",
  },
  {
    id: "pl-debit-credit",
    prompt: "Jaka jest główna różnica między kartą debetową a kredytową?",
    options: [
      "Debetowa ma zawsze wyższe opłaty",
      "Kredytowa pobiera z własnych pieniędzy, debetowa z kredytu",
      "Debetowa korzysta z konta, kredytowa z pożyczki banku",
      "Nie ma różnicy, tylko wygląd",
    ],
    correctIndex: 2,
    explanation:
      "Debetowa = twoje pieniądze na koncie. Kredytowa = pożyczasz od banku i spłacasz.",
  },
  {
    id: "pl-inflation",
    prompt: "Czym jest inflacja?",
    options: [
      "Wzrost realnej wartości pieniądza",
      "Spadek cen towarów i usług",
      "Spadek siły nabywczej pieniądza w czasie",
      "Stała stopa procentowa NBP",
    ],
    correctIndex: 2,
    explanation:
      "Inflacja = za tę samą kwotę jutro kupisz mniej. Dlatego oszczędności pod poduszką tracą.",
  },
  {
    id: "pl-etf",
    prompt: "Czym są fundusze ETF?",
    options: [
      "Obligacje skarbowe o stałym kuponie",
      "Kosze aktywów notowane na giełdzie (fundusze indeksowe)",
      "Ubezpieczenie dla inwestorów",
      "Portfele kryptowalutowe",
    ],
    correctIndex: 1,
    explanation:
      "ETF (Exchange-Traded Fund) śledzi indeks (np. S&P 500, WIG20) — tani, zdywersyfikowany, notowany jak akcja.",
  },
  {
    id: "pl-iko",
    prompt: "Czym jest PKO IKO?",
    options: [
      "Konto firmowe dla jednoosobowej działalności",
      "Aplikacja mobilna PKO Bank Polski",
      "Portfel kryptowalutowy z kartą",
      "Rodzaj kredytu hipotecznego",
    ],
    correctIndex: 1,
    explanation:
      "IKO to aplikacja mobilna PKO — płatności, BLIK, przelewy, wypłaty z bankomatu kodem QR, zarządzanie kontami.",
  },
  {
    id: "pl-ike",
    prompt: "Co oznacza IKE w polskim systemie emerytalnym?",
    options: [
      "Indywidualne Konto Emerytalne — dobrowolne, z korzyścią podatkową",
      "Indywidualna inwestycja krypto",
      "Powszechna emerytura państwowa",
      "Karta kredytowa dla seniorów",
    ],
    correctIndex: 0,
    explanation:
      "IKE to 3. filar — inwestujesz z pieniędzy po opodatkowaniu, przy wypłacie po 60. r.ż. nie płacisz 19 % podatku od zysków kapitałowych. Podobnie: IKZE.",
  },
  {
    id: "pl-konto-mlodych",
    prompt: "Od jakiego wieku można założyć Konto dla Młodych w PKO?",
    options: ["10 lat", "13 lat", "18 lat", "21 lat"],
    correctIndex: 1,
    explanation:
      "PKO Konto dla Młodych jest dla 13–17-latków — z IKO, BLIK i bezpłatnymi przelewami. Od 18. r.ż. automatycznie staje się kontem standardowym.",
  },
  {
    id: "pl-ike-limit-2026",
    prompt: "Ile maksymalnie można wpłacić na IKE w 2026 roku (w przybliżeniu)?",
    options: [
      "1 500 zł",
      "~25 000 zł (3-krotność prognozowanej średniej płacy)",
      "Bez limitu",
      "50 000 zł",
    ],
    correctIndex: 1,
    explanation:
      "Roczny limit IKE to 3× prognozowane przeciętne miesięczne wynagrodzenie. W 2026 ok. 25 000 zł. IKZE ma niższy limit, ale inne korzyści podatkowe.",
  },
  {
    id: "pl-coal",
    prompt: "Jaki procent energii elektrycznej w Polsce nadal pochodzi w 2025 z węgla?",
    options: ["~15 %", "~35 %", "~55 %", "~85 %"],
    correctIndex: 2,
    explanation:
      "Polska jest w UE wyjątkiem — wciąż ~55 % energii z węgla. Cel UE to stopniowe zmniejszanie przez OZE i atom.",
  },
  {
    id: "pl-wibor",
    prompt: "Czym jest WIBOR / WIRON w kredytach hipotecznych?",
    options: [
      "Międzybankowa stawka referencyjna, na której opiera się oprocentowanie",
      "Opłata za wcześniejszą spłatę",
      "Rodzaj ubezpieczenia nieruchomości",
      "Minimalny wkład własny",
    ],
    correctIndex: 0,
    explanation:
      "WIBOR = Warsaw Interbank Offered Rate. Zmienne oprocentowanie hipoteki to często WIBOR 3M/6M + marża banku. Od 2025 WIBOR jest stopniowo zastępowany przez WIRON.",
  },
  {
    id: "pl-real-rate",
    prompt: "Jakie jest realne oprocentowanie, jeśli lokata daje 5 %, a inflacja wynosi 6 %?",
    options: ["+5 %", "+1 %", "−1 %", "−11 %"],
    correctIndex: 2,
    explanation:
      "Realne oprocentowanie = nominalne − inflacja. 5 − 6 = −1 %. Twoje pieniądze na lokacie tracą siłę nabywczą, mimo że rosną nominalnie.",
  },
  {
    id: "pl-bk2",
    prompt: "Czym był program Bezpieczny Kredyt 2 %?",
    options: [
      "Kredyt dla małych firm z dopłatą państwa",
      "Dopłata państwa do hipoteki dla osób do 45. r.ż.",
      "Karta kredytowa dla studentów",
      "Obligacja emitowana przez ministerstwo finansów",
    ],
    correctIndex: 1,
    explanation:
      "Bezpieczny Kredyt 2 % (2023–2024) dopłacał różnicę pomiędzy rynkową stawką a 2 % — państwowa pomoc dla młodych na pierwsze mieszkanie. Od 2024 zmieniała się dostępność.",
  },
  {
    id: "pl-gift-tax",
    prompt: "Od ilu złotych trzeba w Polsce zgłosić darowiznę od najbliższej rodziny (2025)?",
    options: ["500 zł", "9 637 zł", "36 120 zł", "100 000 zł"],
    correctIndex: 2,
    explanation:
      "Dla grupy 0 (rodzice, dziadkowie, rodzeństwo) limit zwolnienia wynosi 36 120 zł. Powyżej — zgłoszenie SD-Z2 w 6 miesięcy, inaczej 20 % podatku.",
  },
  {
    id: "pl-belka",
    prompt: "Ile wynosi polski „podatek Belki” od zysków kapitałowych?",
    options: ["9 %", "12 %", "19 %", "32 %"],
    correctIndex: 2,
    explanation:
      "Podatek Belki = 19 % od odsetek, dywidend i zysków kapitałowych. IKE i IKZE pozwalają legalnie tego uniknąć przy długim horyzoncie.",
  },
  {
    id: "pl-varso",
    prompt: "Ile mierzy Varso Tower w Warszawie (najwyższy budynek w UE)?",
    options: ["210 m", "270 m", "310 m", "420 m"],
    correctIndex: 2,
    explanation:
      "Varso Tower mierzy 310 m i jest najwyższym budynkiem w Unii Europejskiej. W Watt City to twój ostateczny cel progresu.",
  },
];

const UK_QUESTIONS: QuizQuestion[] = [
  {
    id: "uk-apr",
    prompt: "Що означає реальна річна ставка (APR / ефективна ставка) за кредитом?",
    options: [
      "Лише номінальний відсоток без комісій",
      "Відсотки + усі обов'язкові комісії та страховки",
      "Штраф за дострокове погашення",
      "Мінімальний щомісячний платіж",
    ],
    correctIndex: 1,
    explanation:
      "Ефективна ставка включає всі витрати за кредитом — саме так порівнюйте пропозиції між банками (ПриватБанк, Монобанк, ОТП).",
  },
  {
    id: "uk-save-pct",
    prompt: "Скільки відсотків доходу експерти радять мінімально відкладати?",
    options: ["1–2 %", "5–10 %", "10–20 %", "50 %+"],
    correctIndex: 2,
    explanation:
      "Правило 50/30/20: близько 20 % доходу на заощадження та погашення боргів. Початківці можуть стартувати з 10 %.",
  },
  {
    id: "uk-diversify",
    prompt: "Що означає диверсифікація портфеля?",
    options: [
      "Купівля найдешевших акцій",
      "Розподіл інвестицій між активами та секторами",
      "Використання кредитного плеча",
      "Регулярне виведення прибутку",
    ],
    correctIndex: 1,
    explanation:
      "Диверсифікація зменшує ризик — коли один сектор падає, інший може зростати.",
  },
  {
    id: "uk-emergency",
    prompt: "Що таке фінансова «подушка безпеки»?",
    options: [
      "Довгострокова інвестиція в облігації",
      "Позика у родичів про всяк випадок",
      "Ліквідний запас на 3–6 місяців витрат",
      "Страхування відповідальності",
    ],
    correctIndex: 2,
    explanation:
      "Подушка безпеки = гроші, до яких є миттєвий доступ (ощадний рахунок) на 3–6 місяців життя.",
  },
  {
    id: "uk-compound",
    prompt: "Яке твердження про складний відсоток є правильним?",
    options: [
      "Працює лише з великими сумами",
      "Відсотки нараховуються лише на початкову суму",
      "Відсотки додаються до основної суми й надалі зростають",
      "Це те саме, що й простий відсоток",
    ],
    correctIndex: 2,
    explanation:
      "Складний відсоток = відсотки на відсотки. Час — твій найкращий союзник, тож починай інвестувати якнайраніше.",
  },
  {
    id: "uk-monobank",
    prompt: "Для чого використовується Apple Pay / Google Pay у Monobank або ПриватБанку?",
    options: [
      "Для входу в застосунок",
      "Для безконтактної оплати карткою з телефона",
      "Для перевірки особи в магазині",
      "Для міжнародних переказів",
    ],
    correctIndex: 1,
    explanation:
      "Apple Pay / Google Pay дозволяють платити телефоном без фізичної картки — номер картки залишається приватним (токенізація).",
  },
  {
    id: "uk-debit-credit",
    prompt: "У чому основна різниця між дебетовою та кредитною карткою?",
    options: [
      "Дебетова завжди дорожча",
      "Кредитна використовує власні гроші, дебетова — позичку",
      "Дебетова списує з рахунку, кредитна — це позика від банку",
      "Різниці немає, лише дизайн",
    ],
    correctIndex: 2,
    explanation:
      "Дебетова = твої гроші. Кредитна = позичаєш у банку й повертаєш, зазвичай із відсотками після пільгового періоду (grace period).",
  },
  {
    id: "uk-inflation",
    prompt: "Що таке інфляція?",
    options: [
      "Зростання реальної вартості грошей",
      "Зниження цін на товари",
      "Зниження купівельної спроможності грошей у часі",
      "Фіксована ставка НБУ",
    ],
    correctIndex: 2,
    explanation:
      "Інфляція в Україні у 2023–2025 була суттєвим фактором. Гроші «під подушкою» реально знецінюються.",
  },
  {
    id: "uk-etf",
    prompt: "Що таке ETF?",
    options: [
      "Державні облігації з фіксованим купоном",
      "Біржові фонди, що відстежують індекси",
      "Криптовалютний гаманець",
      "Страхування для інвесторів",
    ],
    correctIndex: 1,
    explanation:
      "ETF — це біржовий фонд, що тримає кошик акцій (S&P 500, MSCI World). Дешевий, диверсифікований, торгується як акція.",
  },
  {
    id: "uk-diia",
    prompt: "Що таке «Дія» в контексті українських фінансів?",
    options: [
      "Державний мобільний застосунок з цифровими документами й послугами",
      "Приватний банк",
      "Криптобіржа",
      "Міжнародна платіжна система",
    ],
    correctIndex: 0,
    explanation:
      "«Дія» — державний застосунок: ID, податки, ФОП, довідки. Цифрові послуги на рівні найкращих у Європі.",
  },
  {
    id: "uk-ovdp",
    prompt: "Що таке ОВДП (облігації внутрішньої державної позики)?",
    options: [
      "Акції «Нафтогазу»",
      "Державні облігації України у гривні або валюті",
      "Обов'язкове пенсійне страхування",
      "Бонус від роботодавця",
    ],
    correctIndex: 1,
    explanation:
      "ОВДП — це державний борг. Доходи від них звільнені від ПДФО (18 %) — вигідний інструмент у складних макроумовах.",
  },
  {
    id: "uk-real-rate",
    prompt: "Якою є реальна ставка, якщо депозит дає 14 %, а інфляція 10 %?",
    options: ["+14 %", "+4 %", "−4 %", "−24 %"],
    correctIndex: 1,
    explanation:
      "Реальна ставка = номінальна − інфляція. 14 − 10 = +4 %. Лише додатна реальна ставка зберігає купівельну спроможність.",
  },
  {
    id: "uk-nbu",
    prompt: "Хто в Україні встановлює облікову ставку?",
    options: [
      "Міністерство фінансів",
      "Національний банк України (НБУ)",
      "Кабінет міністрів",
      "Рада безпеки",
    ],
    correctIndex: 1,
    explanation:
      "Облікова ставка НБУ впливає на кредити, депозити й курс гривні. У 2022 була 25 %, поступово знижувалася.",
  },
  {
    id: "uk-fop",
    prompt: "Яка максимальна ставка єдиного податку для ФОП 3-ї групи (2026)?",
    options: ["1 %", "3 % або 5 %", "10 %", "18 %"],
    correctIndex: 1,
    explanation:
      "ФОП 3-ї групи: 3 % з ПДВ або 5 % без ПДВ від обороту. Популярний для ІТ-фахівців та малого бізнесу.",
  },
  {
    id: "uk-eu",
    prompt: "Який головний фінансовий бенефіт ЄС-інтеграції для українських споживачів?",
    options: [
      "Однакова валюта з першого дня",
      "Доступ до SEPA-переказів у євро та нижчі комісії",
      "Нульові податки",
      "Безкоштовні кредити",
    ],
    correctIndex: 1,
    explanation:
      "Підключення до SEPA (з 2025) означає дешеві й швидкі платежі в євро між Україною та країнами ЄС — рівень LT/EE.",
  },
  {
    id: "uk-scam",
    prompt: "Хтось пише, що ти виграв у лотерею, й просить сплатити «комісію» — що це?",
    options: [
      "Реальний виграш",
      "Класичний фінансовий шахрайський скам (advance-fee fraud)",
      "Податок на виграш",
      "Благодійність",
    ],
    correctIndex: 1,
    explanation:
      "Жодна справжня лотерея не просить передплатити. Особливо обережно з «Нова Пошта»-, «ПриватБанк»- та «OLX»-фішингом.",
  },
  {
    id: "uk-gdp-eur",
    prompt: "Як називається основна валюта країн ЄС, куди інтегрується Україна?",
    options: ["Долар США", "Євро (EUR)", "Швейцарський франк", "Фунт стерлінгів"],
    correctIndex: 1,
    explanation:
      "Євро — спільна валюта 20 країн єврозони. Польща, Чехія, Україна ще не в єврозоні, але використовують євро для розрахунків з ЄС.",
  },
];

const CS_QUESTIONS: QuizQuestion[] = [
  {
    id: "cs-rpsn",
    prompt: "Co je RPSN u úvěru?",
    options: [
      "Roční úroková sazba bez poplatků",
      "Roční procentní sazba nákladů — úrok + všechny poplatky",
      "Poplatek za předčasné splacení",
      "Minimální měsíční splátka",
    ],
    correctIndex: 1,
    explanation:
      "RPSN zahrnuje úrok i všechny povinné poplatky. Podle RPSN se u nás porovnávají nabídky úvěrů (ČSOB, KB, Air Bank, Fio).",
  },
  {
    id: "cs-save-pct",
    prompt: "Kolik procent měsíčního příjmu odborníci doporučují minimálně odkládat?",
    options: ["1–2 %", "5–10 %", "10–20 %", "50 %+"],
    correctIndex: 2,
    explanation:
      "Pravidlo 50/30/20: ~20 % na spoření a splátky dluhu. Kdo začíná, může 10 %.",
  },
  {
    id: "cs-diversify",
    prompt: "Co znamená diverzifikace portfolia?",
    options: [
      "Nákup co nejlevnějších akcií",
      "Rozložení investic do více aktiv a sektorů",
      "Využití pákového efektu",
      "Pravidelné vybírání zisku",
    ],
    correctIndex: 1,
    explanation:
      "Diverzifikace snižuje riziko — když padá jeden sektor, jiný může růst.",
  },
  {
    id: "cs-emergency",
    prompt: "Co je nouzová rezerva (emergency fund)?",
    options: [
      "Dlouhodobá investice do dluhopisů",
      "Půjčka od rodiny pro případ nouze",
      "Likvidní rezerva 3–6 měsíčních výdajů",
      "Povinné pojištění",
    ],
    correctIndex: 2,
    explanation:
      "Nouzová rezerva = peníze okamžitě dostupné (spořící účet) na 3–6 měsíců běžných výdajů.",
  },
  {
    id: "cs-compound",
    prompt: "Které tvrzení o složeném úročení je pravdivé?",
    options: [
      "Funguje jen u vysokých částek",
      "Úroky se počítají jen z původní jistiny",
      "Úroky se přičítají k jistině a dále se úročí",
      "Je stejné jako jednoduché úročení",
    ],
    correctIndex: 2,
    explanation:
      "Složené úročení = úroky z úroků. Čas je váš největší spojenec — proto začněte spořit brzy.",
  },
  {
    id: "cs-inflation",
    prompt: "Co je inflace?",
    options: [
      "Růst reálné hodnoty peněz",
      "Pokles cen zboží a služeb",
      "Pokles kupní síly peněz v čase",
      "Fixní úroková sazba ČNB",
    ],
    correctIndex: 2,
    explanation:
      "Inflace = za stejnou částku si zítra koupíte méně. V ČR byla v 2022–2023 dvoucifrová — úspory reálně ztrácely.",
  },
  {
    id: "cs-debit-credit",
    prompt: "Jaký je hlavní rozdíl mezi debetní a kreditní kartou?",
    options: [
      "Debetní má vždy vyšší poplatky",
      "Kreditní čerpá z vlastních peněz, debetní z úvěru",
      "Debetní čerpá z účtu, kreditní je úvěr od banky",
      "Není rozdíl, jen design",
    ],
    correctIndex: 2,
    explanation:
      "Debetní = vaše peníze na účtě. Kreditní = půjčka od banky, u nás s bezúročným obdobím typicky 45–55 dní.",
  },
  {
    id: "cs-etf",
    prompt: "Co jsou ETF fondy?",
    options: [
      "Státní dluhopisy s fixním kuponem",
      "Koše aktiv obchodované na burze (indexové fondy)",
      "Pojištění pro investory",
      "Kryptoměnové peněženky",
    ],
    correctIndex: 1,
    explanation:
      "ETF (Exchange-Traded Fund) sleduje index (S&P 500, MSCI World) — levný, diverzifikovaný, obchodovatelný jako akcie.",
  },
  {
    id: "cs-dip",
    prompt: "Co je DIP (Dlouhodobý investiční produkt, od 2024)?",
    options: [
      "Státní dluhopis",
      "Daňově zvýhodněný účet pro dlouhodobé spoření na důchod",
      "Typ hypotéky",
      "Pojištění odpovědnosti",
    ],
    correctIndex: 1,
    explanation:
      "DIP je český 3. pilíř 2.0 — vložíš, zaměstnavatel může přidat, stát dává daňovou úlevu. Výběr nejdříve v 60. roce.",
  },
  {
    id: "cs-repo",
    prompt: "Co je 2T repo sazba ČNB?",
    options: [
      "Sazba pro úvěry občanům",
      "Hlavní měnověpolitická sazba, která ovlivňuje všechny úvěry a depozita",
      "Daň z obratu",
      "Poplatek za převod peněz",
    ],
    correctIndex: 1,
    explanation:
      "2T repo je hlavní sazbou ČNB. Když ji zvedne, rostou úroky hypoték, ale i spořících účtů. V 2022 byla 7 %, postupně klesá.",
  },
  {
    id: "cs-real-rate",
    prompt: "Jaká je reálná sazba, pokud spořicí účet dává 5 %, inflace 6 %?",
    options: ["+5 %", "+1 %", "−1 %", "−11 %"],
    correctIndex: 2,
    explanation:
      "Reálná sazba = nominální − inflace. 5 − 6 = −1 %. Peníze na spořáku reálně ztrácejí, i když rostou nominálně.",
  },
  {
    id: "cs-mortgage",
    prompt: "Jak se jmenuje český program státní podpory hypoték pro mladé?",
    options: [
      "První bydlení ČMZRB",
      "Bezpieczny Kredyt",
      "OVB Young",
      "Hypotéka EU",
    ],
    correctIndex: 0,
    explanation:
      "Národní rozvojová banka (dříve ČMZRB) nabízí zvýhodněné půjčky na vlastní bydlení pro mladé do 36 let.",
  },
  {
    id: "cs-stavebko",
    prompt: "Stavební spoření v ČR nabízí…",
    options: [
      "Státní příspěvek až 1 000 Kč/rok (od 2024 snížený na 1 000 z 2 000)",
      "Nekonečnou státní podporu",
      "Záruku výnosu 10 %",
      "Bezúrokovou hypotéku",
    ],
    correctIndex: 0,
    explanation:
      "Od 2024 byl státní příspěvek u stavebního spoření snížen na max 1 000 Kč ročně. Stále je to jedna z nejlepších nízkorizikových investic.",
  },
  {
    id: "cs-tax-capital",
    prompt: "Jaká je v ČR daň ze zisků kapitálových (akcie, ETF)?",
    options: ["9 %", "15 %", "19 %", "32 %"],
    correctIndex: 1,
    explanation:
      "15 % srážková daň. Pokud držíš akcie/ETF déle než 3 roky, aplikuje se osvobození — důvod, proč v ČR často doporučujeme pasivní buy-and-hold.",
  },
  {
    id: "cs-scam",
    prompt: "Neznámý investor slibuje garantovaný výnos 20 % měsíčně — co to je?",
    options: [
      "Fantastická příležitost",
      "Pravděpodobně Ponziho schéma / podvod",
      "Normální tržní výnos",
      "Státní dluhopis",
    ],
    correctIndex: 1,
    explanation:
      "Garantované vysoké výnosy neexistují. V ČR vždy zkontroluj licenci u ČNB (seznam regulovaných firem).",
  },
  {
    id: "cs-eu-rate",
    prompt: "ECB (Evropská centrální banka) stanovuje sazby pro…",
    options: [
      "ČR přímo",
      "Eurozónu — nepřímo ovlivňuje i ČR",
      "Kryptoměny",
      "Pouze banky v Německu",
    ],
    correctIndex: 1,
    explanation:
      "ČR není v eurozóně, ale sazby ECB a ČNB se sledují navzájem. Spread mezi korunou a eurem ovlivňuje inflaci i investice.",
  },
];

const EN_QUESTIONS: QuizQuestion[] = [
  {
    id: "en-apr",
    prompt: "What does APR on a loan mean?",
    options: [
      "The nominal interest rate only",
      "Annual Percentage Rate — interest plus all mandatory fees",
      "A penalty for early repayment",
      "Minimum monthly payment",
    ],
    correctIndex: 1,
    explanation:
      "APR includes the interest plus compulsory fees and insurance — it's the true comparable cost of credit.",
  },
  {
    id: "en-save-pct",
    prompt: "Minimum percent of monthly income experts recommend saving?",
    options: ["1–2 %", "5–10 %", "10–20 %", "50 %+"],
    correctIndex: 2,
    explanation:
      "50/30/20 rule: ~20 % of income goes to savings and debt repayment. Beginners can start at 10 %.",
  },
  {
    id: "en-diversify",
    prompt: "What does portfolio diversification mean?",
    options: [
      "Buying the cheapest stocks",
      "Spreading investments across assets and sectors",
      "Using leverage",
      "Taking profits regularly",
    ],
    correctIndex: 1,
    explanation:
      "Diversification reduces risk — when one sector drops, another may rise. 'Don't put all your eggs in one basket.'",
  },
  {
    id: "en-emergency",
    prompt: "What is an emergency fund?",
    options: [
      "A long-term bond investment",
      "A loan from family for emergencies",
      "A liquid reserve covering 3–6 months of expenses",
      "Liability insurance",
    ],
    correctIndex: 2,
    explanation:
      "Emergency fund = instantly accessible money (high-yield savings) covering 3–6 months of living costs.",
  },
  {
    id: "en-compound",
    prompt: "Which statement about compound interest is true?",
    options: [
      "It only works with large sums",
      "Interest is calculated only on the original principal",
      "Interest is added to principal and earns more interest",
      "It's the same as simple interest",
    ],
    correctIndex: 2,
    explanation:
      "Compound interest = interest on interest. Time is your biggest ally — start investing early.",
  },
  {
    id: "en-inflation",
    prompt: "What is inflation?",
    options: [
      "Rising real value of money",
      "Falling prices of goods",
      "A fall in purchasing power of money over time",
      "A fixed central bank rate",
    ],
    correctIndex: 2,
    explanation:
      "Inflation = same money buys less tomorrow. Cash under a mattress loses real value — even a 2 % target rate erodes savings.",
  },
  {
    id: "en-debit-credit",
    prompt: "Main difference between debit and credit cards?",
    options: [
      "Debit always has higher fees",
      "Credit uses your money, debit is a loan",
      "Debit pulls from your account, credit is a bank loan",
      "No difference, just design",
    ],
    correctIndex: 2,
    explanation:
      "Debit = your money. Credit = a revolving loan you must repay, usually with a grace period.",
  },
  {
    id: "en-etf",
    prompt: "What are ETFs?",
    options: [
      "Fixed-coupon government bonds",
      "Baskets of assets traded on exchanges (index funds)",
      "Investor insurance",
      "Crypto wallets",
    ],
    correctIndex: 1,
    explanation:
      "ETF (Exchange-Traded Fund) tracks an index like the S&P 500 or MSCI World — cheap, diversified, trades like a stock.",
  },
  {
    id: "en-sepa",
    prompt: "What is SEPA (Single Euro Payments Area)?",
    options: [
      "An EU tax",
      "Standard for fast, cheap euro bank transfers across 36 countries",
      "Crypto network",
      "Credit bureau",
    ],
    correctIndex: 1,
    explanation:
      "SEPA lets you send euro transfers between EU/EEA countries with the same ease and cost as domestic ones — usually free.",
  },
  {
    id: "en-real-rate",
    prompt: "If a savings account pays 5 % and inflation is 6 %, what's your real rate?",
    options: ["+5 %", "+1 %", "−1 %", "−11 %"],
    correctIndex: 2,
    explanation:
      "Real rate = nominal − inflation. 5 − 6 = −1 %. You're losing purchasing power even though the nominal balance grows.",
  },
  {
    id: "en-fire",
    prompt: "What is the FIRE movement?",
    options: [
      "Financial Industry Regulatory Entity",
      "Financial Independence, Retire Early — save 25× expenses, live off 4 %",
      "Fixed-Income Retirement fund",
      "Flash Investment Rapid Exit",
    ],
    correctIndex: 1,
    explanation:
      "FIRE: save aggressively (40–70 % of income) and invest in low-cost index funds. '4 % rule' = withdraw 4 % of portfolio per year.",
  },
  {
    id: "en-ucits",
    prompt: "Why are UCITS ETFs common in the EU instead of US ETFs?",
    options: [
      "They're cheaper",
      "EU retail investors can legally buy UCITS — MiFID II restricts US ETFs without KID disclosure",
      "US ETFs are illegal",
      "UCITS pay no tax",
    ],
    correctIndex: 1,
    explanation:
      "EU investor protection (KID documents) means brokers often only offer UCITS-compliant ETFs (iShares Core, Vanguard FTSE) to retail clients.",
  },
  {
    id: "en-basel",
    prompt: "What is Basel III primarily about?",
    options: [
      "EU energy policy",
      "Global banking regulation on capital and liquidity",
      "A tax treaty",
      "A stock index",
    ],
    correctIndex: 1,
    explanation:
      "Basel III (post-2008 crisis) sets capital adequacy ratios and liquidity coverage — what keeps banks from collapsing.",
  },
  {
    id: "en-scam",
    prompt: "A 'guaranteed 20 % monthly return' offer is almost always…",
    options: [
      "A great opportunity",
      "A Ponzi scheme or scam",
      "Normal market return",
      "A government bond",
    ],
    correctIndex: 1,
    explanation:
      "Risk-free guaranteed returns beyond risk-free rate (~2–4 %) don't exist. Always check regulator: SEC/FCA/BaFin/KNF.",
  },
  {
    id: "en-pl-context",
    prompt: "What is PKO BP (relevant since this hackathon is in Poland)?",
    options: [
      "A crypto exchange",
      "Poland's largest bank — also sponsoring this category",
      "A stock index",
      "A currency",
    ],
    correctIndex: 1,
    explanation:
      "PKO Bank Polski is Poland's largest retail bank (majority state-owned). Its IKO mobile app is a pan-European benchmark.",
  },
  {
    id: "en-coal-pl",
    prompt: "How much Polish electricity still came from coal as of 2025?",
    options: ["~15 %", "~35 %", "~55 %", "~85 %"],
    correctIndex: 2,
    explanation:
      "Poland depends on coal for ~55 % of electricity. EU's Fit for 55 pushes renewables + nuclear; your power bill will reflect this transition.",
  },
  {
    id: "en-varso",
    prompt: "Varso Tower in Warsaw is the tallest building in…",
    options: ["Poland only", "Central Europe", "The EU", "The world"],
    correctIndex: 2,
    explanation:
      "Varso Tower (310 m) is the tallest building in the European Union. In Watt City it's the final tier of your progress.",
  },
];

const POOLS: Record<Lang, QuizQuestion[]> = {
  pl: PL_QUESTIONS,
  uk: UK_QUESTIONS,
  cs: CS_QUESTIONS,
  en: EN_QUESTIONS,
};

export function financeQuestionsFor(lang: Lang): QuizQuestion[] {
  return POOLS[lang];
}

export const FINANCE_QUESTIONS = PL_QUESTIONS;

export const QUESTIONS_PER_ROUND = 5;
export const XP_PER_CORRECT = 20;
