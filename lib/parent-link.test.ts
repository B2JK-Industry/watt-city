import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, sMembers } from "@/lib/redis";
import {
  issueParentCode,
  redeemParentCode,
  parentKidUsername,
  listParentsOf,
  unlinkParent,
  PARENT_CODE_KEY,
  PARENT_LINKS_KEY,
  KID_OF_PARENT_KEY,
} from "./parent-link";

async function reset(kid: string, parent: string) {
  await Promise.all([
    kvDel(PARENT_LINKS_KEY(kid)),
    kvDel(KID_OF_PARENT_KEY(parent)),
  ]);
  // Clear any lingering parent codes from prior runs
  for (const m of await sMembers(PARENT_LINKS_KEY(kid))) {
    await kvDel(PARENT_CODE_KEY(m));
  }
}

describe("V4.6 parent-link flow", () => {
  const kid = "Anna_K_v46";
  const parent = "parent-of-anna";
  beforeEach(() => reset(kid, parent));

  it("issueParentCode returns 6-char code + expiry 24h out", async () => {
    const { code, expiresAt } = await issueParentCode(kid);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(expiresAt).toBeGreaterThan(Date.now());
    expect(expiresAt - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);
  });

  it("redeemParentCode links parent ↔ kid once, then consumes the code", async () => {
    const { code } = await issueParentCode(kid);
    const r1 = await redeemParentCode(code, parent);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.kidUsername).toBe(kid);

    // Code is single-shot — second redeem fails
    const r2 = await redeemParentCode(code, "another-parent");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe("invalid-or-expired");
  });

  it("redeemParentCode is case-insensitive", async () => {
    const { code } = await issueParentCode(kid);
    const r = await redeemParentCode(code.toLowerCase(), parent);
    expect(r.ok).toBe(true);
  });

  it("parent can't re-link to a different kid (one kid per parent MVP)", async () => {
    const { code } = await issueParentCode(kid);
    await redeemParentCode(code, parent);

    const otherKid = "Kuba_M_v46";
    const other = await issueParentCode(otherKid);
    const r = await redeemParentCode(other.code, parent);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("parent-already-linked");
    await unlinkParent(otherKid, parent);
  });

  it("listParentsOf returns every linked parent username", async () => {
    const { code: c1 } = await issueParentCode(kid);
    await redeemParentCode(c1, parent);
    const { code: c2 } = await issueParentCode(kid);
    await redeemParentCode(c2, "parent-two");
    const parents = await listParentsOf(kid);
    expect(parents.sort()).toEqual([parent, "parent-two"].sort());
    await unlinkParent(kid, "parent-two");
  });

  it("parentKidUsername returns the linked kid", async () => {
    const { code } = await issueParentCode(kid);
    await redeemParentCode(code, parent);
    expect(await parentKidUsername(parent)).toBe(kid);
  });

  it("unlinkParent clears both the kid's set and the parent's mapping", async () => {
    const { code } = await issueParentCode(kid);
    await redeemParentCode(code, parent);
    await unlinkParent(kid, parent);
    expect(await parentKidUsername(parent)).toBeNull();
    expect(await listParentsOf(kid)).toEqual([]);
  });

  it("invalid code returns invalid-or-expired", async () => {
    const r = await redeemParentCode("ZZZZZZ", parent);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid-or-expired");
  });
});
