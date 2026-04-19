import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, sMembers } from "@/lib/redis";
import {
  createTeacher,
  getTeacher,
  createClass,
  getClass,
  deleteClass,
  listClassesFor,
  findClassByCode,
  joinClass,
  classOfStudent,
  leaveClass,
  setWeeklyTheme,
  currentWeekIso,
  isTeacher,
} from "./class";

async function reset(keys: string[]) {
  await Promise.all(keys.map((k) => kvDel(k)));
}

describe("V4.1 class data model", () => {
  const t = "teacher-alice";
  const students = ["Anna_K", "Kuba_M", "Lena_P"];
  const allKeys = [
    `xp:teacher:${t}`,
    "xp:class:index",
    ...students.map((s) => `xp:student:class:${s}`),
  ];

  beforeEach(async () => {
    await reset(allKeys);
    // Wipe class set contents
    for (const id of await sMembers("xp:class:index")) {
      await kvDel(`xp:class:${id}`);
    }
    await kvDel("xp:class:index");
  });

  it("createTeacher stores the account + isTeacher reports true", async () => {
    expect(await isTeacher(t)).toBe(false);
    await createTeacher({
      username: t,
      displayName: "Alicja Kowalska",
      email: "alicja@szkola.pl",
      schoolName: "SP-12 Katowice",
    });
    expect(await isTeacher(t)).toBe(true);
    const teacher = await getTeacher(t);
    expect(teacher?.schoolName).toBe("SP-12 Katowice");
    expect(teacher?.classIds).toEqual([]);
  });

  it("createTeacher is idempotent — second call returns existing account", async () => {
    await createTeacher({
      username: t,
      displayName: "Alicja",
      email: null,
      schoolName: "SP-12",
    });
    const second = await createTeacher({
      username: t,
      displayName: "Different",
      email: null,
      schoolName: "Other",
    });
    // Returns the original (first call wins)
    expect(second.displayName).toBe("Alicja");
    expect(second.schoolName).toBe("SP-12");
  });

  it("createClass issues a 6-char join code and links the teacher", async () => {
    await createTeacher({
      username: t,
      displayName: "A",
      email: null,
      schoolName: "S",
    });
    const cls = await createClass({
      name: "V.B Matematyka finansowa",
      grade: 5,
      subject: "Matematyka",
      teacherUsername: t,
    });
    expect(cls.joinCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(cls.teacherUsername).toBe(t);
    expect(cls.studentUsernames).toEqual([]);
    const teacher = await getTeacher(t);
    expect(teacher?.classIds).toContain(cls.id);
  });

  it("findClassByCode returns the class, uppercase-insensitive", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const cls = await createClass({
      name: "VI.A", grade: 6, subject: null, teacherUsername: t,
    });
    const hit = await findClassByCode(cls.joinCode.toLowerCase());
    expect(hit?.id).toBe(cls.id);
  });

  it("joinClass adds the student to the roster idempotently", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const cls = await createClass({ name: "C", grade: 7, subject: null, teacherUsername: t });
    const r1 = await joinClass(cls.id, students[0]);
    expect(r1.ok).toBe(true);
    const r2 = await joinClass(cls.id, students[0]); // already a member
    expect(r2.ok).toBe(true);
    const after = await getClass(cls.id);
    // Student appears exactly once
    expect(after?.studentUsernames.filter((u) => u === students[0]).length).toBe(1);
    const linked = await classOfStudent(students[0]);
    expect(linked?.id).toBe(cls.id);
  });

  it("joinClass rejects student already in a different class", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const c1 = await createClass({ name: "C1", grade: 5, subject: null, teacherUsername: t });
    const c2 = await createClass({ name: "C2", grade: 5, subject: null, teacherUsername: t });
    await joinClass(c1.id, students[0]);
    const r = await joinClass(c2.id, students[0]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("already-in-other-class");
  });

  it("leaveClass removes from roster + clears student mapping", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const cls = await createClass({ name: "C", grade: 5, subject: null, teacherUsername: t });
    await joinClass(cls.id, students[0]);
    await leaveClass(cls.id, students[0]);
    const after = await getClass(cls.id);
    expect(after?.studentUsernames).toEqual([]);
    expect(await classOfStudent(students[0])).toBeNull();
  });

  it("listClassesFor returns every class the teacher created", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const a = await createClass({ name: "A", grade: 5, subject: null, teacherUsername: t });
    const b = await createClass({ name: "B", grade: 6, subject: null, teacherUsername: t });
    const classes = await listClassesFor(t);
    expect(classes.map((c) => c.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("deleteClass removes index + join code + student mappings", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const cls = await createClass({ name: "C", grade: 5, subject: null, teacherUsername: t });
    await joinClass(cls.id, students[0]);
    await deleteClass(cls.id);
    expect(await getClass(cls.id)).toBeNull();
    expect(await findClassByCode(cls.joinCode)).toBeNull();
    expect(await classOfStudent(students[0])).toBeNull();
    const teacher = await getTeacher(t);
    expect(teacher?.classIds).not.toContain(cls.id);
  });

  it("setWeeklyTheme stores theme + timestamp", async () => {
    await createTeacher({ username: t, displayName: "A", email: null, schoolName: "S" });
    const cls = await createClass({ name: "C", grade: 5, subject: null, teacherUsername: t });
    await setWeeklyTheme(cls.id, "Inflacja");
    const after = await getClass(cls.id);
    expect(after?.weeklyTheme).toBe("Inflacja");
    expect(after?.weeklyThemeStart).toBeGreaterThan(0);
  });

  it("currentWeekIso produces YYYY-Www format", () => {
    const iso = currentWeekIso(new Date(Date.UTC(2026, 3, 19)));
    expect(iso).toMatch(/^\d{4}-W\d{2}$/);
  });
});
