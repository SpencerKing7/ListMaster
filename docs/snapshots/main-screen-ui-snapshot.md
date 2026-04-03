# Main Screen UI Snapshot — April 2026# Main Screen UI Snapshot — April 2026

> **Purpose:** This document captures the exact current state of every UI component that makes up the main screen — its HTML structure, layout mechanics, scrolling behavior, known quirks, and what is confirmed working for every main screen component. Use it as a reference baseline when diagnosing regressions or planning changes.> **Purpose:** This document captures the exact current state of every UI component that makes up the main screen — its HTML structure, layout mechanics, scrolling behavior, known quirks, and what is confirmed working for every main screen component. Use it as a reference baseline when diagnosing regressions or planning changes.

> >

> **Last updated:** April 2026. The three-panel slider architecture has been replaced with a single-panel layout. Several components have been extracted into standalone files. See the Architecture Change notes.> **Last updated:** April 2026. The three-panel slider architecture has been replaced with a single-panel layout. See the Architecture Change note in the layout tree section.

---

## High-Level Layout Tree## High-Level Layout Tree

The `MainScreen` render tree, from outermost to innermost:The `MainScreen` render tree, from outermost to innermost:

````

<> (Fragment)<> (Fragment)

  ├── [fixed background div — solid color]       position:fixed, extends into safe areas  ├── [fixed background div — solid color]       position:fixed, extends into safe areas

  ├── [fixed background div — brand gradient]    position:fixed, extends into safe areas  ├── [fixed background div — brand gradient]    position:fixed, extends into safe areas

  └── <div> layout shell                         relative h-dvh flex flex-col overflow-hidden  └── <div> layout shell                         relative h-dvh flex flex-col overflow-hidden

        ├── <HeaderBar>                           sticky top-0, z-10        ├── <HeaderBar>                           sticky top-0, z-10

        │     ├── greeting row (title + refresh icon + settings icon)        │     ├── greeting row (title + refresh icon + settings icon)

        │     ├── <GroupTabBar>                  conditional: only rendered when store.hasGroups        │     ├── <GroupTabBar>                  conditional: only rendered when store.hasGroups

        │     └── <CategoryPicker>               overflow-x:auto pill row        │     └── <CategoryPicker>               overflow-x:auto pill row

        ├── <div> content area                   flex-1 overflow-hidden relative flex flex-col min-h-0        ├── <div> content area                   flex-1 overflow-hidden relative flex flex-col min-h-0

        │     └── <CategoryPanel>                category={store.selectedCategory}        │     └── <CategoryPanel>                category={store.selectedCategory}

        │           ├── <AddItemInput>           extracted standalone component        ├── <BottomBar>                           sticky bottom-0, z-10  (3-column grid)

        │           ├── <ListMetaBar>            sort controls + check-all        └── <SettingsSheet>                       Sheet side="bottom", conditionally open

        │           ├── <SwipeableRow> × N       swipe-to-delete wrapper```

        │           │     └── <ChecklistItemRow> individual item row

        │           └── <EmptyState>             contextual empty state> **Architecture change (April 2026):** The three-panel slider architecture (previous + current + next `CategoryPanel` instances always mounted side-by-side, driven by a `translate3d` animation and Pointer Events gesture handler) has been **removed**. `MainScreen` now renders a single `<CategoryPanel>` with `category={store.selectedCategory}`. Category switching is driven at the store level (`selectNextCategory` / `selectPreviousCategory`). The `contentRef`, `containerRef`, `dragOffset`, `isAnimating`, `contentWidth`, `ResizeObserver`, and all swipe gesture state variables from the old architecture no longer exist in `MainScreen`.

        ├── <BottomBar>                           sticky bottom-0, z-10  (3-column grid)

        └── <SettingsSheet>                       Sheet side="bottom", conditionally open---

```

## Component Details

> **Architecture change (April 2026):** The three-panel slider architecture (previous + current + next `CategoryPanel` instances always mounted side-by-side, driven by a `translate3d` animation and Pointer Events gesture handler) has been **removed**. `MainScreen` now renders a single `<CategoryPanel>` with `category={store.selectedCategory}`. Category switching is driven at the store level (`selectNextCategory` / `selectPreviousCategory`). The `contentRef`, `containerRef`, `dragOffset`, `isAnimating`, `contentWidth`, `ResizeObserver`, and all swipe gesture state variables from the old architecture no longer exist in `MainScreen`.

### `MainScreen` (`src/screens/MainScreen.tsx`)

> **Extraction change (April 2026):** `AddItemInput` (formerly an inline sub-component of `CategoryPanel`) has been extracted to `src/components/AddItemInput.tsx`. `ChecklistItemRow` has been extracted to `src/components/ChecklistItemRow.tsx`. `EmptyState` has been extracted to `src/components/EmptyState.tsx`. `ListMetaBar` (sort controls + check-all) has been extracted to `src/components/ListMetaBar.tsx`.

#### Layout shell

---

```tsx

## Component Details<div className="relative h-dvh flex flex-col overflow-hidden">

```

### `MainScreen` (`src/screens/MainScreen.tsx`)

- `h-dvh` — full dynamic viewport height. This is the **single vertical clip container** for the entire screen.

#### Layout shell- `flex flex-col` — children stack vertically: header → content area → bottom bar.

- `overflow-hidden` — clips child overflow so the panel occupies exactly the available height.

```tsx- `relative` — establishes a stacking context.

<div className="relative h-dvh flex flex-col overflow-hidden">

```#### Background layers



- `h-dvh` — full dynamic viewport height. This is the **single vertical clip container** for the entire screen.Two `position: fixed` divs render **before** the layout shell inside the fragment:

- `flex flex-col` — children stack vertically: header → content area → bottom bar.

- `overflow-hidden` — clips child overflow so the panel occupies exactly the available height.1. **Solid color fill** — `backgroundColor: var(--color-surface-background)`. Extended with `top: calc(-1 * env(safe-area-inset-top, 0px))` and `bottom: calc(-1 * env(safe-area-inset-bottom, 0px))` to fill behind the notch and home indicator during overscroll bounce.

