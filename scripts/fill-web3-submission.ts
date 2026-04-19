#!/usr/bin/env tsx
/* Post-deploy placeholder filler for Web3 submission docs.
 *
 * Run after W2 (contract deploy) + W5 (demo URL) + video upload. Reads
 * deployment artefacts from `docs/web3/DEPLOYMENTS.md` + env overrides
 * + command-line flags, substitutes every `{{TOKEN}}` in the tracked
 * files, and writes them back in place.
 *
 * Usage:
 *   pnpm tsx scripts/fill-web3-submission.ts \
 *     --demo-url=https://watt-city.vercel.app \
 *     --video-url=https://youtu.be/abc123 \
 *     --contact=hello@b2jk.industries
 *
 * Or via env vars WEB3_DEMO_URL / WEB3_VIDEO_URL / WEB3_CONTACT_EMAIL.
 *
 * Safety: refuses to overwrite if any token would remain `{{…}}`. Run
 * `scripts/check-placeholders.sh` separately to verify the result.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type TokenMap = Record<string, string>;

const ROOT = join(__dirname, "..");

const TRACKED_FILES = [
  "docs/web3/SUBMISSION.md",
  "docs/web3/DEPLOYMENTS.md",
  "README.md",
];

/** Parse `docs/web3/DEPLOYMENTS.md` for the Base Sepolia row. Expected
 * format is a standard markdown table with the headers Contract,
 * Address, BaseScan, Deployer EOA, Block, Timestamp. Returns `null` if
 * not yet populated (placeholders still present). */
function readDeploymentsFromDoc(): Partial<TokenMap> | null {
  const path = join(ROOT, "docs/web3/DEPLOYMENTS.md");
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  if (raw.includes("{{CONTRACT_ADDRESS}}")) return null;

  const row = raw.match(
    /\|\s*WattCityMedal\s*\|\s*(0x[a-fA-F0-9]{40})\s*\|\s*(https?:\S+)\s*\|/,
  );
  const deployer = raw.match(/Deployer EOA:\s*(0x[a-fA-F0-9]{40})/);
  const block = raw.match(/Deployed at block:\s*(\d+)/);
  const timestamp = raw.match(/Deployed at:\s*([\d\-:\sTZ+]+)/);

  if (!row) return null;
  return {
    CONTRACT_ADDRESS: row[1],
    BASESCAN_URL: row[2],
    DEPLOYER_ADDRESS: deployer?.[1] ?? "",
    DEPLOY_BLOCK: block?.[1] ?? "",
    DEPLOY_TIMESTAMP: timestamp?.[1]?.trim() ?? "",
  };
}

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((a) => a.startsWith(prefix));
  return match?.slice(prefix.length);
}

function resolveTokens(): TokenMap {
  // Chain constants — only Base Sepolia is valid for this submission per
  // hard constraint in docs/WEB3-AGENT-KICKOFF.md (mainnet audit-gated).
  const chain = {
    CHAIN_NAME: "Base Sepolia",
    CHAIN_ID: "84532",
  };

  const deployment = readDeploymentsFromDoc() ?? {};

  const operator: Partial<TokenMap> = {
    DEMO_URL: arg("demo-url") ?? process.env.WEB3_DEMO_URL ?? "",
    VIDEO_URL: arg("video-url") ?? process.env.WEB3_VIDEO_URL ?? "",
    CONTACT_EMAIL:
      arg("contact") ?? process.env.WEB3_CONTACT_EMAIL ?? "",
    REPO_URL: "https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026",
  };

  // Merge in precedence order: chain < deployment-doc < operator/CLI.
  return {
    ...chain,
    ...deployment,
    ...operator,
  } as TokenMap;
}

function substitute(content: string, tokens: TokenMap): string {
  let out = content;
  for (const [key, value] of Object.entries(tokens)) {
    if (!value) continue; // leave `{{KEY}}` in place if not provided
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    out = out.replace(re, value);
  }
  return out;
}

function listRemainingTokens(content: string): string[] {
  const found = content.match(/\{\{[A-Z_]+\}\}/g) ?? [];
  return [...new Set(found)];
}

function main() {
  const tokens = resolveTokens();
  const filled: Record<string, number> = {};
  const stillMissing: Record<string, string[]> = {};

  for (const relPath of TRACKED_FILES) {
    const abs = join(ROOT, relPath);
    let raw: string;
    try {
      raw = readFileSync(abs, "utf8");
    } catch {
      console.warn(`skip: ${relPath} (not found)`);
      continue;
    }
    const next = substitute(raw, tokens);
    if (next !== raw) {
      writeFileSync(abs, next);
      const replaced = (raw.match(/\{\{[A-Z_]+\}\}/g) ?? []).length;
      const remaining = (next.match(/\{\{[A-Z_]+\}\}/g) ?? []).length;
      filled[relPath] = replaced - remaining;
    }
    const left = listRemainingTokens(next);
    if (left.length > 0) stillMissing[relPath] = left;
  }

  console.log("\nWeb3 submission fill report");
  console.log("─".repeat(40));
  for (const [file, n] of Object.entries(filled)) {
    console.log(`  filled: ${file} (${n} token${n === 1 ? "" : "s"})`);
  }
  if (Object.keys(stillMissing).length === 0) {
    console.log("\n✅ All placeholders filled. Ready for submission.");
    return;
  }
  console.log("\n⚠️  Still-pending placeholders:");
  for (const [file, tokens] of Object.entries(stillMissing)) {
    console.log(`  ${file}`);
    for (const t of tokens) console.log(`    ${t}`);
  }
  console.log(
    "\nRerun with the missing values, e.g.:\n" +
      '  pnpm tsx scripts/fill-web3-submission.ts \\\n' +
      '    --demo-url=https://watt-city.vercel.app \\\n' +
      '    --video-url=https://youtu.be/XXXXXXXX \\\n' +
      '    --contact=hello@b2jk.industries',
  );
  process.exitCode = 1;
}

main();
