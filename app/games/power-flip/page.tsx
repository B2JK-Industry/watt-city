import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PowerFlipClient } from "@/components/games/power-flip-client";
import { POWER_ROUNDS } from "@/lib/content/power-flip";

export const dynamic = "force-dynamic";

function pickRound() {
  return [...POWER_ROUNDS].sort(() => Math.random() - 0.5);
}

export default async function PowerFlipPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/power-flip");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Power Flip</h1>
        <p className="text-zinc-400">
          Ktorá voľba je energeticky úspornejšia? Klikni rýchlo — 30 sekúnd,
          combo bonusy, ku každej otázke krátke vysvetlenie. Strop 180 XP.
        </p>
      </header>
      <PowerFlipClient rounds={pickRound()} />
    </div>
  );
}
