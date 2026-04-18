import type { Lang } from "@/lib/i18n";

export type ScrambleWord = {
  word: string;
  hint: string;
};

const PL_WORDS: ScrambleWord[] = [
  { word: "POŻYCZKA", hint: "Krótkoterminowa pożyczka pieniężna." },
  { word: "KREDYT", hint: "Długoterminowy bankowy instrument finansowy." },
  { word: "INFLACJA", hint: "Wzrost cen i spadek wartości pieniądza." },
  { word: "INWESTYCJA", hint: "Wpłata kapitału w celu osiągnięcia zysku." },
  { word: "OSZCZĘDNOŚĆ", hint: "To, co odłożysz na bok." },
  { word: "AKCJA", hint: "Udział we własności firmy notowanej na giełdzie." },
  { word: "OBLIGACJA", hint: "Papier dłużny z wypłatą odsetek." },
  { word: "BUDŻET", hint: "Plan przychodów i wydatków." },
  { word: "LOKATA", hint: "Wkład terminowy w banku." },
  { word: "WALUTA", hint: "Jednostka pieniężna państwa." },
  { word: "ZYSK", hint: "Różnica, gdy przychód przewyższa koszty." },
  { word: "STRATA", hint: "Przeciwieństwo zysku." },
  { word: "KURS", hint: "Stosunek wymiany między dwiema walutami." },
  { word: "BANKOMAT", hint: "Urządzenie do wypłaty gotówki." },
  { word: "OPROCENTOWANIE", hint: "Wysokość odsetek wyrażona w procentach." },
  { word: "DYWIDENDA", hint: "Część zysku spółki dla akcjonariuszy." },
  { word: "HIPOTEKA", hint: "Kredyt zabezpieczony nieruchomością." },
  { word: "PODATEK", hint: "Obowiązkowa danina na rzecz państwa." },
  { word: "EMERYTURA", hint: "Świadczenie pieniężne po zakończeniu pracy." },
  { word: "PORTFEL", hint: "Zbiór wszystkich twoich inwestycji." },
];

const UK_WORDS: ScrambleWord[] = [
  { word: "КРЕДИТ", hint: "Банківська позика на довгий термін." },
  { word: "ПОЗИКА", hint: "Короткостроковий фінансовий продукт." },
  { word: "ІНФЛЯЦІЯ", hint: "Зростання цін і знецінення грошей." },
  { word: "ІНВЕСТИЦІЯ", hint: "Вкладення грошей з метою прибутку." },
  { word: "ЗАОЩАДЖЕННЯ", hint: "Те, що ти відкладаєш на майбутнє." },
  { word: "АКЦІЯ", hint: "Частка у власності компанії." },
  { word: "ОБЛІГАЦІЯ", hint: "Борговий цінний папір з купоном." },
  { word: "БЮДЖЕТ", hint: "План доходів і витрат." },
  { word: "ДЕПОЗИТ", hint: "Строковий вклад у банку." },
  { word: "ВАЛЮТА", hint: "Грошова одиниця країни." },
  { word: "ПРИБУТОК", hint: "Коли доходи перевищують витрати." },
  { word: "ЗБИТОК", hint: "Коли витрати більші за доходи." },
  { word: "КУРС", hint: "Співвідношення між двома валютами." },
  { word: "БАНКОМАТ", hint: "Пристрій для зняття готівки." },
  { word: "ВІДСОТОК", hint: "Плата за користування грошима." },
  { word: "ДИВІДЕНД", hint: "Частка прибутку компанії акціонеру." },
  { word: "ІПОТЕКА", hint: "Довгостроковий кредит під нерухомість." },
  { word: "ПОДАТОК", hint: "Обов'язкова плата державі." },
  { word: "ПЕНСІЯ", hint: "Грошове забезпечення у старості." },
  { word: "ПОРТФЕЛЬ", hint: "Набір твоїх інвестицій." },
];

const CS_WORDS: ScrambleWord[] = [
  { word: "PŮJČKA", hint: "Krátkodobý úvěr od banky nebo instituce." },
  { word: "ÚVĚR", hint: "Dlouhodobý bankovní dluh." },
  { word: "INFLACE", hint: "Růst cen a pokles hodnoty peněz." },
  { word: "INVESTICE", hint: "Vložení kapitálu s očekávaným výnosem." },
  { word: "ÚSPORA", hint: "To, co odložíš stranou." },
  { word: "AKCIE", hint: "Podíl na vlastnictví firmy." },
  { word: "DLUHOPIS", hint: "Dluhový cenný papír s kuponem." },
  { word: "ROZPOČET", hint: "Plán příjmů a výdajů." },
  { word: "DEPOZIT", hint: "Termínovaný vklad v bance." },
  { word: "MĚNA", hint: "Peněžní jednotka státu." },
  { word: "ZISK", hint: "Kladný rozdíl mezi výnosy a náklady." },
  { word: "ZTRÁTA", hint: "Opak zisku." },
  { word: "KURZ", hint: "Směnný poměr dvou měn." },
  { word: "BANKOMAT", hint: "Stroj pro výběr hotovosti." },
  { word: "ÚROK", hint: "Cena za půjčení peněz." },
  { word: "DIVIDENDA", hint: "Podíl na zisku pro akcionáře." },
  { word: "HYPOTÉKA", hint: "Úvěr zajištěný nemovitostí." },
  { word: "DAŇ", hint: "Povinná platba státu." },
  { word: "DŮCHOD", hint: "Peněžní dávka po ukončení práce." },
  { word: "PORTFOLIO", hint: "Soubor všech tvých investic." },
];

const EN_WORDS: ScrambleWord[] = [
  { word: "LOAN", hint: "Money borrowed to be repaid with interest." },
  { word: "CREDIT", hint: "Long-term borrowing facility." },
  { word: "INFLATION", hint: "Rising prices and falling money value." },
  { word: "INVESTMENT", hint: "Putting money to work for potential returns." },
  { word: "SAVINGS", hint: "Money put aside for the future." },
  { word: "STOCK", hint: "Ownership share in a company." },
  { word: "BOND", hint: "Debt security paying interest." },
  { word: "BUDGET", hint: "Plan of income and expenses." },
  { word: "DEPOSIT", hint: "Money placed in a bank account." },
  { word: "CURRENCY", hint: "Monetary unit of a country." },
  { word: "PROFIT", hint: "When income exceeds costs." },
  { word: "LOSS", hint: "Opposite of profit." },
  { word: "RATE", hint: "Exchange ratio between two currencies." },
  { word: "ATM", hint: "Machine to withdraw cash." },
  { word: "INTEREST", hint: "Cost of borrowing or reward for saving." },
  { word: "DIVIDEND", hint: "Company profit paid to shareholders." },
  { word: "MORTGAGE", hint: "Long-term loan secured on property." },
  { word: "TAX", hint: "Compulsory contribution to the state." },
  { word: "PENSION", hint: "Regular income after retirement." },
  { word: "PORTFOLIO", hint: "Collection of your investments." },
];

const POOLS: Record<Lang, ScrambleWord[]> = {
  pl: PL_WORDS,
  uk: UK_WORDS,
  cs: CS_WORDS,
  en: EN_WORDS,
};

export function scrambleWordsFor(lang: Lang): ScrambleWord[] {
  return POOLS[lang];
}

export const SCRAMBLE_WORDS = PL_WORDS;
export const WORDS_PER_ROUND = 8;
export const XP_PER_WORD = 15;