- `relative` — establishes a stacking context.2. **Brand gradient** — `background: var(--gradient-brand-wide)`. Same negative-inset extent.



#### Background layersThese are outside the `overflow-hidden` layout shell so they always cover the full screen.



Two `position: fixed` divs render **before** the layout shell inside the fragment:#### Content area



1. **Solid color fill** — `backgroundColor: var(--color-surface-background)`. Extended with `top: calc(-1 * env(safe-area-inset-top, 0px))` and `bottom: calc(-1 * env(safe-area-inset-bottom, 0px))` to fill behind the notch and home indicator during overscroll bounce.```tsx

2. **Brand gradient** — `background: var(--gradient-brand-wide)`. Same negative-inset extent.<div

  className="flex-1 overflow-hidden relative flex flex-col min-h-0"

These are outside the `overflow-hidden` layout shell so they always cover the full screen.  onScroll={handleScrollWithPosition}

>

#### Content area  <CategoryPanel category={store.selectedCategory} />

</div>

```tsx```

<div

  className="flex-1 overflow-hidden relative flex flex-col min-h-0"`flex-1` consumes all space between header and bottom bar. `flex flex-col min-h-0` passes the flex constraint down so `CategoryPanel` can establish a bounded height for its scroll container. The `onScroll` handler reads `(e.target as HTMLElement).scrollTop` to drive `scrolled` state for the `HeaderBar` title animation.

  onScroll={handleScrollWithPosition}

>#### State variables

  <CategoryPanel category={store.selectedCategory} />

</div>| Variable         | Type      | Purpose                                                          |

```| ---------------- | --------- | ---------------------------------------------------------------- |

| `isSettingsOpen` | `boolean` | Controls `SettingsSheet` open/close                              |

`flex-1` consumes all space between header and bottom bar. `flex flex-col min-h-0` passes the flex constraint down so `CategoryPanel` can establish a bounded height for its scroll container. The `onScroll` handler reads `(e.target as HTMLElement).scrollTop` to drive `scrolled` state for the `HeaderBar` title animation.| `scrolled`       | `boolean` | Whether the list has been scrolled > 20px (drives header shrink) |



#### Keyboard dismiss on scroll#### Mount scroll reset



`handleScroll` calls `(document.activeElement as HTMLElement | null)?.blur()` to dismiss the iOS keyboard whenever the list is scrolled — this is called before `handleScrollWithPosition` updates `scrolled`.On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called. This clears residual scroll offset from onboarding screens that may have had the software keyboard open.



#### State variables---



| Variable         | Type      | Purpose                                                          |### `HeaderBar` (`src/components/HeaderBar.tsx`)

| ---------------- | --------- | ---------------------------------------------------------------- |

| `isSettingsOpen` | `boolean` | Controls `SettingsSheet` open/close                              |```html

| `scrolled`       | `boolean` | Whether the list has been scrolled > 20px (drives header shrink) |<header

  class="sticky top-0 z-10 px-4 pt-2 pb-4"

#### Mount scroll reset  style="padding-top: calc(env(safe-area-inset-top, 0px) + 8px);

         background: linear-gradient(to top, transparent 0%, var(--color-surface-background) 35%, var(--color-surface-background) 100%)"

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called. This clears residual scroll offset from onboarding screens that may have had the software keyboard open.></header>

```

---

- `sticky top-0 z-10` — sticks to the top of the layout shell (not the document, because the ancestor has `overflow-hidden`).

### `HeaderBar` (`src/components/HeaderBar.tsx`)- `paddingTop` overrides Tailwind's `pt-2` to clear the iOS notch.

- The gradient fades list content underneath.

```html

<header#### Greeting title — scroll-shrink animation

  class="sticky top-0 z-10 px-4 pt-2 pb-4"

  style="padding-top: calc(env(safe-area-inset-top, 0px) + 8px);Props: `scrolled?: boolean` (passed from `MainScreen`).

         background: linear-gradient(to top, transparent 0%, var(--color-surface-background) 35%, var(--color-surface-background) 100%)"

></header>```tsx

```className={`font-bold flex-1 min-w-0 truncate transition-all duration-220 ease-out ${

  scrolled ? "text-base opacity-60" : "text-2xl"

- `sticky top-0 z-10` — sticks to the top of the layout shell (not the document, because the ancestor has `overflow-hidden`).}`}

- `paddingTop` overrides Tailwind's `pt-2` to clear the iOS notch.style={{

- The gradient fades list content underneath.  letterSpacing: scrolled ? "0" : "-0.01em",

  transform: scrolled ? "scale(0.88) translateX(-6%)" : "scale(1)",

#### Greeting title — scroll-shrink animation  transformOrigin: "left center",

}}

Props: `scrolled?: boolean` (passed from `MainScreen`).```



```tsxWhen `scrolled` is `true`, the title transitions from `text-2xl` (large iOS-style nav title) to `text-base opacity-60` (compact title). `scale(0.88) translateX(-6%)` keeps the text visually left-aligned during the scale.

className={`font-bold flex-1 min-w-0 truncate transition-all duration-220 ease-out ${

  scrolled ? "text-base opacity-60" : "text-2xl"#### Refresh button

}`}

style={{A circular `w-9 h-9` tinted button. On tap, `isRefreshing` is set to `true`, applying `animation: spin 0.7s linear infinite` to the icon SVG. After 800 ms, `onRefresh?.()` is called (which invokes `window.location.reload()` in `MainScreen`). `@keyframes spin` is defined in `index.css`.

  color: "var(--color-text-primary)",

  letterSpacing: scrolled ? "0" : "-0.01em",#### `CategoryPicker` placement

  transform: scrolled ? "scale(0.88) translateX(-6%)" : "scale(1)",

  transformOrigin: "left center",`CategoryPicker` is the last child of the `<header>` element, below `GroupTabBar` (when groups exist) or directly below the greeting row (when no groups exist).

}}

```---



