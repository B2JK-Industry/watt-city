import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PowerFlipClient } from "@/components/games/power-flip-client";
import { POWER_ROUNDS, type PowerRound } from "@/lib/content/power-flip";
import { shuffle } from "@/lib/shuffle";

export const dynamic = "force-dynamic";

function pickRound(): PowerRound[] {
  return shuffle(POWER_ROUNDS).map((r) => {
    // Randomly flip sides so the correct answer isn't always on the same one.
    if (Math.random() < 0.5) {
      return {
        ...r,
        left: r.right,
        right: r.left,
        correct: r.correct === "left" ? "right" : "left",
      };
    }
    return r;
  });
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
          combo bonusy, ku každej otázke krátke vysvetlenie. Max 180 W.
        </p>
      </header>
      <PowerFlipClient rounds={pickRound()} />
    </div>
  );
}
