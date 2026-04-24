import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import {
  listChildren,
  listParents,
  readChildParentPrivacy,
  getRole,
} from "@/lib/roles";
import { ParentClient } from "@/components/parent-client";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  const [role, children, parents, privacy] = await Promise.all([
    getRole(session.username),
    listChildren(session.username),
    listParents(session.username),
    readChildParentPrivacy(session.username),
  ]);

  const copy = {
    pl: {
      heading: "Rodzic i dziecko",
      generateCode: "Wygeneruj kod linkowania (dziecko)",
      linkAsParent: "Dołącz jako rodzic po kodzie",
      linked: "Połączone",
      children: "Twoje dzieci",
      parents: "Twoi rodzice",
      privacy: "Co rodzic widzi",
      hideLedger: "Ukryj historię zasobów",
      hideDuels: "Ukryj historię pojedynków",
      hideBuildings: "Ukryj miasto",
      newCode: "Twój jednorazowy kod (ważny 24h)",
      generate: "Wygeneruj",
      link: "Połącz",
      open: "Otwórz",
    },
    uk: { heading: "Батьки і діти", generateCode: "Згенерувати код (дитина)", linkAsParent: "Приєднатись як батьки", linked: "Підключено", children: "Діти", parents: "Батьки", privacy: "Що бачать батьки", hideLedger: "Приховати історію", hideDuels: "Приховати дуелі", hideBuildings: "Приховати місто", newCode: "Одноразовий код (24 год)", generate: "Згенерувати", link: "Підключити", open: "Відкрити" },
    cs: { heading: "Rodič a dítě", generateCode: "Vygenerovat kód (dítě)", linkAsParent: "Připojit jako rodič", linked: "Propojeno", children: "Děti", parents: "Rodiče", privacy: "Co rodič vidí", hideLedger: "Skrýt historii", hideDuels: "Skrýt duely", hideBuildings: "Skrýt město", newCode: "Jednorázový kód (24 h)", generate: "Vygenerovat", link: "Propojit", open: "Otevřít" },
    en: { heading: "Parent & child", generateCode: "Generate link code (kid)", linkAsParent: "Link as parent", linked: "Linked", children: "Your children", parents: "Your parents", privacy: "What parents see", hideLedger: "Hide resource history", hideDuels: "Hide duel history", hideBuildings: "Hide city map", newCode: "Your one-time code (24h)", generate: "Generate", link: "Link", open: "Open" },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <h1 className="section-heading text-3xl">{copy.heading}</h1>
      <ParentClient
        role={role}
        kids={children}
        parents={parents}
        privacy={privacy}
        copy={copy}
      />
    </div>
  );
}
