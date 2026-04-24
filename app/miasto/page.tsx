import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import {
  catalogForPlayer,
  slotSnapshot,
  computePlayerTier,
  yieldAtLevel,
  ensureSignupGift,
} from "@/lib/buildings";
import { tickPlayer } from "@/lib/tick";
import { getCatalogEntry } from "@/lib/building-catalog";
import { WattCityClient } from "@/components/watt-city/watt-city-client";
import { getLang } from "@/lib/i18n-server";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// i18n pack for the Watt City page. Small enough to live inline rather than
// push into the main dict file. TODO(phase 2): promote into lib/locales
// alongside the rest of the site copy.
const DICT: Record<Lang, {
  pickSlot: string;
  buildHere: string;
  upgrade: string;
  demolish: string;
  level: string;
  category: string;
  yields: string;
  cost: string;
  tier: string;
  creditScore: string;
  mortgageTitle: string;
  mortgageBody: string;
  mortgageMax: string;
  mortgageMonthly: string;
  mortgageTotalInterest: string;
  mortgageTake: string;
  mortgageOpen: string;
  loansTitle: string;
  noLoans: string;
  lockedComing: string;
  emptySlot: string;
  locked: string;
  rrsoLabel: string;
  termMonths: string;
  principal: string;
  comingSoon: string;
  disclaimer: string;
  heading: string;
  intro: string;
  /** Upgrade-panel prefix — "Następny poziom" / "Next level". */
  nextLevelLabel: string;
  /** Error banner on insufficient resources. Includes `{missing}` placeholder
   *  replaced client-side with the formatted resource bundle. */
  insufficientResources: string;
  /** Confirm dialog shown before the demolish mutation. Must not hardcode a
   *  language — previously this was a plain `confirm("Zburzyć...")` which
   *  leaked PL into UK/CS/EN sessions. */
  demolishConfirm: string;
  /** Chip/tooltip when a building is at L10 and further upgrades are
   *  blocked by the max-level cap. */
  atMaxLevel: string;
  /** Error banner fallback when the server returns an error code the client
   *  doesn't have a translation for. Parametrised with `{code}`. */
  errorUnknown: string;
  /** Error banner when rate-limited on mutation routes. */
  errorRateLimited: string;
  /** Error banner when a concurrent score submission holds the building lock. */
  errorScoreInProgress: string;
}> = {
  pl: {
    pickSlot: "Wybierz slot",
    buildHere: "Buduj",
    upgrade: "Ulepsz",
    demolish: "Zburz",
    level: "Poziom",
    category: "Kategoria",
    yields: "Dochód",
    cost: "Koszt",
    tier: "Tier",
    creditScore: "Scoring",
    mortgageTitle: "Kredyt hipoteczny",
    mortgageBody:
      "Pożyczasz teraz, spłacasz co miesiąc z cashflow. To GRA — uczysz się RRSO bez ryzyka.",
    mortgageMax: "Maks. kapitał",
    mortgageMonthly: "Rata miesięczna",
    mortgageTotalInterest: "Łączne odsetki",
    mortgageTake: "Weź kredyt",
    mortgageOpen: "Kalkulator",
    loansTitle: "Aktywne kredyty",
    noLoans: "Brak aktywnych kredytów.",
    lockedComing: "Wkrótce — faza 2",
    emptySlot: "Pusty slot",
    locked: "Zablokowane",
    rrsoLabel: "RRSO",
    termMonths: "mies.",
    principal: "Kapitał",
    comingSoon: "Wkrótce",
    disclaimer:
      "GRA EDUKACYJNA — to nie są prawdziwe pieniądze.",
    heading: "Watt City",
    intro: "Twoje miasto. Graj → zarabiaj → buduj → spłacaj.",
    nextLevelLabel: "Następny poziom",
    insufficientResources: "Brakuje: {missing}. Zagraj w kilka gier, żeby dobrać surowce.",
    demolishConfirm: "Zburzyć budynek? Otrzymasz 50% kosztów w zwrocie.",
    atMaxLevel: "Maksymalny poziom (L10) — nie można ulepszać dalej.",
    errorUnknown: "Coś nam uciekło (kod: {code}). Spróbuj jeszcze raz.",
    errorRateLimited: "Za szybko — daj chwilę i spróbuj ponownie.",
    errorScoreInProgress: "Trwa zapisywanie wyniku. Spróbuj ponownie za sekundę.",
  },
  uk: {
    pickSlot: "Вибери слот",
    buildHere: "Збудувати",
    upgrade: "Покращити",
    demolish: "Знести",
    level: "Рівень",
    category: "Категорія",
    yields: "Дохід",
    cost: "Вартість",
    tier: "Рівень",
    creditScore: "Скоринг",
    mortgageTitle: "Іпотечний кредит",
    mortgageBody:
      "Позичаєш зараз, платиш щомісяця з cashflow. Це гра — вчишся RRSO без ризику.",
    mortgageMax: "Макс. капітал",
    mortgageMonthly: "Щомісячний платіж",
    mortgageTotalInterest: "Загальні відсотки",
    mortgageTake: "Взяти кредит",
    mortgageOpen: "Калькулятор",
    loansTitle: "Активні кредити",
    noLoans: "Немає активних кредитів.",
    lockedComing: "Скоро — фаза 2",
    emptySlot: "Порожній слот",
    locked: "Заблоковано",
    rrsoLabel: "RRSO",
    termMonths: "міс.",
    principal: "Капітал",
    comingSoon: "Скоро",
    disclaimer: "Навчальна гра — це не справжні гроші.",
    heading: "Watt City",
    intro: "Твоє місто. Грай → заробляй → будуй → виплачуй.",
    nextLevelLabel: "Наступний рівень",
    insufficientResources: "Не вистачає: {missing}. Зіграй у кілька ігор, щоб зібрати ресурси.",
    demolishConfirm: "Знести будівлю? Отримаєш 50% вартості назад.",
    atMaxLevel: "Максимальний рівень (L10) — покращити далі неможливо.",
    errorUnknown: "Щось пішло не так (код: {code}). Спробуй ще раз.",
    errorRateLimited: "Занадто швидко — зачекай і спробуй знову.",
    errorScoreInProgress: "Зберігаємо результат гри. Спробуй ще раз за секунду.",
  },
  cs: {
    pickSlot: "Vyber slot",
    buildHere: "Postavit",
    upgrade: "Vylepšit",
    demolish: "Zbořit",
    level: "Úroveň",
    category: "Kategorie",
    yields: "Příjem",
    cost: "Cena",
    tier: "Tier",
    creditScore: "Skóre",
    mortgageTitle: "Hypotéka",
    mortgageBody:
      "Půjčíš si teď, splácíš měsíčně z cashflow. Je to hra — učíš se RRSO bez rizika.",
    mortgageMax: "Max. jistina",
    mortgageMonthly: "Měsíční splátka",
    mortgageTotalInterest: "Celkové úroky",
    mortgageTake: "Vzít úvěr",
    mortgageOpen: "Kalkulačka",
    loansTitle: "Aktivní úvěry",
    noLoans: "Žádné aktivní úvěry.",
    lockedComing: "Brzy — fáze 2",
    emptySlot: "Prázdný slot",
    locked: "Zamčeno",
    rrsoLabel: "RRSO",
    termMonths: "měs.",
    principal: "Jistina",
    comingSoon: "Brzy",
    disclaimer: "Vzdělávací hra — nejsou to skutečné peníze.",
    heading: "Watt City",
    intro: "Tvé město. Hraj → vyděláš → stavíš → splácíš.",
    nextLevelLabel: "Další úroveň",
    insufficientResources: "Chybí: {missing}. Zahraj si pár her, abys doplnil suroviny.",
    demolishConfirm: "Zbourat budovu? Dostaneš zpět 50 % nákladů.",
    atMaxLevel: "Maximální úroveň (L10) — dál už vylepšit nelze.",
    errorUnknown: "Něco se pokazilo (kód: {code}). Zkus to znovu.",
    errorRateLimited: "Příliš rychle — počkej chvíli a zkus to znovu.",
    errorScoreInProgress: "Ukládáme výsledek hry. Zkus to znovu za sekundu.",
  },
  en: {
    pickSlot: "Pick a slot",
    buildHere: "Build",
    upgrade: "Upgrade",
    demolish: "Demolish",
    level: "Level",
    category: "Category",
    yields: "Yields",
    cost: "Cost",
    tier: "Tier",
    creditScore: "Credit score",
    mortgageTitle: "Mortgage",
    mortgageBody:
      "Borrow now, pay monthly from cashflow. It's a game — learn APR/RRSO without real risk.",
    mortgageMax: "Max principal",
    mortgageMonthly: "Monthly payment",
    mortgageTotalInterest: "Total interest",
    mortgageTake: "Take loan",
    mortgageOpen: "Calculator",
    loansTitle: "Active loans",
    noLoans: "No active loans.",
    lockedComing: "Coming soon — phase 2",
    emptySlot: "Empty slot",
    locked: "Locked",
    rrsoLabel: "RRSO",
    termMonths: "mo",
    principal: "Principal",
    comingSoon: "Coming soon",
    disclaimer:
      "EDUCATIONAL GAME — these are not real money.",
    heading: "Watt City",
    intro: "Your city. Play → earn → build → repay.",
    nextLevelLabel: "Next level",
    insufficientResources: "You're short: {missing}. Play a few games to top up.",
    demolishConfirm: "Demolish this building? You'll get 50% of the cost back.",
    atMaxLevel: "Max level (L10) — no further upgrades available.",
    errorUnknown: "Something slipped (code: {code}). Please try again.",
    errorRateLimited: "Too fast — pause for a moment and retry.",
    errorScoreInProgress: "Saving your game result. Try again in a second.",
  },
};

