import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { EnergyDashClient } from "@/components/games/energy-dash-client";

export const dynamic = "force-dynamic";

export default async function EnergyDashPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/energy-dash");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Energy Dash</h1>
        <p className="text-zinc-400">
          30 sekúnd. Klikaj iba zelené — obnoviteľné zdroje (slnko, vietor, voda,
          biomasa). Vyhni sa čiernym — fosílne palivá. Combo × multiplikátor
          láka na rekordy. Max 220 W.
        </p>
      </header>
      <EnergyDashClient />
    </div>
  );
}
