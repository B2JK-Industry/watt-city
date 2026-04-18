import { NextRequest } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const json = await request.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json(
      { ok: false, error: "Nieprawidłowe żądanie." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Podaj nazwę i hasło." },
      { status: 400 },
    );
  }
  const result = await loginUser(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 401 });
  }
  await createSession(result.user.username);
  return Response.json({ ok: true, username: result.user.username });
}
