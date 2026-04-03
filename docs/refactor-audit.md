# Refactor Audit Report

> Generated as part of the Phase 0 audit. This document captures the current state of the codebase before refactoring.

---

## 0.1 File Size Audit

| File Path                                  | Lines | Concerns                                                        |
| ------------------------------------------ | ----- | --------------------------------------------------------------- |
| `src/screens/SettingsSheet.tsx`            | 1,899 | Mixed drag logic, 15+ useState, 8+ dialogs, inline SVG icons    |
| `src/store/useCategoriesStore.ts`          | 944   | Reducer + Provider + 50+ callbacks in one file                  |
| `src/components/CategoryPanel.tsx`         | 423   | AddItemInput sub-component, sort logic, empty states, item list |
| `src/screens/OnboardingSetupScreen.tsx`    | 317   | Two-path form (manual + sync), inline SVG                       |
| `src/screens/OnboardingInstallScreen.tsx`  | 184   | Instruction steps with inline SVG, gtag declaration             |
| `src/components/GroupTabBar.tsx`           | 176   | Drag-to-scroll + underline animation (manageable)               |
| `src/components/ui/action-sheet.tsx`       | 164   | shadcn primitive — do not edit                                  |
| `src/components/ui/dialog.tsx`             | 161   | shadcn primitive — do not edit                                  |
| `src/components/SwipeableRow.tsx`          | 157   | Pointer event swipe logic — single concern (fine)               |
| `src/store/useSyncStore.tsx`               | 151   | Provider + types + callbacks — single concern (fine)            |
| `src/services/syncService.ts`              | 150   | Firebase CRUD — single concern (fine)                           |
| `src/components/BottomBar.tsx`             | 150   | Nav chevrons + clear button + ActionSheet (borderline)          |
| `src/components/CategoryPicker.tsx`        | 149   | Drag-to-scroll picker — single concern (fine)                   |
| `src/services/settingsService.ts`          | 139   | localStorage CRUD — single concern (fine)                       |
| `src/components/ui/sheet.tsx`              | 141   | shadcn primitive — do not edit                                  |
| `src/screens/OnboardingWelcomeScreen.tsx`  | 125   | Simple screen with animations (fine)                            |
| `src/store/useSettingsStore.ts`            | 124   | Provider + state + callbacks (fine)                             |
| `src/components/HeaderBar.tsx`             | 113   | Header with refresh + settings + pickers (borderline)           |
| `src/components/PageTransitionWrapper.tsx` | 108   | Route transition logic — single concern (fine)                  |
| `src/screens/SplashScreen.tsx`             | 101   | Animated splash — single concern (fine)                         |

### Files requiring decomposition (>250 lines or multiple concerns):

1. **`SettingsSheet.tsx` (1,899)** — Critical. Contains category drag logic, group drag logic, 8+ dialog modals, appearance/text-size/sync settings, inline SVG icons.
2. **`useCategoriesStore.ts` (944)** — Large but single-concern reducer. Can be split into reducer + provider + types.
3. **`CategoryPanel.tsx` (423)** — Contains `AddItemInput` sub-component, sort controls, and item list. Extraction candidates clear.
4. **`OnboardingSetupScreen.tsx` (317)** — Two-path form. Moderate — could extract sync-code section.

---

## 0.2 TypeScript Health Audit

| Metric                 | Count |
| ---------------------- | ----- |
| `tsc --noEmit` errors  | 0     |
| `any` type annotations | 0     |
| `as any` casts         | 0     |
| `// @ts-ignore`        | 0     |
| Missing return types   | ~20   |
| `.js`/`.jsx` files     | 0     |

**Assessment:** TypeScript health is excellent. Zero `any` types, zero compiler errors. The main gap is missing explicit return type annotations on components and callbacks — these will be added during Phase 3.

---

## 0.3 Documentation Audit

### Root README.md

- ✅ Exists and is reasonably accurate
- ⚠️ Missing: `tsc --noEmit` script reference, sync/Firebase feature mention
- ⚠️ Clone URL is generic `<repository-url>`

### `docs/reference/` — 12 files, all relevant and up to date

These are authoritative reference docs. All should be retained and updated if the refactor changes anything they describe.

### `docs/snapshots/` — 3 files, point-in-time captures

These document current behavior. Will need updating after refactor only if component structure changes.

