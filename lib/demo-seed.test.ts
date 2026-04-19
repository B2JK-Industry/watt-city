import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, sMembers } from "@/lib/redis";
import {
  seedDemoSchool,
  teardownDemoSchool,
  isDemoSeedPresent,
  DEMO_TEACHER_USERNAME,
  DEMO_SEED_SENTINEL,
} from "./demo-seed";
import { getClass, getTeacher, classOfStudent } from "./class";
import { getPlayerState } from "./player";

async function hardReset() {
  // Wipe sentinel + any lingering demo state so each test run is fresh.
  await teardownDemoSchool().catch(() => null);
  await kvDel(DEMO_SEED_SENTINEL);
  for (const id of await sMembers("xp:class:index")) {
    await kvDel(`xp:class:${id}`);
  }
  await kvDel("xp:class:index");
}

describe("V4.4 demo-seed endpoint", () => {
  beforeEach(hardReset);

  it("seedDemoSchool creates teacher + class + 30 students", async () => {
    const r = await seedDemoSchool();
    expect(r.teacher).toBe(DEMO_TEACHER_USERNAME);
    expect(r.students.length).toBe(30);
    expect(r.class.joinCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(r.weeks).toBe(4);

    const cls = await getClass(r.class.id);
    expect(cls).not.toBeNull();
    expect(cls?.studentUsernames.length).toBe(30);
    expect(cls?.weeklyTheme).toBeTruthy();

    const teacher = await getTeacher(DEMO_TEACHER_USERNAME);
    expect(teacher?.schoolName).toContain("Katowice");
  });

  it("seedDemoSchool is idempotent (second call returns same class id)", async () => {
    const r1 = await seedDemoSchool();
    const r2 = await seedDemoSchool();
    expect(r2.class.id).toBe(r1.class.id);
    const cls = await getClass(r1.class.id);
    expect(cls?.studentUsernames.length).toBe(30);
  });

  it("isDemoSeedPresent flips true after seed", async () => {
    expect(await isDemoSeedPresent()).toBe(false);
    await seedDemoSchool();
    expect(await isDemoSeedPresent()).toBe(true);
  });

  it("every demo student is linked to the demo class", async () => {
    const r = await seedDemoSchool();
    for (const student of r.students) {
      const linked = await classOfStudent(student);
      expect(linked?.id).toBe(r.class.id);
    }
  });

  it("top-tier students have ledger entries (non-inactive gain resources)", async () => {
    const r = await seedDemoSchool();
    const topStudent = r.students[0]; // Anna_K (top)
    const state = await getPlayerState(topStudent);
    // Starter kit (50c+50b) + simulated games over 4 weeks should push
    // balances well above 50c.
    expect(state.resources.coins).toBeGreaterThan(50);
  });

  it("teardown removes sentinel + class + students", async () => {
    await seedDemoSchool();
    const td = await teardownDemoSchool();
    expect(td.ok).toBe(true);
    expect(await isDemoSeedPresent()).toBe(false);
  });
});
