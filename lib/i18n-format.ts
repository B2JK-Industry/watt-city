/* Locale-aware formatters — Phase 6.6.4 + 6.6.5.
 *
 * Polish pluralization (and, for consistency, CS + UK) uses complex rules
 * that `Intl.PluralRules` already handles. We wrap the most common cases
 * (items count, watts, minutes) as short helpers so components don't
 * construct formatters on every render.
 */

import type { Lang } from "@/lib/i18n";

const LOCALE_MAP: Record<Lang, string> = {
  pl: "pl-PL",
  uk: "uk-UA",
  cs: "cs-CZ",
  en: "en-GB",
};

/** Pick the correct plural form for `n`. `forms` is a map keyed by
 *  Intl.PluralRules category ("one" | "few" | "many" | "other" — Polish
 *  uses all four; English only "one" + "other"). `other` is the
 *  mandatory fallback. */
export function plural(
  lang: Lang,
  n: number,
  forms: {
    one?: string;
    few?: string;
    many?: string;
    other: string;
    zero?: string;
    two?: string;
  },
): string {
  const rules = new Intl.PluralRules(LOCALE_MAP[lang]);
  const category = rules.select(n) as keyof typeof forms;
  return (forms[category] ?? forms.other).replace("{n}", String(n));
}

/** Format a number according to locale conventions. */
export function formatNumber(lang: Lang, n: number): string {
  return new Intl.NumberFormat(LOCALE_MAP[lang]).format(n);
}

/** Format a currency amount. Defaults to PLN; CZ/UA markets override
 *  via the `currency` arg. */
export function formatCurrency(
  lang: Lang,
  amount: number,
  currency: "PLN" | "CZK" | "UAH" | "EUR" = "PLN",
): string {
  return new Intl.NumberFormat(LOCALE_MAP[lang], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date. `style` maps to Intl date-style ("short" | "medium" | "long"). */
export function formatDate(
  lang: Lang,
  ts: number | Date,
  style: "short" | "medium" | "long" = "medium",
): string {
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], { dateStyle: style }).format(ts);
}

/** Short relative-time helper — "2 minuty temu" / "3 dni temu". */
export function formatRelative(lang: Lang, ts: number, now = Date.now()): string {
  const diffSec = Math.round((ts - now) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(LOCALE_MAP[lang], { numeric: "auto" });
  if (absSec < 60) return rtf.format(diffSec, "second");
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (absSec < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86_400), "day");
}
