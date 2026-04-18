/* Watt City service-worker stub — Phase 2.7 groundwork.
 *
 * Right now this only listens for the `push` event and renders a
 * notification from the payload. It does NOT register itself — registration
 * happens only after VAPID provisioning (see
 * docs/decisions/002-push-notifications-vapid.md). Kept minimal so it can
 * coexist with future offline-shell caching (Phase 7.1.2).
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Watt City", body: "Nowe powiadomienie." };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch {
    // non-JSON payload — keep defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.tag || "watt-city",
      data: data.href ? { href: data.href } : {},
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification?.data?.href || "/";
  event.waitUntil(self.clients.openWindow(href));
});
