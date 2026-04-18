import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { listActiveListings, listingHistory } from "@/lib/marketplace";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { MarketplaceClient } from "@/components/marketplace-client";

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="brutal-heading text-3xl">{copy.heading}</h1>
        <span className="chip">Tier T{tier}</span>
      </header>
      {tier < 7 ? (
        <div className="card p-6 text-sm text-amber-300">🔒 {copy.tierGate}</div>
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
