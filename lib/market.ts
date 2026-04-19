/* Per-market infrastructure — Phase 9.
 *
 * A "market" is a country-scoped variant of Watt City with its own
 * theme pool, landmark catalogue, currency label, and default locale.
 * The PL market is the legacy default — existing Upstash keys (without
 * a market prefix) are treated as PL to preserve Phase 1-5 data.
 *
 * Per-agent-charter constraint (#3): we do NOT rename existing Redis
 * keys. New per-market data uses the `market:<id>:` prefix; legacy
 * PL data stays under its original keys. `/api/admin/migrate-to-
 * multimarket` ships as a DRY-RUN listing rather than a destructive
 * rename.
 */

import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export type MarketId = "pl" | "cz" | "ua";

export type MarketDef = {
  id: MarketId;
  defaultLang: Lang;
  currency: "PLN" | "CZK" | "UAH";
  currencyLabel: string;
  capital: string;
  centralBank: string;
  /** Short 1-line description shown in the market picker. */
  description: Record<Lang, string>;
};

export const MARKETS: Record<MarketId, MarketDef> = {
  pl: {
    id: "pl",
    defaultLang: "pl",
    currency: "PLN",
    currencyLabel: "zł",
    capital: "Warszawa",
    centralBank: "NBP",
    description: {
      pl: "Polski rynek — NBP, PKO, BLIK, WIBOR/WIRON.",
      uk: "Польський ринок — NBP, PKO, BLIK, WIBOR/WIRON.",
      cs: "Polský trh — NBP, PKO, BLIK, WIBOR/WIRON.",
      en: "Polish market — NBP, PKO, BLIK, WIBOR/WIRON.",
    },
  },
  cz: {
    id: "cz",
    defaultLang: "cs",
    currency: "CZK",
    currencyLabel: "Kč",
    capital: "Praha",
    centralBank: "ČNB",
    description: {
      pl: "Czeski rynek — ČNB, ČSOB, KB, MONETA, czeskie podatki.",
      uk: "Чеський ринок — ČNB, ČSOB, KB, MONETA.",
      cs: "Český trh — ČNB, ČSOB, KB, MONETA, české daně.",
      en: "Czech market — ČNB, ČSOB, KB, MONETA, Czech taxes.",
    },
  },
  ua: {
    id: "ua",
    defaultLang: "uk",
    currency: "UAH",
    currencyLabel: "₴",
    capital: "Київ",
    centralBank: "НБУ",
    description: {
      pl: "Ukraiński rynek — NBU, PrivatBank, Monobank, UAH.",
      uk: "Український ринок — НБУ, ПриватБанк, Monobank, гривні.",
      cs: "Ukrajinský trh — NBU, PrivatBank, Monobank, hřivny.",
      en: "Ukrainian market — NBU, PrivatBank, Monobank, hryvnia.",
    },
  },
};

const MARKET_COOKIE = "wc_market";

export async function currentMarket(): Promise<MarketDef> {
  try {
    const store = await cookies();
    const raw = store.get(MARKET_COOKIE)?.value as MarketId | undefined;
    if (raw && MARKETS[raw]) return MARKETS[raw];
  } catch {
    // called outside request scope — fall through
  }
  return MARKETS.pl;
}

export function marketKey(market: MarketId, key: string): string {
  // PL is the legacy default — existing keys are NOT rewritten. For PL
  // we return the bare key so Phase 1-5 data remains canonical.
  if (market === "pl") return key;
  return `market:${market}:${key}`;
}

export function parseMarket(value: string | null | undefined): MarketId {
  if (value === "cz" || value === "ua") return value;
  return "pl";
}
