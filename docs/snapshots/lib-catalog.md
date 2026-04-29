# `src/lib/` Catalog — April 2026

> **Purpose:** Reference snapshot of every file in `src/lib/`. All files here are pure, framework-agnostic utility modules — no React, no hooks, no I/O. They can be imported by any layer of the app.

---

## Table of Contents

- [detectPlatform.ts](#detectplatformts)
- [installSteps.ts](#installstepsts)
- [installStepsDesktop.ts](#installstepsdesktopts)
- [utils.ts](#utilsts)

---

## `detectPlatform.ts`

**File:** `src/lib/detectPlatform.ts`

Sniffs `navigator.userAgent` to detect device mode and browser. Used by `OnboardingInstallScreen` and `InstallInstructions` to pre-select the correct set of add-to-home-screen steps.

### Types

| Type                | Values                                                 | Description                |
| ------------------- | ------------------------------------------------------ | -------------------------- |
| `DeviceMode`        | `"mobile" \| "desktop"`                                | Device form factor         |
| `MobileBrowser`     | `"safari" \| "chrome" \| "firefox"`                    | Mobile browser identifier  |
| `DesktopBrowser`    | `"chrome" \| "edge" \| "safari"`                       | Desktop browser identifier |
| `PlatformDetection` | `{ deviceMode, mobileBrowser, desktopBrowser, isIos }` | Full detection result      |

### Function

| Function         | Signature                 | Description                                                               |
| ---------------- | ------------------------- | ------------------------------------------------------------------------- |
| `detectPlatform` | `() => PlatformDetection` | Sniffs UA string; returns best-guess platform info. Called once on mount. |

### Detection logic

| Browser (mobile) | Detection rule                                                |
| ---------------- | ------------------------------------------------------------- |
| `"firefox"`      | UA contains `FxiOS` or `Firefox`                              |
| `"chrome"`       | UA contains `CriOS` (Chrome on iOS) or `Chrome` without `Edg` |
| `"safari"`       | Default fallback for iOS WebKit (includes in-app browsers)    |

| Browser (desktop) | Detection rule                     |
| ----------------- | ---------------------------------- |
| `"edge"`          | UA contains `Edg/`                 |
| `"chrome"`        | UA contains `Chrome` without `Edg` |
| `"safari"`        | Default fallback                   |

`isIos` is `true` when UA matches `/iPhone|iPad|iPod/i`.

---

## `installSteps.ts`

**File:** `src/lib/installSteps.ts`

Pure data definitions for mobile add-to-home-screen install instruction steps. Returns arrays of `InstallStep` objects keyed to icon identifiers from `InstallIcons`.

### Types

| Type          | Fields                                      | Description                    |
| ------------- | ------------------------------------------- | ------------------------------ |
| `InstallStep` | `iconKey`, `title`, `subtitle`, `iconLabel` | A single numbered install step |

`iconKey` must be one of: `"share"`, `"plusSquare"`, `"menuDots"`, `"menuDotsH"`, `"download"`, `"globe"`.

### Functions

| Function                | Signature                           | Platform           | Steps |
| ----------------------- | ----------------------------------- | ------------------ | ----- |
| `getMobileSafariSteps`  | `() => InstallStep[]`               | iOS/iPadOS Safari  | 3     |
| `getMobileChromeSteps`  | `(isIos: boolean) => InstallStep[]` | Chrome iOS/Android | 3     |
| `getMobileFirefoxSteps` | `() => InstallStep[]`               | Firefox mobile     | 3     |

`getMobileChromeSteps` adapts icon and copy based on `isIos` — Chrome on iOS uses the share sheet (same as Safari); Chrome on Android uses the `⋮` menu and "Install app" option.

---

## `installStepsDesktop.ts`

**File:** `src/lib/installStepsDesktop.ts`

Pure data definitions for desktop browser install instruction steps. Imports `InstallStep` from `installSteps.ts`.

### Functions

| Function            | Signature             | Browser        | Steps |
| ------------------- | --------------------- | -------------- | ----- |
| `getChromeSteps`    | `() => InstallStep[]` | Chrome desktop | 2     |
| `getEdgeSteps`      | `() => InstallStep[]` | Edge desktop   | 2     |
| `getSafariMacSteps` | `() => InstallStep[]` | Safari macOS   | 2     |

Desktop flows are shorter (2 steps) because browser-level install prompts are simpler than mobile share sheets.

---

## `utils.ts`

**File:** `src/lib/utils.ts`

Shared pure utility functions. Currently contains the shadcn/ui standard `cn` helper.

### Functions

| Function | Signature                             | Description                                                                                            |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `cn`     | `(...inputs: ClassValue[]) => string` | Merges Tailwind class names using `clsx` + `tailwind-merge`. Deduplicates conflicting utility classes. |

### Usage

```ts
import { cn } from "@/lib/utils";
cn("px-4", condition && "bg-green-500", "px-2"); // → "bg-green-500 px-2"
```

`tailwind-merge` ensures that conflicting utilities (e.g. `px-4` and `px-2`) resolve to the last one rather than both being emitted. This is the standard shadcn/ui pattern for conditional class composition.