export default async function MiastoPage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  // Idempotent: both are safe to call on every render.
  await tickPlayer(session.username);
  const primed = await getPlayerState(session.username);
  await ensureSignupGift(primed);

  const state = await getPlayerState(session.username);
  const [catalog] = await Promise.all([catalogForPlayer(state)]);
  const snapshot = slotSnapshot(state).map(({ slot, building, upgrade }) => {
    if (!building) return { slot, building: null, upgrade: null };
    const c = getCatalogEntry(building.catalogId);
    return {
      slot,
      // `upgrade` carries nextLevelCost / nextLevelYield / affordability /
      // missing — computed server-side by slotSnapshot so the client never
      // needs to duplicate the × 1.6 / × 1.4 formula.
      upgrade,
      building: {
        ...building,
        currentYield: c ? yieldAtLevel(c.baseYieldPerHour, building.level) : {},
        labels: c?.labels ?? null,
        glyph: c?.glyph ?? null,
        roofColor: c?.roofColor ?? null,
        bodyColor: c?.bodyColor ?? null,
      },
    };
  });
  const tier = computePlayerTier(state.buildings);
  const dict = DICT[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-1">
        <h1 className="section-heading text-3xl">{dict.heading}</h1>
        <p className="text-sm text-[var(--ink-muted)]">{dict.intro}</p>
      </header>
      <WattCityClient
        bootstrap={{
          resources: state.resources,
          tier,
          creditScore: state.creditScore,
          catalog,
          slots: snapshot,
          loans: state.loans,
          lang,
          dict,
        }}
      />
      <ComingSoonSection lang={lang} />
    </div>
  );
}