The greeting reads `"Welcome, {userName}"` with the name rendered in `var(--color-brand-green)`. When `scrolled` is `true`, the title transitions from `text-2xl` (large iOS-style nav title) to `text-base opacity-60` (compact title). `scale(0.88) translateX(-6%)` keeps the text visually left-aligned during the scale. If `trimmedName` is empty, a flex spacer replaces the greeting.### `GroupTabBar` (`src/components/GroupTabBar.tsx`)



#### Refresh buttonRenders a horizontal tab bar with an "All" tab followed by one tab per user-defined group. Conditionally mounted in `HeaderBar` only when `store.hasGroups` is `true`.



A circular `w-9 h-9` button tinted with `rgba(var(--color-brand-deep-green-rgb), 0.10)`. Uses the `.press-scale` utility class for press feedback. On tap:#### Outer shell



1. `isRefreshing` local state is set to `true` — applies `animation: spin 0.7s linear infinite` to the icon SVG.```tsx

2. After 800 ms, `onRefresh?.()` is called (which invokes `window.location.reload()` in `MainScreen`).<div

  ref={containerRef}

`@keyframes spin` is defined in `index.css`. The delay gives tactile confirmation before the reload happens.  role="tablist"

  className="relative flex overflow-x-auto cursor-grab px-2"

#### Settings button  style={{ scrollbarWidth: "none" }}

>

A circular `w-9 h-9` button with a gear icon filled with `var(--color-brand-teal)`. Same tinted background as the refresh button. Calls `onOpenSettings` on tap.```



#### Internal store access- `overflow-x: auto` — native horizontal scroll. Scrollbars suppressed inline (`scrollbarWidth: "none"`) since the global `scrollbar-width: none` rule only applies in some browsers.

- `relative` — establishes stacking context for the absolutely positioned underline indicator.

`HeaderBar` directly reads `useSettingsStore()` for `userName` and `useCategoriesStore()` for `hasGroups`, `groups`, `selectedGroupID`, and `selectGroup`. It passes these to `GroupTabBar` as props and renders `CategoryPicker` as its last child (which reads the store internally).- `role="tablist"` — ARIA landmark for accessibility.



#### `GroupTabBar` placement#### Tab buttons



`GroupTabBar` is conditionally rendered between the greeting row and `CategoryPicker` when `hasGroups` is `true`. It receives `groups`, `selectedGroupID`, and `onSelectGroup` as props from `HeaderBar`.```tsx

<button

#### `CategoryPicker` placement  ref={el => { buttonRefs.current[index] = el; }}

  role="tab"

`CategoryPicker` is the last child of the `<header>` element. It takes no props — it reads all data from `useCategoriesStore()` internally.  aria-selected={isActive}

  className="shrink-0 px-3 py-2 text-sm font-semibold whitespace-nowrap"

---  style={{

    color: isActive ? "var(--color-brand-green)" : "var(--color-text-secondary)",

### `GroupTabBar` (`src/components/GroupTabBar.tsx`)    transition: "color var(--duration-element) ease-out",

  }}

Renders a horizontal tab bar with an "All" tab followed by one tab per user-defined group, sorted by `sortOrder`. Conditionally mounted in `HeaderBar` only when `store.hasGroups` is `true`.  onClick={() => { if (!hasDraggedRef.current) store.selectGroup(id); }}

>

#### Props```



| Prop              | Type                                                | Required | Description                          |- **No `rounded` class** — tabs are flat text buttons per design spec.

| ----------------- | --------------------------------------------------- | -------- | ------------------------------------ |- `role="tab"` + `aria-selected` — ARIA pattern for tablist.

| `groups`          | `{ id: string; name: string; sortOrder: number }[]` | Yes      | Sorted list of user-defined groups   |- `hasDraggedRef.current` guard on `onClick` — prevents drag gestures from accidentally firing a group selection.

| `selectedGroupID` | `string \| null`                                    | Yes      | Active group ID, or `null` for "All" |- Colors use CSS custom properties, not Tailwind theme classes.

| `onSelectGroup`   | `(id: string \| null) => void`                      | Yes      | Called when a tab is tapped          |

#### Sliding underline indicator

#### Outer shell

```tsx

```tsx<div

