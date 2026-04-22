/* V4.4 — demo school seed.
 *
 * Creates a fully-populated demo teacher + class + 30 students + 4
 * weeks of simulated activity that a PKO salesperson can show
 * riaditeľke in under 60 seconds. Idempotent via SADD sentinel so
 * running the endpoint twice is safe.
 */

import { kvGet, kvSet, kvDel, sAdd, sMembers } from "@/lib/redis";
import { registerUser } from "@/lib/auth";
import {
  createTeacher,
  createClass,
  joinClass,
  getClass,
  setWeeklyTheme,
  deleteClass,
} from "@/lib/class";
import {
  creditResources,
  getPlayerState,
  savePlayerState,
  type LedgerKind,
} from "@/lib/player";
import { ensureSignupGift } from "@/lib/buildings";
import { refreshCityValue } from "@/lib/city-value";
import { writeAgeBucket } from "@/lib/gdpr-k";

export const DEMO_SEED_SENTINEL = "xp:demo-seed:v1";
export const DEMO_TEACHER_USERNAME = "demo-teacher-pl";
export const DEMO_TEACHER_PASSWORD = "demo1234";
export const DEMO_SCHOOL_NAME = "Szkoła Podstawowa nr 12 — Katowice";
export const DEMO_CLASS_NAME = "V.B — Matematyka finansowa";
export const DEMO_CLASS_GRADE = 7 as const;
export const DEMO_CLASS_SUBJECT = "Matematyka finansowa (WOS/EDB)";

/** 30 realistic PL kid usernames + a skew that matches real classes. */
const DEMO_STUDENTS: Array<{ username: string; tier: "top" | "mid" | "casual" | "inactive" }> = [
  // 3 top
  { username: "Anna_K", tier: "top" },
  { username: "Kuba_M", tier: "top" },
  { username: "Lena_W", tier: "top" },
  // 10 mid
  { username: "Jan_Z", tier: "mid" },
  { username: "Maja_R", tier: "mid" },
  { username: "Oskar_P", tier: "mid" },
  { username: "Zosia_N", tier: "mid" },
  { username: "Filip_G", tier: "mid" },
  { username: "Natalia_B", tier: "mid" },
  { username: "Wojtek_S", tier: "mid" },
  { username: "Ola_D", tier: "mid" },
  { username: "Igor_K", tier: "mid" },
  { username: "Hania_T", tier: "mid" },
  // 15 casual
  { username: "Marek_L", tier: "casual" },
  { username: "Alicja_C", tier: "casual" },
  { username: "Piotr_O", tier: "casual" },
  { username: "Karolina_J", tier: "casual" },
  { username: "Tomek_H", tier: "casual" },
  { username: "Milena_F", tier: "casual" },
  { username: "Bartek_A", tier: "casual" },
  { username: "Julia_V", tier: "casual" },
  { username: "Michal_E", tier: "casual" },
  { username: "Ewa_Y", tier: "casual" },
  { username: "Dominik_U", tier: "casual" },
  { username: "Sara_Q", tier: "casual" },
  { username: "Patryk_I", tier: "casual" },
  { username: "Agata_X", tier: "casual" },
  { username: "Kamil_Z2", tier: "casual" },
  // 2 inactive
  { username: "Ola_Inactive", tier: "inactive" },
  { username: "Damian_Inactive", tier: "inactive" },
];

const DEMO_WEEKLY_THEMES = [
  "RRSO-basics",
  "compound-interest",
  "inflation-cpi",
  "mortgage-intro",
];

function pickScorePerWeek(tier: "top" | "mid" | "casual" | "inactive"): number {
  switch (tier) {
    case "top":
      return 6 + Math.floor(Math.random() * 3); // 6-8 games/week
    case "mid":
      return 3 + Math.floor(Math.random() * 3); // 3-5
    case "casual":
      return 1 + Math.floor(Math.random() * 2); // 1-2
    case "inactive":
      return 0;
  }
}

async function simulateActivityForStudent(
  username: string,
  tier: "top" | "mid" | "casual" | "inactive",
  weekStart: number,
  weekIndex: number,
): Promise<void> {
  const gamesThisWeek = pickScorePerWeek(tier);
  if (gamesThisWeek === 0) return;
  const state = await getPlayerState(username);
  const kinds: Array<{
    kind: LedgerKind;
    gameId: string;
    aiKind?: string;
    yield: { coins?: number; bricks?: number; watts?: number };
  }> = [
    { kind: "score", gameId: "finance-quiz", yield: { coins: 30 } },
    { kind: "score", gameId: "calc-sprint", yield: { watts: 20 } },
    { kind: "score", gameId: "match-pairs", yield: { bricks: 15 } },
    { kind: "score", gameId: "true-false", yield: { coins: 20 } },
    {
      kind: "score",
      gameId: `ai-${weekIndex}-${tier}`,
      aiKind: DEMO_WEEKLY_THEMES[weekIndex % DEMO_WEEKLY_THEMES.length],
      yield: { coins: 40 },
    },
  ];
  for (let g = 0; g < gamesThisWeek; g++) {
    const pick = kinds[g % kinds.length];
    const ts = weekStart + g * 4 * 60 * 60 * 1000; // spread across week
    await creditResources(
      state,
      pick.kind,
      pick.yield,
      `[seed] ${pick.gameId} week ${weekIndex + 1}`,
      `seed:${username}:w${weekIndex}:${g}`,
      {
        gameId: pick.gameId,
        aiKind: pick.aiKind,
        seedWeek: weekIndex,
        seedTimestamp: ts,
      },
    );
  }
}

