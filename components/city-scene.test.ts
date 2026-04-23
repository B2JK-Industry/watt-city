import { describe, it, expect } from "vitest";
import {
  resolveLiveAiGameForSlot,
  type CityAiGame,
} from "./city-scene";

// Bug 1 (2026-04-23) — `listActiveAiGames` does NOT filter by
// `validUntil > now`. When an upstream consumer forgot the lazy-rotation
// wrapper, expired envelopes leaked into CityScene's `aiGames` prop and
// rendered as a LIVE-labelled building with a red "EXPIRED" chip.
// `resolveLiveAiGameForSlot` is the pure filter that `ALL_SLOTS.map`
// consults — covering it here fixes the regression in isolation from
// the SVG render tree.
describe("resolveLiveAiGameForSlot — expired envelope is filtered", () => {
  const NOW = 1_700_000_000_000;

  const fresh: CityAiGame = {
    id: "ai-fresh",
    title: "Fresh fast game",
    validUntil: NOW + 60 * 60 * 1000,
    rotationSlot: "fast",
  };
  const expired: CityAiGame = {
    id: "ai-stale",
    title: "Expired fast game",
    validUntil: NOW - 1, // 1 ms past expiry
    rotationSlot: "fast",
  };
  const mediumFresh: CityAiGame = {
    id: "ai-medium",
    title: "Fresh medium game",
    validUntil: NOW + 6 * 60 * 60 * 1000,
    rotationSlot: "medium",
  };

  it("returns the fresh envelope and ignores the expired one", () => {
    const result = resolveLiveAiGameForSlot([expired, fresh], "fast", NOW);
    expect(result?.id).toBe("ai-fresh");
  });

  it("returns undefined when the only candidate for the slot has expired", () => {
    const result = resolveLiveAiGameForSlot([expired], "fast", NOW);
    expect(result).toBeUndefined();
  });

  it("resolves independently across slots — expired fast does not shadow fresh medium", () => {
    const activeAi = [expired, mediumFresh];
    expect(resolveLiveAiGameForSlot(activeAi, "fast", NOW)).toBeUndefined();
    expect(resolveLiveAiGameForSlot(activeAi, "medium", NOW)?.id).toBe(
      "ai-medium",
    );
    expect(resolveLiveAiGameForSlot(activeAi, "slow", NOW)).toBeUndefined();
  });

  it("treats legacy envelopes without rotationSlot as 'fast'", () => {
    const legacy: CityAiGame = {
      id: "ai-legacy",
      title: "Legacy (no slot field)",
      validUntil: NOW + 60 * 60 * 1000,
    };
    expect(resolveLiveAiGameForSlot([legacy], "fast", NOW)?.id).toBe(
      "ai-legacy",
    );
    expect(resolveLiveAiGameForSlot([legacy], "medium", NOW)).toBeUndefined();
  });

  it("rejects an envelope whose validUntil equals now (strict >)", () => {
    const borderline: CityAiGame = {
      id: "ai-edge",
      title: "Borderline",
      validUntil: NOW,
      rotationSlot: "fast",
    };
    expect(resolveLiveAiGameForSlot([borderline], "fast", NOW)).toBeUndefined();
  });
});
