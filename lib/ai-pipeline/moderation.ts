/* Pre-publish content filter + content-hash for AI-generated game specs.
 *
 * 5.2.1 Pre-publish filter: rejects a localized spec if any visible-text
 * field contains a denylist term (real names, violence, negative brand
 * mentions, slurs). Keeps the filter fast + deterministic so rotation
 * doesn't stall on one flagged generation.
 *
 * 5.2.6 Content hash: deterministic sha256 over a JSON canonicalised spec
 * so every published game has a stable id we can trace across edits.
 */

import { createHash } from "node:crypto";
import type { AiGame, LocalizedSpec, GameSpec } from "./types";

// Start narrow — false positives are worse than false negatives for a kid
// product. Expand via admin tooling (Phase 5.5 content tooling) when we
// see something land in the reported-queue that the filter missed.
const REAL_PERSON_PATTERNS: RegExp[] = [
  /\bElon Musk\b/i,
  /\bVladimir Putin\b/i,
  /\bDonald Trump\b/i,
  /\bAndrzej Duda\b/i,
  /\bRobert Lewandowski\b/i, // avoid implying endorsement
];

const BRAND_NEGATIVE_PATTERNS: RegExp[] = [
  /\bPKO.*?(oszustwo|mafia|złodzieje|pranie pieniędzy|money laundering|scam|fraud)\b/i,
  /\bNBP.*?(oszustwo|mafia|scam)\b/i,
  /\bTauron.*?(oszustwo|złodzieje|scam)\b/i,
];

// Polish diacritics break JS's \b word-boundary (it's ASCII-only). Use a
// lookahead/lookbehind on ASCII-or-Polish letter set instead.
const PL_NONWORD = "(^|[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9_])";
const PL_NONWORD_END = "(?=$|[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9_])";

const VIOLENCE_PATTERNS: RegExp[] = [
  new RegExp(`${PL_NONWORD}zabi[jćłlaiąę]\\w*${PL_NONWORD_END}`, "i"),
  /\bmorderst\w+\b/i,
  /\bsuicide\b/i,
  new RegExp(`${PL_NONWORD}samobójst\\w+${PL_NONWORD_END}`, "i"),
  /\bkill.*?yourself\b/i,
];

const SLUR_PATTERNS: RegExp[] = [
  /\bkurwa\b/i,
  /\bfuck\b/i,
  /\bshit\b/i,
  /\bpiz[dz]a\b/i,
  /\bchuj\b/i,
];

export type ModerationFinding = {
  category: "real-person" | "brand-negative" | "violence" | "slur";
  pattern: string;
  field: string; // e.g. "pl.items[0].prompt"
  sample: string;
};

function walkStrings(
  obj: unknown,
  path: string,
  visit: (s: string, p: string) => void,
): void {
  if (typeof obj === "string") {
    visit(obj, path);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkStrings(v, `${path}[${i}]`, visit));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      walkStrings(v, path ? `${path}.${k}` : k, visit);
    }
  }
}

export function moderateSpec(spec: LocalizedSpec): ModerationFinding[] {
  const findings: ModerationFinding[] = [];
  const checks: Array<{ category: ModerationFinding["category"]; list: RegExp[] }> = [
    { category: "real-person", list: REAL_PERSON_PATTERNS },
    { category: "brand-negative", list: BRAND_NEGATIVE_PATTERNS },
    { category: "violence", list: VIOLENCE_PATTERNS },
    { category: "slur", list: SLUR_PATTERNS },
  ];
  walkStrings(spec, "", (s, path) => {
    for (const { category, list } of checks) {
      for (const p of list) {
        if (p.test(s)) {
          findings.push({
            category,
            pattern: p.source,
            field: path,
            sample: s.slice(0, 80),
          });
        }
      }
    }
  });
  return findings;
}

// ---------------------------------------------------------------------------
// Content hash (5.2.6)
// ---------------------------------------------------------------------------

/** Deterministic JSON.stringify — sorts keys so `{a:1,b:2}` and `{b:2,a:1}`
 *  produce the same string. Arrays keep their order. */
export function canonicalise(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalise).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(",")}}`;
}

export function contentHash(spec: GameSpec | LocalizedSpec): string {
  return createHash("sha256").update(canonicalise(spec)).digest("hex");
}

/** Overlay a moderation trailer on the game envelope so admin surfaces
 *  can show it inline. Not stored back to the envelope unless rejected. */
export function reviewEnvelope(game: AiGame): {
  contentHash: string;
  findings: ModerationFinding[];
  blocking: boolean;
} {
  const findings = moderateSpec(game.spec as LocalizedSpec);
  // Any slur / violence / real-person / negative-brand finding blocks
  // publish — the list is deliberately narrow so blocking rarely fires.
  const blocking = findings.length > 0;
  return {
    contentHash: contentHash(game.spec as LocalizedSpec),
    findings,
    blocking,
  };
}
