/* F-01 — `/loans/compare` deprecated.
 *
 * The full LoanComparison surface now lives inline inside the
 * Hypotéka panel on /miasto (see WattCityClient → MortgageCard).
 * Keeping the standalone route would mean two sources of truth +
 * an extra nav slot the IA budget can't afford.
 *
 * This file 308-redirects every legacy bookmark / tour-step / deep
 * link to the inline panel anchor, preserving the player's chosen
 * principal/term query params so the inline calculator opens with
 * the same starting point.
 *
 * Returns 308 (Permanent Redirect) so search engines drop the old
 * URL from their index and bookmark-syncing browsers update the
 * canonical target.
 */

import { redirect, permanentRedirect } from "next/navigation";

type SearchParams = {
  principal?: string;
  term?: string;
};

export default async function LoanComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  if (sp.principal) usp.set("principal", sp.principal);
  if (sp.term) usp.set("term", sp.term);
  const qs = usp.toString();
  // `permanentRedirect` issues a 308 so old links migrate; falls
  // back to a 307 via `redirect` if the call site changes (Next.js
  // accepts both as long as the import is correct).
  permanentRedirect(`/miasto${qs ? `?${qs}` : ""}#hypoteka`);
  // Unreachable — `permanentRedirect` throws to abort rendering.
  // Kept so the function has an explicit return path the type
  // checker accepts.
  redirect("/miasto#hypoteka");
}