<div  ref={underlineRef}

  ref={containerRef}  className="absolute pointer-events-none bg-brand-green"

  role="tablist"  style={{

  aria-label="Groups"    bottom: "3px",

  className="relative overflow-x-auto pb-[3px] mb-3 mt-1"    height: "2px",

  style={{ scrollbarWidth: "none", touchAction: "pan-y" }}    left: underlineLeft,

>    width: underlineWidth,

```    transition: `left var(--duration-element) var(--spring-snap), width var(--duration-element) var(--spring-snap)`,

  }}

- `overflow-x: auto` — native horizontal scroll. Scrollbars suppressed inline (`scrollbarWidth: "none"`)./>

- `relative` — establishes stacking context for the absolutely positioned underline indicator.```

- `role="tablist"` + `aria-label` — ARIA landmark for accessibility.

- `touchAction: pan-y` — allows native vertical scroll passthrough.- Position is computed in a `useLayoutEffect` that fires whenever `selectedGroupID` changes.

- `useLayoutEffect` reads `getBoundingClientRect()` on the active button and the container, then writes `left` (button left − container left + scrollLeft) and `width` into React state (`underlineLeft`, `underlineWidth`).

#### Tab buttons- The `transition` is specified entirely in the inline `style` object using `var(--duration-element)` and `var(--spring-snap)`. **Do not move this to a Tailwind class** — Tailwind cannot resolve CSS custom properties in class-based transition utilities.

- `bottom: 3px` positions the underline slightly above the very bottom edge of the tab bar.

- **No `rounded` class** — tabs are flat text buttons per design spec.

- `role="tab"` + `aria-pressed` — ARIA pattern for tablist.#### Drag-to-scroll

- `hasDraggedRef.current` guard on `onClick` — prevents drag gestures from accidentally firing a group selection.

- Colors use CSS custom properties, not Tailwind theme classes.Uses Pointer Events on the container (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave`). Implementation mirrors `CategoryPicker`:

- `active:opacity-50` — press feedback.

- `select-none` — prevents text selection during drag.- `startX` and `scrollLeftStart` are tracked in plain `useRef` variables (not state).

- `touchAction: "manipulation"` — kills 300ms tap delay.- `setPointerCapture` is called on the container **only after horizontal drag intent is confirmed** (|Δx| > 5px).

- `hasDraggedRef` (`useRef<boolean>`) is set to `true` when capture begins, and reset to `false` via `setTimeout(..., 0)` in `pointerUp` — the timeout ensures the reset runs after the current event's `onClick` propagation has completed.

#### Sliding underline indicator- `releasePointerCapture` is called in `pointerUp` before the timeout.



Position is computed in a `useLayoutEffect` that fires whenever `selectedGroupID` changes. `useLayoutEffect` reads `getBoundingClientRect()` on the active button and the container, then writes `left` and `width` directly to the underline element's `style`. The `transition` uses `var(--duration-element)` and `var(--spring-snap)` — specified in inline `style`, **not** Tailwind classes.---



#### Drag-to-scroll### `CategoryPicker` (`src/components/CategoryPicker.tsx`)



Uses Pointer Events on the container (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`). Same pattern as `CategoryPicker`: `setPointerCapture` after |Δx| > 5px, `hasDraggedRef` prevents accidental tab selection, `setTimeout(..., 0)` resets after click propagation.Renders the horizontal pill bar for switching categories. Lives inside `HeaderBar`.



---#### Outer shell



### `CategoryPicker` (`src/components/CategoryPicker.tsx`)```tsx

<div className="rounded-full px-1 py-1 w-full"

Renders the horizontal pill bar for switching categories. Lives inside `HeaderBar`. Reads all data from `useCategoriesStore()` internally — no props.  style={{ background: `rgba(var(--color-brand-deep-green-rgb), 0.12)` }}>

```

#### Internal store access

A pill-shaped tinted container.

Reads `categoriesInSelectedGroup`, `selectedCategoryID`, and `selectCategory` from `useCategoriesStore()`.

#### Scroll track

#### Empty group state

```tsx

When `categoriesInSelectedGroup.length === 0`, renders a centered "No lists in this group yet" message instead of the pill row.<div

  ref={scrollRef}

#### Pill buttons  className="overflow-x-auto cursor-grab w-full"

  onPointerDown={handlePointerDown}

- Selected: `backgroundColor: var(--color-surface-card)`, `color: var(--color-brand-green)`, `fontWeight: 700`, box-shadow with brand-green tint.  onPointerMove={handlePointerMove}

- Unselected: `backgroundColor: transparent`, `color: var(--color-text-secondary)`.  onPointerUp={handlePointerUp}

- Both: transitions using `var(--duration-element)` and `var(--ease-decelerate)`.  onPointerLeave={handlePointerUp}

- `flex-1 min-w-max` — pills fill the row when few; overflow to enable drag-scroll when many.>

- `active:scale-[0.97]` — press feedback. Pill tap triggers `HapticService.selection()`.```



#### Selection-follow behavior- `overflow-x: auto` — native horizontal scroll, scrollbars hidden app-wide via `* { scrollbar-width: none }` in `index.css`.

- No `touch-action` is set here; the parent `MainScreen` swiper has `touch-none` which blocks browser-native pan on the outer layer. The `CategoryPicker`'s own Pointer Events handler manually drives `container.scrollLeft` during a drag.

A `useEffect` on `selectedCategoryID` calls `selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })`.

#### Pill buttons

#### Drag-to-scroll guard (`hasDraggedRef`)

```tsx

Same pattern as `GroupTabBar`: `hasDraggedRef` set to `true` when pointer movement exceeds 5px, reset via `setTimeout(..., 0)` in `onPointerUp`/`onPointerCancel`.className={`flex-1 min-w-max rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.97]`}

style={{

---  backgroundColor: isSelected ? "var(--color-surface-card)" : "transparent",

  color: isSelected ? "var(--color-brand-green)" : "var(--color-text-secondary)",

### `CategoryPanel` (`src/components/CategoryPanel.tsx`)  transition: "background-color 200ms ease-out, color 200ms ease-out, box-shadow 200ms ease-out",

}}

Renders the full content area for a single category. `MainScreen` renders exactly one instance.```



#### Props- `flex-1 min-w-max` — pills expand to fill the row when there are few categories, and overflow (enabling drag-scroll) when there are many.

- `active:scale-[0.97]` — press-down feedback.

| Prop       | Type              | Required | Description                                                      |

| ---------- | ----------------- | -------- | ---------------------------------------------------------------- |#### Selection-follow behavior

| `category` | `Category \| null` | Yes      | The category to render; `null` renders a spacer or empty-group state |

A `useEffect` on `selectedCategoryID` calls:

#### Four render paths

```ts

| Condition                                                                      | Renders                                                                                                         |selectedEl.scrollIntoView({

| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |  behavior: "smooth",

| `!category && store.hasGroups && store.categoriesInSelectedGroup.length === 0` | `<EmptyState>` with folder icon + "No lists in this group" + "Assign lists to this group in Settings."          |  inline: "center",

| `!category` (generic)                                                          | An empty `<div className="flex-1" />` spacer                                                                    |  block: "nearest",

| `category.items.length === 0`                                                  | `<AddItemInput>` above `<EmptyState>` with checklist icon + "No items yet" + "Add your first item above."       |});

| `category.items.length > 0`                                                    | Full layout: sticky header (`AddItemInput` + `ListMetaBar`) + scrollable list of `SwipeableRow`/`ChecklistItemRow` |```



#### Full layout structure (non-empty category)This fires both when the user taps a pill directly and when category changes from a swipe gesture in `MainScreen`.



```#### Drag-to-scroll guard (`hasDraggedRef`)

