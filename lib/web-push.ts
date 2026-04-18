/* Web Push — Phase 7.1.6.
 *
 * Ships a minimal send() helper that gracefully no-ops when VAPID keys
 * aren't configured. The end-to-end delivery chain needs:
 *   - VAPID_PUBLIC_KEY (b64url) exposed to the client
 *   - VAPID_PRIVATE_KEY (b64url) on the server
 *   - VAPID_CONTACT ("mailto:ops@watt-city.example")
 *   - A subscription stored per user in xp:push-sub:<u>
 *
 * The client subscribes via ServiceWorkerRegistration.pushManager.subscribe
 * (in pwa-register.tsx, gated behind parental consent for under-16).
 *
 * Sending a push requires a Web Push library. We avoid adding another
 * dep in the MVP — instead, pushTo() signs the payload manually with
 * ES256 via web-crypto. For now, shipping the shape + no-op behaviour
 * so the rest of the system can call sendPush(...) safely. ADR 002
 * documents the activation gate.
 */

export type PushSubscriptionShape = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function vapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_CONTACT,
  );
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/** Placeholder for future real implementation. Returns `{ ok:false }`
 *  when VAPID is unset so callers can gracefully skip. */
export async function sendPush(
  subscription: PushSubscriptionShape,
  payload: { title: string; body: string; href?: string; tag?: string },
): Promise<{ ok: boolean; reason?: string }> {
  if (!vapidConfigured()) {
    return { ok: false, reason: "vapid-not-configured" };
  }
  // Real implementation deferred — see ADR 002. We intentionally don't
  // add a runtime fetch against the push service without careful JWT
  // signing + payload encryption; shipping a half-working version here
  // could cause subscribers to drop silently.
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: "push.would-send",
      endpoint: subscription.endpoint.slice(0, 40) + "…",
      tag: payload.tag,
      title: payload.title,
    }),
  );
  return { ok: false, reason: "not-implemented-yet" };
}