### `docs/plans/` — 15 files to triage:

| File                                        | Classification       | Action           |
| ------------------------------------------- | -------------------- | ---------------- |
| `add-item-input-fix-and-splash-screen.md`   | Minor fix (shipped)  | Delete           |
| `add-to-homescreen-onboarding.md`           | Feature (shipped)    | Keep → features/ |
| `bottom-bar-safe-area-fix.md`               | Minor fix (shipped)  | Delete           |
| `bottom-fade-and-row-density.md`            | Minor tweak (done)   | Delete           |
| `category-groups.md`                        | Major feature (live) | Keep → features/ |
| `check-all-and-nav-chevrons.md`             | Minor feature (done) | Delete           |
| `db-sync-options.md`                        | Research/spike       | Keep → features/ |
| `firebase-sync-implementation.md`           | Major feature (live) | Keep → features/ |
| `github-pages-deploy.md`                    | Infra (done)         | Delete           |
| `ios-feel-overhaul.md`                      | Major design (live)  | Keep → features/ |
| `refresh-button.md`                         | Minor fix (done)     | Delete           |
| `scroll-fade-and-bottom-bar-fix.md`         | Minor fix (done)     | Delete           |
| `settings-categories-groups-ux-redesign.md` | Major feature (live) | Keep → features/ |
| `settings-phase-2-completion.md`            | Major feature (live) | Keep → features/ |
| `swipe-smoothness-and-theme-bar-fix.md`     | Minor fix (done)     | Delete           |

**Summary:** 8 files to delete, 7 to move to `docs/plans/features/`.

---

## 0.4 Dependency Graph — Oversized Files

### `SettingsSheet.tsx` (1,899 lines)

- **Imports from:** Sheet, Dialog, Button, Input, ToggleGroup, ActionSheet, useCategoriesStore, useSettingsStore, useSyncStore, cn, TextSize
- **Imported by:** MainScreen
- **State owned:** ~15 useState hooks (rename, delete, add, drag, expanded groups, sync dialogs)
- **Side effects:** 4 useEffects (category drag handlers, group drag handlers, group expansion, store ref sync)

### `useCategoriesStore.ts` (944 lines)

- **Imports from:** uuid, types, PersistenceService, useSyncStore, useSettingsStore
- **Imported by:** MainScreen, HeaderBar, CategoryPanel, BottomBar, SettingsSheet, OnboardingSetupScreen, CategoryPicker
- **State owned:** StoreState (categories, selectedCategoryID, groups, selectedGroupID)
- **Side effects:** Cloud sync subscription, debounced cloud save, localStorage auto-save

### `CategoryPanel.tsx` (423 lines)

- **Imports from:** Category type, useCategoriesStore, HapticService, SwipeableRow
- **Imported by:** MainScreen
- **State owned:** tappedId, mounted (local); delegates to store for mutations
- **Contains:** AddItemInput sub-component (lines 14-86)

---

## 0.5 Refactor Plan

### SettingsSheet.tsx → 8+ extracted files

1. **`useCategoryDrag.ts`** — Custom hook for category drag-to-reorder (all catDragState, refs, handlers)
2. **`useGroupDrag.ts`** — Custom hook for group drag-to-reorder
3. **`SettingsCard.tsx`** — Presentational wrapper (already exists inline at bottom of file)
4. **`SectionLabel.tsx`** — Presentational label (already exists inline at bottom of file)
5. **`CategoriesGroupsSection.tsx`** — The categories & groups settings card content
6. **`AppearanceSection.tsx`** — Appearance toggle group
7. **`TextSizeSection.tsx`** — Text size toggle group
8. **`SyncSection.tsx`** — Sync & backup card
9. **`SettingsDialogs.tsx`** — All 8+ dialog modals extracted to a single file (or split further)

### useCategoriesStore.ts → 3 files

1. **`categoriesReducer.ts`** — Pure reducer function + action types + helper functions
2. **`useCategoriesStore.ts`** — Provider + context + derived values + callbacks (slimmed)
3. Types stay in `models/types.ts` (already there)

### CategoryPanel.tsx → 3 files

1. **`AddItemInput.tsx`** — Extracted sub-component (already self-contained)
2. **`ChecklistItemRow.tsx`** — Single item row component
3. **`CategoryPanel.tsx`** — Slimmed parent composing the above
