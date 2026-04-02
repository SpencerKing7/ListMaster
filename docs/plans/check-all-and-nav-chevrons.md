# Plan: Check-All Button & Chevron Navigation (Remove Swipe-to-Navigate)

**Goal:**

1. Add a "check all" button in the `CategoryPanel` meta row (left of the item count) that checks every item in the list in one tap.
2. Replace the swipe-left/right page-change gesture in `MainScreen` with dedicated left/right chevron buttons rendered in the `BottomBar` area.

---

## Background & Constraints

- The swipe gesture is implemented entirely in `MainScreen.tsx` using Pointer Events on the three-panel sliding `contentRef` div.
- The three-panel sliding layout (`previousCategory`, `selectedCategory`, `nextCategory`) can be **removed** along with all drag state and gesture handlers. The `CategoryPanel` will render only the currently selected category.
- `BottomBar` already occupies the sticky footer. The chevron buttons will be added as siblings to (or inside) that component's footer zone, always visible regardless of whether checked items exist.
- The `store` already exposes `selectNextCategory`, `selectPreviousCategory`, `canSelectNextCategory`, `canSelectPreviousCategory` — no store changes needed for navigation.
- A new `CHECK_ALL` action must be added to `useCategoriesStore` and the reducer for the check-all feature.
- The item circle/checkmark SVGs in `CategoryPanel` define the visual style to match for the new check-all button.

---

## Files to Change

