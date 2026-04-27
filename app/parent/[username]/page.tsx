import Link from "next/link";
import { redirect } from "next/navigation";
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
  // G-26 — explicit 403 explainer instead of generic notFound(). The
  // page renders to authenticated parents only; a wrong username or
  // a yet-unlinked relationship deserves a clear "request invite"
  // pointer, not a confusing "page doesn't exist".
  if (!(await isParentOf(session.username, username))) {
    const t = {
      pl: {
        title: "Brak dostępu do tego profilu",
        body: "Nie jesteś powiązany z tym kontem dziecka. Jeśli chcesz uzyskać dostęp, poproś o zaproszenie z poziomu sekcji Rodzic.",
        cta: "Panel rodzica",
      },
      uk: {
        title: "Немає доступу до цього профілю",
        body: "Ти не пов'язаний з цим дитячим акаунтом. Запроси доступ через панель Батьки.",
        cta: "Панель батьків",
      },
      cs: {
        title: "Nemáš přístup k tomuto profilu",
        body: "Nejsi propojen s tímto dětským účtem. Požádej o pozvánku v sekci Rodič.",
        cta: "Panel rodiče",
      },
      en: {
        title: "No access to this profile",
        body: "You're not linked to this child account. Request an invite from the Parent dashboard.",
        cta: "Parent dashboard",
      },
    }[lang];
    return (
      <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center animate-slide-up">
        <span aria-hidden className="text-5xl">
          🚫
        </span>
        <h1 className="t-h2 text-[var(--accent)]">{t.title}</h1>
        <p className="text-[var(--ink-muted)] max-w-md">{t.body}</p>
        <Link href="/rodzic" className="btn btn-primary">
          {t.cta}
        </Link>
      </main>
    );
  }
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
          className="w-12 h-12 border border-[var(--line)] rounded flex items-center justify-center text-3xl"
          style={{ color: av.hue }}
        >
          {av.emoji}
        </span>
        <div>
          <h1 className="section-heading text-2xl">
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
        <h2 className="text-sm font-semibold">{copy.resources}</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {RESOURCE_KEYS.map((k) => (
            <li key={k} className="chip" style={{ borderColor: RESOURCE_DEFS[k].lightColor }}>
              {RESOURCE_DEFS[k].icon} {state.resources[k].toLocaleString("pl-PL")}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
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
        <h2 className="text-sm font-semibold">{copy.buildings}</h2>
        {privacy.hideBuildings ? (
          <p className="text-xs text-[var(--ink-muted)]">🔒 {copy.hidden}</p>
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
        <h2 className="text-sm font-semibold">{copy.ledger}</h2>
        {privacy.hideLedger ? (
          <p className="text-xs text-[var(--ink-muted)]">🔒 {copy.hidden}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs font-mono">
            {ledger.slice(0, 12).map((e) => (
              <li key={e.id} className="flex justify-between border-b border-[var(--line)] pb-1 last:border-0">
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
