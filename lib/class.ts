/* V4.1 — classroom data model.
 *
 * Teacher signs up → becomes a teacher account (separate tier — the
 * existing `xp:user:<u>` stays as the auth layer; we add `xp:teacher:<u>`
 * and `xp:class:<id>` on top). Classes hold a roster of student
 * usernames (each student is a normal Watt City player) + a weekly
 * theme + a 4-char join code kids type to join.
 *
 * V4 acceptance: teacher can sign up via /nauczyciel/signup, create a
 * class, share the code, 30 kids join, teacher sees roster on
 * /klasa/[id]. PDF export (V4.3) + curriculum alignment (V4.5) + demo
 * seed (V4.4) all read from the same model.
 */

import {
  kvGet,
  kvSet,
  kvDel,
  sAdd,
  sMembers,
  sRem,
  sHas,
} from "@/lib/redis";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export type TeacherAccount = {
  username: string; // primary auth username (same as /lib/auth)
  displayName: string;
  email: string | null;
  schoolName: string;
  createdAt: number;
  classIds: string[]; // denormalized for fast lookup
  tourSeenAt?: number;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: number; // 5..8 PL podstawowa
  subject: string | null;
  teacherUsername: string;
  joinCode: string; // 6-char alphanumeric
  studentUsernames: string[];
  weeklyTheme: string | null;
  weeklyThemeStart: number | null;
  createdAt: number;
  // Privacy flags controllable by students — start defaulting to visible;
  // students can toggle in /profile (Phase 3.4.4 integration).
  privacy?: {
    hideLedger: boolean;
    hideCashflow: boolean;
    hideBuildings: boolean;
  };
};

const TEACHER_KEY = (u: string) => `xp:teacher:${u}`;
const CLASS_KEY = (id: string) => `xp:class:${id}`;
const CLASS_INDEX = "xp:class:index"; // SET of all class ids
const JOIN_CODE_KEY = (code: string) => `xp:class:joincode:${code}`;
const STUDENT_CLASS_KEY = (u: string) => `xp:student:class:${u}`; // class id the kid is in

// ---------------------------------------------------------------------------
// Teacher helpers
// ---------------------------------------------------------------------------

export async function getTeacher(username: string): Promise<TeacherAccount | null> {
  return await kvGet<TeacherAccount>(TEACHER_KEY(username));
}

export async function saveTeacher(t: TeacherAccount): Promise<void> {
  await kvSet(TEACHER_KEY(t.username), t);
}

export async function isTeacher(username: string): Promise<boolean> {
  return !!(await kvGet(TEACHER_KEY(username)));
}

export async function createTeacher(input: {
  username: string;
  displayName: string;
  email: string | null;
  schoolName: string;
}): Promise<TeacherAccount> {
  const existing = await getTeacher(input.username);
  if (existing) return existing; // idempotent
  const t: TeacherAccount = {
    username: input.username,
    displayName: input.displayName,
    email: input.email,
    schoolName: input.schoolName,
    createdAt: Date.now(),
    classIds: [],
  };
  await saveTeacher(t);
  return t;
}

// ---------------------------------------------------------------------------
// Class helpers
// ---------------------------------------------------------------------------

export async function getClass(id: string): Promise<SchoolClass | null> {
  return await kvGet<SchoolClass>(CLASS_KEY(id));
}

export async function saveClass(cls: SchoolClass): Promise<void> {
  await kvSet(CLASS_KEY(cls.id), cls);
}

export async function listAllClassIds(): Promise<string[]> {
  return await sMembers(CLASS_INDEX);
}

