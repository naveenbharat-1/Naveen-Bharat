# Android APK Build Guide — Sadguru Coaching Classes

## Overview

This guide walks you through generating an installable Android APK from the web app using **Capacitor**.

```
APK Generation Flow:
┌──────────────┐    ┌──────────┐    ┌──────────────┐
│ Export to     │───>│ npm      │───>│ npx cap add  │
│ GitHub       │    │ install  │    │ android      │
└──────────────┘    └──────────┘    └──────────────┘
                                          │
┌──────────────┐    ┌──────────┐    ┌─────▼────────┐
│ Upload APK   │<───│ Build in │<───│ npx cap sync │
│ to Release   │    │ Studio   │    │              │
└──────────────┘    └──────────┘    └──────────────┘
```

## Prerequisites

- **Node.js 18+** and npm installed
- **Android Studio** installed ([download](https://developer.android.com/studio))
- **Java JDK 17+** (bundled with Android Studio)
- A GitHub account (for release hosting)

## Step-by-Step Instructions

### 1. Export to GitHub
In the Lovable editor, click **Export to GitHub** to push the project to your GitHub repository. Then clone it locally:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Install Dependencies
```bash
npm install
```

Capacitor packages (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) are already in `package.json`.

### 3. Add Android Platform
```bash
npx cap add android
```
This creates an `android/` folder with the native Android project. If it already exists, skip this step.

### 4. Build & Sync
```bash
npm run build
npx cap sync
```
- `npm run build` creates the optimized `dist/` folder
- `npx cap sync` copies `dist/` into the Android project and updates native plugins

### 5. Open in Android Studio
```bash
npx cap open android
```
Android Studio will launch with the project loaded.

### 6. Build the APK

#### Debug APK (for testing):
1. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK (for distribution):
1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select a keystore file
4. Choose **release** build type
5. APK location: `android/app/build/outputs/apk/release/app-release.apk`

> ⚠️ **Keep your keystore file safe!** You need it for all future updates. Back it up securely.

### 7. Create GitHub Release
1. Go to your GitHub repository
2. Click **Releases → Create a new release**
3. Tag: `v1.0.0` (or appropriate version)
4. Title: `Sadguru Coaching Classes v1.0.0`
5. Description: Add release notes
6. Attach the APK file (`app-debug.apk` or `app-release.apk`)
7. Click **Publish release**

### 8. Share the Download Link
Copy the APK download URL from the GitHub release. Share it with users or add it to the `/install` page in the app.

## After Making Changes

Whenever you update the web app and want a new APK:

```bash
git pull
npm install
npm run build
npx cap sync
# Open Android Studio and build again
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npx cap add android` fails | Ensure Android Studio is installed and `ANDROID_HOME` is set |
| Build fails in Android Studio | File → Sync Project with Gradle Files |
| White screen in APK | Check `capacitor.config.ts` — ensure `webDir` is `dist` |
| App crashes on launch | Check logcat in Android Studio for errors |

## Configuration Reference

The Capacitor config is in `capacitor.config.ts`:
```typescript
{
  appId: 'app.lovable.b37af6442649452885c0456243e70148',
  appName: 'Sadguru Coaching Classes',
  webDir: 'dist'
}
```

To change the app ID for Play Store publishing, update `appId` to something like `com.sadguru.coaching`.
