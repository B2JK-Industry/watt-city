/* Role / relationship model — Phase 3.3 + 3.4.
 *
 * We keep three lightweight data types:
 *   xp:user:<u>:role              = "student" | "teacher" | "parent" | "admin"
 *   xp:class:<code>               = Class JSON (teacher, name, memberIds,
 *                                   createdAt, curriculumTags)
 *   xp:class-index:by-teacher:<u> = string[] of class codes owned
 *   xp:class-codes:<code>         = the invite code JSON (status, ttl, class)
 *   xp:parent:<u>:children        = string[] child usernames linked
 *   xp:child:<u>:parents          = string[] parent usernames linked
 *   xp:link-code:<code>           = one-shot parent-child linkage code
 *
 * Curriculum tags (backlog 3.3.7) are tagged per class — teacher picks
 * subjects covered; the content-tooling stage can filter themes accordingly.
 */

import { kvGet, kvSet, kvDel } from "@/lib/redis";

export type Role = "student" | "teacher" | "parent" | "admin";

const ROLE_KEY = (u: string) => `xp:user:${u}:role`;

export async function getRole(username: string): Promise<Role> {
  return ((await kvGet<Role>(ROLE_KEY(username))) as Role) ?? "student";
}

export async function setRole(username: string, role: Role): Promise<void> {
  await kvSet(ROLE_KEY(username), role);
}

// ---------------------------------------------------------------------------
// Class mode (teachers)
// ---------------------------------------------------------------------------

export type CurriculumTag =
  | "savings"
  | "credit"
  | "investing"
  | "taxes"
  | "energy"
  | "budgeting"
  | "payments"
  | "insurance"
  | "everyday";

export type ClassDef = {
  code: string;
  teacher: string;
  name: string;
  members: string[];
  joinCodes: string[]; // 30 unique per-student invite codes
  curriculum: CurriculumTag[];
  qOfWeekTheme?: string;
  createdAt: number;
};

const CLASS_KEY = (code: string) => `xp:class:${code}`;
const CLASS_INDEX = (teacher: string) => `xp:class-index:by-teacher:${teacher}`;
const JOIN_CODE_KEY = (joinCode: string) => `xp:class-join:${joinCode}`;

