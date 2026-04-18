/* Minimal A/B framework — Phase 5.5.3.
 *
 * Per-user-per-experiment bucket lookup. The assignment function is a
 * deterministic hash over `${username}:${experiment}` split into N
 * variants. That means:
 *   - No server-side storage required (deterministic mapping).
 *   - Experiments can be added/removed without migration.
 *   - Assignment is stable across sessions for the same username.
 *
 * An experiment declaration lives in `EXPERIMENTS` below. New experiments
 * land via a code commit; admins can override an experiment's `active`
 * flag via `xp:config:experiments` overlay (Phase 5.1 surface).
 */

import { kvGet } from "@/lib/redis";

export type Experiment = {
  id: string;
  /** Ordered variants. Defaults: ["control", "treatment"]. */
  variants: string[];
  /** When false, every user falls into variants[0]. Admin-toggleable. */
  active: boolean;
  description: string;
};

export const EXPERIMENTS: Record<string, Experiment> = {
  // Ship-it-now example: whether to show the tier-up celebration on mobile
  // as a modal vs inline toast. Control = modal (current); treatment =
  // inline. (Not yet wired to UI — demonstrates the framework.)
  "tier-up-mobile": {
    id: "tier-up-mobile",
    variants: ["modal", "inline"],
    active: true,
    description: "Tier-up reveal on screens <640px wide.",
  },
  // Another: mortgage dialog copy wording.
  "mortgage-copy": {
    id: "mortgage-copy",
    variants: ["default", "rrso-first"],
    active: false, // waiting for pilot data
    description: "Is 'RRSO' or 'APR' the primary label in the take-loan dialog?",
  },
};

const OVERRIDE_KEY = "xp:config:experiments";

export async function activeExperiments(): Promise<Record<string, Experiment>> {
  const override = await kvGet<Record<string, Partial<Experiment>>>(OVERRIDE_KEY);
  if (!override) return EXPERIMENTS;
  const merged: Record<string, Experiment> = { ...EXPERIMENTS };
  for (const [id, patch] of Object.entries(override)) {
    if (merged[id]) merged[id] = { ...merged[id], ...patch };
  }
  return merged;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function bucketOf(
  username: string,
  experiment: Experiment,
): string {
  if (!experiment.active) return experiment.variants[0];
  const idx = hash(`${username}:${experiment.id}`) % experiment.variants.length;
  return experiment.variants[idx];
}

export async function resolveBucketAsync(
  username: string,
  experimentId: string,
): Promise<string> {
  const map = await activeExperiments();
  const ex = map[experimentId];
  if (!ex) return "control";
  return bucketOf(username, ex);
}
