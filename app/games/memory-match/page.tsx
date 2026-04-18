import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MemoryMatchClient } from "@/components/games/memory-match-client";
import { MEMORY_PAIRS, PAIRS_PER_ROUND } from "@/lib/content/memory-pairs";
import { sample } from "@/lib/shuffle";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

function pickRound() {
  return sample(MEMORY_PAIRS, PAIRS_PER_ROUND);
}

export default async function MemoryMatchPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/memory-match");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.memory;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          {dict.games.back}
        </Link>
        <h1 className="text-3xl font-bold">{t.headerTitle}</h1>
        <p className="text-zinc-400">{t.headerBody}</p>
      </header>
      <MemoryMatchClient pairs={pickRound()} />
    </div>
  );
}
