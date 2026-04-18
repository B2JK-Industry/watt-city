import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { GamesHub } from "@/components/games-hub";

export const dynamic = "force-dynamic";

export default async function GamesHubPage() {
  const session = await getSession();
  const stats = session ? await getUserStats(session.username) : null;

  const personalized = GAMES.map((g) => {
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
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Hry</h1>
        <p className="text-zinc-400 max-w-2xl">
          Vyber si minihru. Každá dáva XP do globálneho rebríčka a má svoj vlastný rebríček. Nováčikom odporúčame začať finančným kvízom.
        </p>
      </header>
      <GamesHub games={personalized} loggedIn={Boolean(session)} />
    </div>
  );
}
