#!/usr/bin/env node
// Phase 2 — static analysis of every app/api/**/route.ts.
// Enumerates exported HTTP handlers, detects auth/admin/cron gates,
// CSRF exemption, rate-limit usage. Emits a JSON inventory consumed
// by the accompanying vitest suite which exercises each row.
//
// Run: node scripts/audit-api-contracts.mjs > tmp/api-inventory.json

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const API_ROOT = join(ROOT, "app", "api");
const CSRF_SHARED = join(ROOT, "lib", "csrf-shared.ts");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (entry === "route.ts") out.push(p);
  }
  return out;
}

function routePathFor(filePath) {
  // /app/api/foo/[id]/route.ts → /api/foo/[id]
  const rel = relative(join(ROOT, "app"), filePath);
  return "/" + rel.split(sep).slice(0, -1).join("/");
}

function readExemptPrefixes() {
  const src = readFileSync(CSRF_SHARED, "utf8");
  const match = src.match(/EXEMPT_PATH_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  if (!match) throw new Error("could not parse EXEMPT_PATH_PREFIXES");
  return Array.from(match[1].matchAll(/"([^"]+)"/g)).map((m) => m[1]);
}

function analyseRoute(filePath) {
  const src = readFileSync(filePath, "utf8");
  const methods = [];
  for (const m of ["GET", "POST", "PATCH", "PUT", "DELETE"]) {
    // Match `export async function METHOD` or `export const METHOD =`
    const re = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\b`,
    );
    if (re.test(src)) methods.push(m);
  }
  return {
    path: routePathFor(filePath),
    file: relative(ROOT, filePath),
    methods,
    // Heuristic tags — these drive the runtime harness's expected
    // status codes. All keyed off source patterns that the codebase
    // uses consistently (getSession / ADMIN_SECRET / CRON_SECRET).
    usesSession:
      /\bgetSession\s*\(/.test(src) || /from\s+["']@\/lib\/session["']/.test(src),
    requiresAdminSecret: /ADMIN_SECRET|adminAuth|bearerAuth\(|requireAdmin/.test(src),
    requiresCronSecret: /CRON_SECRET|cronAuth|requireCronAuth/.test(src),
    usesRateLimit: /rate-limit|rateLimit|checkRateLimit|withRateLimit/.test(src),
    usesZod: /\bz\s*\.\s*object|\.safeParse\b/.test(src),
  };
}

const exempt = readExemptPrefixes();
const isExempt = (p) => exempt.some((pref) => p.startsWith(pref));

const routes = walk(API_ROOT)
  .sort()
  .map((f) => {
    const row = analyseRoute(f);
    return { ...row, csrfExempt: isExempt(row.path) };
  });

const outDir = join(ROOT, "tmp");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "api-inventory.json"),
  JSON.stringify({ exempt, routes }, null, 2),
);

// Human-friendly table summary for the session log.
const headers = [
  "path",
  "methods",
  "session",
  "admin",
  "cron",
  "csrfExempt",
  "zod",
  "rateLimit",
];
const rows = [headers];
for (const r of routes) {
  rows.push([
    r.path,
    r.methods.join("+"),
    r.usesSession ? "Y" : "",
    r.requiresAdminSecret ? "Y" : "",
    r.requiresCronSecret ? "Y" : "",
    r.csrfExempt ? "Y" : "",
    r.usesZod ? "Y" : "",
    r.usesRateLimit ? "Y" : "",
  ]);
}
const widths = headers.map((_, i) => Math.max(...rows.map((r) => r[i].length)));
for (const r of rows) {
  // eslint-disable-next-line no-console
  console.log(r.map((cell, i) => cell.padEnd(widths[i])).join("  "));
}
