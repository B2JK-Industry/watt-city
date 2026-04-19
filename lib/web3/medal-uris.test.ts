import { describe, it, expect } from "vitest";
import { Buffer } from "node:buffer";
import { MEDAL_URIS } from "./medal-uris";
import { ACHIEVEMENT_DEFS, type AchievementId } from "@/lib/achievements";

/* W3 guard — MEDAL_URIS must stay exhaustive + well-formed.
 *
 * Every AchievementId in lib/achievements.ts needs a URI. The URI must
 * be either a data URI (default, offline-safe) or ipfs://<cid> (after
 * scripts/upload-medal-metadata.ts re-hosts). If someone adds a new
 * achievement and forgets to re-run scripts/build-medal-metadata.ts,
 * this guard fails CI.
 */

describe("W3 — MEDAL_URIS exhaustiveness + validity", () => {
  const ids = Object.keys(ACHIEVEMENT_DEFS) as AchievementId[];

  it("every AchievementId has an entry", () => {
    for (const id of ids) {
      expect(MEDAL_URIS[id], `missing URI for ${id}`).toBeTruthy();
    }
  });

  it("no entry is an empty string", () => {
    for (const id of ids) {
      expect(MEDAL_URIS[id]).not.toBe("");
    }
  });

  it("every entry is a data URI or ipfs:// URI", () => {
    for (const id of ids) {
      const uri = MEDAL_URIS[id];
      const ok =
        uri.startsWith("data:application/json;base64,") ||
        uri.startsWith("ipfs://");
      expect(ok, `${id} URI has unexpected scheme: ${uri.slice(0, 40)}`).toBe(true);
    }
  });

  it("data URIs decode to valid ERC-721 metadata", () => {
    for (const id of ids) {
      const uri = MEDAL_URIS[id];
      if (!uri.startsWith("data:application/json;base64,")) continue;
      const b64 = uri.slice("data:application/json;base64,".length);
      const json = Buffer.from(b64, "base64").toString("utf8");
      const parsed = JSON.parse(json) as {
        name?: string;
        description?: string;
        image?: string;
        attributes?: Array<{ trait_type: string; value: string }>;
      };
      expect(parsed.name, `${id}.name`).toBeTruthy();
      expect(parsed.description, `${id}.description`).toBeTruthy();
      expect(parsed.image, `${id}.image`).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(parsed.attributes, `${id}.attributes`).toBeTruthy();
      const traitIds = parsed.attributes!.map((a) => a.trait_type);
      for (const required of ["achievementId", "category", "rarity", "soulbound"]) {
        expect(traitIds, `${id} missing trait ${required}`).toContain(required);
      }
      // Sanity: the achievementId trait matches the map key.
      const idTrait = parsed.attributes!.find((a) => a.trait_type === "achievementId");
      expect(idTrait?.value, `${id} trait mismatch`).toBe(id);
    }
  });

  it("no URI is absurdly large (< 8 KB keeps gas reasonable)", () => {
    for (const id of ids) {
      expect(MEDAL_URIS[id].length, `${id} URI size`).toBeLessThan(8 * 1024);
    }
  });
});
