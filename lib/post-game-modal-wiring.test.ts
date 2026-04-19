import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* Cleanup issue 3 — PostGameBreakdown is now actually mounted.
 *
 * The component has existed since V2 R3.4; the UX audit found zero
 * game clients imported it, so the modal never rendered. We wire it
 * into `components/games/round-result.tsx` (the shared result card
 * used by all 9 evergreen + 12 AI game clients), and flag-gate at the
 * server (`/api/score` emits `multBreakdown` only when
 * `v2_post_game_modal` resolves true).
 *
 * File-level asserts here because the runtime modal needs a successful
 * score + a buildings snapshot + the flag — brittle to set up in a
 * vitest unit. These guards protect against an accidental
 * un-import. */

const ROOT = join(__dirname, "..");

describe("issue 3 — PostGameBreakdown wiring", () => {
  it("RoundResult imports PostGameBreakdown", () => {
    const src = readFileSync(
      join(ROOT, "components", "games", "round-result.tsx"),
      "utf8",
    );
    expect(src.includes("PostGameBreakdown")).toBe(true);
    expect(src.includes("@/components/post-game-breakdown")).toBe(true);
  });

  it("RoundResult renders the modal only when multBreakdown is non-null", () => {
    const src = readFileSync(
      join(ROOT, "components", "games", "round-result.tsx"),
      "utf8",
    );
    // Conditional JSX gate — regression check.
    expect(src.includes("multBreakdown &&")).toBe(true);
  });

  it("/api/score respects v2_post_game_modal flag", () => {
    const src = readFileSync(
      join(ROOT, "app", "api", "score", "route.ts"),
      "utf8",
    );
    expect(src.includes("v2_post_game_modal")).toBe(true);
    expect(src.includes("postGameModalEnabled")).toBe(true);
  });

  it("ScoreSuccess type exposes multBreakdown as optional nullable field", () => {
    const src = readFileSync(
      join(ROOT, "lib", "client-api.ts"),
      "utf8",
    );
    expect(src.match(/multBreakdown\?:/)).toBeTruthy();
  });

  it("PostGameBreakdown component still exports its named function", () => {
    const src = readFileSync(
      join(ROOT, "components", "post-game-breakdown.tsx"),
      "utf8",
    );
    expect(src.match(/export function PostGameBreakdown/)).toBeTruthy();
  });
});
