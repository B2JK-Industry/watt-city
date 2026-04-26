import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MathSprintClient } from "@/components/games/math-sprint-client";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getGame } from "@/lib/games";
import { GameHero } from "@/components/game-hero";

export const dynamic = "force-dynamic";

export default async function MathSprintPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/math-sprint");
  const lang = await getLang();
  const dict = dictFor(lang);
  const gameMeta = getGame("math-sprint");
  if (!gameMeta) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
      </header>
      <GameHero game={gameMeta} lang={lang} dict={dict} />
      <MathSprintClient dict={dict} />
    </div>
  );
}