<div className="flex-1 flex flex-col min-h-0 px-4 pt-1">   ← outer column

  ├── <div className="shrink-0 pb-1">                        ← sticky header`hasDraggedRef` is set to `true` when pointer movement exceeds 5px. The `onClick` handler on each pill checks `hasDraggedRef.current` and returns early if it is `true`, preventing a drag gesture from accidentally selecting a category.

  │     ├── <AddItemInput />

  │     └── <ListMetaBar ... />---

  └── <div className="flex-1 overflow-y-auto overscroll-contain"   ← scroll container

            style={{ maskImage: ..., WebkitMaskImage: ... }}>### `CategoryPanel` (`src/components/CategoryPanel.tsx`)

        └── <ul className="flex flex-col gap-2 pt-3 pb-10">

              └── <SwipeableRow> × NRenders the full content area for a single category. `MainScreen` renders exactly one instance, passing `store.selectedCategory` as the `category` prop. When the selected category changes in the store, the prop updates and the component re-renders in place.

                    └── <ChecklistItemRow item={item} isTapped={...} onTap={...} />

```#### Four render paths



**Critical layout values:** `min-h-0` on the outer column is load-bearing. `shrink-0` on the header prevents compression. `flex-1 overflow-y-auto overscroll-contain` on the scroll container enables native scroll.| Condition                                                         | Renders                                                                                 |

| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |

#### Scroll fade mask| `store.hasGroups && store.categoriesInSelectedGroup.length === 0` | Empty-group state: folder icon + "No lists in this group" + "Assign lists in Settings." |

| `category` prop is `undefined`                                    | An empty `<div className="flex-1" />` spacer                                            |

CSS mask dissolves the top 24px and bottom 32px of the list content.| `category.items.length === 0`                                     | Empty-state view with icon, heading, subtext, and the add-item input                    |

| `category.items.length > 0`                                       | Full layout: sticky header (input + sort row) + scrollable list                         |

#### Sort logic

The empty-group check must come **before** the generic `!category` guard, because when a group has no assigned (or ungrouped) categories, `categoriesInSelectedGroup` is empty and `selectedCategoryID` remains `""` — meaning `category` will also be `undefined`. Without the group-specific check first, the generic spacer would silently render instead of informing the user that the group is empty.

Unchecked items always before checked. Within each group: sort by `createdAt` (date) or `name.localeCompare()` (alpha, with `sensitivity: "base"`). `sortDirection === "desc"` negates the comparison.

#### Full layout structure (non-empty category)

#### Item tap feedback

```

`tappedId` (local state) set on tap and cleared after 120 ms. Each tap also calls `store.toggleItemInSelectedCategory(item.id)` and `HapticService.light()`.<div className="flex-1 flex flex-col min-h-0 px-4 pt-1">   ← outer column

  ├── <div className="shrink-0 pb-1">                        ← sticky header

---  │     ├── <AddItemInput />

  │     └── sort meta row (item count + order/direction toggles)

### `AddItemInput` (`src/components/AddItemInput.tsx`)  └── <div className="flex-1 overflow-y-auto overscroll-contain"   ← scroll container

            style={{ maskImage: ..., WebkitMaskImage: ... }}>

Standalone inline input row for adding new checklist items. Reads `useCategoriesStore()` internally. `newItemName` local state drives the controlled input. On submit: calls `store.addItemToSelectedCategory(trimmedValue)`, clears input, triggers `HapticService.light()`, and blur→refocus cycle to reset iOS auto-capitalize. Card styling: `rounded-[16px]`, `var(--color-surface-card)`, `var(--elevation-card)`.        └── <ul className="flex flex-col gap-2 pt-3 pb-10">

              └── <SwipeableRow> × N

---                    └── <li> item row

```

### `ChecklistItemRow` (`src/components/ChecklistItemRow.tsx`)

**Critical layout values:**

Standalone checklist item row with checked/unchecked visual states. Props: `item`, `isTapped`, `onTap`. Unchecked: card background + shadow + circle outline. Checked: subtle tint background + no shadow + filled checkmark + strikethrough text. Text size via `var(--text-size-base)`. Row padding via `var(--row-padding-y)`.

- `flex-1 flex flex-col min-h-0` on the outer column — `min-h-0` overrides flexbox's default `min-height: auto`, which would otherwise force the column to grow to fit all content and make the scroll container never actually scroll.

---- `shrink-0` on the header — prevents the sticky header from compressing as the flex column tries to fit the scroll area.

- `flex-1 overflow-y-auto overscroll-contain` on the scroll container — `flex-1` takes all remaining vertical space; `overflow-y-auto` enables native scroll; `overscroll-contain` prevents the scroll from leaking to the parent and triggering whole-page bounce.

### `EmptyState` (`src/components/EmptyState.tsx`)

#### Scroll fade mask

Animated empty-state card. Props: `icon`, `title`, `subtitle?`. Mount animation: fade + slide up over 220ms.

The scroll container has inline CSS mask properties:

---

```ts

### `ListMetaBar` (`src/components/ListMetaBar.tsx`)maskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",

WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",

Sort controls + item count + check-all toggle. Props: `itemCount`, `allChecked`, `sortOrder`, `sortDirection`, plus callbacks. Haptics: `HapticService.medium()` for check-all, `HapticService.light()` for sort toggles.```



---This fades the top 24px and bottom 32px of the list content. The top fade prevents items from abruptly appearing under the sticky header. The bottom fade dissolves content before it reaches the page indicator dots, creating a seamless visual transition. At rest (scroll position 0), the `pt-3` on the `<ul>` keeps the first item below the top fade zone, and `pb-10` ensures the last item can scroll into the fully-opaque middle zone above the bottom fade.



### `SwipeableRow` (`src/components/SwipeableRow.tsx`)> **Why mask instead of an overlay div:** An earlier implementation used an absolutely positioned `<div>` with a background gradient to fake a fade. This created a visible color mismatch because the true app background is `var(--color-surface-background)` **plus** `var(--gradient-brand-wide)` (a diagonal alpha tint), whereas the overlay div could only approximate the solid color. CSS masking operates on transparency, not paint, so it works correctly regardless of what is visually behind the container.



Swipe-left-to-delete wrapper. Props: `onDelete`, `children`. Swipe clamped to `[-80, 0]`. Snap at `-40`. Spring easing: `cubic-bezier(0.34,1.56,0.64,1)`. Gesture arbitration: vertical → lockout, horizontal → capture. Haptics: medium (open), light (close), heavy (delete).#### Sort logic



---```ts

