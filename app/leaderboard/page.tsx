import Link from "next/link";
import { gameLeaderboard, globalLeaderboard } from "@/lib/leaderboard";
import { GAMES, getGame, localizedTitle } from "@/lib/games";
import { LeaderboardEntry } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { takeFiltered } from "@/lib/account-filter";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ game?: string }>;
};

function rankBadge(rank: number): { icon: string; tone: string } | null {
  if (rank === 1) return { icon: "🥇", tone: "text-[var(--foreground)]" };
  if (rank === 2) return { icon: "🥈", tone: "text-[var(--foreground)]" };
  if (rank === 3) return { icon: "🥉", tone: "text-amber-700" };
  return null;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const gameId = sp.game;
  const game = gameId ? getGame(gameId) : undefined;
  const session = await getSession();
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.leaderboard;
  const locale = lang === "pl" ? "pl-PL" : lang === "cs" ? "cs-CZ" : lang === "uk" ? "uk-UA" : "en-US";

  // Public surface — fetch generously then filter QA/smoke accounts so
  // the visible leaderboard is a real community, not a QA log dump.
  const rawEntries: LeaderboardEntry[] = game
    ? await gameLeaderboard(game.id, 150)
    : await globalLeaderboard(150);
  const entries: LeaderboardEntry[] = takeFiltered(rawEntries, 50).map(
    (e, i) => ({ ...e, rank: i + 1 }),
  );

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Credibility patch: a short metric + scope note under the headline.
  // The leaderboard sometimes still shows seeded outliers, so the chip
  // row tells visitors what they're looking at (W = Watts, not money;
  // QA accounts hidden) — without a redesign.
  const credibility = {
    pl: {
      metric: "W = Wat (XP z minigier)",
      filtered: "Konta testowe ukryte",
    },
    uk: {
      metric: "W = Ват (XP з міні-ігор)",
      filtered: "Тестові акаунти приховані",
    },
    cs: {
      metric: "W = Watt (XP z miniher)",
      filtered: "Testovací účty skryté",
    },
    en: {
      metric: "W = Watts (XP from mini-games)",
      filtered: "Test accounts hidden",
    },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <span
            className="chip"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {t.tag}
          </span>
        </div>
        <p className="text-[var(--ink-muted)]">
          {game
            ? t.gameBody.replace("{title}", localizedTitle(game, dict))
            : t.globalBody}
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="chip">⚡ {credibility.metric}</span>
          <span className="chip">🛡 {credibility.filtered}</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/leaderboard"
          className={`chip ${!game ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
        >
          {t.global}
        </Link>
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/leaderboard?game=${g.id}`}
            className={`chip ${game?.id === g.id ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
          >
            {g.emoji} {g.title}
          </Link>
        ))}
      </div>

      {podium.length === 3 && (
        // R-04 — stepped podium with shared ground line. Heights are
        // 1.0/0.73/0.55 (h-44/h-32/h-24) so the gold tile reads as the
        // dominant block — the prior 0.78/1.0/0.67 looked muddled.
        // `items-end` aligns all three to the same baseline.
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end relative">
          <PodiumCard
            entry={podium[1]}
            height="h-32"
            badge="🥈"
            bg="bg-[var(--ink-subtle)]"
            rank={2}
            isMe={podium[1].username === session?.username}
          />
          <PodiumCard
            entry={podium[0]}
            height="h-44"
            badge="🥇"
            bg="bg-[var(--sales)]"
            rank={1}
            isMe={podium[0].username === session?.username}
            crown
          />
          <PodiumCard
            entry={podium[2]}
            height="h-24"
            badge="🥉"
            bg="bg-[var(--surface-2)]"
            rank={3}
            isMe={podium[2].username === session?.username}
          />
          {/* R-04 — shared ground line under all three tiles to anchor
              the stepped look. 1 px navy rule per brand manual §7. */}
          <div className="col-span-3 -mt-px border-t border-[var(--accent)]" />
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon="🏆"
          title={
            {
              pl: "Bądź pierwszy!",
              uk: "Будь першим!",
              cs: "Buď první!",
              en: "Be the first!",
            }[lang]
          }
          body={
            game
              ? t.emptyGame.replace("{title}", localizedTitle(game, dict))
              : {
                  pl: "Liga jest pusta. Zagraj minigrę i zdobądź pierwsze Waty.",
                  uk: "Ліга порожня. Зіграй міні-гру та здобудь перші Вати.",
                  cs: "Žebříček je prázdný. Zahraj minihru a získej první Watty.",
                  en: "The league is empty. Play a mini-game to score the first Watts.",
                }[lang]
          }
          cta={{
            href: "/games",
            label: {
              pl: "Zagraj minigrę",
              uk: "Зіграти міні-гру",
              cs: "Zahrát minihru",
              en: "Play a mini-game",
            }[lang],
            variant: "sales",
          }}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--surface-2)] text-xs text-[var(--ink-muted)] font-semibold">
              <tr>
                <th className="text-left px-4 py-3 w-16">{t.position}</th>
                <th className="text-left px-4 py-3">{t.player}</th>
                <th className="text-right px-4 py-3">{t.watts}</th>
              </tr>
            </thead>
            <tbody>
              {(podium.length === 3 ? rest : entries).map((e) => {
                const isMe = e.username === session?.username;
                const badge = rankBadge(e.rank);
                return (
                  <tr
                    key={e.username}
                    className={`leaderboard-row ${isMe ? "leaderboard-row-me" : ""}`}
                  >
                    <td className="px-4 py-3 font-bold">
                      <span className="flex items-center gap-1.5">
                        {badge ? (
                          <span className={`text-lg ${badge.tone}`}>
                            {badge.icon}
                          </span>
                        ) : (
                          <span className="opacity-60">#{e.rank}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        {e.username}
                        {isMe && (
                          <span className="chip text-[10px] border-[var(--accent)] text-[var(--accent)]">
                            {t.meTag}
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        isMe ? "text-[var(--accent)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {e.xp.toLocaleString(locale)} W
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  height,
  badge,
  bg,
  rank,
  isMe,
  crown,
}: {
  entry: LeaderboardEntry;
  height: string;
  badge: string;
  bg: string;
  rank: 1 | 2 | 3;
  isMe: boolean;
  crown?: boolean;
}) {
  // R-04 — initials placeholder avatar (the LeaderboardEntry API
  // doesn't carry an avatar id; flagged F-NEW-18-leaderboard for a
  // follow-up). Two letters max, uppercase.
  const initials = entry.username.slice(0, 2).toUpperCase();
  // R-04 — gold tile keeps white text on orange (--sales = #db912c).
  // Contrast on white is 3.1:1, but text on the orange fill itself is
  // ~3.6:1 white. Bump to navy on gold for AA-safe rendering. The new
  // `lib/podium-color-contrast.test.ts` token guard pins this so a
  // future palette swap can't regress it.
  const insideTextClass =
    rank === 1
      ? "text-[var(--accent)]"
      : "text-[var(--ink)]";
  return (
    <div className="flex flex-col items-stretch gap-2">
      {/* Avatar circle above the box — uses the existing accent
          token + initials, same look as the dashboard top-leaderboard
          widget. */}
      <div className="flex justify-center">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[11px] font-semibold"
        >
          {initials}
        </span>
      </div>
      <div
        // Tile carries: rank chip (top-left), medal (top-right),
        // username + W$ (bottom inside). Me-row keeps the 1 px navy
        // rule per brand manual §7. `data-testid="podium-name"` is
        // the seeded-filter spec hook (PR pass-6 issue #2).
        className={`relative w-full ${height} ${bg} podium-tile flex flex-col justify-end p-2 ${
          crown ? "animate-[glow-ring_2.4s_ease-in-out_infinite]" : ""
        } ${isMe ? "border-l border-l-[var(--accent)]" : ""}`}
      >
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold text-[var(--ink-muted)] bg-[var(--surface)] rounded px-1.5 py-0.5">
          #{rank}
        </span>
        <span
          aria-hidden
          className="absolute top-1 right-1 text-2xl sm:text-3xl"
        >
          {badge}
        </span>
        <div
          data-testid="podium-name"
          className={`${insideTextClass} text-xs sm:text-sm font-semibold truncate tracking-tight`}
        >
          {entry.username}
          {isMe && (
            <span className="text-[var(--danger)] ml-1 text-[10px]">(ty)</span>
          )}
        </div>
        <div
          className={`${insideTextClass} text-[10px] sm:text-xs font-mono font-semibold tabular-nums`}
        >
          {entry.xp.toLocaleString("pl-PL")} W
        </div>
      </div>
      {/* Decorative podium-base step under each tile. `surface-2`
          + 1 px line keeps the stepped illusion without a brutalism
          wedge. Width follows the tile (parent grid). */}
      <div
        aria-hidden
        className="h-2 bg-[var(--surface-2)] border-t border-[var(--line)]"
      />
    </div>
  );
}
