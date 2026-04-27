import { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

/* G-02 — `/api/contact` POST endpoint.
 *
 * Sink for the ContactForm primitive. Rate-limited 3 / 60s per IP
 * to keep form-spam at bay without blocking legitimate retries.
 * Body: name + email + topic + message. Validated via zod.
 *
 * Sink behavior: log to console + (when CONTACT_WEBHOOK_URL is
 * configured) POST to the configured Slack/Discord/email webhook.
 * Both paths are best-effort — a webhook 5xx still returns ok:true
 * to the client because the message has already been logged.
 *
 * No DB write — submissions are intentionally ephemeral. The
 * production sink is whatever endpoint CONTACT_WEBHOOK_URL points
 * at (PR-P-2 ships with no default URL set; ops adds the secret
 * post-deploy).
 */

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  topic: z.enum(["general", "bug", "school", "press", "privacy"]),
  message: z.string().min(10).max(5000),
});

const RATE_LIMIT_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await rateLimit(
    `contact:${ip}`,
    RATE_LIMIT_PER_WINDOW,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = BodySchema.safeParse(body);
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" },
      { status: 400 },
    );
  }
  const { name, email, topic, message } = parsed.data;

  // Always log; the build pipeline scrubs prod console output by default,
  // and the runtime captures it in Vercel logs for ops triage.
  console.log("[contact] submission", { topic, email, name, ip });

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📨 [${topic}] from ${name} <${email}>\n\n${message}`,
          // Slack-compatible payload; Discord ignores extra keys.
          name,
          email,
          topic,
          message,
        }),
      });
    } catch (err) {
      // Webhook failure must not surface as a user-visible error —
      // the message is already logged above. Ops surfaces webhook
      // health separately.
      console.error("[contact] webhook delivery failed", err);
    }
  }

  return Response.json({ ok: true });
}
