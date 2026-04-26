import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { WordScrambleClient } from "@/components/games/word-scramble-client";
import {
  scrambleWordsFor,
  WORDS_PER_ROUND,
} from "@/lib/content/word-scramble";
import { sample } from "@/lib/shuffle";
import { dictFor, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getGame } from "@/lib/games";
import { GameHero } from "@/components/game-hero";

export const dynamic = "force-dynamic";

function pickRound(lang: Lang) {
  return sample(scrambleWordsFor(lang), WORDS_PER_ROUND);
}

export default async function WordScramblePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/word-scramble");
  const lang = await getLang();
  const dict = dictFor(lang);
  const gameMeta = getGame("word-scramble");
  if (!gameMeta) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
      </header>
      <GameHero game={gameMeta} lang={lang} dict={dict} />
      <WordScrambleClient words={pickRound(lang)} dict={dict} />
    </div>
  );
}
