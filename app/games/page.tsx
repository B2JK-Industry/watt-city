import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { userStats } from "@/lib/leaderboard";
import { levelFromXP, tierForLevel } from "@/lib/level";
import { CityBlock, type CityGame } from "@/components/city-block";

export const dynamic = "force-dynamic";

export default async function GamesHubPage() {
  const session = await getSession();
  const stats = session ? await getUserStats(session.username) : null;
  const lb = session ? await userStats(session.username) : null;
  const level = lb ? levelFromXP(lb.globalXP) : null;
  const tier = level ? tierForLevel(level.level) : null;

  const personalized: CityGame[] = GAMES.map((g) => {
    const played = stats?.games[g.id];
    return {
      ...g,
      bestScore: played?.bestScore ?? 0,
      plays: played?.plays ?? 0,
      lastPlayedAt: played?.lastPlayedAt ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">
            Tvoje mestečko
          </h1>
          {tier && (
            <span
              className="brutal-tag"
              style={{
                background: "var(--neo-yellow)",
                color: "#0a0a0f",
              }}
            >
              {tier.emoji} {tier.name}
            </span>
          )}
        </div>
        <p className="text-zinc-400 max-w-2xl">
          Každá budova v Katowiciach je minihra. Klikni na budovu, zahraj,
          vygeneruj Watty — budovy sa <strong>rozsvietia</strong>,
          tvoje mesto rastie. Žltá lampa vpravo hore = rozsvietené.
        </p>
      </header>
      <CityBlock games={personalized} loggedIn={Boolean(session)} />
    </div>
  );
}
