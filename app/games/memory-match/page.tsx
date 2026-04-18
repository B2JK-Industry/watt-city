import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MemoryMatchClient } from "@/components/games/memory-match-client";
import { MEMORY_PAIRS, PAIRS_PER_ROUND } from "@/lib/content/memory-pairs";

export const dynamic = "force-dynamic";

function pickRound() {
  return [...MEMORY_PAIRS]
    .sort(() => Math.random() - 0.5)
    .slice(0, PAIRS_PER_ROUND);
}

export default async function MemoryMatchPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/games/memory-match");
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Pamäťové páry</h1>
        <p className="text-zinc-400">
          Spáruj finančný pojem s jeho definíciou. Otoč dve karty naraz.
          Čím rýchlejšie a s menším počtom chýb, tým viac XP (strop 160).
        </p>
      </header>
      <MemoryMatchClient pairs={pickRound()} />
    </div>
  );
}
