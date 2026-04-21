#!/usr/bin/env node
// Phase 6 — cross-locale key-coverage audit.
// Loads lib/locales/{pl,uk,cs,en}.ts (PL is the reference) and reports
// keys present in PL but missing (or stringified-differently) in the
// other locales. Does NOT rely on parsing TS — imports the compiled
// runtime via `tsx`/Node's native TS loader.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

// Register a TS loader so we can import .ts files directly from Node.
// Node ≥ 24.3 ships a built-in `--experimental-strip-types` flag; if
// it's active we don't need a custom loader. Otherwise we fall back
// to dynamic import that Node auto-handles under --experimental.
register("./ts-loader.mjs", import.meta.url);

const ROOT = new URL("..", import.meta.url).pathname;

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, p));
    } else {
      out[p] = typeof v;
    }
  }
  return out;
}

// Crude TS-to-JSON extractor. Locale files come in two shapes:
//   const pl = { … } as const;   export default pl;            // PL
//   const uk: typeof plDict = { … };   export default uk;      // others
// Both forms share `const <name>` [optional-type-annotation] `= { … };`.
function loadLocale(name) {
  const src = readFileSync(join(ROOT, "lib", "locales", `${name}.ts`), "utf8");
  const m = src.match(/const\s+\w+(?:\s*:\s*[^=]+?)?\s*=\s*(\{[\s\S]*?\})\s*(?:as\s+const\s*)?;\s*export default/);
  if (!m) throw new Error(`could not extract locale literal from ${name}.ts`);
  // The object is a plain literal (no computed expressions in any of
  // the locale files) — Function-eval is safe; files under our control.
  // eslint-disable-next-line no-new-func
  return new Function(`return (${m[1]});`)();
}

const LOCALES = ["pl", "uk", "cs", "en"];
const data = Object.fromEntries(LOCALES.map((l) => [l, flatten(loadLocale(l))]));

const ref = data.pl;
let issues = 0;
for (const lang of LOCALES.filter((l) => l !== "pl")) {
  const flat = data[lang];
  const missing = Object.keys(ref).filter((k) => !(k in flat));
  const extra = Object.keys(flat).filter((k) => !(k in ref));
  const wrongType = Object.keys(ref).filter(
    (k) => k in flat && ref[k] !== flat[k],
  );
  console.log(
    `[${lang}] keys=${Object.keys(flat).length} missing=${missing.length} extra=${extra.length} wrongType=${wrongType.length}`,
  );
  for (const k of missing.slice(0, 10)) console.log(`  missing: ${k}`);
  if (missing.length > 10) console.log(`  ...and ${missing.length - 10} more`);
  for (const k of extra.slice(0, 10)) console.log(`  extra:   ${k}`);
  for (const k of wrongType.slice(0, 10))
    console.log(`  wrongType: ${k} (pl=${ref[k]}, ${lang}=${flat[k]})`);
  issues += missing.length + extra.length + wrongType.length;
}

process.exit(issues > 0 ? 1 : 0);
