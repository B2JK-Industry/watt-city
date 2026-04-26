import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MemoryMatchClient } from "@/components/games/memory-match-client";
import { memoryPairsFor, PAIRS_PER_ROUND } from "@/lib/content/memory-pairs";
import { sample } from "@/lib/shuffle";
import { dictFor, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getGame } from "@/lib/games";
import { GameHero } from "@/components/game-hero";

export const dynamic = "force-dynamic";

function pickRound(lang: Lang) {
  return sample(memoryPairsFor(lang), PAIRS_PER_ROUND);
}

export default async function MemoryMatchPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/memory-match");
  const lang = await getLang();
  const dict = dictFor(lang);
  const gameMeta = getGame("memory-match");
  if (!gameMeta) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
      </header>
      <GameHero game={gameMeta} lang={lang} dict={dict} />
      <MemoryMatchClient pairs={pickRound(lang)} dict={dict} />
    </div>
  );
}
