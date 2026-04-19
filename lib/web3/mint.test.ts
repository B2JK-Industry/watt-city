import { describe, it, expect } from "vitest";
import { keccak256, stringToBytes } from "viem";
import { tokenIdFor, tokenIdToString, tokenIdFromString } from "./mint";

/* W4 guard — tokenId derivation must be deterministic AND collision-
 * resistant across the (username, achievementId) space. Other mint.ts
 * surface is exercised end-to-end by the route tests in
 * app/api/web3/mint/route.test.ts. */

describe("W4 — tokenIdFor determinism + collision shape", () => {
  it("is purely deterministic", () => {
    expect(tokenIdFor("alice", "first-mortgage-paid")).toBe(
      tokenIdFor("alice", "first-mortgage-paid"),
    );
  });

  it("differs per-user", () => {
    const a = tokenIdFor("alice", "first-mortgage-paid");
    const b = tokenIdFor("bob", "first-mortgage-paid");
    expect(a).not.toBe(b);
  });

  it("differs per-achievement", () => {
    const a = tokenIdFor("alice", "first-mortgage-paid");
    const b = tokenIdFor("alice", "streak-30");
    expect(a).not.toBe(b);
  });

  it("matches keccak256(username:achievementId) as a bigint", () => {
    const hash = keccak256(stringToBytes("alice:streak-30"));
    expect(tokenIdFor("alice", "streak-30")).toBe(BigInt(hash));
  });

  it("roundtrips via tokenIdToString + tokenIdFromString", () => {
    const orig = tokenIdFor("demo-teacher-pl", "all-slots-filled");
    expect(tokenIdFromString(tokenIdToString(orig))).toBe(orig);
  });
});
