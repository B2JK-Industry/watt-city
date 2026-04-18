import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MathSprintClient } from "@/components/games/math-sprint-client";

export const dynamic = "force-dynamic";

export default async function MathSprintPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/games/math-sprint");
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Matematický šprint</h1>
        <p className="text-zinc-400">
          60 sekúnd. Počítaj čo najrýchlejšie. Správna odpoveď: +10 W. Nesprávna:
          −5 W (minimum 0). Max 200 W za kolo.
        </p>
      </header>
      <MathSprintClient />
    </div>
  );
}
