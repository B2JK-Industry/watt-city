import { notFound } from "next/navigation";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { achievementStatus } from "@/lib/achievements";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { userStats } from "@/lib/leaderboard";
import { kvGet } from "@/lib/redis";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  // Minimal existence check: auth-record key present.
  const userRec = await kvGet(`xp:user:${username}`);
  if (!userRec) notFound();
  const lang = await getLang();

  const [status, state, stats] = await Promise.all([
    achievementStatus(username),
    getPlayerState(username),
    userStats(username),
  ]);
  const tier = computePlayerTier(state.buildings);
  const owned = status.filter((s) => s.owned);

  const heading = {
    pl: "Profil publiczny",
    uk: "Публічний профіль",
    cs: "Veřejný profil",
    en: "Public profile",
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="section-heading text-3xl">{heading}</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="chip">
            <strong>{username}</strong>
          </span>
          <span className="chip">Tier <strong>T{tier}</strong></span>
          <span className="chip">
            {stats.globalXP.toLocaleString("pl-PL")} W
            {stats.globalRank !== null ? ` · #${stats.globalRank}` : ""}
          </span>
        </div>
      </header>
      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {{
            pl: "Odznaki",
            uk: "Значки",
            cs: "Odznaky",
            en: "Badges",
          }[lang]}{" "}
          · {owned.length}/{status.length}
        </h2>
        {owned.length === 0 ? (
          <p className="text-[var(--ink-muted)] text-sm">
            {{
              pl: "Jeszcze żadnych odznak.",
              uk: "Ще немає значків.",
              cs: "Zatím žádné odznaky.",
              en: "No badges yet.",
            }[lang]}
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {owned.map(({ id, def }) => (
              <li
                key={id}
                className="border border-[var(--line)] rounded p-3 flex flex-col items-center gap-1 text-center"
              >
                <span className="text-3xl" aria-hidden>
                  {def.icon}
                </span>
                <strong className="text-xs">
                  {def.labels[lang]}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Link href="/leaderboard" className="text-sm text-[var(--ink-muted)] underline">
        ← leaderboard
      </Link>
    </div>
  );
}
