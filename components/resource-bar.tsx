import {
  RESOURCE_DEFS,
  RESOURCE_KEYS,
  type Resources,
} from "@/lib/resources";
import type { Lang } from "@/lib/i18n";

type Props = {
  resources: Resources;
  lang: Lang;
  /** Compact mode: hide non-MVP resources entirely, show only labels on hover. */
  compact?: boolean;
};

// Nav-mounted resource bar. Active resources render in full color; coming-soon
// resources (glass/steel/code in MVP) render muted with a lock icon so players
// can see the roadmap. Native `title` attributes are the tooltip (no JS, no
// hydration cost). Balance uses pl-PL thousands grouping — consistent with
// the existing XP display in site-nav.
export function ResourceBar({ resources, lang, compact = false }: Props) {
  const keys = compact
    ? RESOURCE_KEYS.filter((k) => RESOURCE_DEFS[k].mvpActive)
    : RESOURCE_KEYS;
  return (
    <ul
      className={
        "flex items-center gap-1.5 flex-wrap text-xs font-mono tabular-nums" +
        (compact ? " sm:gap-2" : " sm:gap-3")
      }
      aria-label="Resources"
    >
      {keys.map((k) => {
        const def = RESOURCE_DEFS[k];
        const v = resources[k] ?? 0;
        const active = def.mvpActive;
        const title = `${def.labels[lang]} — ${def.descriptions[lang]}`;
        return (
          <li
            key={k}
            title={title}
            className={
              "flex items-center gap-1 px-2 py-1 rounded border-2 transition-opacity " +
              (active
                ? "border-[var(--ink)] bg-[var(--surface)]"
                : "border-[var(--ink)]/30 bg-transparent opacity-45")
            }
            style={active ? { borderColor: def.color } : undefined}
          >
            <span aria-hidden className="text-sm leading-none">
              {def.icon}
            </span>
            <span
              className="font-bold"
              style={active ? { color: def.color } : { color: "var(--muted)" }}
            >
              {active ? v.toLocaleString("pl-PL") : "—"}
            </span>
            {!active && (
              <span aria-hidden className="text-[10px]">
                🔒
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
