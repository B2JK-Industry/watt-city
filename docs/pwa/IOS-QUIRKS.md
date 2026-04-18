# iOS Safari PWA quirks — Phase 7.1.7

iOS Safari is the Apple of the PWA world — still inconsistent in 2026.
Document the live gotchas so nobody spends an afternoon debugging
something Apple deliberately broke.

## What works

- `manifest.webmanifest` is read; name + short_name + icons applied to
  the home-screen tile.
- `start_url` + `scope` respected.
- `display: standalone` removes the browser chrome.
- `theme_color` drives the status-bar tint (via
  `<meta name="apple-mobile-web-app-status-bar-style">` set from
  `appleWebApp.statusBarStyle` in layout metadata).
- `touch-action: manipulation` on buttons removes the 300 ms tap delay.
- Service worker: registered but HEAVILY limited (no background sync,
  no periodic sync).

## What doesn't work (2026-04)

- **No `beforeinstallprompt`**: iOS has no programmatic install UX. We
  detect iOS and swap the install CTA for a "Add to Home Screen →
  Share sheet" hint instead. See implementation in `PwaRegister`
  (future follow-up — currently we hide the button on iOS).
- **No background Web Push pre-iOS 16.4**; on ≥ 16.4 push works ONLY
  for home-screen-installed sites. Our Phase 7.1.6 `sendPush` gracefully
  returns `{ ok: false, reason: "vapid-not-configured" }` when the
  subscription is missing.
- **No cache-storage pinning**: iOS evicts SW caches after ~50 MB.
  Workbox `CacheFirst` strategies work but budgets are tight.
- **No file system writes**: no `window.showDirectoryPicker`, no
  `caches.storage.estimate()` reliably. Don't plan around it.
- **Home-screen tile ignores CSS dark-mode media query**: the icon has
  to look good on both light + dark wallpapers. Our maskable icon uses
  a yellow background so it reads on either.

## Safari-specific meta + link tags

Controlled via Next.js `metadata` in `app/layout.tsx`:

- `apple-touch-icon` → `icons.apple: "/icons/icon-192.svg"`
- `apple-mobile-web-app-capable: yes` → `appleWebApp.capable: true`
- `apple-mobile-web-app-status-bar-style: black-translucent` →
  `appleWebApp.statusBarStyle`
- `apple-mobile-web-app-title: "Watt City"` →
  `appleWebApp.title: "Watt City"`

## Testing checklist

1. Open in Safari on iPhone (real device or Simulator; not Chrome iOS —
   it uses Safari's webview but `beforeinstallprompt` behaves
   differently).
2. Share → Add to Home Screen; confirm the tile icon + name.
3. Launch from the home screen; verify standalone mode (no URL bar) and
   that the status-bar colour matches `theme_color`.
4. Toggle airplane mode + reload; service worker should serve the
   offline shell (if Workbox is enabled in Phase 7.1.2+).

## Known open bugs

- Safari sometimes uses stale manifest without a hard refresh.
  Workaround: bump a version query `?v=2` on `manifest.webmanifest` in
  layout metadata when the icon changes.
- Adding the site a second time under a different name creates two
  tiles — expected behaviour, not a bug, just surprising.
