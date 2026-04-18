/* Phase 7.2 — Capacitor config for iOS + Android shells.
 *
 * Scaffold-only: operator runs `npx cap add ios` and `npx cap add
 * android` to generate the native platform directories (they add ~600
 * files to the repo, so we don't commit them — they regenerate from
 * this config on demand).
 *
 * Workflow:
 *   1. `pnpm build && pnpm dlx cap copy`     (ship the Next static output)
 *   2. `pnpm dlx cap open ios` / `cap open android`
 *   3. Build in Xcode / Android Studio with a developer account the
 *      operator owns.
 *   4. Submit via docs/mobile/SUBMISSION-RUNBOOK.md.
 *
 * The `server.url` is set for the "online shell" MVP — the app loads
 * from the live Watt City deployment rather than bundling the static
 * export. Future work: switch to bundled with service-worker offline
 * cache once the web UI stabilises.
 */
// Typed loosely so the file builds without @capacitor/cli installed; when
// the operator installs Capacitor, replace with `CapacitorConfig` import.
const config = {
  appId: "com.wattcity.app",
  appName: "Watt City",
  webDir: "out",
  server: {
    url: "https://watt-city.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    scheme: "Watt City",
    backgroundColor: "#0a0a0f",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0a0a0f",
  },
};

export default config;
