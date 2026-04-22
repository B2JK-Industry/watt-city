import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/* eslint-plugin-react-hooks@7 (React 19.2 era) ships two new rules —
 * `react-hooks/purity` and `react-hooks/set-state-in-effect` — that flag
 * legitimate patterns in this codebase as errors:
 *
 * - `react-hooks/purity` fires on `Date.now()` / `Math.random()` in server
 *   components. Those execute per-request server-side (Next 16 app router)
 *   and never hit React reconciliation on the client. `force-dynamic` is
 *   the intended escape hatch for time-dependent SSR.
 * - `react-hooks/set-state-in-effect` fires on the canonical
 *   `useEffect(() => submit(...))` fetch-then-setState pattern used by
 *   every per-game client to POST `/api/score` when the round ends. The
 *   rule's `useSyncExternalStore` alternative doesn't fit one-shot writes.
 *
 * Genuine hydration-mismatch bugs in client components (confetti, etc.)
 * are still fixed at the source. We downgrade these two to `warn` so the
 * lint output keeps surfacing them as signal without failing CI on the
 * false positives. Revisit when the plugin gains "use client" awareness.
 */
const RELAXED_REACT_19_STRICT_RULES = {
  "react-hooks/purity": "warn",
  "react-hooks/set-state-in-effect": "warn",
  // Conventional: underscore-prefixed params/vars are intentionally unused
  // (API route handlers always receive `req` even when not read, browser
  // callbacks like `SyncEvent` pass `event`, etc.). Align the rule with the
  // convention so we don't have to touch every route signature.
  "@typescript-eslint/no-unused-vars": [
    "warn",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    name: "watt-city/relaxed-react-19-rules",
    rules: RELAXED_REACT_19_STRICT_RULES,
  },
]);

export default eslintConfig;
