// Tiny TS import shim for scripts/audit-i18n.mjs.
// Leaves JS files alone, strips types from .ts by a simple passthrough
// (the locale files have no type-syntax that Node's strip-types can't
// handle). Node 24+ ships --experimental-strip-types; on older Node
// this forwards to esbuild if installed, else we let the script import
// via `new Function` (which is what we actually do).
export async function load(url, context, nextLoad) {
  return nextLoad(url, context);
}