| File                               | Change                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/store/useCategoriesStore.ts`  | Add `CHECK_ALL` action + reducer case + `checkAllItemsInSelectedCategory` method                                 |
| `src/components/CategoryPanel.tsx` | Add check-all button to the meta row                                                                             |
| `src/screens/MainScreen.tsx`       | Remove swipe gesture system, three-panel layout, `dragOffset`/`isAnimating` state; render single `CategoryPanel` |
| `src/components/BottomBar.tsx`     | Add always-visible chevron nav row above the conditional clear-checked button                                    |

---

## Step-by-Step Implementation

---

### Step 1 — Add `CHECK_ALL` Store Action

**File:** `src/store/useCategoriesStore.ts`

#### 1a. Add the action type to `StoreAction`

In the discriminated union, add:

```ts
| { type: "CHECK_ALL" }
```

Place it after `| { type: "CLEAR_CHECKED" }` for logical grouping.

#### 1b. Add the reducer case

Inside the `switch (action.type)` block, add after the `CLEAR_CHECKED` case:

```ts
case "CHECK_ALL": {
  const catIdx = state.categories.findIndex(
    (c) => c.id === state.selectedCategoryID,
  );
  if (catIdx === -1) return state;
  const updatedCats = state.categories.map((c, i) =>
    i === catIdx
      ? { ...c, items: c.items.map((item) => ({ ...item, isChecked: true })) }
      : c,
  );
  next = { ...state, categories: updatedCats };
  break;
}
```

#### 1c. Add the context method

In the `StoreContextValue` interface, add:

```ts
checkAllItemsInSelectedCategory: () => void;
```

In `StoreProvider`, add the callback:

```ts
const checkAllItemsInSelectedCategory = useCallback(
  () => dispatch({ type: "CHECK_ALL" }),
  [],
);
```

Wire it into the `value` object:

```ts
checkAllItemsInSelectedCategory,
```

---

### Step 2 — Add "Check All" Button to `CategoryPanel` Meta Row

**File:** `src/components/CategoryPanel.tsx`

#### Context

The meta row currently reads:

```tsx
<div className="flex items-center justify-between mt-4 mb-1 px-1">
  <span
    className="text-xs font-medium"
    style={{ color: "var(--color-text-secondary)" }}
  >
    {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
  </span>
  <div className="flex items-center gap-2">
    {/* Sort order toggle */}
    {/* Divider */}
    {/* Sort direction toggle */}
  </div>
</div>
```

#### 2a. Compute derived state for the button

Directly above the `return` of the non-empty path, derive:

```ts
const uncheckedItems = sortedItems.filter((item) => !item.isChecked);
const allChecked = uncheckedItems.length === 0;
```

#### 2b. Replace the item count `<span>` with a button+count row

Replace the plain `<span>` on the left side of the meta row with a flex row containing:

1. The check-all circle button (same visual style as item checkmarks).
2. The item count text.

```tsx
<div className="flex items-center gap-2">
  {/* Check-all button */}
  <button
    className="press-scale shrink-0"
    style={{ touchAction: "manipulation" }}
    onClick={() => {
      if (allChecked) return;
      store.checkAllItemsInSelectedCategory();
      HapticService.medium();
    }}
    aria-label="Check all items"
    disabled={allChecked}
  >
    {allChecked ? (
      // Fully filled green circle with checkmark — matches checked item icon
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="var(--color-brand-green)" />
        <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="2.2" />
      </svg>
    ) : (
      // Empty circle — matches unchecked item icon, but slightly more opaque to signal interactivity
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--color-brand-teal)", opacity: 0.8 }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" />
      </svg>
    )}
  </button>

  {/* Item count */}
  <span
    className="text-xs font-medium"
    style={{ color: "var(--color-text-secondary)" }}
  >
    {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
  </span>
</div>
```

> **Visual result:** A small circle button matching the item row circles sits to the left of the count. Empty when any items are unchecked; filled green with a tick when all are checked (disabled state). Tapping it when unchecked items exist triggers `checkAllItemsInSelectedCategory()`.

---

### Step 3 — Remove Swipe Navigation from `MainScreen`

**File:** `src/screens/MainScreen.tsx`

This is the largest change. The goal is to strip the horizontal gesture system and three-panel layout while leaving the header, single content panel, page indicator, bottom bar, and settings sheet fully intact.

#### 3a. Remove state variables

Delete:

- `dragOffset` + `setDragOffset`
- `isAnimating` + `setIsAnimating`
- `contentWidth` + `setContentWidth`

Keep:

- `scrolled` + `setScrolled` (drives header shrink animation)
- `isSettingsOpen` + `setIsSettingsOpen`

#### 3b. Remove refs

Delete:

- `isTransitioningRef`
- `startXRef`, `startYRef`, `startTimeRef`
- `isDraggingRef`
- `contentRef`
- `containerRef` — **only** if it was exclusively used for `ResizeObserver` measuring `contentWidth`. The `onScroll` handler can attach to the `CategoryPanel`'s scroll container instead (see Step 4 note below).

> **Note on `scrolled` / `onScroll`:** The existing `onScroll` handler on `containerRef` has a known bug (reads `e.currentTarget.scrollTop` which is always 0). When removing the three-panel layout this bug becomes easier to fix — see the optional fix note at the end of this step.

#### 3c. Remove the `performSlideTransition` top-level function

Delete the entire `performSlideTransition` function from the module. It is only called from `handlePointerUp`, which is also being removed.

#### 3d. Remove the Pointer Event handlers

Delete:

- `handlePointerDown`
- `handlePointerMove`
- `handlePointerUp`

#### 3e. Remove the `ResizeObserver` `useEffect`

Delete the `useEffect` block that observes `containerRef` and sets `contentWidth`.

#### 3f. Simplify the render — content area

Replace the three-panel sliding structure:

```tsx
{
  /* BEFORE: three-panel sliding div */
}
<div
  ref={containerRef}
  className="flex-1 overflow-hidden relative"
  onScroll={handleScrollWithPosition}
>
  <div
    ref={contentRef}
    className="flex h-full touch-none"
    style={{
      width: `${contentWidth * 3}px`,
      transform: `translate3d(${-contentWidth + dragOffset}px, 0, 0)`,
      willChange: "transform",
      transition: isAnimating
        ? "transform var(--duration-page) var(--spring-page)"
        : "none",
    }}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
  >
    <div
      className="flex flex-col h-full min-h-0"
      style={{ width: `${contentWidth}px` }}
    >
      <CategoryPanel category={store.previousCategory} />
    </div>
    <div
      className="flex flex-col h-full min-h-0"
      style={{ width: `${contentWidth}px` }}
    >
      <CategoryPanel category={store.selectedCategory} />
    </div>
    <div
      className="flex flex-col h-full min-h-0"
      style={{ width: `${contentWidth}px` }}
    >
      <CategoryPanel category={store.nextCategory} />
    </div>
  </div>
</div>;
```

With a single-panel container:

```tsx
{
  /* AFTER: single panel */
}
<div
  className="flex-1 overflow-hidden relative flex flex-col min-h-0"
  onScroll={handleScrollWithPosition}
>
  <CategoryPanel category={store.selectedCategory} />
</div>;
```

> The `flex flex-col min-h-0` on the wrapper preserves the same height-constraint contract that `CategoryPanel` relies on for its internal flex layout.

#### 3g. Optional: fix the `scrolled` / `onScroll` bug (recommended)

Since we're restructuring the content area anyway, this is the right moment to apply the fix documented in **Known Issue #1** of the snapshot.

Change the handler to read `e.target` instead of `e.currentTarget`:

```ts
const handleScrollWithPosition = useCallback(
  (e: React.UIEvent<HTMLDivElement>) => {
    handleScroll();
    const scrollTop = (e.target as HTMLElement).scrollTop;
    setScrolled(scrollTop > 20);
  },
  [handleScroll],
);
```

This requires the `onScroll` prop to bubble up correctly from the inner `overflow-y-auto` div inside `CategoryPanel`. React synthetic `onScroll` does bubble, so this works once `e.target` is read instead of `e.currentTarget`.

---

### Step 4 — Add Chevron Navigation to `BottomBar`

**File:** `src/components/BottomBar.tsx`

#### 4a. Update the component to always render

Currently `BottomBar` returns `null` when `hasCheckedItems` is false. The chevron navigation must **always** render (it needs to be visible even with empty lists). Restructure the component:

Remove the early `if (!hasCheckedItems) return null;` guard entirely.

The footer should always render, but the clear-checked button only renders conditionally:

```tsx
const BottomBar = () => {
  const store = useCategoriesStore();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const checkedCount =
    store.selectedCategory?.items.filter((item) => item.isChecked).length ?? 0;
  const hasCheckedItems = checkedCount > 0;

  return (
    <>
      <footer
        className="sticky bottom-0 z-10 px-4 pt-2"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, var(--color-surface-background) 100%)",
        }}
      >
        {/* ── Chevron navigation row ── */}
        <div className="flex items-center justify-between mb-2">
          {/* Previous category chevron */}
          <button
            className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              color: store.canSelectPreviousCategory
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
              opacity: store.canSelectPreviousCategory ? 1 : 0.3,
              backgroundColor: store.canSelectPreviousCategory
                ? "rgba(var(--color-brand-deep-green-rgb), 0.10)"
                : "transparent",
              touchAction: "manipulation",
              transition:
                "opacity 200ms ease-out, background-color 200ms ease-out, color 200ms ease-out",
            }}
            disabled={!store.canSelectPreviousCategory}
            onClick={() => {
              store.selectPreviousCategory();
              HapticService.selection();
            }}
            aria-label="Previous list"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {store.previousCategory?.name ?? ""}
          </button>

          {/* Next category chevron */}
          <button
            className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              color: store.canSelectNextCategory
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
              opacity: store.canSelectNextCategory ? 1 : 0.3,
              backgroundColor: store.canSelectNextCategory
                ? "rgba(var(--color-brand-deep-green-rgb), 0.10)"
                : "transparent",
              touchAction: "manipulation",
              transition:
                "opacity 200ms ease-out, background-color 200ms ease-out, color 200ms ease-out",
            }}
            disabled={!store.canSelectNextCategory}
            onClick={() => {
              store.selectNextCategory();
              HapticService.selection();
            }}
            aria-label="Next list"
          >
            {store.nextCategory?.name ?? ""}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </div>

        {/* ── Clear checked button (conditional) ── */}
        {hasCheckedItems && (
          <button
            className="press-scale w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{
              color: "var(--color-danger)",
              backgroundColor: "rgba(212, 75, 74, 0.10)",
              boxShadow: "0 1px 4px rgba(212,75,74,0.12)",
            }}
            onClick={() => {
              setIsActionSheetOpen(true);
              HapticService.light();
            }}
          >
            {/* Trash icon SVG — unchanged from current */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Clear {checkedCount} Checked {checkedCount === 1 ? "Item" : "Items"}
          </button>
        )}
      </footer>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="Clear Checked Items?"
        message="This will remove all checked items from this list."
        actions={[
          {
            label: "Clear",
            onClick: () => {
              store.clearCheckedItemsInSelectedCategory();
              HapticService.medium();
            },
            destructive: true,
          },
        ]}
      />
    </>
  );
};
```

#### 4b. Add the `HapticService` import to `BottomBar`

`HapticService` is already imported in the current file — no change needed.

#### 4c. Add new store property reads

`BottomBar` needs to read `store.canSelectPreviousCategory`, `store.canSelectNextCategory`, `store.previousCategory`, and `store.nextCategory` — all already exposed by `useCategoriesStore`. No store changes needed.

#### 4d. Handle the single-category case

When `store.categories.length === 1`, both buttons will be disabled (opacity 0.3, no background tint, pointer events off). The nav row is still rendered but visually recedes — this is intentional and matches iOS convention where back/forward controls ghost out at the boundary.

If `store.categories.length === 0` (edge case during onboarding reset), `store.canSelectPreviousCategory` and `store.canSelectNextCategory` are both false, so both buttons are safely disabled.

---

### Step 5 — Clean Up `MainScreen` Imports

**File:** `src/screens/MainScreen.tsx`

After removing swipe gesture code, audit the import list and remove any hooks or types no longer used:

- `useRef` — remove if no refs remain after Step 3. Keep if `containerRef` is retained for `onScroll`.
- `useCallback` — remove if all callbacks that used it are deleted. The `handleScroll` and `handleScrollWithPosition` callbacks still use `useCallback`, so keep it.
- Remove `contentWidth`, `isAnimating`, `dragOffset` from state declarations.
- Remove the `performSlideTransition` import / definition.

Also remove the `aria-label` on the content div that referenced "swipe left or right to switch categories" — replace with a neutral description.

---

### Step 6 — Remove `PageIndicator` (Optional, Recommended)

**File:** `src/screens/MainScreen.tsx`

With chevron navigation replacing swipe, the `PageIndicator` dots become redundant — the chevron buttons already show adjacent category names. The dots also consume vertical space that can be reclaimed.

In the render, remove:

```tsx
{
  store.categories.length > 1 && (
    <div
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
    >
      <PageIndicator
        count={store.categories.length}
        activeIndex={store.categories.findIndex(
          (c) => c.id === store.selectedCategoryID,
        )}
      />
    </div>
  );
}
```

> If the user wants to keep the dots as an additional orientation aid, this step can be skipped. The chevron row in `BottomBar` provides full navigational context with category names, so the dots are purely cosmetic after this change.

---

### Step 7 — Remove `previousCategory` / `nextCategory` Reads from `MainScreen`

**File:** `src/screens/MainScreen.tsx`

After removing the three-panel layout, `store.previousCategory` and `store.nextCategory` are no longer read in `MainScreen`. These are now read exclusively in `BottomBar` (for the button labels). No store changes needed; just remove the references from `MainScreen` to avoid unused-variable lint warnings.

---

## Summary of All Changes

| #   | File                               | Type   | What Changes                                                                                                                                                                                                   |
| --- | ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/store/useCategoriesStore.ts`  | Add    | `CHECK_ALL` action, reducer case, `checkAllItemsInSelectedCategory` callback + context method                                                                                                                  |
| 2   | `src/components/CategoryPanel.tsx` | Modify | Add check-all button (circle icon) to left of item count in meta row; derive `allChecked` and `uncheckedItems`                                                                                                 |
| 3   | `src/screens/MainScreen.tsx`       | Modify | Remove all swipe gesture state, refs, handlers, `performSlideTransition`, `ResizeObserver`, and three-panel layout; render single `CategoryPanel`; fix `scrolled` bug (e.target); remove `PageIndicator` block |
| 4   | `src/components/BottomBar.tsx`     | Modify | Remove early-return null guard; add always-visible chevron nav row with left/right buttons + adjacent category name labels; keep conditional clear-checked button below                                        |

