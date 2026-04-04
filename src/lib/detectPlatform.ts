// src/lib/detectPlatform.ts
// Detects the user's device mode (mobile/desktop) and browser from the
// User-Agent string. Used to pre-select the correct install instructions.

// MARK: - Types

/** Device form factor. */
export type DeviceMode = "mobile" | "desktop";

/** Mobile browser identifiers matching InstallInstructions toggle values. */
export type MobileBrowser = "safari" | "chrome" | "firefox";

/** Desktop browser identifiers matching InstallInstructions toggle values. */
export type DesktopBrowser = "chrome" | "edge" | "safari";

/** Full detection result. */
export interface PlatformDetection {
  deviceMode: DeviceMode;
  mobileBrowser: MobileBrowser;
  desktopBrowser: DesktopBrowser;
}

// MARK: - Detection

/** Sniffs `navigator.userAgent` and returns best-guess platform info. */
export function detectPlatform(): PlatformDetection {
  const ua = navigator.userAgent;

  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  const deviceMode: DeviceMode = isMobile ? "mobile" : "desktop";

  const mobileBrowser = detectMobileBrowser(ua);
  const desktopBrowser = detectDesktopBrowser(ua);

  return { deviceMode, mobileBrowser, desktopBrowser };
}

/** Determines the mobile browser from the UA string. */
function detectMobileBrowser(ua: string): MobileBrowser {
  // Firefox check first — its UA contains "Firefox" explicitly
  if (/FxiOS|Firefox/i.test(ua)) return "firefox";

  // CriOS = Chrome on iOS; "Chrome" without "Edg" = Chrome on Android
  if (/CriOS/i.test(ua) || (/Chrome/i.test(ua) && !/Edg/i.test(ua))) {
    return "chrome";
  }

  // Default to Safari for iOS WebKit (includes in-app browsers on iOS)
  return "safari";
}

/** Determines the desktop browser from the UA string. */
function detectDesktopBrowser(ua: string): DesktopBrowser {
  if (/Edg\//i.test(ua)) return "edge";

  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "chrome";

  // Safari: contains "Safari" but not "Chrome"
  return "safari";
}
