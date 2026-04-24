import {
  ACTIVE_RESOURCE_KEYS,
  DEPRECATED_RESOURCE_KEYS,
  RESOURCE_DEFS,
  type Resources,
} from "@/lib/resources";
import type { Lang } from "@/lib/i18n";

type Props = {
  resources: Resources;
  lang: Lang;
  /** Compact mode: show only the canonical V2 4-resource set. */
  compact?: boolean;
};

// Nav-mounted resource bar. V2: renders the 4 active resources only
// (watts/coins/bricks/cashZl). Any residual glass/steel/code balance is
// surfaced as a single "📦 legacy" chip so a player can see wealth
// hasn't vanished pre-migration; after the R9.1 migration runs, legacy
// balances collapse to coins and this chip disappears.
export function ResourceBar({ resources, lang, compact = false }: Props) {
  void compact;
  const legacyTotal = DEPRECATED_RESOURCE_KEYS.reduce(
    (sum, k) => sum + (resources[k] ?? 0),
    0,
  );
  return (
    <ul
      className="flex items-center gap-1.5 flex-wrap text-xs font-mono tabular-nums sm:gap-3"
      aria-label="Resources"
    >
      {ACTIVE_RESOURCE_KEYS.map((k) => {
        const def = RESOURCE_DEFS[k];
        const v = resources[k] ?? 0;
        const title = `${def.labels[lang]} — ${def.descriptions[lang]}`;
        return (
          <li
            key={k}
            title={title}
            className="flex items-center gap-1 px-2 py-1 rounded border transition-opacity border-[var(--ink)] bg-[var(--surface)]"
            style={{ borderColor: def.color }}
          >
            <span aria-hidden className="text-sm leading-none">
              {def.icon}
            </span>
            <span className="font-bold" style={{ color: def.color }}>
              {v.toLocaleString("pl-PL")}
            </span>
          </li>
        );
      })}
      {legacyTotal > 0 && (
        <li
          title={
            {
              pl: "Zasoby z V1 (szkło/stal/kod) — zamieniają się na monety w migracji.",
              uk: "Ресурси з V1 — будуть сконвертовані на монети у міграції.",
              cs: "Zdroje z V1 — budou sloučeny do mincí během migrace.",
              en: "V1 legacy resources — merging into coins during the migration.",
            }[lang]
          }
          className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-[var(--ink)]/40 opacity-60"
        >
          <span aria-hidden className="text-sm leading-none">
            📦
          </span>
          <span className="font-bold">{legacyTotal.toLocaleString("pl-PL")}</span>
          <span className="text-[10px]">V1</span>
        </li>
      )}
    </ul>
  );
}