function randomCode(len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function createClass(
  teacher: string,
  name: string,
): Promise<ClassDef> {
  await setRole(teacher, "teacher");
  const code = randomCode(6);
  const joinCodes = Array.from({ length: 30 }, () => randomCode(6));
  const cls: ClassDef = {
    code,
    teacher,
    name,
    members: [],
    joinCodes,
    curriculum: [],
    createdAt: Date.now(),
  };
  await kvSet(CLASS_KEY(code), cls);
  const index = (await kvGet<string[]>(CLASS_INDEX(teacher))) ?? [];
  await kvSet(CLASS_INDEX(teacher), [...index, code]);
  await Promise.all(
    joinCodes.map((j) => kvSet(JOIN_CODE_KEY(j), { classCode: code, used: false })),
  );
  return cls;
}

export async function getClass(code: string): Promise<ClassDef | null> {
  return await kvGet<ClassDef>(CLASS_KEY(code));
}

export async function listTeacherClasses(teacher: string): Promise<ClassDef[]> {
  const codes = (await kvGet<string[]>(CLASS_INDEX(teacher))) ?? [];
  const out: ClassDef[] = [];
  for (const c of codes) {
    const cls = await getClass(c);
    if (cls) out.push(cls);
  }
  return out;
}

export async function joinClass(
  username: string,
  joinCode: string,
): Promise<{ ok: boolean; error?: string; class?: ClassDef }> {
  const rec = await kvGet<{ classCode: string; used: boolean }>(JOIN_CODE_KEY(joinCode));
  if (!rec) return { ok: false, error: "unknown-code" };
  if (rec.used) return { ok: false, error: "code-used" };
  const cls = await getClass(rec.classCode);
  if (!cls) return { ok: false, error: "class-missing" };
  if (cls.members.includes(username)) return { ok: false, error: "already-member" };
  cls.members.push(username);
  await kvSet(CLASS_KEY(cls.code), cls);
  await kvSet(JOIN_CODE_KEY(joinCode), { ...rec, used: true, by: username });
  return { ok: true, class: cls };
}

export async function setCurriculum(
  teacher: string,
  classCode: string,
  curriculum: CurriculumTag[],
): Promise<{ ok: boolean; error?: string }> {
  const cls = await getClass(classCode);
  if (!cls) return { ok: false, error: "unknown-class" };
  if (cls.teacher !== teacher) return { ok: false, error: "not-owner" };
  cls.curriculum = curriculum;
  await kvSet(CLASS_KEY(classCode), cls);
  return { ok: true };
}

export async function setQOfWeek(
  teacher: string,
  classCode: string,
  theme: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
  const cls = await getClass(classCode);
  if (!cls) return { ok: false, error: "unknown-class" };
  if (cls.teacher !== teacher) return { ok: false, error: "not-owner" };
  cls.qOfWeekTheme = theme;
  await kvSet(CLASS_KEY(classCode), cls);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Parent linkage (Phase 3.4)
// ---------------------------------------------------------------------------

const PARENT_CHILDREN = (u: string) => `xp:parent:${u}:children`;
const CHILD_PARENTS = (u: string) => `xp:child:${u}:parents`;
const LINK_CODE = (code: string) => `xp:link-code:${code}`;

export async function generateChildLinkCode(child: string): Promise<string> {
  // Valid 24h, single-use. Child generates, shares verbally with parent.
  const code = randomCode(8);
  await kvSet(
    LINK_CODE(code),
    { child, used: false, createdAt: Date.now() },
    { ex: 24 * 60 * 60 },
  );
  return code;
}

export async function linkParent(
  parent: string,
  code: string,
): Promise<{ ok: boolean; error?: string; child?: string }> {
  const rec = await kvGet<{ child: string; used: boolean; createdAt: number }>(
    LINK_CODE(code),
  );
  if (!rec) return { ok: false, error: "unknown-code" };
  if (rec.used) return { ok: false, error: "code-used" };
  await setRole(parent, "parent");
  const pList = (await kvGet<string[]>(PARENT_CHILDREN(parent))) ?? [];
  if (!pList.includes(rec.child)) {
    await kvSet(PARENT_CHILDREN(parent), [...pList, rec.child]);
  }
  const cList = (await kvGet<string[]>(CHILD_PARENTS(rec.child))) ?? [];
  if (!cList.includes(parent)) {
    await kvSet(CHILD_PARENTS(rec.child), [...cList, parent]);
  }
  await kvSet(LINK_CODE(code), { ...rec, used: true, parent });
  return { ok: true, child: rec.child };
}

export async function listChildren(parent: string): Promise<string[]> {
  return (await kvGet<string[]>(PARENT_CHILDREN(parent))) ?? [];
}

export async function listParents(child: string): Promise<string[]> {
  return (await kvGet<string[]>(CHILD_PARENTS(child))) ?? [];
}

export async function isParentOf(
  parent: string,
  child: string,
): Promise<boolean> {
  const list = await listChildren(parent);
  return list.includes(child);
}

// ---------------------------------------------------------------------------
// Per-child privacy (backlog 3.4.4: kid can hide categories from parent)
// ---------------------------------------------------------------------------

export type ChildParentPrivacy = {
  hideLedger: boolean;
  hideDuelHistory: boolean;
  hideBuildings: boolean;
};

const CHILD_PARENT_PRIVACY = (u: string) => `xp:child:${u}:parent-privacy`;

export const DEFAULT_CHILD_PARENT_PRIVACY: ChildParentPrivacy = {
  hideLedger: false,
  hideDuelHistory: false,
  hideBuildings: false,
};

export async function readChildParentPrivacy(
  username: string,
): Promise<ChildParentPrivacy> {
  const existing = await kvGet<Partial<ChildParentPrivacy>>(
    CHILD_PARENT_PRIVACY(username),
  );
  return { ...DEFAULT_CHILD_PARENT_PRIVACY, ...(existing ?? {}) };
}

export async function writeChildParentPrivacy(
  username: string,
  patch: Partial<ChildParentPrivacy>,
): Promise<ChildParentPrivacy> {
  const next = { ...(await readChildParentPrivacy(username)), ...patch };
  await kvSet(CHILD_PARENT_PRIVACY(username), next);
  return next;
}

export { kvDel };