const sortOrder = category.sortOrder ?? "date";

### `BottomBar` (`src/components/BottomBar.tsx`)const sortDirection = category.sortDirection ?? "asc";

```

3-column grid footer. No props — reads store directly. Grid: `gridTemplateColumns: "1fr auto 1fr"`. Previous/next navigation pills + "Clear N" trash button. `ActionSheet` confirmation for clear. Safe-area padding. Gradient fade.

Legacy data may not have `sortOrder` or `sortDirection` fields — they default to `"date"` / `"asc"`. The sort algorithm:

---

1. Unchecked items always sort before checked items.

## Scroll Chain — How It Actually Works2. Within each group, items sort by `createdAt` (Unix ms) or `name.localeCompare()`.

3. If `sortDirection === "desc"`, the within-group comparison is negated.

```

#root (position:fixed, overflow:hidden — set in index.css)#### `AddItemInput` sub-component

  └── MainScreen layout shell (h-dvh overflow-hidden)

        └── content container (flex-1 overflow-hidden)The input is declared as a local sub-component within `CategoryPanel.tsx` and lives **inside the sticky header**, not inside the scroll container. This is deliberate: it means the `+` button is always visible and the keyboard scroll-into-view behavior handled by the browser does not need to fight a fixed header.

              └── CategoryPanel outer column (flex-1 flex flex-col min-h-0)

                    └── scroll container (flex-1 overflow-y-auto overscroll-contain)  ← ONLY SCROLLABLE ELEMENTThe input font size is forced to `16px` by the global `input { font-size: 16px !important }` rule in `index.css` to prevent iOS Safari's auto-zoom on focus.

```

#### Item tap feedback

**The scroll container in `CategoryPanel` is the only element in this chain that scrolls.** `min-h-0` is load-bearing. `onScroll` reads `e.target`, not `e.currentTarget`.

```tsx

---className={`... ${tappedId === item.id ? "scale-[0.97] opacity-80" : ""}`}

style={{

## Known Issues (As of April 2026)  paddingTop: "var(--row-padding-y)",

  paddingBottom: "var(--row-padding-y)",

### 1. `BottomBar` gradient does not include `--gradient-brand-wide`  transition: tappedId === item.id

    ? "none"

**Component:** `BottomBar`    : "transform 200ms ease-out, opacity 200ms ease-out, background-color 250ms ease-out, box-shadow 250ms ease-out",

}}

**Symptom:** On devices where `--gradient-brand-wide` is visually prominent, the `BottomBar` gradient masks list content with a flat solid color that does not blend seamlessly with the background. Subtle in light mode, more visible in dark mode.```



**Root cause:** The `background` inline style uses `var(--color-surface-background)` as its opaque stop. The actual app background is a composite of that color plus `var(--gradient-brand-wide)`.`tappedId` is set on `pointerdown` and cleared on `pointerup` / `pointercancel` with a 150ms delay. Transition is suppressed during the press-down (instant snap) and re-enabled on release (spring back). Vertical padding scales with the text size setting via `var(--row-padding-y)` for proportional row density.



------



## What Is Confirmed Working (April 2026)### `SwipeableRow` (`src/components/SwipeableRow.tsx`)



- ✅ List scrolls vertically on iOS Safari in standalone PWA modeWraps each `<li>` item in the list to provide swipe-left-to-delete behavior.

- ✅ List scrolls vertically in desktop Chrome, Firefox, and Safari

- ✅ `onScroll` correctly reads `e.target.scrollTop` — header shrink animation triggers at 20px scroll#### Structure

- ✅ Keyboard dismisses on scroll via `document.activeElement?.blur()`

- ✅ `SwipeableRow` swipe-to-delete works without conflicting with vertical scroll```

- ✅ `SwipeableRow` correctly resumes from partially-open state via `offsetAtDragStartRef`<div className="relative overflow-hidden rounded-[14px]">   ← clipping shell

- ✅ Delete button springs open/closed with iOS-like overshoot easing  ├── [Delete action strip]     absolute right-0, w-20 (80px), backgroundColor: var(--color-danger)

- ✅ Haptic feedback fires on swipe open, close, and delete  └── [Content row wrapper]     translateX(offsetX)

