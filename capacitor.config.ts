import type { CapacitorConfig } from '@capacitor/cli';

// For local development with live-reload, temporarily restore the server block:
// server: {
//   url: 'https://33478fb9-7020-4ec9-be5f-04cb93d2fa17.lovableproject.com?forceHideBadge=true',
//   cleartext: true,
// }
// For production APK builds (GitHub Actions), the server block is intentionally
// removed so the APK bundles the built dist/ files and works self-contained.

const config: CapacitorConfig = {
  appId: 'com.sadguru.classes',
  appName: 'Sadguru Coaching Classes',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
