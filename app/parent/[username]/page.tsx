import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { isParentOf, readChildParentPrivacy } from "@/lib/roles";
import { getPlayerState, recentLedger } from "@/lib/player";
import { userStats } from "@/lib/leaderboard";
import { achievementStatus } from "@/lib/achievements";
import { computePlayerTier } from "@/lib/buildings";
import { avatarFor } from "@/lib/avatars";
import { RESOURCE_DEFS, RESOURCE_KEYS } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function ParentChildView({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [{ username }, session, lang] = await Promise.all([
    params,
    getSession(),
    getLang(),
  ]);
  if (!session) redirect("/login");
  if (!(await isParentOf(session.username, username))) notFound();
  const privacy = await readChildParentPrivacy(username);
  const [state, stats, achievements] = await Promise.all([
    getPlayerState(username),
    userStats(username),
    achievementStatus(username),
  ]);
  const tier = computePlayerTier(state.buildings);
  const av = avatarFor(state.profile?.avatar);
  const ledger = privacy.hideLedger ? [] : await recentLedger(username, 20);

  const copy = {
    pl: {
      resources: "Zasoby",
      achievements: "Osiągnięcia",
      ledger: "Ostatnie zmiany",
      buildings: "Budynki",
      hidden: "Ukryte przez dziecko",
    },
    uk: { resources: "Ресурси", achievements: "Досягнення", ledger: "Останні зміни", buildings: "Будівлі", hidden: "Приховано дитиною" },
    cs: { resources: "Zdroje", achievements: "Úspěchy", ledger: "Poslední změny", buildings: "Budovy", hidden: "Dítě skrylo" },
    en: { resources: "Resources", achievements: "Achievements", ledger: "Recent changes", buildings: "Buildings", hidden: "Hidden by child" },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex items-center gap-3">
        <span
          className="w-12 h-12 border-[3px] border-[var(--ink)] rounded flex items-center justify-center text-3xl"
          style={{ color: av.hue }}
        >
          {av.emoji}
        </span>
        <div>
          <h1 className="brutal-heading text-2xl">
            {state.profile?.displayName ?? username}
          </h1>
          <div className="flex gap-2 text-xs">
            <span className="chip">Tier T{tier}</span>
            <span className="chip">{stats.globalXP.toLocaleString("pl-PL")} W</span>
            <span className="chip">Score {state.creditScore}/100</span>
          </div>
        </div>
      </header>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">{copy.resources}</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {RESOURCE_KEYS.map((k) => (
            <li key={k} className="chip" style={{ borderColor: RESOURCE_DEFS[k].color }}>
              {RESOURCE_DEFS[k].icon} {state.resources[k].toLocaleString("pl-PL")}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">
          {copy.achievements} · {achievements.filter((a) => a.owned).length}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {achievements.filter((a) => a.owned).map(({ id, def }) => (
            <li key={id} className="chip text-xs">
              {def.icon} {def.labels[lang]}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">{copy.buildings}</h2>
        {privacy.hideBuildings ? (
          <p className="text-xs text-zinc-500">🔒 {copy.hidden}</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {state.buildings.map((b) => (
              <li key={b.id} className="chip text-xs">
                {b.catalogId} L{b.level}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">{copy.ledger}</h2>
        {privacy.hideLedger ? (
          <p className="text-xs text-zinc-500">🔒 {copy.hidden}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs font-mono">
            {ledger.slice(0, 12).map((e) => (
              <li key={e.id} className="flex justify-between border-b border-[var(--ink)]/20 pb-1 last:border-0">
                <span>{e.kind}: {e.reason}</span>
                <span>{new Date(e.ts).toLocaleDateString("pl-PL")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
