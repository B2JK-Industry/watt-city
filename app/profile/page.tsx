import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { achievementStatus, sweepAchievements } from "@/lib/achievements";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { userStats } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  await sweepAchievements(session.username);
  const [status, state, stats] = await Promise.all([
    achievementStatus(session.username),
    getPlayerState(session.username),
    userStats(session.username),
  ]);
  const tier = computePlayerTier(state.buildings);
  const shareUrl = `/profile/${encodeURIComponent(session.username)}`;

  const heading = {
    pl: "Profil",
    uk: "Профіль",
    cs: "Profil",
    en: "Profile",
  }[lang];
  const achLabel = {
    pl: "Osiągnięcia",
    uk: "Досягнення",
    cs: "Úspěchy",
    en: "Achievements",
  }[lang];
  const lockedLabel = {
    pl: "Zablokowane",
    uk: "Заблоковано",
    cs: "Zamčeno",
    en: "Locked",
  }[lang];
  const shareLabel = {
    pl: "Profil publiczny",
    uk: "Публічний профіль",
    cs: "Veřejný profil",
    en: "Public profile",
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="brutal-heading text-3xl">{heading}</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="chip">
            <strong>{session.username}</strong>
          </span>
          <span className="chip">
            Tier <strong>T{tier}</strong>
          </span>
          <span className="chip">
            {stats.globalXP.toLocaleString("pl-PL")} W ·{" "}
            {stats.globalRank !== null ? `#${stats.globalRank}` : "–"}
          </span>
          <a
            href={shareUrl}
            className="chip hover:text-[var(--accent)] underline"
          >
            {shareLabel}
          </a>
        </div>
      </header>
      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-black uppercase">{achLabel}</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {status.map(({ id, owned, def }) => (
            <li
              key={id}
              className={
                "border-2 border-[var(--ink)]/40 rounded p-3 flex flex-col items-center gap-1 text-center " +
                (owned ? "" : "opacity-50")
              }
            >
              <span className="text-3xl" aria-hidden>
                {owned ? def.icon : "🔒"}
              </span>
              <strong className="text-xs uppercase tracking-wider">
                {def.labels[lang]}
              </strong>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {owned ? def.descriptions[lang] : lockedLabel}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
