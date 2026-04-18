/* Webhook alerting — Phase 5.4.2.
 *
 * Fires a POST to the URL at `ALERT_WEBHOOK_URL` (env). Payload is Slack /
 * Discord compatible (`{ text: string }`), so pointing it at either
 * channel works without more code. No-op when the env var is missing —
 * keeps dev + preview deployments quiet.
 *
 * Dedupe: each `key` can fire at most once per `dedupeMs` window (default
 * 15 min). Prevents a stale-rotation alarm from spamming the channel every
 * 5-min pinger tick.
 */

import { kvGet, kvSet } from "@/lib/redis";

const DEDUPE_KEY = (key: string) => `xp:ops:alert-dedupe:${key}`;

export async function sendAlert(
  key: string,
  text: string,
  dedupeMs = 15 * 60_000,
): Promise<{ sent: boolean; reason?: string }> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return { sent: false, reason: "no-webhook-configured" };
  const last = await kvGet<number>(DEDUPE_KEY(key));
  if (last && Date.now() - last < dedupeMs) {
    return { sent: false, reason: "deduped" };
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    await kvSet(DEDUPE_KEY(key), Date.now());
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: `fetch-failed: ${(e as Error).message}` };
  }
}
