# ListMaster: React PWA → Expo React Native Migration Plan

## Context

ListMaster is a React PWA (Vite + TypeScript) deployed on GitHub Pages. This plan covers converting it to an Expo React Native app for native iOS/Android distribution. The UI layer (~55 files) must be fully rewritten using React Native primitives, but the entire business logic layer (reducers, Firebase services, state hooks, types) is portable with minor adjustments. Migration work happens on `claude/plan-expo-migration-aStwk` — the production web app on `main`/`gh-pages` is never touched.

---

## Rollback Plan

The web app lives on `main` / `gh-pages` and is never touched by migration work. Rollback at any phase:

| Scenario | Command |
|---|---|
| Abandon migration entirely | `git checkout main` — GitHub Pages deployment unaffected |
| Roll back to start of a phase | `git checkout migration/pre-phaseN` |
| Roll back to pre-migration | `git checkout migration/pre-phase1` |

**Before each phase:** create a rollback tag:
```bash
git tag migration/pre-phase1   # before Phase 1
git tag migration/pre-phase2   # before Phase 2
# etc.
```

The Expo project is scaffolded as a new `ListMasterExpo/` directory. The existing `src/` tree is never deleted during migration — only new files are added — keeping destructive risk near zero.

---

## Reusability Audit

### Copy Verbatim (zero changes needed)
- `src/models/types.ts`
- `src/store/categoriesReducer.ts` + all handler files (`categoryHandlers.ts`, `itemHandlers.ts`, `groupHandlers.ts`, `metaHandlers.ts`, `categoryAttributeHandlers.ts`, `reducerHelpers.ts`)
- `src/store/useCategoriesStore.ts`, `useCategoryActions.ts`, `useCategoryDerived.ts`
- `src/store/useCloudSync.ts`, `useCloudSyncSubscription.ts`, `syncInitialLoad.ts`, `syncSubscriptionSetup.ts`
- `src/store/useSyncStore.tsx`, `useSyncActions.ts`
- `src/services/syncService.ts`, `authService.ts`
- `src/lib/utils.ts`
- `src/features/settings/hooks/` — all 7 dialog/state hooks (pure React state, no DOM)
- `src/features/settings/utils/dragUtils.ts` (pure math, no DOM)
- `src/features/settings/constants.ts`

### Adapt (targeted replacement)
- `src/services/persistenceService.ts` — `localStorage` → AsyncStorage write-through cache
- `src/services/settingsService.ts` — same pattern
- `src/services/hapticService.ts` — `navigator.vibrate()` → `expo-haptics`
- `src/services/firebaseConfig.ts` — remove `persistentMultipleTabManager` (IndexedDB/web-only)
- `src/store/useSettingsStore.ts` — remove `applyThemeToDOM` DOM calls; expose theme token object
- `src/store/useTheme.ts` — rewrite as pure token object (no `document.documentElement` writes)
- `src/features/settings/hooks/useCategoryDrag.ts`, `useGroupDrag.ts` — replace pointer events with `react-native-gesture-handler` `PanGestureHandler`

### Rewrite (UI layer — ~55 files)
All files in `src/components/`, `src/screens/`, `src/features/settings/components/`. Business logic (store calls, handlers) is portable; only JSX/HTML primitives change.

### Delete (web-only, no mobile equivalent)
`src/services/installPromptService.ts`, `src/lib/detectPlatform.ts`, `src/lib/installSteps.ts`, `src/lib/installStepsDesktop.ts`, all `Install*` components, `OnboardingInstallScreen.tsx`, `PageTransitionWrapper.tsx`, all `src/components/ui/` shadcn/ui web components, `tokens.css`, `index.css`

---

## New Dependencies

```
# Expo core
expo                               ^52+
expo-router                        file-based navigation (replaces React Router)
expo-haptics                       replaces hapticService.ts
expo-font                          Geist variable font
expo-splash-screen                 replaces SplashScreen.tsx animation
expo-status-bar

# Storage
@react-native-async-storage/async-storage    replaces localStorage

# Safe area & navigation
react-native-safe-area-context     replaces CSS env(safe-area-inset-*)
react-native-screens               required by Expo Router

# Gestures & animation
react-native-gesture-handler       replaces pointer event drag/swipe handlers
react-native-reanimated            replaces CSS transitions

# Bottom sheet
@gorhom/bottom-sheet               replaces custom SettingsSheet modal

# Styling
nativewind ^4                      Tailwind CSS for React Native (preserves class names)
tailwindcss                        must match NativeWind peer dep

# Path aliases
babel-plugin-module-resolver       @/ alias for Metro bundler

# Firebase (unchanged)
firebase ^12                       already installed; keep same version
```