- ✅ CSS mask fade at the top and bottom of the scroll container works in all themes```

- ✅ No visible color-mismatch band between list content and sticky header (mask approach)

- ✅ Row vertical padding scales proportionally with text size setting via `--row-padding-y` (xs: 0.45rem → xl: 1.25rem)- The delete strip is always in the DOM, hidden behind the right edge of the clipping shell.

- ✅ `AddItemInput` stays above keyboard on iOS (keyboard pushes the viewport; input is in flow above the scroll container)- `translate3d(${80 + offsetX}px, 0, 0)` on the strip means: when `offsetX = 0` (closed), the strip is translated `+80px` (exactly off the right edge). When `offsetX = -80` (fully open), `80 + (-80) = 0`, bringing the strip flush with the right edge and fully in view.

- ✅ `AddItemInput` blur→refocus cycle resets iOS auto-capitalize correctly- The content row uses `translate3d(${offsetX}px, 0, 0)`.

- ✅ 16px font-size override prevents iOS Safari auto-zoom on input focus

- ✅ Check-all / uncheck-all toggle in `ListMetaBar` works; icon and label update to reflect state#### Swipe thresholds

- ✅ Sort order (date / alpha) and direction (asc / desc) toggles work per-category

- ✅ Item check/uncheck moves items between unchecked (top) and checked (bottom) groups correctly- Maximum swipe travel: `offsetX` is clamped to `[-80, 0]` — exactly the width of the delete button.

- ✅ Item tap press feedback (`tappedId` scale + opacity) fires via `ChecklistItemRow`- Snap threshold on release: if `offsetX < -40` (more than half open), snap to fully open (`-80`). Otherwise, snap closed (`0`).

- ✅ `CategoryPicker` scrolls selected pill into view with `scrollIntoView` when category changes- The `isLockedOutRef` flag: on `pointerdown`, the component checks early movement direction. If the gesture is determined to be **vertical** (scroll or page-swipe) before the horizontal threshold is reached, `isLockedOutRef` is set to `true` and the row stops processing pointer events for that gesture, yielding control to the parent.

- ✅ `CategoryPicker` drag-scroll works; `hasDraggedRef` prevents accidental category select after a drag

- ✅ `CategoryPicker` shows "No lists in this group yet" when group has no categories#### Gesture arbitration

- ✅ `CategoryPicker` haptic feedback fires on pill tap

- ✅ `GroupTabBar` shows "All" tab plus user-defined group tabs with sliding underlineBoth `SwipeableRow` (row swipe) and `CategoryPanel`'s scroll container (vertical scroll) share the same pointer stream. The arbitration works as follows:

- ✅ `GroupTabBar` drag-to-scroll works with same pattern as `CategoryPicker`

- ✅ `BottomBar` previous/next chevrons navigate categories and trigger haptic feedback1. On the first move event, `SwipeableRow` checks whether `|dy| > |dx|`. If vertical movement wins, `isLockedOutRef` is set to `true` and the row stops processing pointer events for that gesture, yielding to the native vertical scroll.

- ✅ `BottomBar` "Clear N" button opens `ActionSheet` confirmation before deleting checked items2. If horizontal movement wins, `SwipeableRow` calls `e.currentTarget.setPointerCapture(e.pointerId)`, claiming the pointer exclusively.

- ✅ `BottomBar` `<footer>` always renders, maintaining safe-area padding and gradient at bottom

- ✅ `HeaderBar` refresh button spins for 800 ms then triggers `window.location.reload()``offsetAtDragStartRef` captures the content row's current `offsetX` at the moment `pointerdown` fires. This allows right-swipe-to-close from a fully-open state: if the row is at `offsetX = -80` and the user drags right, the delta is applied relative to `-80` rather than `0`, so the row smoothly closes instead of jumping.

- ✅ `HeaderBar` and `BottomBar` padding respects `env(safe-area-inset-top/bottom)` on notched iPhones

- ✅ `SettingsSheet` opens from bottom with shadcn `Sheet` component#### Transitions

- ✅ `SettingsSheet` composes extracted feature sections from `features/settings/`

- ✅ `EmptyState` mount animation plays correctly for both empty-category and empty-group statesWhen `isDragging` is `false`:

- ✅ `SplashScreen` enter/fade/finish sequence completes correctly for returning users

- ✅ `PageTransitionWrapper` push/pop animations fire on route changes```ts

- ✅ Foreground reload fires on `visibilitychange` when app returns from backgroundtransition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1)";

- ✅ Overscroll bounce at the document level is suppressed (`overscroll-behavior-y: contain` on body)```

- ✅ `resetToNewUser()` clears all localStorage and resets all store state correctly

- ✅ Theme switching (light / dark / system) applies flash-free via synchronous `applyThemeToDOM()` in store initializerThe spring easing (`0.34, 1.56, 0.64, 1`) gives the snap a slight overshoot, matching iOS's UIKit row-swipe physics. During an active drag, `transition` is set to `"none"` so the row tracks the finger with zero latency.

- ✅ Text size setting applies flash-free via synchronous `applyTextSizeToDOM()` in store initializer

---

### `PageIndicator` (`src/components/PageIndicator.tsx`)

A row of dots reflecting the current category index relative to all categories. Only rendered when `categories.length > 1`.

```tsx
style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
```

The wrapper div adds bottom padding that respects the iOS home indicator.

Each dot:

```ts
width: isActive ? "18px" : "6px",
height: "6px",
borderRadius: "999px",
backgroundColor: isActive ? "var(--color-brand-green)" : "var(--color-text-secondary)",
opacity: isActive ? 1 : 0.4,
transition: "width 280ms cubic-bezier(0.34,1.56,0.64,1), background-color 280ms ease-out, opacity 280ms ease-out",
willChange: "width, background-color, opacity",
```

The active dot stretches to an 18px pill via the spring easing, matching iOS `UIPageControl`'s look. `willChange` is set so the browser pre-promotes the layer and avoids a repaint during the width transition. The component is `aria-hidden` — it is purely decorative; category selection feedback is handled by `CategoryPicker` pill highlight and the `HeaderBar` greeting title.

---

### `BottomBar` (`src/components/BottomBar.tsx`)

The bottom navigation and utility bar. Renders a 3-column CSS grid (`grid-cols-[1fr_auto_1fr]`) within a `<footer>` element.

```tsx
className="sticky bottom-0 z-10 px-4 pt-2"
style={{
  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
  background: "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, var(--color-surface-background) 100%)",
}}
```

- `sticky bottom-0` — sticks to the bottom of the layout shell. Because the scroll container is a sibling inside `CategoryPanel` (not an ancestor of `BottomBar`), `sticky` holds position correctly as the list scrolls above.
- The gradient fades from transparent at the top to solid `var(--color-surface-background)` at 40%, masking list content scrolling underneath.
- `paddingBottom` includes `env(safe-area-inset-bottom)` to clear the iPhone home indicator.

#### Grid columns

| Column          | Content                                   | Condition                                |
| --------------- | ----------------------------------------- | ---------------------------------------- |
| Left (`1fr`)    | Previous-category chevron + category name | `canSelectPreviousCategory`              |
| Centre (`auto`) | "Clear N" button                          | Checked items exist in selected category |
| Right (`1fr`)   | Next-category name + chevron              | `canSelectNextCategory`                  |

- `canSelectPreviousCategory` and `canSelectNextCategory` are exposed by `useCategoriesStore`. When a column's condition is false, the cell renders an empty `<div>` placeholder to preserve the grid layout.
- Each chevron tap calls `store.selectPreviousCategory()` or `store.selectNextCategory()` and triggers `HapticService.selection()` for haptic feedback.
- The "Clear N" button (`N` = count of checked items) opens an `ActionSheet` confirmation. On confirm, `store.clearCheckedItems()` is called and `HapticService.impact()` fires.
- The `<footer>` element always renders (even when no grid content is shown) to maintain the gradient and safe-area padding at the bottom of every screen.

---

## Scroll Chain — How It Actually Works

The entire scrolling architecture depends on this chain being intact:

```
#root (position:fixed, overflow:hidden — set in index.css)
  └── MainScreen layout shell (h-dvh overflow-hidden)
        └── content container (flex-1 overflow-hidden)
              └── CategoryPanel outer column (flex-1 flex flex-col min-h-0)
                    └── scroll container (flex-1 overflow-y-auto overscroll-contain)  ← ONLY SCROLLABLE ELEMENT
