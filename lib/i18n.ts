import pl from "./locales/pl";
import uk from "./locales/uk";
import cs from "./locales/cs";
import en from "./locales/en";

export const LANGS = ["pl", "uk", "cs", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "pl";

export const LANG_LABEL: Record<Lang, string> = {
  pl: "Polski",
  uk: "Українська",
  cs: "Čeština",
  en: "English",
};

export const LANG_FLAG: Record<Lang, string> = {
  pl: "🇵🇱",
  uk: "🇺🇦",
  cs: "🇨🇿",
  en: "🇬🇧",
};

export const LANG_HTML: Record<Lang, string> = {
  pl: "pl",
  uk: "uk",
  cs: "cs",
  en: "en",
};

export type Dict = typeof pl;

const DICTS: Record<Lang, Dict> = { pl, uk, cs, en };

export function dictFor(lang: Lang): Dict {
  return DICTS[lang];
}

export const COOKIE_NAME = "xp_lang";
