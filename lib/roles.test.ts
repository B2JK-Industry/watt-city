import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, kvSet } from "@/lib/redis";
import {
  getRole,
  createClass,
  joinClass,
  setCurriculum,
  setQOfWeek,
  getClass,
  generateChildLinkCode,
  linkParent,
  listChildren,
  listParents,
  isParentOf,
  readChildParentPrivacy,
  writeChildParentPrivacy,
} from "./roles";

async function primeUser(u: string) {
  await kvSet(`xp:user:${u}`, { username: u });
  await kvDel(`xp:user:${u}:role`);
  await kvDel(`xp:parent:${u}:children`);
  await kvDel(`xp:child:${u}:parents`);
}

describe("class mode", () => {
  beforeEach(async () => {
    await primeUser("mrskowalska");
    await primeUser("student1");
    await primeUser("student2");
  });

  it("createClass sets teacher role + 30 join codes", async () => {
    const cls = await createClass("mrskowalska", "Klasa 7A");
    expect(cls.teacher).toBe("mrskowalska");
    expect(cls.joinCodes.length).toBe(30);
    expect(cls.code.length).toBeGreaterThan(4);
    expect(await getRole("mrskowalska")).toBe("teacher");
  });

  it("joinClass consumes a code once", async () => {
    const cls = await createClass("mrskowalska", "Klasa 7A");
    const code = cls.joinCodes[0];
    const r1 = await joinClass("student1", code);
    expect(r1.ok).toBe(true);
    const r2 = await joinClass("student2", code);
    expect(r2.ok).toBe(false);
    if (r2.ok) return;
    expect(r2.error).toBe("code-used");
  });

  it("setCurriculum rejects non-owner", async () => {
    const cls = await createClass("mrskowalska", "Klasa 7A");
    const r = await setCurriculum("student1", cls.code, ["savings"]);
    expect(r.ok).toBe(false);
  });

  it("setQOfWeek persists on class record", async () => {
    const cls = await createClass("mrskowalska", "Klasa 7A");
    await setQOfWeek("mrskowalska", cls.code, "BLIK — kody");
    const fresh = await getClass(cls.code);
    expect(fresh?.qOfWeekTheme).toBe("BLIK — kody");
  });
});

describe("parent linkage", () => {
  beforeEach(async () => {
    await primeUser("kid");
    await primeUser("mom");
    await primeUser("dad");
  });

  it("linkParent bidirectional after kid generates code", async () => {
    const code = await generateChildLinkCode("kid");
    const r = await linkParent("mom", code);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.child).toBe("kid");
    expect(await listChildren("mom")).toContain("kid");
    expect(await listParents("kid")).toContain("mom");
    expect(await getRole("mom")).toBe("parent");
    expect(await isParentOf("mom", "kid")).toBe(true);
    expect(await isParentOf("dad", "kid")).toBe(false);
  });

  it("same code cannot be used twice", async () => {
    const code = await generateChildLinkCode("kid");
    await linkParent("mom", code);
    const r = await linkParent("dad", code);
    expect(r.ok).toBe(false);
  });

  it("child privacy defaults to all-visible", async () => {
    const p = await readChildParentPrivacy("kid");
    expect(p.hideLedger).toBe(false);
    expect(p.hideDuelHistory).toBe(false);
    expect(p.hideBuildings).toBe(false);
  });

  it("writeChildParentPrivacy merges patch", async () => {
    await writeChildParentPrivacy("kid", { hideLedger: true });
    const p = await readChildParentPrivacy("kid");
    expect(p.hideLedger).toBe(true);
    expect(p.hideBuildings).toBe(false);
  });
});
