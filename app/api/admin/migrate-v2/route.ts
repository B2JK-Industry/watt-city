import { NextRequest } from "next/server";
import { z } from "zod";
import {
  migrateUser,
  revertMigration,
  getMigrationStatus,
  migrateBatch,
} from "@/lib/migration-v2";

/* V2 refactor R9.1 — admin endpoint for value-based migration (BLOCKER-2).
 *
 *   POST /api/admin/migrate-v2
 *   Authorization: Bearer $ADMIN_SECRET
 *   Body variants:
 *     { op: "migrate", username: "daniel_babjak" } — migrate one user
 *     { op: "migrate", usernames: [...] }          — batch migrate
 *     { op: "revert",   username: "daniel_babjak" } — restore snapshot
 *     { op: "status",   username: "daniel_babjak" } — read-only inspect
 *
 * Each response includes the per-user migration report (before / after /
 * delta / capped / rank change) so the caller can build the operator
 * dashboard or per-user audit log without re-reading Redis.
 */

const Body = z.union([
  z.object({
    op: z.literal("migrate"),
    username: z.string().min(1).max(64).optional(),
    usernames: z.array(z.string().min(1).max(64)).max(500).optional(),
  }),
  z.object({
    op: z.literal("revert"),
    username: z.string().min(1).max(64),
  }),
  z.object({
    op: z.literal("status"),
    username: z.string().min(1).max(64),
  }),
]);

function unauthorized(): Response {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  if (expected) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token !== expected) return unauthorized();
  }

  let parsed;
  try {
    const json = await request.json();
    parsed = Body.safeParse(json);
  } catch {
    return Response.json({ ok: false, error: "bad-json" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "bad-body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (body.op === "migrate") {
    if (body.usernames && body.usernames.length > 0) {
      const out = await migrateBatch(body.usernames);
      return Response.json({ ok: true, ...out });
    }
    if (!body.username) {
      return Response.json(
        { ok: false, error: "username-or-usernames-required" },
        { status: 400 },
      );
    }
    const r = await migrateUser(body.username);
    if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: 409 });
    return Response.json({ ok: true, report: r.report });
  }

  if (body.op === "revert") {
    const r = await revertMigration(body.username);
    if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: 404 });
    return Response.json({ ok: true, restored: r.restored });
  }

  // status
  const status = await getMigrationStatus(body.username);
  return Response.json({ ok: true, ...status });
}
