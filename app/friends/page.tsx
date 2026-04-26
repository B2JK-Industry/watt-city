import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { FriendsClient } from "@/components/friends-client";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  const copy = {
    pl: {
      friendsLabel: "Znajomi",
      inboxLabel: "Zaproszenia do ciebie",
      outgoingLabel: "Wysłane zaproszenia",
      addByUsername: "Dodaj znajomego po username",
      send: "Wyślij",
      accept: "Akceptuj",
      reject: "Odrzuć",
      remove: "Usuń",
      visit: "Odwiedź miasto",
      privacyLabel: "Prywatność profilu",
      publicOpt: "Publiczny",
      friendsOpt: "Tylko znajomi",
      privateOpt: "Prywatny",
      cashflowOpt: "Pokaż cashflow i zasoby innym",
      empty: "Jeszcze nikogo tu nie ma.",
      emptyTitle: "Zaproś pierwszego znajomego",
      emptyBody:
        "Twoja lista znajomych jest pusta. Udostępnij swój profil — Twoi koledzy zobaczą Twoje miasto i pojedynki.",
      emptyCta: "Zobacz swój profil",
    },
    uk: {
      friendsLabel: "Друзі",
      inboxLabel: "Запрошення до тебе",
      outgoingLabel: "Надіслані запрошення",
      addByUsername: "Додати друга за username",
      send: "Надіслати",
      accept: "Прийняти",
      reject: "Відхилити",
      remove: "Видалити",
      visit: "До його міста",
      privacyLabel: "Приватність профілю",
      publicOpt: "Публічний",
      friendsOpt: "Тільки друзі",
      privateOpt: "Приватний",
      cashflowOpt: "Показувати cashflow та ресурси",
      empty: "Поки що порожньо.",
      emptyTitle: "Запроси першого друга",
      emptyBody:
        "Список друзів порожній. Поділись профілем — друзі побачать твоє місто і дуелі.",
      emptyCta: "Переглянути профіль",
    },
    cs: {
      friendsLabel: "Přátelé",
      inboxLabel: "Pozvánky pro tebe",
      outgoingLabel: "Odeslané pozvánky",
      addByUsername: "Přidat přítele podle username",
      send: "Odeslat",
      accept: "Přijmout",
      reject: "Odmítnout",
      remove: "Odebrat",
      visit: "Navštívit město",
      privacyLabel: "Soukromí profilu",
      publicOpt: "Veřejný",
      friendsOpt: "Jen přátelé",
      privateOpt: "Soukromý",
      cashflowOpt: "Zobrazovat cashflow a zdroje",
      empty: "Ještě nikdo.",
      emptyTitle: "Pozvi prvního přítele",
      emptyBody:
        "Seznam přátel je prázdný. Sdílej svůj profil — přátelé uvidí tvé město a duely.",
      emptyCta: "Zobrazit profil",
    },
    en: {
      friendsLabel: "Friends",
      inboxLabel: "Incoming requests",
      outgoingLabel: "Sent requests",
      addByUsername: "Add a friend by username",
      send: "Send",
      accept: "Accept",
      reject: "Reject",
      remove: "Remove",
      visit: "Visit city",
      privacyLabel: "Profile privacy",
      publicOpt: "Public",
      friendsOpt: "Friends only",
      privateOpt: "Private",
      cashflowOpt: "Show cashflow + resources to others",
      empty: "No one here yet.",
      emptyTitle: "Invite your first friend",
      emptyBody:
        "Your friends list is empty. Share your profile — friends will see your city and duels.",
      emptyCta: "Open your profile",
    },
  }[lang];

  const heading = { pl: "Znajomi", uk: "Друзі", cs: "Přátelé", en: "Friends" }[lang];

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      <h1 className="section-heading text-3xl">{heading}</h1>
      <FriendsClient copy={copy} />
    </div>
  );
}
