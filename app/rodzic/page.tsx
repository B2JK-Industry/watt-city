import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { parentKidUsername } from "@/lib/parent-link";
import { getPlayerState } from "@/lib/player";
import { cityLevelFromBuildings } from "@/lib/city-level";
import { computeBuildingValue } from "@/lib/city-value";
import { recentLedger } from "@/lib/player";
import { ParentDigestCard } from "@/components/parent-digest-card";

/* V4.6 — parent observer dashboard. Read-only. Shows the kid's city
 * stats + weekly digest. Respects kid's privacy flags (MVP: assume
 * everything visible; Phase 3.4.4 toggle integration can land when
 * that layer is live). */

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/rodzic");

  const kid = await parentKidUsername(session.username);
  if (!kid) {
    return (
      <div className="max-w-md mx-auto flex flex-col gap-4 animate-slide-up">
        <h1 className="brutal-heading text-3xl">Dashboard rodzica</h1>
        <p className="text-sm">Nie jesteś jeszcze połączony z kontem dziecka.</p>
        <Link href="/rodzic/dolacz" className="btn btn-primary self-start">
          Wpisz kod od dziecka
        </Link>
      </div>
    );
  }

  const state = await getPlayerState(kid);
  const city = cityLevelFromBuildings(state.buildings);
  const cityValue = computeBuildingValue(state.buildings);
  const recent = await recentLedger(kid, 30);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = recent.filter((e) => e.ts >= weekAgo);

  const scoresThisWeek = thisWeek.filter((e) => e.kind === "score").length;
  const buildsThisWeek = thisWeek.filter((e) => e.kind === "build").length;
  const loanTakes = thisWeek.filter((e) => e.kind === "loan_disburse").length;

  const themesThisWeek = Array.from(
    new Set(
      thisWeek
        .filter((e) => e.kind === "score")
        .map((e) => (e.meta?.aiKind as string) ?? "")
        .filter((x) => x),
    ),
  ).slice(0, 3);

  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-4xl">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest opacity-60">
          Obserwujesz
        </p>
        <h1 className="brutal-heading text-3xl">
          {state.profile?.displayName ?? kid}
        </h1>
        <p className="text-xs opacity-70">
          Tryb obserwatora. Nie możesz edytować konta dziecka.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Level miasta" value={`${city.level}`} />
        <Stat label="Budynków" value={`${state.buildings.length}`} />
        <Stat label="Wartość" value={cityValue.toLocaleString("pl-PL")} />
        <Stat label="Credit score" value={`${state.creditScore}/100`} />
      </section>

      <ParentDigestCard
        scoresThisWeek={scoresThisWeek}
        buildsThisWeek={buildsThisWeek}
        loanTakes={loanTakes}
        themesThisWeek={themesThisWeek}
        kidName={state.profile?.displayName ?? kid}
      />

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-widest font-black text-[var(--accent)]">
          Top 3 budynki
        </h2>
        {state.buildings.length === 0 ? (
          <p className="text-sm italic opacity-60">
            Jeszcze brak budynków.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {state.buildings
              .slice()
              .sort((a, b) => b.level - a.level)
              .slice(0, 3)
              .map((b) => (
                <li key={b.id} className="flex justify-between">
                  <span>{b.catalogId}</span>
                  <span className="font-mono">L{b.level}</span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest opacity-60">
        {label}
      </div>
      <div className="text-xl font-black tabular-nums mt-1">{value}</div>
    </div>
  );
}