```

**The scroll container in `CategoryPanel` is the only element in this chain that scrolls.** Every ancestor clips but does not scroll. If any ancestor gains `overflow-y: auto` or `overflow-y: scroll`, it will intercept scroll events before they reach the intended container and the list will stop scrolling.

**`min-h-0` is load-bearing.** Without it on `CategoryPanel`'s outer column, the flexbox layout calculates that the column's minimum height equals the full height of all content (all list items), forces the parent to expand past the viewport, and the `overflow-y-auto` container never gets a bounded height — so it never actually scrolls. This has bitten the project before; see `docs/plans/scroll-fade-and-bottom-bar-fix.md`.

**`onScroll` reads `e.target`, not `e.currentTarget`.** The `onScroll` handler is attached to the content container div in `MainScreen`. React's `onScroll` bubbles up from the inner `overflow-y-auto` element inside `CategoryPanel`. The handler correctly casts `e.target as HTMLElement` and reads `.scrollTop` from that element — not `e.currentTarget`, whose `scrollTop` is always `0`.

---

## Known Issues (As of April 2026)

### 1. `BottomBar` gradient does not include `--gradient-brand-wide`

**Component:** `BottomBar`

**Symptom:** On devices where `--gradient-brand-wide` is visually prominent, the `BottomBar` gradient masks list content with a flat solid color that does not blend seamlessly with the background. The mismatch is subtle in light mode and more visible in dark mode.

**Root cause:** The `background` inline style on `BottomBar` uses `var(--color-surface-background)` as its opaque stop. The actual app background is a composite of that color plus `var(--gradient-brand-wide)` (a diagonal alpha-tint overlay). Replicating this exact composite in a CSS gradient is not possible without the same diagonal alpha-tint approach the background layers use. The same root cause previously affected the fade overlay on `CategoryPanel` (resolved by switching to CSS masking). `BottomBar` still uses the old solid-stop approach.

---

## What Is Confirmed Working (April 2026)

- ✅ List scrolls vertically on iOS Safari in standalone PWA mode
- ✅ List scrolls vertically in desktop Chrome, Firefox, and Safari
- ✅ `onScroll` correctly reads `e.target.scrollTop` — header shrink animation triggers at 20px scroll
- ✅ `SwipeableRow` swipe-to-delete works without conflicting with vertical scroll
- ✅ `SwipeableRow` correctly resumes from partially-open state via `offsetAtDragStartRef`
- ✅ Delete button springs open/closed with iOS-like overshoot easing
- ✅ CSS mask fade at the top and bottom of the scroll container works in all themes
- ✅ No visible color-mismatch band between list content and sticky header (mask approach)
- ✅ Row vertical padding scales proportionally with text size setting via `--row-padding-y` (xs: 0.45rem → xl: 1.25rem)
- ✅ `AddItemInput` stays above keyboard on iOS (keyboard pushes the viewport; input is in flow above the scroll container)
- ✅ 16px font-size override prevents iOS Safari auto-zoom on input focus
- ✅ Check-all / uncheck-all toggle in `CategoryPanel` header works; icon and label update to reflect state
- ✅ Sort order (date / alpha) and direction (asc / desc) toggles work per-category
- ✅ Item check/uncheck moves items between unchecked (top) and checked (bottom) groups correctly
- ✅ Item tap press feedback (`tappedId` scale + opacity) fires instantly and releases with spring easing
- ✅ `CategoryPicker` scrolls selected pill into view with `scrollIntoView` when category changes
- ✅ `CategoryPicker` drag-scroll works; `hasDraggedRef` prevents accidental category select after a drag
- ✅ `PageIndicator` dots animate with spring width expansion when category changes
- ✅ `BottomBar` previous/next chevrons navigate categories and trigger haptic feedback
- ✅ `BottomBar` "Clear N" button opens `ActionSheet` confirmation before deleting checked items
- ✅ `BottomBar` `<footer>` always renders, maintaining safe-area padding and gradient at bottom
- ✅ `HeaderBar` refresh button spins for 800 ms then triggers `window.location.reload()`
- ✅ `HeaderBar` and `BottomBar` padding respects `env(safe-area-inset-top/bottom)` on notched iPhones
- ✅ `SettingsSheet` opens from bottom with shadcn `Sheet` component
- ✅ `SettingsSheet` swipe-to-dismiss gesture works (tracks `swipeTranslateY`, dismisses at 120px)
- ✅ `SettingsSheet` drag-to-reorder categories updates live via `MOVE_CATEGORIES` action
- ✅ `SplashScreen` enter/fade/finish sequence completes correctly for returning users
- ✅ `PageTransitionWrapper` push/pop animations fire on route changes
- ✅ Foreground reload fires on `visibilitychange` when app returns from background
- ✅ Overscroll bounce at the document level is suppressed (`overscroll-behavior-y: contain` on body)
- ✅ `resetToNewUser()` clears all localStorage and resets all store state correctly
- ✅ Theme switching (light / dark / system) applies flash-free via synchronous `applyThemeToDOM()` in store initializer
- ✅ Text size setting applies flash-free via synchronous `applyTextSizeToDOM()` in store initializer
````
