import { NextRequest } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import { createSession, getSession } from "@/lib/session";
import { createTeacher, isTeacher } from "@/lib/class";
import { containsPII, writeAgeBucket } from "@/lib/gdpr-k";
import { openTeacherVerification } from "@/lib/teacher-verify";
import { sendTeacherVerifyEmail } from "@/lib/mailer";

/* V4.1 + G-14 — teacher signup.
 *
 * POST /api/nauczyciel/signup
 *   { username, password, displayName, email, schoolName }
 *
 * Creates a normal user record (`registerUser`) + flags it as a teacher
 * (`createTeacher`). Session cookie issued on success so the wizard can
 * immediately proceed to class creation.
 *
 * G-14 — email is now REQUIRED (was optional). New teacher accounts
 * land in `verified=false` state; class creation is blocked until
 * the teacher clicks the /verify?token=… link sent to their email.
 * 24h TTL token, single-use. Pre-G-14 teacher accounts are
 * grandfathered (verified field undefined → treated as verified).
 */

const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120),
  // G-14 — email required so we can send the verify link.
  email: z.string().email().max(200),
  schoolName: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    const json = await req.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json({ ok: false, error: "bad-json" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "bad-body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { username, password, displayName, email, schoolName } = parsed.data;

  // Don't allow an email-looking username per GDPR-K PII rule.
  const pii = containsPII(username);
  if (pii) {
    return Response.json(
      { ok: false, error: `username-pii:${pii}` },
      { status: 400 },
    );
  }

  // If already a teacher, short-circuit with session re-issue.
  if (await isTeacher(username)) {
    await createSession(username);
    return Response.json({ ok: true, alreadyTeacher: true });
  }

  const r = await registerUser(username, password);
  if (!r.ok) {
    return Response.json({ ok: false, error: r.error }, { status: 400 });
  }
  // Teachers are adults → mark bucket "adult" so content-filter treats them
  // as non-minor. Pick a safe default birth year (1990) when not provided.
  await writeAgeBucket(username, 1990);
  await createTeacher({
    username,
    displayName,
    email,
    schoolName,
  });
  await createSession(username);
  // G-14 — open a fresh 24h verify token + send the email. Failure
  // to deliver is logged but does NOT block the signup response —
  // the teacher can request a re-send via /nauczyciel later.
  const { token } = await openTeacherVerification(username, email);
  await sendTeacherVerifyEmail(email, displayName, token);
  return Response.json({ ok: true, verifySent: true });
}

export async function GET() {
  // Expose the current session's teacher flag for the UI.
  const session = await getSession();
  if (!session) return Response.json({ ok: false, teacher: false });
  return Response.json({ ok: true, teacher: await isTeacher(session.username) });
}