export async function isDemoSeedPresent(): Promise<boolean> {
  const v = await kvGet<string>(DEMO_SEED_SENTINEL);
  return !!v;
}

export type SeedResult = {
  teacher: string;
  class: { id: string; name: string; joinCode: string };
  students: string[];
  weeks: number;
};

/** Main entry. Idempotent: if the sentinel exists, returns the existing
 *  class metadata without re-running the simulation. */
export async function seedDemoSchool(): Promise<SeedResult> {
  const existingSentinel = await kvGet<{
    teacher: string;
    classId: string;
    students: string[];
  }>(DEMO_SEED_SENTINEL);
  if (existingSentinel) {
    const cls = await getClass(existingSentinel.classId);
    if (cls) {
      return {
        teacher: existingSentinel.teacher,
        class: { id: cls.id, name: cls.name, joinCode: cls.joinCode },
        students: existingSentinel.students,
        weeks: 4,
      };
    }
  }

  // 1. Teacher user + account
  await registerUser(DEMO_TEACHER_USERNAME, DEMO_TEACHER_PASSWORD).catch(
    () => null,
  );
  await writeAgeBucket(DEMO_TEACHER_USERNAME, 1990).catch(() => null);
  await createTeacher({
    username: DEMO_TEACHER_USERNAME,
    displayName: "Demo Nauczyciel",
    email: "demo@watt-city.example",
    schoolName: DEMO_SCHOOL_NAME,
  });

  // 2. Class
  const cls = await createClass({
    name: DEMO_CLASS_NAME,
    grade: DEMO_CLASS_GRADE,
    subject: DEMO_CLASS_SUBJECT,
    teacherUsername: DEMO_TEACHER_USERNAME,
  });

  // 3. Students + roster + signup gift
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const firstWeekStart = now - 4 * weekMs;

  for (const { username, tier } of DEMO_STUDENTS) {
    // register if new, then sign up gift + put them in the class
    await registerUser(username, DEMO_TEACHER_PASSWORD).catch(() => null);
    await writeAgeBucket(username, 2014).catch(() => null);
    const state = await getPlayerState(username);
    await ensureSignupGift(state);
    await joinClass(cls.id, username);
    if (tier === "inactive") continue;
    // 4 weeks of simulated activity
    for (let w = 0; w < 4; w++) {
      await simulateActivityForStudent(
        username,
        tier,
        firstWeekStart + w * weekMs,
        w,
      );
    }
    // Refresh city-value so the class leaderboard shows real numbers
    const fresh = await getPlayerState(username);
    await refreshCityValue(username, fresh.buildings);
  }

  // 4. Pre-fill weekly theme
  await setWeeklyTheme(cls.id, DEMO_WEEKLY_THEMES[0]);

  // 5. Sentinel
  await kvSet(DEMO_SEED_SENTINEL, {
    teacher: DEMO_TEACHER_USERNAME,
    classId: cls.id,
    students: DEMO_STUDENTS.map((s) => s.username),
  });
  await sAdd("xp:demo-seed:log", `${new Date().toISOString()}:${cls.id}`);

  return {
    teacher: DEMO_TEACHER_USERNAME,
    class: { id: cls.id, name: cls.name, joinCode: cls.joinCode },
    students: DEMO_STUDENTS.map((s) => s.username),
    weeks: 4,
  };
}

export async function teardownDemoSchool(): Promise<{ ok: true; cleared: number }> {
  const sentinel = await kvGet<{
    teacher: string;
    classId: string;
    students: string[];
  }>(DEMO_SEED_SENTINEL);
  if (!sentinel) return { ok: true, cleared: 0 };
  let cleared = 0;

  // Delete the class (unlinks students from join mapping)
  await deleteClass(sentinel.classId);
  cleared += 1;

  // Wipe student data
  for (const username of sentinel.students) {
    const keys = [
      `xp:player:${username}`,
      `xp:player:${username}:ledger`,
      `xp:player:${username}:ledger-dedup`,
      `xp:user:${username}`,
      `xp:student:class:${username}`,
    ];
    for (const k of keys) await kvDel(k);
    cleared += keys.length;
  }

  // Wipe teacher records
  await kvDel(`xp:teacher:${sentinel.teacher}`);
  await kvDel(`xp:user:${sentinel.teacher}`);
  cleared += 2;

  // Sentinel
  await kvDel(DEMO_SEED_SENTINEL);
  cleared += 1;
  return { ok: true, cleared };
}

void sMembers;
void savePlayerState;
