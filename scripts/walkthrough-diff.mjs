#!/usr/bin/env node
/* Diff two `WALKTHROUGH_LABEL=<name> pnpm test:walk` runs.
 *
 * Reads `tmp/walkthrough-shots/<labelA>/_findings.json` and the same
 * for labelB, then prints:
 *   - per-run summary (routes, a11y serious, console errors, page errors)
 *   - delta counts
 *   - PNG-only-in-A and PNG-only-in-B (cheap proxy for routes added/removed)
 *
 * Usage:
 *   node scripts/walkthrough-diff.mjs <labelA> <labelB>
 *
 * Pixel-level visual diff is intentionally out of scope — for that,
 * pair this with `pixelmatch` or open the PNGs side by side.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error("Usage: node scripts/walkthrough-diff.mjs <labelA> <labelB>");
  process.exit(1);
}

const root = path.resolve(process.cwd(), "tmp/walkthrough-shots");
const aDir = path.join(root, a);
const bDir = path.join(root, b);

if (!existsSync(aDir) || !existsSync(bDir)) {
  console.error(`Missing dir: ${!existsSync(aDir) ? aDir : bDir}`);
  process.exit(1);
}

const aFindings = JSON.parse(readFileSync(path.join(aDir, "_findings.json"), "utf8"));
const bFindings = JSON.parse(readFileSync(path.join(bDir, "_findings.json"), "utf8"));

const summary = (f) => ({
  routes: f.length,
  a11y: f.reduce((s, r) => s + r.a11ySerious.length, 0),
  console: f.reduce((s, r) => s + r.consoleErrors.length, 0),
  page: f.reduce((s, r) => s + r.pageErrors.length, 0),
});

const sa = summary(aFindings);
const sb = summary(bFindings);

console.log(`A=${a}: ${JSON.stringify(sa)}`);
console.log(`B=${b}: ${JSON.stringify(sb)}`);
console.log(`Δ a11y:    ${sb.a11y - sa.a11y}`);
console.log(`Δ console: ${sb.console - sa.console}`);
console.log(`Δ page:    ${sb.page - sa.page}`);

const aShots = readdirSync(aDir).filter((f) => f.endsWith(".png"));
const bShots = readdirSync(bDir).filter((f) => f.endsWith(".png"));
const onlyA = aShots.filter((f) => !bShots.includes(f));
const onlyB = bShots.filter((f) => !aShots.includes(f));
if (onlyA.length) console.log(`Only in A: ${onlyA.join(", ")}`);
if (onlyB.length) console.log(`Only in B: ${onlyB.join(", ")}`);
if (!onlyA.length && !onlyB.length) console.log("PNG names match between A and B.");

// Per-route a11y delta — surface routes that gained findings.
const aByRoute = new Map(aFindings.map((r) => [`${r.viewport}__${r.route}`, r.a11ySerious.length]));
const regressions = [];
for (const r of bFindings) {
  const key = `${r.viewport}__${r.route}`;
  const before = aByRoute.get(key) ?? 0;
  if (r.a11ySerious.length > before) {
    regressions.push({ key, before, after: r.a11ySerious.length, ids: r.a11ySerious.map((x) => x.id) });
  }
}
if (regressions.length) {
  console.log("\nA11y regressions:");
  for (const r of regressions) {
    console.log(`  ${r.key}: ${r.before} → ${r.after} (${r.ids.join(", ")})`);
  }
}
