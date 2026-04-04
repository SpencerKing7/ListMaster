// src/lib/installSteps.ts
// Pure data definitions for add-to-home-screen install instruction steps.

// MARK: - Types

/** A single install instruction step. */
export interface InstallStep {
  /** Key referencing an icon in InstallIcons. */
  iconKey: "share" | "plusSquare" | "menuDots" | "download" | "globe";
  title: string;
  subtitle: string;
  /** Short label displayed below the reference icon. */
  iconLabel: string;
}

// MARK: - Mobile steps

/** iPhone / iOS Safari install steps. */
export function getIphoneSteps(): InstallStep[] {
  return [
    {
      iconKey: "share",
      title: "Tap the Share button",
      subtitle: "Find this icon in Safari's bottom toolbar",
      iconLabel: "Share",
    },
    {
      iconKey: "plusSquare",
      title: 'Choose "Add to Home Screen"',
      subtitle: "Scroll down in the share sheet to find it",
      iconLabel: "Add to Home Screen",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add" to confirm',
      subtitle: "Top-right corner of the dialog",
      iconLabel: "Add",
    },
  ];
}

/** Android / Chrome install steps. */
export function getAndroidSteps(): InstallStep[] {
  return [
    {
      iconKey: "menuDots",
      title: "Open the browser menu",
      subtitle: "Tap the \u22EE icon at the top-right of Chrome",
      iconLabel: "Menu",
    },
    {
      iconKey: "download",
      title: 'Choose "Add to Home screen"',
      subtitle: 'May also appear as "Install app"',
      iconLabel: "Install",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add" to confirm',
      subtitle: "Places the app icon on your home screen",
      iconLabel: "Add",
    },
  ];
}

// MARK: - Desktop steps

/** Chrome desktop install steps. */
export function getChromeSteps(): InstallStep[] {
  return [
    {
      iconKey: "download",
      title: "Click the install icon in the address bar",
      subtitle: "Right side of the URL bar, or use the \u22EE menu",
      iconLabel: "Install",
    },
    {
      iconKey: "plusSquare",
      title: 'Click "Install" in the popup',
      subtitle: "Chrome will add it as a standalone app",
      iconLabel: "Install",
    },
  ];
}

/** Edge desktop install steps. */
export function getEdgeSteps(): InstallStep[] {
  return [
    {
      iconKey: "menuDots",
      title: "Open the \u2026 menu",
      subtitle: "Top-right corner of the Edge toolbar",
      iconLabel: "Menu",
    },
    {
      iconKey: "globe",
      title: 'Choose "Apps" \u2192 "Install this site as an app"',
      subtitle: "Then click Install to confirm",
      iconLabel: "Apps",
    },
  ];
}

/** Safari macOS install steps. */
export function getSafariMacSteps(): InstallStep[] {
  return [
    {
      iconKey: "share",
      title: "Click the Share button in the toolbar",
      subtitle: "Located in Safari's top toolbar area",
      iconLabel: "Share",
    },
    {
      iconKey: "plusSquare",
      title: 'Choose "Add to Dock"',
      subtitle: "The app opens as its own window from the Dock",
      iconLabel: "Add to Dock",
    },
  ];
}