---

## Design Notes & Edge Cases

### Check-All Button

- The button is **disabled** when `allChecked === true` (all items already checked). The filled green circle icon serves as a passive indicator in this state.
- The button is hidden when `category.items.length === 0` because the empty-state path in `CategoryPanel` does not render the meta row at all.
- Tapping check-all triggers `HapticService.medium()` to signal a significant batch action, matching iOS batch-selection feedback weight.

### Chevron Navigation

- Each button shows the **adjacent category name** truncated with `max-w-[120px] truncate` (add these utility classes) so the row doesn't overflow on small screens with long category names.
- Both buttons are `disabled` and visually ghosted when at the respective boundary.
- The entire chevron row renders even with a single category (both disabled) to avoid the layout shifting when a second category is added.
- The `BottomBar` gradient now always renders — it transitions smoothly when the clear-checked button appears or disappears below the chevron row.

### Removing the Swipe Gesture

- The `touch-none` (`touch-action: none`) CSS on the former three-panel slider div will be removed along with the slider itself. This is important: without it, native browser vertical scroll within `CategoryPanel` is fully controlled by the browser again without needing the manual pointer capture workaround.
- `SwipeableRow` swipe-to-delete is unaffected — it operates on its own pointer capture domain inside the list.
- `CategoryPicker` drag-scroll is unaffected — it is self-contained in its own scroll track.
- Known Issue #3 (CategoryPicker vs MainScreen page-swipe conflict) is **resolved as a side effect** of this change, since the MainScreen page-swipe no longer exists.
