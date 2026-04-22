#!/usr/bin/env node
// Phase 1 backlog #6 — Lighthouse CWV baseline.
//
// Runs Lighthouse against a deployed URL (default:
// https://watt-city.vercel.app) for a fixed set of routes and prints
// a summary table + the full JSON report.
//
// Skips the heavy install: uses `npx lighthouse` which pulls the
// binary on demand. Provides `--routes` / `--url` CLI flags.
//
// Usage:
//   node scripts/lighthouse-baseline.mjs
//   node scripts/lighthouse-baseline.mjs --url https://watt-city.vercel.app --routes /,/games,/leaderboard
//
// Exit codes:
//   0 — all routes met the budget thresholds (or NO budget set)
//   1 — at least one route regressed past a threshold
//   2 — Lighthouse run failed (infrastructure error)

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function parseArgs(argv) {
  const out = { url: "https://watt-city.vercel.app", routes: ["/", "/games", "/leaderboard", "/o-platforme"] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--url" && argv[i + 1]) {
      out.url = argv[++i];
    } else if (argv[i] === "--routes" && argv[i + 1]) {
      out.routes = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return out;
}

const { url, routes } = parseArgs(process.argv);
const outDir = join(process.cwd(), "tmp", "lighthouse");
mkdirSync(outDir, { recursive: true });

/* Budgets are regression guards, not marketing targets. Keyed to the
 * category score (0..1). Missing a threshold = route fails the run. */
const BUDGET = {
  performance: 0.5,
  accessibility: 0.9,
  "best-practices": 0.8,
  seo: 0.8,
};

import { readFileSync as fsReadFile } from "node:fs";

function runLighthouse(route) {
  const target = url.replace(/\/$/, "") + route;
  const out = join(outDir, `${route.replace(/[^a-z0-9]+/gi, "_") || "root"}.json`);
  const result = spawnSync(
    "npx",
    [
      "--yes",
      "lighthouse",
      target,
      "--output=json",
      `--output-path=${out}`,
      "--chrome-flags=--headless=new --no-sandbox",
      "--quiet",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--preset=desktop",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    return { ok: false, route, error: result.stderr.toString().slice(0, 400) };
  }
  return { ok: true, route, reportPath: out };
}

const rows = [];
for (const route of routes) {
  process.stdout.write(`[lh] ${route} … `);
  const r = runLighthouse(route);
  if (!r.ok) {
    process.stdout.write(`FAIL (${r.error})\n`);
    rows.push({ route, ok: false });
    continue;
  }
  const report = JSON.parse(fsReadFile(r.reportPath, "utf8"));
  const scores = {};
  for (const key of Object.keys(BUDGET)) {
    scores[key] = report.categories?.[key]?.score ?? null;
  }
  process.stdout.write(
    `perf=${scores.performance} a11y=${scores.accessibility} bp=${scores["best-practices"]} seo=${scores.seo}\n`,
  );
  rows.push({ route, ok: true, scores });
}

// Summary CSV-style
const lines = [
  "route,performance,accessibility,best_practices,seo,pass",
  ...rows.map((r) => {
    if (!r.ok) return `${r.route},-,-,-,-,ERROR`;
    const pass = Object.entries(BUDGET).every(
      ([k, min]) => r.scores[k] !== null && r.scores[k] >= min,
    );
    return [
      r.route,
      r.scores.performance ?? "-",
      r.scores.accessibility ?? "-",
      r.scores["best-practices"] ?? "-",
      r.scores.seo ?? "-",
      pass ? "PASS" : "FAIL",
    ].join(",");
  }),
];
writeFileSync(join(outDir, "summary.csv"), lines.join("\n") + "\n");

const failing = rows.filter((r) => {
  if (!r.ok) return true;
  return !Object.entries(BUDGET).every(
    ([k, min]) => r.scores[k] !== null && r.scores[k] >= min,
  );
});

console.log("");
console.log(lines.join("\n"));
console.log("");
console.log(`[lh] summary: ${rows.length - failing.length}/${rows.length} routes passed budget`);
console.log(`[lh] reports: ${outDir}`);
process.exit(failing.length === 0 ? 0 : 1);
