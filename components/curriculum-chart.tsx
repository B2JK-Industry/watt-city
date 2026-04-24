/* V4.5 — curriculum coverage chart. Server component. Renders a
 * horizontal bar per CurriculumArea showing covered/total for the
 * given grade based on observed themes + games. Mounted in the PDF
 * report (V4.3) and in the class dashboard if time permits.
 */

import { coverageByArea, type CurriculumArea } from "@/lib/curriculum";

type Props = {
  grade: 5 | 6 | 7 | 8;
  observedThemes: Set<string>;
  observedGames: Set<string>;
};

export function CurriculumChart({ grade, observedThemes, observedGames }: Props) {
  const cov = coverageByArea(observedThemes, observedGames, grade);
  const areas = Object.keys(cov) as CurriculumArea[];

  const color: Record<CurriculumArea, string> = {
    Ekonomia: "var(--accent)",
    Matematyka: "var(--accent)",
    WOS: "var(--danger)",
    EDB: "var(--success)",
    Informatyka: "var(--accent)",
  };

  return (
    <section className="card p-4 flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-[var(--accent)]">
        Podstawa programowa · klasa {grade}
      </h3>
      <ul className="flex flex-col gap-2">
        {areas.map((a) => {
          const c = cov[a];
          if (c.total === 0) return null;
          const pct = Math.round((c.covered / c.total) * 100);
          return (
            <li key={a} className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-bold">{a}</span>
                <span className="font-mono tabular-nums">
                  {c.covered}/{c.total}{" "}
                  <span className="opacity-50">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 border border-[var(--ink)] bg-[var(--surface-2)] relative overflow-hidden">
                <div
                  className="h-full"
                  style={{ width: `${pct}%`, background: color[a] }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