---

## Phase 1 — Scaffold & Portable Core (1–2 days)

**Goal:** Bare Expo app boots with all business logic loaded, typed correctly, and backed by AsyncStorage.

```bash
git tag migration/pre-phase1
```

1. Scaffold: `npx create-expo-app ListMasterExpo --template blank-typescript`
2. Configure Metro `@/` alias via `babel-plugin-module-resolver` in `babel.config.js`
3. Copy all verbatim-portable files into the new project
4. Rewrite `persistenceService.ts` — AsyncStorage write-through cache (synchronous reads via in-memory mirror, async background writes; preserves reducer's synchronous contract)
5. Rewrite `settingsService.ts` — same pattern
6. Rewrite `hapticService.ts` — `expo-haptics` (5 methods map directly: light/medium/heavy/success/selection)
7. Rewrite `firebaseConfig.ts` — remove `persistentMultipleTabManager` and `localCache` config (Firestore falls back to memory cache; AsyncStorage is the persistence layer)
8. Rewrite `useSettingsStore.ts` — remove `applyThemeToDOM`; expose theme token object via context
9. Create `src/lib/theme.ts` — TypeScript token object mirroring `tokens.css` (light/dark × 3 color themes)
10. Add providers (`SettingsProvider`, `SyncProvider`, `StoreProvider`) to `app/_layout.tsx`
11. `npx tsc --noEmit` — all types pass

**Verify:** App boots on simulator; providers mount without crash; `useCategoriesStore` returns empty state; AsyncStorage read/write confirmed via debugger.

---

## Phase 2 — Navigation Shell & Theme System (2–3 days)

**Goal:** Expo Router navigation works; light/dark/color theming applies correctly.

```bash
git tag migration/pre-phase2
```

1. Install NativeWind v4 + `tailwindcss`; configure `tailwind.config.js` with design token extension from `tokens.css` values
2. Add `nativewind/babel` to `babel.config.js`
3. Install `react-native-safe-area-context`, `react-native-screens`
4. Create Expo Router screen files:
   - `app/_layout.tsx` — root layout: providers + `SafeAreaProvider` + `GestureHandlerRootView`
   - `app/index.tsx` — splash gate + onboarding/main fork (replaces `App.tsx` routing logic)
   - `app/onboarding/welcome.tsx`, `setup.tsx`, `sync.tsx`
   - `app/(main)/index.tsx` — MainScreen shell
5. Implement splash timing via `expo-splash-screen` (`preventAutoHideAsync` / `hideAsync`)
6. Wire `useColorScheme` from `react-native` into `useSettingsStore` for system appearance detection

**Verify:** Navigate through onboarding flow on simulator; theme switching applies; safe area insets correct on notched device.

---

## Phase 3 — Core Screens (3–5 days)

**Goal:** All onboarding screens and the main checklist screen fully functional.

```bash
git tag migration/pre-phase3
```

1. Install `react-native-gesture-handler`, `react-native-reanimated`; add `GestureHandlerRootView` to root layout
2. Install `expo-font`; load Geist variable font in root layout
3. Create `src/components/primitives/`:
   - `Button.tsx` — `Pressable` + press-scale animation
   - `StyledTextInput.tsx` — `TextInput` with styled focus ring
   - `Sheet.tsx` — slide-up modal (or use `@gorhom/bottom-sheet`)
   - `Dialog.tsx` — `Modal` + `Animated.View`
4. Rewrite all three onboarding screens (business logic unchanged; JSX primitives swap)
5. Rewrite `SplashScreen` — CSS transitions → Reanimated `withTiming`/`withSpring`
6. Rewrite `MainScreen` — `div` layout → `View flex:1` + `SafeAreaView`; remove `InstallToast`/`InstallSheet`
7. Rewrite `CategoryPanel` — scrollable `div` → `FlatList`
8. Rewrite `ChecklistItemRow` — `li` → `View`, `button` → `Pressable`
9. Rewrite `SwipeableRow` — pointer state machine → `react-native-gesture-handler` `Swipeable`; snap thresholds and haptic calls unchanged
10. Rewrite `HeaderBar`, `BottomBar`, `CategoryPicker` (horizontal `ScrollView`), `GroupTabBar`, `AddItemInput`, `EmptyState`, `ListMetaBar`, `RenameItemDialog`

**Verify:** Full checklist CRUD on device — add, check/uncheck, swipe-to-delete, category navigation, category picker scroll.

---

## Phase 4 — Settings Feature (3–4 days)

**Goal:** Full SettingsSheet and all 30+ settings components, including drag-to-reorder.

```bash
git tag migration/pre-phase4
```

1. Implement `SettingsSheet` using `@gorhom/bottom-sheet` (velocity-based dismissal, keyboard avoidance, safe area)
2. Rewrite each section component in `src/features/settings/components/`:
   - Radio rows (appearance, color theme, text size)
   - `NameSection` — `TextInput`
   - `SyncSection` — `Text` + `Pressable` CTA
   - `DataSection` — destructive `Pressable` row
   - `CategoriesGroupsSection`, `FlatLayout`, `GroupsMapSection` — `View` + `FlatList`
3. Rewrite drag-to-reorder:
   - Replace `window.addEventListener("pointermove")` with `PanGestureHandler`
   - Replace `translateY` state with Reanimated `useSharedValue`
   - Reuse `dragUtils.ts` slot-snap math verbatim (pure functions)
4. Rewrite all dialog components using new `Dialog.tsx`/`Sheet.tsx` primitives
5. All dialog-state hooks copied verbatim (pure React state, no DOM)

**Verify:** Add/rename/drag/delete category; assign to group; enable/disable sync; change appearance/theme/text size.

---

## Phase 5 — Polish & App Store Preparation (2–3 days)

**Goal:** Production-quality UX and App Store readiness.

```bash
git tag migration/pre-phase5
```

1. `expo-status-bar` for theme-aware status bar per color scheme
2. Replace `visibilitychange` event with `AppState.addEventListener('change', ...)` for foreground detection
3. `KeyboardAvoidingView` replacing `--keyboard-inset` CSS variable approach
4. Configure `app.json` — bundle ID, name, icon, splash screen assets
5. Remove all remaining web-only dead code
6. Test on physical iOS + Android devices (safe area, haptics, keyboard, dark mode, back button)
7. `eas build --platform ios --profile preview` — internal distribution build

**Verify:** EAS build installs on physical device; full regression test of all features.

---

## Architectural Decisions

| Decision | Rationale |
|---|---|
| **AsyncStorage write-through cache** | Keeps in-memory mirror for synchronous reads; writes to AsyncStorage in background. Preserves reducer's synchronous contract without making every action `async`. |
| **NativeWind over StyleSheet API** | Preserves Tailwind class names; design tokens in `tailwind.config.js` map directly from `tokens.css`. Plain `StyleSheet.create()` would require rewriting every class string. |
| **`@gorhom/bottom-sheet` for SettingsSheet** | Requires `react-native-reanimated` + `react-native-gesture-handler` (already needed). Provides velocity-based dismissal, keyboard avoidance, and safe area handling out of the box. |
| **Firebase JS SDK v12 (unchanged)** | Works in React Native. Only blocker: remove `persistentMultipleTabManager()` (requires IndexedDB). Firestore falls back to memory cache; AsyncStorage is the persistence layer. |
| **Expo Router** | File-based routing matches existing `/screens` structure; `useNavigate()` → `useRouter()` is a mechanical swap; integrates with Expo build system. |

---

## Critical Files

| File | Why critical |
|---|---|
| `src/services/persistenceService.ts` | AsyncStorage write-through cache decision cascades to reducer auto-save |
| `src/store/categoriesReducer.ts` | Orchestrates all auto-save calls; any persistence contract change appears here |
| `src/features/settings/hooks/useCategoryDrag.ts` | Most complex adaptation — pointer events → `PanGestureHandler`; `dragUtils.ts` math reused |
| `src/store/useSettingsStore.ts` | Bridge between ported token system and component tree; `applyThemeToDOM` → RN theme context |
| `src/services/firebaseConfig.ts` | Removing `persistentMultipleTabManager` is the only Firebase blocker |

---

## Verification Checklist

- [ ] Phase 1: `npx tsc --noEmit` passes; providers mount; AsyncStorage read/write confirmed
- [ ] Phase 2: Onboarding navigation works; theme switching correct; safe area insets correct
- [ ] Phase 3: Full checklist CRUD on device (add, check, swipe-to-delete, category navigation)
- [ ] Phase 4: All settings panels functional; drag-to-reorder works; sync enable/disable works
- [ ] Phase 5: EAS build installs on physical iOS + Android; no regressions