// Phase 1.6 — static coming-soon roadmap surface. Teaches players what's on
// the horizon without any live logic. Each tile one line; all four langs.
const COMING_SOON_TILES: Array<{
  emoji: string;
  key: "leasing" | "obrotowy" | "konsumencki" | "inwestycyjny" | "parent" | "class" | "trade" | "pko";
  labels: Record<Lang, string>;
  teasers: Record<Lang, string>;
}> = [
  {
    emoji: "🚚",
    key: "leasing",
    labels: { pl: "Leasing", uk: "Лізинг", cs: "Leasing", en: "Leasing" },
    teasers: {
      pl: "Wynajmij wyższy budynek na 6 miesięcy, potem zostaw lub zwróć.",
      uk: "Орендуй вищу будівлю на 6 міс., потім залиш або поверни.",
      cs: "Pronajmi si vyšší budovu na 6 měsíců, pak nech nebo vrať.",
      en: "Rent a higher-tier building for 6 months, then keep or return.",
    },
  },
  {
    emoji: "💳",
    key: "obrotowy",
    labels: { pl: "Kredyt obrotowy", uk: "Обіговий кредит", cs: "Revolvingový úvěr", en: "Revolving credit" },
    teasers: {
      pl: "Krótkoterminowa pożyczka pod przyszłe wyniki — 7 dni na spłatę.",
      uk: "Короткострокова позика під майбутні результати — 7 днів на виплату.",
      cs: "Krátkodobá půjčka proti budoucím skóre — 7 dní na splacení.",
      en: "Short-term loan against pending scores — 7 days to repay.",
    },
  },
  {
    emoji: "⚠️",
    key: "konsumencki",
    labels: {
      pl: "Kredyt konsumencki",
      uk: "Споживчий кредит",
      cs: "Spotřebitelský úvěr",
      en: "Consumer credit",
    },
    teasers: {
      pl: "Szybka gotówka, RRSO 20% — lekcja ostrzegawcza.",
      uk: "Швидкі гроші, RRSO 20% — навчання застереженню.",
      cs: "Rychlá hotovost, RRSO 20% — varovná lekce.",
      en: "Instant cash, 20% RRSO — cautionary tale.",
    },
  },
  {
    emoji: "📈",
    key: "inwestycyjny",
    labels: {
      pl: "Kredyt inwestycyjny",
      uk: "Інвест. кредит",
      cs: "Investiční úvěr",
      en: "Investment loan",
    },
    teasers: {
      pl: "Pożycz, by odkupić budynek innego gracza. Tier 7+.",
      uk: "Позич, щоб купити будівлю іншого гравця. Tier 7+.",
      cs: "Půjč si na koupi budovy jiného hráče. Tier 7+.",
      en: "Borrow to buy another player's building. Tier 7+.",
    },
  },
  {
    emoji: "👨‍👩‍👧",
    key: "parent",
    labels: {
      pl: "Panel rodzica",
      uk: "Панель батьків",
      cs: "Panel rodiče",
      en: "Parent dashboard",
    },
    teasers: {
      pl: "Rodzic widzi postępy dziecka i koncepcje, których się uczy.",
      uk: "Батьки бачать прогрес дитини та вивчені концепти.",
      cs: "Rodič vidí pokrok dítěte a koncepty, které se učí.",
      en: "Parents see their kid's progress and learned concepts.",
    },
  },
  {
    emoji: "🏫",
    key: "class",
    labels: {
      pl: "Tryb klasy",
      uk: "Режим класу",
      cs: "Režim třídy",
      en: "Class mode",
    },
    teasers: {
      pl: "Nauczyciel zakłada klasę, rozsyła 30 kodów dostępu.",
      uk: "Вчитель створює клас, роздає 30 кодів доступу.",
      cs: "Učitel založí třídu, rozešle 30 přístupových kódů.",
      en: "Teacher creates a class, distributes 30 join codes.",
    },
  },
  {
    emoji: "🤝",
    key: "trade",
    labels: {
      pl: "Handel między graczami",
      uk: "Торгівля між гравцями",
      cs: "Obchod mezi hráči",
      en: "Player-to-player trade",
    },
    teasers: {
      pl: "Odsprzedaj budynek innemu graczowi. Wymaga T7.",
      uk: "Продай будівлю іншому гравцеві. Потрібен T7.",
      cs: "Prodej budovu jinému hráči. Vyžaduje T7.",
      en: "Sell a building to another player. Requires T7.",
    },
  },
  {
    emoji: "🏦",
    key: "pko",
    labels: {
      pl: "Mirror do PKO Junior",
      uk: "Mirror у PKO Junior",
      cs: "Mirror do PKO Junior",
      en: "Mirror to PKO Junior",
    },
    teasers: {
      pl: "Przenieś zaoszczędzone w grze kwoty na realne konto PKO Junior.",
      uk: "Переведи заощаджені в грі суми на реальний рахунок PKO Junior.",
      cs: "Přenes naspořené částky do reálného účtu PKO Junior.",
      en: "Mirror your in-game savings onto a real PKO Junior account.",
    },
  },
];

function ComingSoonSection({ lang }: { lang: Lang }) {
  const heading = {
    pl: "Wkrótce — faza 2 i dalej",
    uk: "Скоро — фаза 2 і далі",
    cs: "Brzy — fáze 2 a dál",
    en: "Coming soon — phase 2 and beyond",
  }[lang];
  return (
    <section className="card p-4 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
        {COMING_SOON_TILES.map((t) => (
          <li
            key={t.key}
            className="border border-[var(--line)] bg-[var(--surface)]/40 rounded p-3 flex flex-col gap-1 opacity-70"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {t.emoji}
              </span>
              <strong className="text-xs">
                {t.labels[lang]}
              </strong>
              <span className="ml-auto text-[10px]">🔒</span>
            </div>
            <p className="text-xs leading-snug text-[var(--ink-muted)]">
              {t.teasers[lang]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
