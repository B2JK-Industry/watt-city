import Link from "next/link";
import { GAMES } from "@/lib/games";
import { gameLeaderboard } from "@/lib/leaderboard";
import { getSession } from "@/lib/session";
import {
  listActiveAiGames,
  listArchivedAiGames,
} from "@/lib/ai-pipeline/publish";
import { specKind } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const session = await getSession();
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.sinSlavy;
  const [results, aiGames, archive] = await Promise.all([
    Promise.all(
      GAMES.map(async (g) => ({
        game: g,
        top: await gameLeaderboard(g.id, 3),
      })),
    ),
    listActiveAiGames(),
    listArchivedAiGames(20),
  ]);
  const liveAi = [...aiGames].reverse();
  const liveAiWithTop = await Promise.all(
    liveAi.map(async (g) => ({
      game: g,
      top: await gameLeaderboard(g.id, 3),
    })),
  );
  const liveIds = new Set(aiGames.map((g) => g.id));
  const pastAi = archive.filter((r) => !liveIds.has(r.id));
  const pastAiWithTop = await Promise.all(
    pastAi.map(async (r) => ({
      record: r,
      top: await gameLeaderboard(r.id, 3),
    })),
  );

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">{t.title}</h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}
          >
            {t.tag}
          </span>
        </div>
        <p className="text-zinc-400 max-w-2xl">{t.body}</p>
      </header>

      {/* Today's AI challenge — live list if any, placeholder otherwise */}
      {liveAi.length > 0 ? (
        <section className="card p-6 flex flex-col gap-4 border-[var(--accent)]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="brutal-heading text-xl">{t.todayTitle}</h2>
            <span
              className="brutal-tag"
              style={{ background: "var(--accent)", color: "#0a0a0f" }}
            >
              LIVE
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            {t.liveMedalNote}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveAiWithTop.map(({ game: g, top }) => {
              const hoursLeft = Math.max(
                0,
                Math.round((g.validUntil - Date.now()) / (60 * 60 * 1000)),
              );
              return (
                <div key={g.id} className="card p-4 flex flex-col gap-3">
                  <Link
                    href={`/games/ai/${g.id}`}
                    className="flex flex-col gap-2 hover:text-[var(--accent)]"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl">🤖</span>
                      <strong className="font-black uppercase tracking-tight">
                        {g.title}
                      </strong>
                      <span className="chip ml-auto text-[11px]">
                        ⏱ {hoursLeft}h
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{g.theme}</p>
                    <p className="text-xs text-zinc-500">
                      {g.model} · {specKind(g.spec)}
                    </p>
                  </Link>
                  <ol className="flex flex-col gap-1.5">
                    {[0, 1, 2].map((i) => {
                      const entry = top[i];
                      const medal = ["🥇", "🥈", "🥉"][i];
                      const tone = [
                        "bg-[var(--neo-yellow)]",
                        "bg-zinc-300",
                        "bg-[var(--neo-orange)]",
                      ][i];
                      return (
                        <li
                          key={i}
                          className={`flex items-center justify-between rounded-lg border-2 border-[var(--ink)] px-2.5 py-1.5 ${
                            entry
                              ? `${tone} text-[#0a0a0f]`
                              : "bg-[var(--surface-2)] text-zinc-500"
                          } ${
                            entry && entry.username === session?.username
                              ? "ring-2 ring-[var(--neo-pink)]"
                              : ""
                          }`}
                        >
                          <span className="flex items-center gap-2.5 font-semibold truncate">
                            <span className="text-lg">{medal}</span>
                            {entry ? (
                              <span className="truncate">
                                {entry.username}
                                {entry.username === session?.username && (
                                  <span className="ml-1 text-[10px] font-black">
                                    (TY)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="italic">{t.noneYet}</span>
                            )}
                          </span>
                          <span className="font-mono font-black text-sm whitespace-nowrap">
                            {entry ? `${entry.xp.toLocaleString("pl-PL")} W` : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card p-6 flex flex-col gap-3 border-[var(--accent)]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="brutal-heading text-xl">{t.todayTitle}</h2>
            <span
              className="brutal-tag"
              style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}
            >
              {t.comingSoon}
            </span>
          </div>
          <p className="text-sm text-zinc-300 max-w-2xl">
            {t.todayBody.split("{permBadge}").map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <strong className="text-[var(--accent)]">{t.permBadge}</strong>
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="chip">{t.chipStart}</div>
            <div className="chip">{t.chipEnd}</div>
            <div className="chip">{t.chipMedal}</div>
            <div className="chip">{t.chipAI}</div>
          </div>
        </section>
      )}

      {/* Archive of expired AI games — permanent top-3 medals */}
      {pastAiWithTop.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="brutal-heading text-xl sm:text-2xl">
            {t.aiArchiveTitle}
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl">
            {t.aiArchiveBody}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pastAiWithTop.map(({ record, top }) => {
              const date = new Date(record.generatedAt);
              return (
                <div
                  key={record.id}
                  className="card p-5 flex flex-col gap-3 stagger-item"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-2xl shrink-0">🤖</span>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-tight truncate">
                          {record.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-semibold truncate">
                          {record.theme}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono">
                          {date.toLocaleDateString(lang === "en" ? "en-US" : "pl-PL")}{" "}
                          · {record.model} · {record.kind}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ol className="flex flex-col gap-1.5">
                    {[0, 1, 2].map((i) => {
                      const entry = top[i];
                      const medal = ["🥇", "🥈", "🥉"][i];
                      const tone = [
                        "bg-[var(--neo-yellow)]",
                        "bg-zinc-300",
                        "bg-[var(--neo-orange)]",
                      ][i];
                      return (
                        <li
                          key={i}
                          className={`flex items-center justify-between rounded-lg border-2 border-[var(--ink)] px-2.5 py-1.5 ${
                            entry
                              ? `${tone} text-[#0a0a0f]`
                              : "bg-[var(--surface-2)] text-zinc-500"
                          } ${
                            entry && entry.username === session?.username
                              ? "ring-2 ring-[var(--neo-pink)]"
                              : ""
                          }`}
                        >
                          <span className="flex items-center gap-2.5 font-semibold truncate">
                            <span className="text-lg">{medal}</span>
                            {entry ? (
                              <span className="truncate">
                                {entry.username}
                                {entry.username === session?.username && (
                                  <span className="ml-1 text-[10px] font-black">
                                    (TY)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="italic">{t.noneYet}</span>
                            )}
                          </span>
                          <span className="font-mono font-black text-sm whitespace-nowrap">
                            {entry ? `${entry.xp.toLocaleString("pl-PL")} W` : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Permanent games — current top 3 */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-xl sm:text-2xl">{t.medalsByGame}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map(({ game, top }) => (
            <div
              key={game.id}
              className="card p-5 flex flex-col gap-3 stagger-item"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 hover:text-[var(--accent)]"
                >
                  <span className="text-3xl">{game.emoji}</span>
                  <div>
                    <p className="font-black uppercase tracking-tight">
                      {game.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-semibold">
                      {game.building.name}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/leaderboard?game=${game.id}`}
                  className="text-[11px] text-[var(--accent)] hover:underline"
                >
                  {t.leaderLink}
                </Link>
              </div>
              <ol className="flex flex-col gap-1.5">
                {[0, 1, 2].map((i) => {
                  const entry = top[i];
                  const medal = ["🥇", "🥈", "🥉"][i];
                  const tone = [
                    "bg-[var(--neo-yellow)]",
                    "bg-zinc-300",
                    "bg-[var(--neo-orange)]",
                  ][i];
                  return (
                    <li
                      key={i}
                      className={`flex items-center justify-between rounded-lg border-2 border-[var(--ink)] px-2.5 py-1.5 ${
                        entry
                          ? `${tone} text-[#0a0a0f]`
                          : "bg-[var(--surface-2)] text-zinc-500"
                      } ${
                        entry && entry.username === session?.username
                          ? "ring-2 ring-[var(--neo-pink)]"
                          : ""
                      }`}
                    >
                      <span className="flex items-center gap-2.5 font-semibold truncate">
                        <span className="text-lg">{medal}</span>
                        {entry ? (
                          <span className="truncate">
                            {entry.username}
                            {entry.username === session?.username && (
                              <span className="ml-1 text-[10px] font-black">
                                (TY)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="italic">{t.noneYet}</span>
                        )}
                      </span>
                      <span className="font-mono font-black text-sm whitespace-nowrap">
                        {entry ? `${entry.xp.toLocaleString("pl-PL")} W` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <aside className="card p-5 text-sm text-zinc-400">
        <p>
          <strong className="text-zinc-200">{t.whyTitle}</strong> {t.whyBody}
        </p>
      </aside>
    </div>
  );
}
