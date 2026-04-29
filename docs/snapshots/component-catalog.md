# Component Catalog — April 2026

> **Purpose:** A reference snapshot of every component in `src/components/`. For each component, this document records its props interface, key behaviors, implementation details, and where it is used. Use this when diagnosing regressions, planning changes, or onboarding to the codebase.

---

## Table of Contents

- [HeaderBar](#headerbar)
- [GroupTabBar](#grouptabbar)
- [CategoryPicker](#categorypicker)
- [CategoryPanel](#categorypanel)
- [AddItemInput](#additeminput)
- [ChecklistItemRow](#checklistitemrow)
- [ListMetaBar](#listmetabar)
- [EmptyState](#emptystate)
- [BottomBar](#bottombar)
- [SwipeableRow](#swipeablerow)
- [PageIndicator](#pageindicator)
- [PageTransitionWrapper](#pagetransitionwrapper)
- [OnboardingCategoryInput](#onboardingcategoryinput)
- [OnboardingSyncCodeInput](#onboardingsynccodedinput)
- [InstallToast](#installtoast)
- [InstallSheet](#installsheet)
- [InstallStepper](#installstepper)
- [InstallInstructions](#installinstructions)
- [InstallIcons](#installicons)
- [SyncFeatureRow](#syncfeaturerow)
- [SyncBenefitsCard](#syncbenefitscard)
- [InstallSyncCodeCard](#installsynccodecard)
- [InstallDeviceToggle](#installdevicetoggle)
- [CategoryPickerPill](#categorypickerpill)
- [UI Primitives (shadcn/ui)](#ui-primitives-shadcnui)

---

## `HeaderBar`

**File:** `src/components/HeaderBar.tsx`
**Used by:** `MainScreen`

### Props

| Prop             | Type         | Required | Description                                             |
| ---------------- | ------------ | -------- | ------------------------------------------------------- |
| `scrolled`       | `boolean`    | No       | When `true`, shrinks the greeting title to compact form |
| `onOpenSettings` | `() => void` | Yes      | Called when the settings gear icon is tapped            |
| `onRefresh`      | `() => void` | No       | Called ~800 ms after the refresh button is tapped       |

### Internal store access

Reads `useSettingsStore()` for `userName` and `useCategoriesStore()` for `hasGroups`, `groups`, `selectedGroupID`, and `selectGroup`.

### Behavior

The header is a `<header>` element with `sticky top-0 z-10`. Its `paddingTop` is set inline to `calc(env(safe-area-inset-top, 0px) + 8px)` to clear the iOS notch. A downward gradient (`linear-gradient(to top, transparent 0%, var(--color-surface-background) 35%, ...)`) fades list content scrolling below.

#### Greeting title (scroll-shrink animation)

The greeting reads `"Welcome, {userName}"` with the name rendered in `var(--color-brand-green)`. When `scrolled` is `true`, the title transitions:

- Size: `text-2xl` → `text-base opacity-60`
- Transform: `scale(1)` → `scale(0.88) translateX(-6%)` (keeps the text visually left-aligned)
- Letter spacing: `-0.01em` → `0`
- Duration: `220ms ease-out`

If `trimmedName` is empty, a flex spacer replaces the greeting text.

#### Refresh button

A circular `w-9 h-9` button tinted with `rgba(var(--color-brand-deep-green-rgb), 0.10)`. Uses `.press-scale` class. On tap: `isRefreshing` → `true`, icon spins for 800 ms (`animation: spin 0.7s linear infinite`), then `onRefresh?.()` fires.

#### Settings button

A circular `w-9 h-9` button with a gear icon filled with `var(--color-brand-teal)`. Same tinted background. Calls `onOpenSettings` on tap.

#### Child components

- `GroupTabBar` — conditionally rendered when `hasGroups` is `true`, between greeting row and `CategoryPicker`.
- `CategoryPicker` — always rendered as the last child of `<header>`.

---

## `GroupTabBar`

**File:** `src/components/GroupTabBar.tsx`
**Used by:** `HeaderBar` (conditional on `store.hasGroups`)

### Props

| Prop              | Type                                                | Required | Description                          |
| ----------------- | --------------------------------------------------- | -------- | ------------------------------------ |
| `groups`          | `{ id: string; name: string; sortOrder: number }[]` | Yes      | Sorted list of user-defined groups   |
| `selectedGroupID` | `string \| null`                                    | Yes      | Active group ID, or `null` for "All" |
| `onSelectGroup`   | `(id: string \| null) => void`                      | Yes      | Called when a tab is tapped          |

### Behavior

Renders a horizontal tab bar: "All" tab first, followed by user-defined groups sorted by `sortOrder`. The container is `overflow-x: auto` with `scrollbarWidth: "none"` and `touchAction: "pan-y"`. Uses `role="tablist"` with `aria-label="Groups"`.

#### Tab buttons

Flat text buttons (no `rounded` class). `role="tab"`, `aria-pressed`. Text style: `text-sm`, active `fontWeight: 600` in `var(--color-brand-green)`, inactive `fontWeight: 500` in `var(--color-text-secondary)`. Press feedback: `active:opacity-50`. `select-none` prevents text selection during drag. `touchAction: "manipulation"` kills 300ms tap delay.

#### Sliding underline indicator

`useLayoutEffect` on `selectedGroupID` reads `getBoundingClientRect()` on the active button and container, writes `left` and `width` to the underline `ref`'s inline style. Transition: `var(--duration-element) var(--spring-snap)` — must stay in inline `style`, not Tailwind classes.

#### Drag-to-scroll

Pointer Events pattern matching `CategoryPicker`: `setPointerCapture` after |Δx| > 5px, `hasDraggedRef` prevents accidental tab selection, `setTimeout(..., 0)` resets after click propagation. Uses `onPointerCancel` alongside `onPointerUp`.

---

## `CategoryPicker`

**File:** `src/components/CategoryPicker.tsx`
**Used by:** `HeaderBar`

### Props

None. Reads `categoriesInSelectedGroup`, `selectedCategoryID`, and `selectCategory` from `useCategoriesStore()` internally.

### Behavior

Renders a horizontally scrollable row of pill buttons — one per category in the selected group. Wrapped in a pill-shaped tinted container (`rgba(var(--color-brand-deep-green-rgb), 0.12)`).

#### Empty group state

When `categoriesInSelectedGroup.length === 0`, renders a centered "No lists in this group yet" message instead of the pill row.

#### Pill styles

- Selected: `backgroundColor: var(--color-surface-card)`, `color: var(--color-brand-green)`, `fontWeight: 700`, box-shadow with `rgba(var(--color-brand-deep-green-rgb), 0.16)`.
- Unselected: `backgroundColor: transparent`, `color: var(--color-text-secondary)`.
- Transitions: `var(--duration-element) var(--ease-decelerate)`.
- `flex-1 min-w-max` — pills fill when few; overflow to enable drag-scroll when many.
- `active:scale-[0.97]` — press feedback. Pill tap triggers `HapticService.selection()`.

#### Selection-follow behavior

A `useEffect` on `selectedCategoryID` calls `selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })`.

#### Drag-to-scroll (`hasDraggedRef`)

Same Pointer Events pattern as `GroupTabBar`.

---

## `CategoryPanel`

**File:** `src/components/CategoryPanel.tsx`
**Icons:** `src/components/CategoryPanelIcons.tsx` (extracted — `noGroupIcon`, `noItemsIcon`)
**Used by:** `MainScreen` (single instance, passed `store.selectedCategory`)

### Props

| Prop       | Type               | Required | Description                                                          |
| ---------- | ------------------ | -------- | -------------------------------------------------------------------- |
| `category` | `Category \| null` | Yes      | The category to render; `null` renders a spacer or empty-group state |

### Behavior

#### Four render paths

| Condition                                                                      | Output                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `!category && store.hasGroups && store.categoriesInSelectedGroup.length === 0` | `<EmptyState>` with folder icon + "No lists in this group" + "Assign lists to this group in Settings."             |
| `!category` (generic)                                                          | `<div className="flex-1" />` — empty spacer                                                                        |
| `category.items.length === 0`                                                  | `<AddItemInput>` above `<EmptyState>` with checklist icon + "No items yet" + "Add your first item above."          |
| `category.items.length > 0`                                                    | Full layout: sticky header (`AddItemInput` + `ListMetaBar`) + scrollable list of `SwipeableRow`/`ChecklistItemRow` |

The empty-group check must come **before** the generic `!category` guard.

#### Full layout structure

Outer column: `flex-1 flex flex-col min-h-0 px-4 pt-1`. Sticky header: `shrink-0 pb-1` containing `AddItemInput` and `ListMetaBar`. Scroll container: `flex-1 overflow-y-auto overscroll-contain` with CSS mask fade. Item list: `<ul>` with `SwipeableRow` wrapping `ChecklistItemRow`.

#### Sort logic

`sortOrder` defaults to `"date"`, `sortDirection` defaults to `"asc"`. Unchecked before checked. Within group: `createdAt` or `name.localeCompare()` with `sensitivity: "base"`.

#### Item tap feedback

`tappedId` state set on tap, cleared after 120 ms. Tap also calls `store.toggleItemInSelectedCategory(item.id)` and `HapticService.light()`.

---

## `AddItemInput`

**File:** `src/components/AddItemInput.tsx`
**Used by:** `CategoryPanel`

### Props

None. Reads `useCategoriesStore()` internally.

### Behavior

Inline input row for adding new checklist items. Card styling: `h-12 rounded-[16px]`, `var(--color-surface-card)`, `var(--elevation-card)`.

- `newItemName` local state drives the controlled input.
- On submit (Enter key or `+` button): calls `store.addItemToSelectedCategory(trimmedValue)`, clears input, triggers `HapticService.light()`, blur→refocus cycle resets iOS auto-capitalize.
- `+` button disabled when trimmed input is empty. Uses `.press-scale` class.
- Input: `enterKeyHint="send"`, `autoCapitalize="sentences"`, `autoComplete="off"`, `autoCorrect="off"`.
- Input caret color: `var(--color-brand-green)`.
- 16px font-size forced by global CSS to prevent iOS auto-zoom.

---

## `ChecklistItemRow`

**File:** `src/components/ChecklistItemRow.tsx`
**Used by:** `CategoryPanel` (inside `SwipeableRow`)

### Props

| Prop       | Type            | Required | Description                                |
| ---------- | --------------- | -------- | ------------------------------------------ |
| `item`     | `ChecklistItem` | Yes      | The checklist item data                    |
| `isTapped` | `boolean`       | Yes      | Whether the row is in press-feedback state |
| `onTap`    | `() => void`    | Yes      | Called when the row is tapped              |

### Behavior

Renders a `<li>` element with circle icon + item name text.

#### Visual states

- **Unchecked:** `var(--color-surface-card)` background, `var(--elevation-card)` shadow, open circle icon in `var(--color-brand-teal)` at 60% opacity, `font-medium` text in `var(--color-text-primary)`.
- **Checked:** `rgba(var(--color-brand-deep-green-rgb), 0.04)` background, no shadow, filled green circle + white checkmark, `line-through` text in `var(--color-text-secondary)`, strikethrough color `rgba(var(--color-brand-green-rgb), 0.45)`.
- **Tapped:** `scale-[0.97] opacity-80` with `80ms ease-out` transitions.
- Text size: `var(--text-size-base)`. Row padding: `var(--row-padding-y)`.

---

## `ListMetaBar`

**File:** `src/components/ListMetaBar.tsx`
**Used by:** `CategoryPanel`

### Props

| Prop                    | Type                            | Required | Description                    |
| ----------------------- | ------------------------------- | -------- | ------------------------------ |
| `itemCount`             | `number`                        | Yes      | Total items in category        |
| `allChecked`            | `boolean`                       | Yes      | Whether all items are checked  |
| `sortOrder`             | `SortOrder`                     | Yes      | Current sort order             |
| `sortDirection`         | `SortDirection`                 | Yes      | Current sort direction         |
| `onCheckAll`            | `() => void`                    | Yes      | Check-all callback             |
| `onUncheckAll`          | `() => void`                    | Yes      | Uncheck-all callback           |
| `onChangeSortOrder`     | `(next: SortOrder) => void`     | Yes      | Sort order toggle callback     |
| `onChangeSortDirection` | `(next: SortDirection) => void` | Yes      | Sort direction toggle callback |

### Behavior

Horizontal flex row: left side has check-all toggle button + item count label ("N items"), right side has sort order toggle ("A–Z" / "Date Added") + divider + sort direction toggle (arrow up/down). All buttons use `.press-scale` and `touchAction: "manipulation"`. Colors: `var(--color-text-secondary)`. Haptics: `HapticService.medium()` for check-all, `HapticService.light()` for sort toggles.

---

## `EmptyState`

**File:** `src/components/EmptyState.tsx`
**Used by:** `CategoryPanel`

### Props

| Prop       | Type        | Required | Description                                   |
| ---------- | ----------- | -------- | --------------------------------------------- |
| `icon`     | `ReactNode` | Yes      | SVG icon node rendered inside a tinted circle |
| `title`    | `string`    | Yes      | Primary message text                          |
| `subtitle` | `string`    | No       | Optional secondary description text           |

### Behavior

Centered flex column with mount-in animation. On mount, `mounted` transitions from `false` to `true` via `useEffect`. Container animates from `opacity: 0, translateY(12px), scale(0.92)` to visible over `220ms cubic-bezier(0,0,0.2,1)`.

Icon is rendered inside a `w-16 h-16 rounded-full` circle with `rgba(var(--color-brand-deep-green-rgb), 0.10)` background. Title: `text-base font-medium` in `var(--color-brand-teal)`. Subtitle: `text-sm text-center` in `var(--color-text-secondary)`.

---

## `BottomBar`

**File:** `src/components/BottomBar.tsx`
**Used by:** `MainScreen`

### Props

None. Reads all state directly from `useCategoriesStore()`.

### Behavior

Renders a `<footer>` element that always mounts (ensuring the gradient and safe-area padding are always present). Uses inline `gridTemplateColumns: "1fr auto 1fr"` for the 3-column layout.

#### Grid columns

| Column          | Content                                        | Condition                                |
| --------------- | ---------------------------------------------- | ---------------------------------------- |
| Left (`1fr`)    | Previous-category chevron + name (pill button) | `canSelectPreviousCategory`              |
| Centre (`auto`) | "Clear N" trash icon button                    | Checked items exist in selected category |
| Right (`1fr`)   | Next-category name + chevron (pill button)     | `canSelectNextCategory`                  |

When a column's condition is false, an empty `<div>` placeholder preserves the grid layout.

#### Navigation pills

`press-scale`, `rounded-xl`, `text-xs font-semibold`, `color: var(--color-brand-green)`, `backgroundColor: rgba(var(--color-brand-deep-green-rgb), 0.10)`, `touchAction: manipulation`. Category name: `max-w-[100px] truncate`. `aria-label` set on each button.

#### Clear button

`press-scale`, `rounded-xl`, `text-xs font-semibold`, `color: var(--color-danger)`, `backgroundColor: rgba(212, 75, 74, 0.10)`. Trash icon + "Clear N" text. Opens `ActionSheet` on tap (with `HapticService.light()`). Confirm calls `store.clearCheckedItemsInSelectedCategory()` + `HapticService.medium()`.

#### ActionSheet

Rendered outside the `<footer>` as a sibling. Title: "Clear Checked Items?". Message: "This will remove all checked items from this list." Single destructive "Clear" action.

---

## `SwipeableRow`

**File:** `src/components/SwipeableRow.tsx`
**Used by:** `CategoryPanel` (wraps each `<li>` item)

### Props

| Prop       | Type         | Required | Description                                                    |
| ---------- | ------------ | -------- | -------------------------------------------------------------- |
| `onDelete` | `() => void` | Yes      | Called when the red delete button is tapped after swiping open |
| `children` | `ReactNode`  | Yes      | The item row content                                           |

### Behavior

#### Structure

Clipping shell: `relative overflow-hidden rounded-[14px]`. Delete strip: `absolute right-0, w-20, var(--color-danger)`, `rounded: 0 14px 14px 0`. Content row: `translateX(offsetX)`.

#### Swipe mechanics

- `offsetX` clamped to `[-80, 0]`.
- `offsetAtDragStartRef` captures current `offsetX` on `pointerdown`.
- Snap threshold: `offsetX < -40` → fully open (`-80`), otherwise closed (`0`).
- Spring transition: `300ms cubic-bezier(0.34,1.56,0.64,1)`.
- During drag: `transition: none`.
- `isDragging` as React state (not just ref) — ensures transition style re-evaluates same render cycle.

#### Gesture arbitration

First `pointermove`: if `|dy| >= |dx|` → `isLockedOutRef = true` (yield to vertical scroll). If `|dx| > |dy|` and > 5px → `setPointerCapture` + `e.stopPropagation()`.

#### Content click guard

If row is open (`offsetX !== 0`), tapping the content row calls `e.stopPropagation()` and snaps closed.

#### Haptics

`HapticService.medium()` on snap open. `HapticService.light()` on snap close. `HapticService.heavy()` on delete.

---

## `PageIndicator`

**File:** `src/components/PageIndicator.tsx`
**Used by:** Not currently rendered in `MainScreen` layout (available for future use)

### Props

| Prop          | Type     | Required | Description                               |
| ------------- | -------- | -------- | ----------------------------------------- |
| `count`       | `number` | Yes      | Total number of categories                |
| `activeIndex` | `number` | Yes      | Zero-based index of the selected category |

### Behavior

Renders `count` dots in a horizontal row. Active dot: `18px` wide pill in `var(--color-brand-green)`. Inactive dots: `6px` circles in `var(--color-text-secondary)` at 40% opacity. Spring width animation: `280ms cubic-bezier(0.34,1.56,0.64,1)`. `willChange: "width, background-color, opacity"`. `aria-hidden` — purely decorative.

---

## `PageTransitionWrapper`

**File:** `src/components/PageTransitionWrapper.tsx`
**Used by:** `App.tsx` (wraps all `<Route>` children)

### Props

| Prop       | Type        | Required | Description                            |
| ---------- | ----------- | -------- | -------------------------------------- |
| `children` | `ReactNode` | Yes      | The current route's rendered component |

### Behavior

Provides iOS-style push/pop slide animations on route changes.

#### Route depth

`getRouteDepth(pathname)` returns the number of non-empty path segments. Higher depth = forward (push), lower = backward (pop). Examples: `/` = 0, `/setup` = 1, `/sync` = 1, `/install` = 1.

#### Animation classes

| Direction      | Incoming screen         | Outgoing screen      |
| -------------- | ----------------------- | -------------------- |
| Forward (push) | `page-enter-from-right` | `page-exit-to-left`  |
| Backward (pop) | `page-enter-from-left`  | `page-exit-to-right` |

`prevChildren` is snapshotted at the start of the transition and kept in the DOM until the animation completes (380 ms, matching `--duration-page` in `tokens.css`). After 380 ms, `prevChildren` is cleared and the outgoing screen is unmounted. All four CSS animation keyframes are defined in `index.css`. Both layers use `willChange: "transform"` during transition.

---

## `OnboardingCategoryInput`

**File:** `src/components/OnboardingCategoryInput.tsx`
**Used by:** `OnboardingSetupScreen`

### Props

| Prop         | Type                     | Required | Description                        |
| ------------ | ------------------------ | -------- | ---------------------------------- |
| `categories` | `string[]`               | Yes      | Current list of pending categories |
| `onAdd`      | `(name: string) => void` | Yes      | Called when a category is added    |
| `onRemove`   | `(name: string) => void` | Yes      | Called when a category is removed  |

### Behavior

Category input field with an add button (green circle `+` icon) and animated pending-category list. Local state: `text` (controlled input). Duplicate detection: case-insensitive check against existing `categories`. On add: blur→refocus cycle to reset iOS keyboard.

Pending categories render as animated rows (`animate-in fade-in slide-in-from-top-1 duration-200`) with green checkmark icon, name text, and an `×` remove button. Input: `h-12 rounded-[14px]`, `enterKeyHint="send"`, `autoCapitalize="words"`.

---

## `OnboardingSyncCodeInput`

**File:** `src/components/OnboardingSyncCodeInput.tsx`
**Used by:** `OnboardingSetupScreen`

### Props

| Prop       | Type                      | Required | Description            |
| ---------- | ------------------------- | -------- | ---------------------- |
| `value`    | `string`                  | Yes      | Controlled input value |
| `onChange` | `(value: string) => void` | Yes      | Called on input change |
| `onSubmit` | `() => void`              | Yes      | Called on Enter key    |

### Behavior

Sync code input with label ("Enter a Sync Code"), description text, and an `<Input>` element. Input: `h-12 rounded-[14px] font-mono text-sm`, placeholder `"XXXXX-XXXXX-XXXXX-XXXXX"`, `autoCapitalize="characters"`, `spellCheck={false}`.

---

## `InstallToast`

**File:** `src/components/InstallToast.tsx`
**Used by:** `MainScreen`

### Props

| Prop                 | Type         | Required | Description                                                    |
| -------------------- | ------------ | -------- | -------------------------------------------------------------- |
| `onOpenInstallSheet` | `() => void` | Yes      | Called when the user taps the toast body (not the ×)           |
| `isSuppressed`       | `boolean`    | Yes      | When `true`, the toast must not show (a sheet is already open) |

### Behavior

A dismissible bottom-of-screen banner that nudges existing browser-mode users to install the PWA. All show/hide logic reads from `InstallPromptService` — see `docs/snapshots/services-catalog.md`.

#### Visibility conditions (all must pass)

1. `InstallPromptService.shouldShow()` returns `true` (not permanently dismissed, show count < 3, 7-day cooldown elapsed).
2. `window.matchMedia("(display-mode: standalone)").matches` is `false` (not already installed).
3. `isSuppressed` is `false` (no sheet currently open).

#### Appearance sequence

1. On mount: starts a 2000ms delay timer. If the active element is an `INPUT` or `TEXTAREA` when the timer fires, defers until `focusout`.
2. After the delay: `isVisible = true`, then `isEntered = true` on the next animation frame (triggers slide-up transition).
3. After 20 seconds: `isExiting = true` triggers slide-down dismiss.
4. On tap (×): `isExiting = true` + `InstallPromptService.recordDismissal()`.
5. On body tap: calls `onOpenInstallSheet()` + `InstallPromptService.recordDismissal()`.
6. After exit transition completes (400ms): `isVisible = false`, component returns `null`.

---

## `InstallSheet`

**File:** `src/components/InstallSheet.tsx`
**Used by:** `MainScreen`

### Props

| Prop           | Type                      | Required | Description                             |
| -------------- | ------------------------- | -------- | --------------------------------------- |
| `isOpen`       | `boolean`                 | Yes      | Controls the shadcn `Sheet` open state  |
| `onOpenChange` | `(open: boolean) => void` | Yes      | Called when the sheet should open/close |

### Behavior

A bottom sheet (`Sheet side="bottom"`, `max-h-[90dvh]`, `rounded-t-3xl`) with complete install instructions for existing users who haven't yet installed the PWA.

#### Sections

1. **Header** — "Add to Home Screen" title + "Done" button.
2. **`InstallDeviceToggle`** — segmented Mobile/Desktop toggle, pre-populated by `detectPlatform()`.
3. **`InstallSyncCodeCard`** — shows or enables sync + displays/copies the sync code.
4. **`InstallInstructions`** — step-by-step browser-specific instructions.
5. **"Don't Remind Me" link** — calls `InstallPromptService.setPermanentlyDismissed(true)` and closes the sheet.

#### `handleOpenChange`

When the sheet closes (`open === false`), `InstallPromptService.recordDismissal()` is called. This means closing the sheet (by any mechanism) counts as a dismissal and increments the show count.

#### Sync code flow

`handleGetAndCopyCode` — if sync is not yet enabled, calls `enableSync()` first. Then reads the code directly from `SettingsService.getSyncCode()` (bypasses the store, which may not have flushed yet) and copies to clipboard. Sets `isCopied = true` for 2 seconds for the "Copied!" feedback. Clipboard failures are swallowed — the code is visible for manual copy.

#### Focus sentinel

`sheetFocusSentinelRef` — a visually hidden `<div tabIndex={-1}>` passed as `initialFocus` to prevent the first interactive element from receiving focus and triggering the iOS keyboard on open.

---

## `InstallStepper`

**File:** `src/components/InstallStepper.tsx`
**Used by:** `InstallInstructions`

Renders a vertical numbered stepper for install instruction steps. Each step shows a numbered badge, a connector line (except the last step), a reference icon in a dashed non-interactive container, and instruction text.

### Props

| Prop    | Type            | Required | Description               |
| ------- | --------------- | -------- | ------------------------- |
| `steps` | `InstallStep[]` | Yes      | Array of step definitions |

### `StepCard` (internal)

Each step renders via an internal `StepCard` function component:

- **Number badge**: `w-7 h-7 rounded-full`, `backgroundColor: var(--color-brand-green)`, white text.
- **Connector line**: `w-px flex-1 my-1` in `var(--color-border-subtle)` — omitted on the last step.
- **Reference icon container**: `w-11 h-11 rounded-lg` with `border: 1.5px dashed var(--color-brand-teal)` and `var(--color-surface-green-tint)` background. Styled to look clearly non-interactive (dashed border, no hover/press feedback).
- **Icon label**: `10px` text in `var(--color-text-secondary)` below the icon.
- **Instruction text**: `text-sm` in `var(--color-text-primary)`.

---

## `InstallInstructions`

**File:** `src/components/InstallInstructions.tsx`
**Used by:** `InstallSheet`

Platform-specific add-to-home-screen / install instructions. Renders a `PlatformToggle` (segmented browser selector) followed by an `InstallStepper` with steps for the selected browser.

### Props

| Prop                    | Type                    | Required | Description                                         |
| ----------------------- | ----------------------- | -------- | --------------------------------------------------- |
| `deviceMode`            | `"mobile" \| "desktop"` | Yes      | Current device mode (drives browser options)        |
| `initialMobileBrowser`  | `MobileBrowser`         | No       | Pre-selected mobile browser. Default: `"safari"`    |
| `initialDesktopBrowser` | `DesktopBrowser`        | No       | Pre-selected desktop browser. Default: `"chrome"`   |
| `isIos`                 | `boolean`               | No       | Whether the device is iOS — adapts Chrome icon/copy |

### Browser sets

- **Mobile:** `safari` / `chrome` / `firefox`
- **Desktop:** `chrome` / `edge` / `safari`

Step data comes from `@/lib/installSteps` (mobile) and `@/lib/installStepsDesktop` (desktop).

### `PlatformToggle` (internal)

A generic segmented control. Options: `{ value: T; label: string }[]`. Selected option has `var(--color-surface-card)` background + `var(--color-brand-teal)` text. Unselected: transparent background + `var(--color-text-secondary)` text.

---

## `InstallIcons`

**File:** `src/components/InstallIcons.tsx`
**Used by:** `InstallStepper`

SVG icon components used in install instruction step reference containers. Exports `InstallStepIcon` — a dispatch component that renders the correct SVG based on an `iconKey` string from `InstallStep`.

### Available icons

| Icon function    | `iconKey`       | Visual                                    |
| ---------------- | --------------- | ----------------------------------------- |
| `ShareIcon`      | `"share"`       | Square with up-arrow (iOS share button)   |
| `PlusSquareIcon` | `"plus-square"` | Plus inside a rounded rectangle           |
| `MenuDotsIcon`   | `"menu-dots"`   | Three vertical dots (Android/Chrome)      |
| `MenuDotsHIcon`  | `"menu-dots-h"` | Three horizontal dots (Chrome iOS / Edge) |
| `DownloadIcon`   | `"download"`    | Arrow pointing down to a line (desktop)   |
| `AppIconIcon`    | `"app-icon"`    | Rounded-square app icon placeholder       |

All icons are `24×24` SVG, stroked with `var(--color-brand-teal)`, `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

---

## `SyncFeatureRow`

**File:** `src/components/SyncFeatureRow.tsx`
**Used by:** `SyncBenefitsCard`

Single benefit row: icon (JSX.Element) + title + subtitle. Props: `SyncFeatureRowProps { icon, title, subtitle }`. Stateless, no dependencies beyond React.

---

## `SyncBenefitsCard`

**File:** `src/components/SyncBenefitsCard.tsx`
**Used by:** `OnboardingSyncScreen`

Animated card listing three sync benefit rows. Props: `SyncBenefitsCardProps { isEntered: boolean }`. Uses staggered translate/opacity animation driven by `isEntered`. Renders three `<SyncFeatureRow>` instances.

---

## `InstallSyncCodeCard`

**File:** `src/components/InstallSyncCodeCard.tsx`
**Used by:** `InstallSheet`

Shows the user's sync code (copy button, "Copied!" feedback) or an offer to enable sync when sync is inactive. Props: `InstallSyncCodeCardProps { isSyncEnabled, syncCode, isCopied, syncStatus, onCopy }`. Imports `SyncStatus` from `@/store/useSyncStore`.

---

## `InstallDeviceToggle`

**File:** `src/components/InstallDeviceToggle.tsx`
**Used by:** `InstallSheet`

Segmented Mobile / Desktop toggle. Props: `InstallDeviceToggleProps { deviceMode: "mobile" | "desktop"; onDeviceModeChange: (mode) => void }`. Stateless.

---

## `CategoryPickerPill`

**File:** `src/components/CategoryPickerPill.tsx`
**Used by:** `CategoryPicker`

Single pill button + optional section label for the horizontal category picker. Props: `CategoryPickerPillProps { category, isUngrouped, isSelected, isFirstOfSection, isAllView, labelText, hasDraggedRef, onSelect }`. Fires haptic feedback on select; checks `hasDraggedRef.current` before calling `onSelect` to prevent accidental selection during drag.

---

## UI Primitives (shadcn/ui)

The files in `src/components/ui/` are generated shadcn/ui primitives. **Do not hand-edit these files.** The following is a usage reference only.

### `ActionSheet`

**File:** `src/components/ui/action-sheet.tsx`
**Used by:** `BottomBar`, `SettingsSheet` (via `features/settings/`)

An iOS-style bottom action sheet for confirmations. Props: `isOpen`, `onClose`, `title?`, `message?`, `actions` (array of `{ label, onClick, destructive? }`). Backdrop overlay calls `onClose` on tap. Safe-area padding on the panel.

### `Button`

**File:** `src/components/ui/button.tsx`

Standard shadcn `Button` with `variant` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and `size` props. Used in `SettingsSheet`, onboarding screens, and throughout the app.

### `Dialog`

**File:** `src/components/ui/dialog.tsx`

Standard shadcn `Dialog` (modal overlay). Used in `SettingsSheet` for rename/delete/reset confirmation dialogs.

### `Input`

**File:** `src/components/ui/input.tsx`

Standard shadcn `Input`. Global 16px font-size rule in `index.css` prevents iOS auto-zoom.

### `Sheet`

**File:** `src/components/ui/sheet.tsx`

Standard shadcn `Sheet`. Used by `SettingsSheet` with `side="bottom"`.

### `Toggle` / `ToggleGroup`

**Files:** `src/components/ui/toggle.tsx`, `src/components/ui/toggle-group.tsx`

Standard shadcn primitives. Used in `SettingsSheet` for Appearance mode and Text Size selectors.

---

## `AddCategoryGroupButton`

**File:** `src/features/settings/components/AddCategoryGroupButton.tsx`
**Used by:** `CategoriesGroupsSection`

### Props

| Prop      | Type         | Required | Description                      |
| --------- | ------------ | -------- | -------------------------------- |
| `onClick` | `() => void` | Yes      | Called when the button is tapped |

Full-width branded button (brand-green background tint) with a `+` icon. Extracted from `CategoriesGroupsSection` to keep that component under the 180-line ceiling.

---

## `CategoryPanelIcons`

**File:** `src/components/CategoryPanelIcons.tsx`
**Used by:** `CategoryPanel`

Exports two module-level JSX constants — `noGroupIcon` and `noItemsIcon` — used by `CategoryPanel`'s empty-state render paths. Extracted to keep `CategoryPanel` under the 180-line ceiling.
