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
  const snapshot = slotSnapshot(state).map(({ slot, building }) => {
    if (!building) return { slot, building: null };
    const c = getCatalogEntry(building.catalogId);
    return {
      slot,
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
        <h1 className="brutal-heading text-3xl">{dict.heading}</h1>
        <p className="text-sm text-zinc-400">{dict.intro}</p>
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
    </div>
  );
}
