import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { WordScrambleClient } from "@/components/games/word-scramble-client";
import {
  SCRAMBLE_WORDS,
  WORDS_PER_ROUND,
} from "@/lib/content/word-scramble";
import { sample } from "@/lib/shuffle";

export const dynamic = "force-dynamic";

function pickRound() {
  return sample(SCRAMBLE_WORDS, WORDS_PER_ROUND);
}

export default async function WordScramblePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/games/word-scramble");
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Premiešané slová</h1>
        <p className="text-zinc-400">
          Odhaľ poľské slovo z oblasti financií a ekonómie. Písmená sú
          premiešané. Máš k dispozícii nápovedu. Za každé správne slovo +15 W
          (max 120 W).
        </p>
      </header>
      <WordScrambleClient words={pickRound()} />
    </div>
  );
}
