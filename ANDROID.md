# Building the Geneloai Android APK

The project is wired for **Capacitor**. The Lovable sandbox can't compile an APK (that needs the Android SDK on your machine), so build it locally.

## One-time setup on your computer

1. Install [Android Studio](https://developer.android.com/studio) (includes JDK + Android SDK).
2. Install [Bun](https://bun.sh) (or Node 20+).
3. Export the project from Lovable to GitHub, then clone it locally.

## Build the APK

From the project root:

```bash
bun install
bun run build              # produces dist/client (the web assets)
bunx cap add android       # first time only — scaffolds the android/ folder
bunx cap sync android      # copies web assets + plugins into the Android project
bunx cap open android      # opens Android Studio
```

In Android Studio:

- **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
- For a signed release APK: **Build → Generate Signed Bundle / APK → APK**, create a keystore, choose **release**.

## Live-reload against the published site (optional)

Uncomment the `server.url` block in `capacitor.config.ts`, then `bunx cap sync android`. The app will load `https://geneloai.lovable.app` directly — every Lovable publish updates the app with no rebuild.

## App identity

- **App name:** Geneloai
- **Package / App ID:** `com.geneloai.app`

Change these in `capacitor.config.ts` **before** running `cap add android` (they're baked into the Android project on creation).

## Updating the app after code changes

```bash
bun run build && bunx cap sync android
```

Then rebuild in Android Studio.
