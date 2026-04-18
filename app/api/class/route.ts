import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  createClass,
  joinClass,
  listTeacherClasses,
  getClass,
  setCurriculum,
  setQOfWeek,
  getRole,
} from "@/lib/roles";
import { classLeaderboard } from "@/lib/class-leaderboard";
import { rateLimit } from "@/lib/rate-limit";

const ActionSchema = z.object({
  action: z.enum(["create", "join", "set-curriculum", "set-qofweek"]),
  name: z.string().min(2).max(60).optional(),
  joinCode: z.string().min(4).max(16).optional(),
  classCode: z.string().min(4).max(16).optional(),
  curriculum: z
    .array(
      z.enum([
        "savings",
        "credit",
        "investing",
        "taxes",
        "energy",
        "budgeting",
        "payments",
        "insurance",
        "everyday",
      ]),
    )
    .optional(),
  theme: z.string().min(1).max(120).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const classCode = url.searchParams.get("class");
  const role = await getRole(session.username);

  if (classCode) {
    const cls = await getClass(classCode);
    if (!cls) return Response.json({ ok: false, error: "unknown-class" }, { status: 404 });
    const isTeacher = cls.teacher === session.username;
    const isMember = cls.members.includes(session.username);
    if (!isTeacher && !isMember) {
      return Response.json({ ok: false, error: "not-authorised" }, { status: 403 });
    }
    const leaderboard = await classLeaderboard(cls);
    // Strip joinCodes from non-teacher view — they're admin secrets.
    return Response.json({
      ok: true,
      class: isTeacher ? cls : { ...cls, joinCodes: [] },
      leaderboard,
      role,
      isTeacher,
    });
  }

  // No class specified → list my classes (teacher) + role
  const mine = await listTeacherClasses(session.username);
  return Response.json({ ok: true, classes: mine, role });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const rl = await rateLimit(`class:${session.username}`, 10, 60_000);
  if (!rl.ok)
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  let body;
  try {
    body = ActionSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  switch (body.action) {
    case "create": {
      if (!body.name)
        return Response.json({ ok: false, error: "missing-name" }, { status: 400 });
      const cls = await createClass(session.username, body.name);
      return Response.json({ ok: true, class: cls });
    }
    case "join": {
      if (!body.joinCode)
        return Response.json({ ok: false, error: "missing-joinCode" }, { status: 400 });
      const r = await joinClass(session.username, body.joinCode);
      if (!r.ok) return Response.json(r, { status: 400 });
      return Response.json(r);
    }
    case "set-curriculum": {
      if (!body.classCode || !body.curriculum)
        return Response.json({ ok: false, error: "missing-args" }, { status: 400 });
      const r = await setCurriculum(session.username, body.classCode, body.curriculum);
      if (!r.ok) return Response.json(r, { status: 400 });
      return Response.json(r);
    }
    case "set-qofweek": {
      if (!body.classCode)
        return Response.json({ ok: false, error: "missing-classCode" }, { status: 400 });
      const r = await setQOfWeek(session.username, body.classCode, body.theme);
      if (!r.ok) return Response.json(r, { status: 400 });
      return Response.json(r);
    }
  }
}
