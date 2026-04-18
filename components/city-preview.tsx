import Link from "next/link";
import { GAMES } from "@/lib/games";

// Read-only skyline used on the anonymous landing + logged-in dashboard
// to tease the city hub. No state, no personalization.
export function CityPreview() {
  return (
    <div className="relative">
      <div
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[130px] gap-3 stagger-container"
        aria-label="Panorama 9 budov (hier) v meste Katowice"
      >
        {GAMES.map((g, i) => {
          const heights = [120, 110, 130, 95, 115, 105, 125, 100, 110];
          const h = heights[i % heights.length];
          const isTall = g.building.shape === "tall";
          return (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className={`relative block rounded-xl border-[3px] border-[var(--ink)] overflow-hidden shadow-[4px_4px_0_0_var(--ink)] hover:shadow-[7px_7px_0_0_var(--ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all stagger-item ${
                isTall ? "row-span-2" : ""
              }`}
              style={{ height: isTall ? "100%" : `${h}%` }}
            >
              <div
                className={`${g.building.roof} border-b-[3px] border-[var(--ink)] h-5`}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, rgba(0,0,0,0.2) 0 5px, transparent 5px 10px)",
                }}
              />
              <div
                className={`${g.building.body} h-[calc(100%-1.25rem)] relative flex items-center justify-center`}
              >
                <div className="absolute inset-2 rounded-md border-2 border-[var(--ink)] bg-[#0a0a0f]/70 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">
                    {g.building.glyph}
                  </span>
                </div>
                <span className="absolute bottom-1 left-1 right-1 text-[9px] font-black uppercase tracking-wider text-[#0a0a0f] bg-white/90 rounded-sm border-2 border-[var(--ink)] px-1 truncate text-center">
                  {g.building.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className="mt-3 h-5 rounded-lg border-[3px] border-[var(--ink)] bg-zinc-700"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0 6px, transparent 6px 12px)",
        }}
      />
    </div>
  );
}