/** 6-char uppercase alphanumeric, collision-checked. */
export async function generateJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = [...crypto.getRandomValues(new Uint8Array(6))]
      .map((b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 30])
      .join("");
    const taken = await kvGet<string>(JOIN_CODE_KEY(code));
    if (!taken) return code;
  }
  // Fall-back unique via timestamp
  return `CLS${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

export async function createClass(input: {
  name: string;
  grade: number;
  subject: string | null;
  teacherUsername: string;
}): Promise<SchoolClass> {
  const id = `C-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
  const joinCode = await generateJoinCode();
  const cls: SchoolClass = {
    id,
    name: input.name,
    grade: input.grade,
    subject: input.subject,
    teacherUsername: input.teacherUsername,
    joinCode,
    studentUsernames: [],
    weeklyTheme: null,
    weeklyThemeStart: null,
    createdAt: Date.now(),
    privacy: { hideLedger: false, hideCashflow: false, hideBuildings: false },
  };
  await saveClass(cls);
  await sAdd(CLASS_INDEX, id);
  await kvSet(JOIN_CODE_KEY(joinCode), id);
  // Add to teacher's class list
  const teacher = await getTeacher(input.teacherUsername);
  if (teacher) {
    teacher.classIds.push(id);
    await saveTeacher(teacher);
  }
  return cls;
}

export async function deleteClass(id: string): Promise<void> {
  const cls = await getClass(id);
  if (!cls) return;
  await kvDel(CLASS_KEY(id));
  await sRem(CLASS_INDEX, id);
  await kvDel(JOIN_CODE_KEY(cls.joinCode));
  // Remove from teacher
  const teacher = await getTeacher(cls.teacherUsername);
  if (teacher) {
    teacher.classIds = teacher.classIds.filter((cid) => cid !== id);
    await saveTeacher(teacher);
  }
  // Unlink students
  for (const student of cls.studentUsernames) {
    await kvDel(STUDENT_CLASS_KEY(student));
  }
}

export async function listClassesFor(teacherUsername: string): Promise<SchoolClass[]> {
  const teacher = await getTeacher(teacherUsername);
  if (!teacher) return [];
  const results = await Promise.all(teacher.classIds.map((id) => getClass(id)));
  return results.filter((c): c is SchoolClass => c !== null);
}

// ---------------------------------------------------------------------------
// Join-code lookup + student membership
// ---------------------------------------------------------------------------

export async function findClassByCode(code: string): Promise<SchoolClass | null> {
  const id = await kvGet<string>(JOIN_CODE_KEY(code.toUpperCase()));
  if (!id) return null;
  return await getClass(id);
}

export async function classOfStudent(username: string): Promise<SchoolClass | null> {
  const id = await kvGet<string>(STUDENT_CLASS_KEY(username));
  if (!id) return null;
  return await getClass(id);
}

export async function joinClass(
  classId: string,
  studentUsername: string,
): Promise<{ ok: true; class: SchoolClass } | { ok: false; error: string }> {
  const cls = await getClass(classId);
  if (!cls) return { ok: false, error: "class-not-found" };
  // A student can belong to exactly one class — bounce if already in one.
  const already = await classOfStudent(studentUsername);
  if (already && already.id !== classId) {
    return { ok: false, error: "already-in-other-class" };
  }
  if (!cls.studentUsernames.includes(studentUsername)) {
    cls.studentUsernames.push(studentUsername);
    await saveClass(cls);
  }
  await kvSet(STUDENT_CLASS_KEY(studentUsername), classId);
  return { ok: true, class: cls };
}

export async function leaveClass(
  classId: string,
  studentUsername: string,
): Promise<void> {
  const cls = await getClass(classId);
  if (!cls) return;
  cls.studentUsernames = cls.studentUsernames.filter((u) => u !== studentUsername);
  await saveClass(cls);
  await kvDel(STUDENT_CLASS_KEY(studentUsername));
}

// ---------------------------------------------------------------------------
// Weekly theme
// ---------------------------------------------------------------------------

export async function setWeeklyTheme(
  classId: string,
  theme: string | null,
): Promise<void> {
  const cls = await getClass(classId);
  if (!cls) return;
  cls.weeklyTheme = theme;
  cls.weeklyThemeStart = theme ? Date.now() : null;
  await saveClass(cls);
}

/** ISO week string like "2026-W17". Used by /api/klasa/[id]/report?week=... */
export function currentWeekIso(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Test-only dedup check.
export async function _isStudentInClass(
  classId: string,
  studentUsername: string,
): Promise<boolean> {
  const cls = await getClass(classId);
  return !!cls?.studentUsernames.includes(studentUsername);
}

void sHas;
