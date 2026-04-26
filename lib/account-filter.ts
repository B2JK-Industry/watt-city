/* Public-surface filter for QA / Playwright / smoke accounts.
 *
 * Test accounts created by Playwright fixtures and prod-smoke runs
 * leak into the live leaderboards because they share the same
 * production Redis. We don't delete them (the runs need them around
 * mid-test) — we hide them from public-facing rankings and the hall
 * of fame. Authenticated user-private surfaces (the user's own row,
 * admin dashboards) keep raw data.
 *
 * Conventions audited from `e2e/*.spec.ts` and
 * `app/api/admin/purge-e2e-accounts/route.ts`:
 *   gp_*        — golden-paths spec
 *   pr_*        — production-ready spec
 *   smoke*      — smoke specs (mobile / cross / desktop)
 *   prod_smoke* — read-only prod smoke
 *   review*     — manual reviewer accounts
 *   e2e_*       — generic e2e fixture
 *   test_*      — ad-hoc QA accounts
 *   qa_*        — internal QA team
 *   _bot        — bot-protection spec
 *   playwright* — leftover defaults
 *
 * Match is case-insensitive on the prefix because some specs upper-
 * case usernames in their setup.
 */

const PUBLIC_HIDE_PREFIXES = [
  "gp_",
  "pr_",
  "smoke",
  "prod_smoke",
  "review",
  "e2e_",
  "test_",
  "qa_",
  "playwright",
] as const;

const PUBLIC_HIDE_SUFFIXES = ["_bot"] as const;

export function isTestAccount(username: string): boolean {
  if (!username) return false;
  const lower = username.toLowerCase();
  for (const p of PUBLIC_HIDE_PREFIXES) {
    if (lower.startsWith(p)) return true;
  }
  for (const s of PUBLIC_HIDE_SUFFIXES) {
    if (lower.endsWith(s)) return true;
  }
  return false;
}

export function filterPublicEntries<T extends { username: string }>(
  entries: T[],
): T[] {
  return entries.filter((e) => !isTestAccount(e.username));
}

/* Helper for "fetch N, but expect to lose some to the filter".
 * Caller asks for `n`; we fetch `n * over` (default 3×) and then take
 * the first `n` that survive the filter. Keeps the leaderboard fast
 * while compensating for the test-account churn. */
export function takeFiltered<T extends { username: string }>(
  raw: T[],
  n: number,
): T[] {
  const filtered: T[] = [];
  for (const e of raw) {
    if (filtered.length >= n) break;
    if (!isTestAccount(e.username)) filtered.push(e);
  }
  return filtered;
}
