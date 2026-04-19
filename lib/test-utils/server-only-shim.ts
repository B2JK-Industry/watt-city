/* Vitest shim for the `server-only` Next.js guard.
 *
 * The real package throws when imported into a client component. Under
 * vitest the entire test runs in a Node process, so the guard is a
 * false positive — we alias the import to this empty module via
 * vitest.config.ts. Nothing to export; the alias simply replaces the
 * throwing side-effect with a no-op.
 */
export {};
