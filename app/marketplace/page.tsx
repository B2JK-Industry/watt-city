import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { listActiveListings, listingHistory } from "@/lib/marketplace";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { MarketplaceClient } from "@/components/marketplace-client";

export const dynamic = "force-dynamic";

const UNLOCK_TIER = 7;

export default async function MarketplacePage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  const [listings, history, state] = await Promise.all([
    listActiveListings(),
    listingHistory(session.username, 50),
    getPlayerState(session.username),
  ]);
  const tier = computePlayerTier(state.buildings);

  const copy = {
    pl: {
      heading: "Giełda miejska",
      tierGate: "Giełda aktywna od Tier 7 (odblokujesz budując Stację kolejową).",
      lockedTitle: "Giełda otworzy się przy Tier 7",
      lockedBody:
        "Tu kupujesz i sprzedajesz budynki z innymi graczami. Najpierw rozbuduj swoje miasto — graj minigry, zbieraj zasoby, stawiaj kolejne budynki.",
      progressLabel: "Twój postęp",
      tierProgress: "Tier {now} z {target}",
      whatNow: "Co możesz zrobić teraz",
      ctaPlay: "Zagraj minigrę",
      ctaCity: "Zobacz swoje miasto",
      yourBuildings: "Twoje budynki",
      listFor: "Wystaw na sprzedaż",
      listings: "Aktywne oferty",
      askLabel: "Cena (W$)",
      listNow: "Wystaw",
      buyNow: "Kup teraz",
      cancel: "Anuluj ofertę",
      historyLabel: "Historia transakcji",
      ownListing: "(twoja oferta)",
      sellerLabel: "Sprzedawca",
      empty: "Brak ofert na rynku.",
    },
    uk: {
      heading: "Міська біржа",
      tierGate: "Біржа активна з Tier 7.",
      lockedTitle: "Біржа відкриється на Tier 7",
      lockedBody:
        "Тут купуєш і продаєш будівлі з іншими гравцями. Спершу розбудуй своє місто — грай міні-ігри, збирай ресурси, став будівлі.",
      progressLabel: "Твій прогрес",
      tierProgress: "Tier {now} з {target}",
      whatNow: "Що зробити зараз",
      ctaPlay: "Зіграти міні-гру",
      ctaCity: "Поглянути на місто",
      yourBuildings: "Твої будівлі",
      listFor: "Виставити на продаж",
      listings: "Активні лоти",
      askLabel: "Ціна (W$)",
      listNow: "Виставити",
      buyNow: "Купити",
      cancel: "Скасувати",
      historyLabel: "Історія угод",
      ownListing: "(твій лот)",
      sellerLabel: "Продавець",
      empty: "Порожньо.",
    },
    cs: {
      heading: "Městská burza",
      tierGate: "Burza od Tier 7.",
      lockedTitle: "Burza se otevře v Tier 7",
      lockedBody:
        "Tady kupuješ a prodáváš budovy s jinými hráči. Nejdřív rozšiř své město — hraj minihry, sbírej zdroje, stav budovy.",
      progressLabel: "Tvůj pokrok",
      tierProgress: "Tier {now} z {target}",
      whatNow: "Co teď můžeš udělat",
      ctaPlay: "Zahrát minihru",
      ctaCity: "Podívat se na město",
      yourBuildings: "Tvé budovy",
      listFor: "Vystavit k prodeji",
      listings: "Aktivní nabídky",
      askLabel: "Cena (W$)",
      listNow: "Vystavit",
      buyNow: "Koupit",
      cancel: "Zrušit",
      historyLabel: "Historie",
      ownListing: "(tvá nabídka)",
      sellerLabel: "Prodejce",
      empty: "Žádné nabídky.",
    },
    en: {
      heading: "City Marketplace",
      tierGate: "Marketplace unlocks at Tier 7.",
      lockedTitle: "Marketplace opens at Tier 7",
      lockedBody:
        "Here you buy and sell buildings with other players. First grow your city — play mini-games, earn resources, place more buildings.",
      progressLabel: "Your progress",
      tierProgress: "Tier {now} of {target}",
      whatNow: "What to do now",
      ctaPlay: "Play a mini-game",
      ctaCity: "Open your city",
      yourBuildings: "Your buildings",
      listFor: "List for sale",
      listings: "Active offers",
      askLabel: "Ask price (W$)",
      listNow: "List",
      buyNow: "Buy now",
      cancel: "Cancel",
      historyLabel: "Trade history",
      ownListing: "(your listing)",
      sellerLabel: "Seller",
      empty: "No offers yet.",
    },
  }[lang];

  const isLocked = tier < UNLOCK_TIER;
  const progressPct = Math.min(100, Math.round((tier / UNLOCK_TIER) * 100));

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="section-heading text-3xl">{copy.heading}</h1>
        <span className="chip">Tier T{tier}</span>
      </header>
      {isLocked ? (
        <section
          className="card card--elevated p-6 sm:p-8 flex flex-col gap-5"
          aria-label={copy.lockedTitle}
        >
          <div className="flex flex-col gap-2">
            <span className="t-overline text-[var(--ink-muted)]">
              🔒 {copy.progressLabel}
            </span>
            <h2 className="t-h3 text-[var(--accent)]">{copy.lockedTitle}</h2>
            <p className="t-body text-[var(--foreground)] max-w-2xl">
              {copy.lockedBody}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-[var(--ink-muted)]">
              <span>
                {copy.tierProgress
                  .replace("{now}", String(tier))
                  .replace("{target}", String(UNLOCK_TIER))}
              </span>
              <span className="tabular-nums font-semibold">{progressPct}%</span>
            </div>
            <div
              className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--accent)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="t-overline text-[var(--ink-muted)]">
              {copy.whatNow}
            </span>
            <div className="flex flex-wrap gap-3">
              <Link href="/games" className="btn btn-sales">
                {copy.ctaPlay}
              </Link>
              <Link href="/miasto" className="btn btn-secondary">
                {copy.ctaCity}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <MarketplaceClient
          username={session.username}
          tier={tier}
          ownBuildings={state.buildings}
          resources={state.resources}
          initialListings={listings}
          initialHistory={history as Array<Record<string, unknown>>}
          copy={copy}
        />
      )}
    </div>
  );
}
