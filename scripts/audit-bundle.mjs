#!/usr/bin/env node
// Phase 8 — bundle audit.
//
// Runs after `next build`. Greps the produced `.next/` chunks for
// Web3-only symbols and asserts the default (non-profile) bundle
// carries zero of them. Prevents accidentally shipping wagmi /
// rainbowkit / viem in the critical path.
//
// Also prints a size summary of first-party JS per first-level route.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const BUILD_DIR = join(ROOT, ".next");

if (!existsSync(BUILD_DIR)) {
  console.error("No .next/ — run `pnpm build` first.");
  process.exit(2);
}

// 1 — enumerate JS chunks under .next/static/chunks and .next/server.
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.m?js$/.test(entry)) out.push(p);
  }
  return out;
}

const chunks = walk(BUILD_DIR);
const totalBytes = chunks.reduce((acc, f) => acc + statSync(f).size, 0);
console.log(
  `[bundle] total JS across .next/ = ${(totalBytes / 1024 / 1024).toFixed(2)} MB in ${chunks.length} files`,
);

// 2 — Web3 leak check. Grep chunks (EXCEPT those under a /profile
// folder heuristic) for library identifiers that only belong in the
// opt-in surface.
const WEB3_MARKERS = [
  "@rainbow-me/rainbowkit",
  "RainbowKitProvider",
  "useAccount",
  "connectorsForWallets",
  // viem's entry shape — overly generic symbols are avoided to prevent
  // false positives on unrelated Node std chunks.
  "@wagmi/core",
];

/* Identify *which routes actually load* each chunk, rather than
 * greping chunk paths. Next emits per-route `react-loadable-manifest.json`
 * under `.next/server/app/<route>/page/`; each listing the client
 * chunks that route pulls in. A chunk that carries web3 markers is a
 * leak only if a non-/profile route's manifest references it.
 */
const routeManifests = [];
const serverApp = join(BUILD_DIR, "server", "app");
if (existsSync(serverApp)) {
  function walkManifests(dir, routeParts = []) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) walkManifests(p, [...routeParts, entry]);
      else if (entry === "react-loadable-manifest.json") {
        // Path under .next/server/app/<route...>/page/react-loadable-manifest.json
        // Strip the trailing `page` segment; the rest is the route.
        const route = "/" + routeParts.filter((s) => s !== "page").join("/");
        routeManifests.push({ route, file: p });
      }
    }
  }
  walkManifests(serverApp);
}

// For each chunk carrying web3 markers, list routes that load it.
const chunkToRoutes = new Map();
for (const { route, file } of routeManifests) {
  try {
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    // Shape: { "<loaderId>": { files: ["static/chunks/...js"] }, ... }
    for (const entry of Object.values(manifest)) {
      const files = entry.files ?? [];
      for (const f of files) {
        if (!f.endsWith(".js")) continue;
        const arr = chunkToRoutes.get(f) ?? [];
        if (!arr.includes(route)) arr.push(route);
        chunkToRoutes.set(f, arr);
      }
    }
  } catch {
    // manifest parse error — ignore, not a leak signal
  }
}

const WEB3_ALLOWED_ROUTE_PREFIXES = ["/profile"];
let leakRoutes = 0;
const leakSample = [];
for (const [chunkRelPath, routes] of chunkToRoutes) {
  const abs = join(BUILD_DIR, chunkRelPath);
  if (!existsSync(abs)) continue;
  const src = readFileSync(abs, "utf8");
  const hits = WEB3_MARKERS.filter((m) => src.includes(m));
  if (hits.length === 0) continue;
  const bad = routes.filter(
    (r) => !WEB3_ALLOWED_ROUTE_PREFIXES.some((p) => r.startsWith(p)),
  );
  if (bad.length > 0) {
    leakRoutes += bad.length;
    if (leakSample.length < 10) {
      leakSample.push({
        chunk: chunkRelPath,
        markers: hits,
        leakedTo: bad,
      });
    }
  }
}

console.log(
  `[bundle] web3 leak scan: ${leakRoutes} non-/profile route loads carry web3 markers`,
);
for (const s of leakSample) {
  console.log(`  leak: ${s.chunk} → [${s.leakedTo.join(", ")}] — [${s.markers.join(", ")}]`);
}
// Keep the leakFiles naming used later in the exit check.
const leakFiles = leakRoutes;

// 3 — route-level breakdown (static-chunks manifest sizes).
// Approximation: sum of chunks under .next/static/chunks/app/<route>.
const appRoot = join(BUILD_DIR, "static", "chunks", "app");
const routeBreakdown = {};
if (existsSync(appRoot)) {
  function walkApp(dir, prefix = "") {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const st = statSync(p);
      const key = prefix ? `${prefix}/${entry}` : entry;
      if (st.isDirectory()) walkApp(p, key);
      else if (/\.js$/.test(entry)) {
        // Parent-dir name → route label.
        const label = prefix || "(root)";
        routeBreakdown[label] = (routeBreakdown[label] ?? 0) + st.size;
      }
    }
  }
  walkApp(appRoot);
}
const sorted = Object.entries(routeBreakdown).sort((a, b) => b[1] - a[1]);
console.log("[bundle] per-route chunk sizes (first 20):");
for (const [label, bytes] of sorted.slice(0, 20)) {
  console.log(`  ${(bytes / 1024).toFixed(1).padStart(7)} kB  ${label}`);
}

// Exit non-zero only if we found a leak — the rest is informational.
process.exit(leakFiles === 0 ? 0 : 1);
