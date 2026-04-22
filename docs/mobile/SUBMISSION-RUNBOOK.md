# App store submission runbook — Phase 7.2

Every item below is **operator-led**. The autonomous agent does NOT run
Xcode, does NOT create developer accounts, does NOT sign binaries, and
does NOT upload to App Store Connect or Play Console. This document is
the checklist a human follows with the scaffolding the agent shipped.

## Prerequisites

- macOS with Xcode 16+ (iOS)
- Android Studio Hedgehog+ (Android)
- Apple Developer Program membership (USD 99/yr) — required for App Store
  submission.
- Google Play Console account (USD 25 one-time) — required for Play
  Store submission.
- Node 20 LTS or 22 LTS (repo currently targets `@types/node@^20`;
  Node 25 is incompatible with Hardhat 2.x per `docs/web3/DEPLOY.md §0`),
  pnpm 10+, Ruby + CocoaPods (iOS), JDK 17 (Android).

## One-time scaffold (operator runs once)

```bash
# Install Capacitor CLI
pnpm add -D @capacitor/cli

# Install platform bridges
pnpm add @capacitor/core @capacitor/ios @capacitor/android

# Generate the iOS platform dir (creates ios/ — not committed; regenerate on demand)
pnpm dlx cap add ios

# Generate the Android platform dir
pnpm dlx cap add android

# Sync the web build into both
pnpm build
pnpm dlx cap copy
```

## iOS submission path (7.2.1 + 7.2.3 + 7.2.4)

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Set bundle identifier to `com.wattcity.app` (matches
   `capacitor.config.ts`).
3. Select signing team (operator's Apple Developer team).
4. Info.plist:
   - `NSAppTransportSecurity` → no exceptions (we use HTTPS only).
   - `ITSAppUsesNonExemptEncryption` = NO (we use only HTTPS).
   - Age rating → 9+ (our content is suitable per our self-assessment;
     App Store requires an explicit answer).
5. Assets:
   - App icon (1024×1024 PNG) — convert `public/icons/icon-512.svg` at
     2× resolution via any SVG→PNG tool.
   - Screenshots (iPhone 6.7" + iPad 12.9" — mandatory by 2026-04
     guidelines) — manual capture needed.
   - Launch screen → use the splash colour `#0a0a0f` with the WC logo.
6. App Store Connect metadata:
   - Title: "Watt City"
   - Subtitle: "Nauka finansów dla dzieci" (PL) / "Finance for kids" (EN)
   - Keywords: finanse, edukacja, waluta, matematyka, quiz
   - Primary category: Education; Secondary: Family Games
7. Apple Family Sharing (7.2.4): enable in App Store Connect → "Family
   Sharing" toggle after submission approval. No code change required.
8. Submit for review. Expected turnaround: 1-3 days in 2026-04.

## Android submission path (7.2.2 + 7.2.3 + 7.2.5)

1. Open `android/` in Android Studio.
2. Set `applicationId = "com.wattcity.app"` in `app/build.gradle`.
3. Keystore generation:
   ```bash
   keytool -genkey -v -keystore watt-city.keystore -alias wc -keyalg RSA -keysize 2048 -validity 10000
   ```
4. Configure signing in `app/build.gradle` → `signingConfigs.release`.
5. Family policy compliance (7.2.5):
   - Declare "Made for Kids" in Play Console → App content.
   - Complete the COPPA + GDPR-K + local-law questionnaire — our age
     gate + parental-consent flow (Phase 6.3) answers "Yes, we comply".
   - Do NOT use Play Services Ads or analytics SDKs (already our
     constraint per Phase 5.3).
6. Assets:
   - 512×512 icon (PNG) — from our SVG.
   - Feature graphic (1024×500) — designer task.
   - Screenshots × 5+ phones + 1 tablet.
7. Upload AAB via Play Console → Production track.

## CI-friendly release flow (future)

Once both app stores accept us, wire a GitHub Actions workflow with:
- Fastlane for iOS (App Store Connect API key).
- Gradle Play Publisher for Android (service-account JSON).
- Trigger on Git tag `mobile-vX.Y.Z`.
- Document in `.github/workflows/mobile-release.yml` when the operator
  has provisioned the credentials.

## Rollback

- iOS: use App Store Connect "Phased Release" to halt 7-day rollout.
- Android: Play Console → Staged rollout → roll back to the previous
  version.
- Both: publish a Web-only hotfix in minutes via `vercel deploy --prod`
  — native shell will pick it up on next cold start because `server.url`
  points at the live web app.
