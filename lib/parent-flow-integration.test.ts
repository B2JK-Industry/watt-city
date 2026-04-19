import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { kvDel, sMembers } from "@/lib/redis";
import {
  issueParentCode,
  redeemParentCode,
  parentKidUsername,
  listParentsOf,
  PARENT_LINKS_KEY,
  KID_OF_PARENT_KEY,
} from "@/lib/parent-link";

/* Cleanup issue 4 — full V4.6 parent-observer flow is reachable from
 * the UI. The backend tests in `parent-link.test.ts` already cover the
 * redis-level logic; these tests guard the wiring that was missing (no
 * "Generate code" button on /profile) + the files the audit flagged as
 * reverted. */

const ROOT = join(__dirname, "..");

describe("V4.6 file inventory (cleanup issue 4)", () => {
  const files = [
    "app/rodzic/page.tsx",
    "app/rodzic/dolacz/page.tsx",
    "app/api/rodzic/code/route.ts",
    "app/api/rodzic/dolacz/route.ts",
    "components/parent-digest-card.tsx",
    "components/parent-invite-card.tsx",
    "lib/parent-link.ts",
  ];
  for (const f of files) {
    it(`${f} is present in the tree`, () => {
      expect(() => readFileSync(join(ROOT, f), "utf8")).not.toThrow();
    });
  }

  it("profile page mounts ParentInviteCard", () => {
    const src = readFileSync(join(ROOT, "app", "profile", "page.tsx"), "utf8");
    expect(src.includes("ParentInviteCard")).toBe(true);
    expect(src.includes('@/components/parent-invite-card')).toBe(true);
  });

  it("ParentInviteCard POSTs to /api/rodzic/code (confirmed wire target)", () => {
    const src = readFileSync(
      join(ROOT, "components", "parent-invite-card.tsx"),
      "utf8",
    );
    expect(src.includes("/api/rodzic/code")).toBe(true);
    expect(src.match(/method:\s*"POST"/)).toBeTruthy();
  });
});

describe("V4.6 end-to-end redis flow (cleanup issue 4)", () => {
  const kid = "Anna_cleanup_issue4";
  const parent = "parent-of-anna-issue4";

  beforeEach(async () => {
    await Promise.all([
      kvDel(PARENT_LINKS_KEY(kid)),
      kvDel(KID_OF_PARENT_KEY(parent)),
    ]);
    for (const m of await sMembers(PARENT_LINKS_KEY(kid))) {
      await kvDel(m);
    }
  });

  it("kid issues code → parent redeems → parent linked to kid", async () => {
    const { code, expiresAt } = await issueParentCode(kid);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(expiresAt - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);

    const redeem = await redeemParentCode(code, parent);
    expect(redeem.ok).toBe(true);
    if (redeem.ok) expect(redeem.kidUsername).toBe(kid);

    expect(await parentKidUsername(parent)).toBe(kid);
    expect(await listParentsOf(kid)).toContain(parent);
  });
});
