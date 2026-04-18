# CategoryPicker & Group Tab Bar — Bug Findings

**Reviewed:** April 18, 2026  
**Files examined:** `CategoryPicker.tsx`, `GroupTabBar.tsx`, `usePickerScroll.ts`, `useCategoryDerived.ts`, `models/types.ts`

---

## 1. Touch Scrolling — Pill `touch-action` Suppresses Container Scroll

**Severity:** High  
**File:** `src/components/CategoryPicker.tsx`

Pill `<button>` elements carry the Tailwind class `touch-manipulation`, which maps to `touch-action: manipulation`. The scroll container has `touchAction: "pan-x"` in its inline style. On iOS Safari, when a touch gesture _begins on a pill button_, the browser resolves the touch-action from the element under the touch point — the button — not the scroll container. Because `manipulation` is semantically different from `pan-x` (it adds "no double-tap zoom"), some iOS versions treat this as an incompatible constraint and will _not_ initiate a horizontal pan on the container. The user finds that touching directly on a pill label and dragging horizontally does nothing; the picker refuses to scroll.

**Expected:** Container scrolls horizontally whenever the user swipes left/right, regardless of which child element was touched.  
**Actual:** Scroll may fail to start when the touch originates on a pill button.

---

## 2. Touch Drag Does Not Set `hasDraggedRef` — Ghost Clicks Possible

**Severity:** Medium  
**File:** `src/store/usePickerScroll.ts`, lines 46–54

`handlePointerDown` has an explicit early-return guard for non-mouse pointer types:

```typescript
if (e.pointerType !== "mouse") return;
```

This means for touch events, `isDraggingRef` and `hasDraggedRef` are never set to `true` by the hook. Native `pan-x` handles the scroll, but `hasDraggedRef.current` stays `false` for the entire gesture. If the browser (particularly Chrome on Android) fires a `click` event after a touch scroll (which it sometimes does in edge cases with fast short swipes), the pill's `onClick` guard:

```typescript
if (!hasDraggedRef.current) {
  selectCategory(category.id);
}
```

…evaluates to `true` and changes the selected category unintentionally.

iOS Safari reliably suppresses tap events after scroll, but Android Chrome and desktop-mode browsers do not always do so. The fix pattern used in `GroupTabBar.tsx` (which handles all pointer types in its drag hook) does not have this problem because it sets `hasDraggedRef` for touch as well.

---

## 3. GroupTabBar — Missing `onPointerLeave` Handler

**Severity:** Medium  
**File:** `src/components/GroupTabBar.tsx`, lines 107–116

The GroupTabBar's scroll container registers `onPointerCancel={handlePointerUp}` but **does not register `onPointerLeave`**. Compare with `CategoryPicker.tsx` which registers both:

```tsx
onPointerLeave = { handlePointerUp };
onPointerCancel = { handlePointerUp };
```

If the user's pointer leaves the GroupTabBar boundary while a drag is in progress (e.g. dragging upward into the HeaderBar), `isDraggingRef.current` remains `true`. The next `pointerDown` inside the component fires with the ref already `true`, causing incorrect scroll calculations. Additionally, `hasDraggedRef` may stay `true` after the stuck drag, silently suppressing the very next tab tap.

---

## 4. GroupTabBar — `touchAction: "pan-y"` on a Horizontal Scroller

**Severity:** Medium  
**File:** `src/components/GroupTabBar.tsx`, line 105

The GroupTabBar container sets `touchAction: "pan-y"` in its inline style:

```tsx
style={{ scrollbarWidth: "none", touchAction: "pan-y" }}
```

This is a **horizontal** scroll container. `pan-y` tells the browser "this element handles vertical panning natively" and suppresses native horizontal scrolling. As a result, iOS Safari will never let the browser handle the horizontal scroll; the component relies entirely on its custom pointer-event drag handler for touch scrolling. If the pointer handler has any edge-case failures (stuck `isDraggingRef`, incorrect `pointerId`, etc.), horizontal touch scrolling on the group tab bar breaks completely.

The correct value is `pan-x`. CategoryPicker correctly uses `pan-x`.

---

## 5. Section Labels — Width Spans Only the First Pill in a Group, Not the Whole Section

**Severity:** Medium  
**File:** `src/components/CategoryPicker.tsx`, lines 100–118

Each section label is rendered as a `position: absolute` `<span>` inside the _first pill's wrapper div_. The wrapper div is a natural-width flex child — it is only as wide as the pill button inside it. The label has `left: 0; right: 0; width: 100%` which constrains it to that single pill's width.

Result: A group named "GROCERY RUN" is labeled above a pill named "Eggs" (a narrow pill). The 80px-wide label "GROCERY RUN" is text-centered in a 40px-wide pill space. Because `position: absolute` elements can overflow, the label renders but its _visual center_ is over the first pill, not over the geometric center of the group's pills. Users scanning the picker see labels misaligned with their groups.

An additional consequence: with `whitespace-nowrap`, long group names overflow the pill bounds in both directions. No clipping occurs (no `overflow: hidden` on the wrapper), so labels can visually collide with the pill text of the _preceding_ group.

---

## 6. Section Label `marginTop` Reserve Is Fixed at 18px — May Clip on Zoom

**Severity:** Low  
**File:** `src/components/CategoryPicker.tsx`, line 76

```tsx
marginTop: isAllView ? 18 : 0,
```

The 18px margin is the only vertical space reserved for section labels. The label font is `text-[8px]` (~10px line height) plus `paddingBottom: 3px` = ~13px total — fitting within 18px at default text size. However:

- If the user's OS or browser applies a minimum font size (iOS accessibility "Larger Text" or Chrome's minimum font size setting), the label text can render larger than 8px, consuming more than 18px and clipping behind the header above the picker.
- The margin is only on the pill bar background wrapper. If labels overflow upward past 18px, they render on top of the `GroupTabBar` or the header with no background, becoming unreadable.

---

## 7. "No Group" Label Appears Even When Every Category Is Ungrouped

**Severity:** Low  
**File:** `src/components/CategoryPicker.tsx`, line 114 / `src/store/useCategoryDerived.ts`, line 83

`isAllView` is `true` when `selectedGroupID === null && groups.length > 0`. In this state, all ungrouped categories are placed first with `isUngrouped: true`. The first pill always gets `isFirstOfSection = true`, and if it is ungrouped, the label reads "No Group".

If a user has created groups but _none of their categories have been assigned to any group yet_, the picker shows ALL categories under a "NO GROUP" label. This is misleading — the user sees a label implying their lists are a distinct "ungrouped" category, when in reality they haven't configured groups at all. The label might prompt confusion about missing lists.

---

## 8. Blank Section Label When `groupID` Is Orphaned

**Severity:** Low  
**File:** `src/components/CategoryPicker.tsx`, lines 113–115

```tsx
{
  isUngrouped ? "No Group" : (groupNameMap.get(currGroupID ?? "") ?? "");
}
```

`sanitizeOrphanedGroupIDs` in `reducerHelpers.ts` clears orphaned `groupID`s on sync, but this sanitization runs inside the reducer and may lag behind a render cycle. If a category still holds a `groupID` that no longer exists in `state.groups`, `groupNameMap.get(currGroupID)` returns `undefined`, and the fallback `?? ""` renders an empty string. The section label renders visually as blank — a floating empty label above the first pill of that section with no text.

---

## 9. `CategoryPickerItem.isUngrouped` JSDoc Is Stale / Contradicts Implementation

**Severity:** Low (documentation)  
**File:** `src/models/types.ts`, lines 33–38

The JSDoc comment on `CategoryPickerItem` states:

> "When a specific group is active, ungrouped categories are appended with `isUngrouped: true` so the picker can render them dimmed."

The current implementation in `useCategoryDerived.ts` (lines 93–95) returns _only_ the categories assigned to the active group when a specific group is selected. Ungrouped categories are completely absent in specific-group view — they are not appended, and `isUngrouped` is always `false` in that view. The comment describes a design that was apparently changed but never updated. Any future developer reading `types.ts` will build against incorrect assumptions.

---

## 10. `canDeleteCategories` Counts All Categories, Not the Visible Group

**Severity:** Low / UX  
**File:** `src/store/useCategoryDerived.ts`, line 152

```typescript
canDeleteCategories: state.categories.length > 1,
```

This checks the total category count across _all_ groups. If the user is inside a specific group that has only one category assigned to it, `canDeleteCategories` is still `true` (because other groups' categories count). The delete UI remains enabled even though deleting would leave the current group completely empty, which creates an abrupt "No lists in this group" empty state immediately after deletion. The check arguably should be `categoriesInSelectedGroup.length > 1` (or unconditionally allow deletion with a better post-delete auto-navigation fallback).

---

## 11. Auto-Select Dispatches on Every Render If `categoriesInSelectedGroup` Is Unstable

**Severity:** Low  
**File:** `src/store/useCategoryDerived.ts`, lines 99–109

The auto-select `useEffect` depends on `[categoriesInSelectedGroup, state.selectedCategoryID, dispatch]`. `categoriesInSelectedGroup` is a `useMemo` result, so it is stable as long as `state.categories` and `state.selectedGroupID` don't change. However, if a cloud sync fires and replaces the categories array with a new reference (even identical content), the memo recomputes, `categoriesInSelectedGroup` gets a new reference, and the effect fires again. If the selected category happens to be absent in the brief moment before the sync resolves (e.g., mid-sync partial state), this could dispatch a spurious `SELECT_CATEGORY` action mid-animation, visibly snapping the picker back to the first category.

---

## 12. `scrollIntoView` Conflict — Picker Scroll Fights Native Touch Scroll

**Severity:** Low  
**File:** `src/components/CategoryPicker.tsx`, lines 31–37

```typescript
useEffect(() => {
  ...
  selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}, [selectedCategoryID, scrollRef]);
```

When the user selects a category by scrolling the picker (touch, native pan-x) and tapping a pill that is partly out of view, two scroll animations potentially run simultaneously:

1. The native momentum scroll from the touch gesture that was ongoing
2. The `scrollIntoView` animation triggered by the new `selectedCategoryID`

On iOS Safari, these compete. The `scrollIntoView` can abruptly interrupt or reverse the natural momentum scroll, creating a jarring "snap-back" visual. This is most visible when tapping a pill near the edge of the visible scroll area.

---

## Summary Table

| #   | Issue                                                             | Severity | File                    |
| --- | ----------------------------------------------------------------- | -------- | ----------------------- |
| 1   | `touch-action: manipulation` on pills blocks container `pan-x`    | High     | `CategoryPicker.tsx`    |
| 2   | Touch drag never sets `hasDraggedRef` — ghost clicks possible     | Medium   | `usePickerScroll.ts`    |
| 3   | GroupTabBar missing `onPointerLeave` — drag state gets stuck      | Medium   | `GroupTabBar.tsx`       |
| 4   | GroupTabBar `touchAction: "pan-y"` on horizontal scroller         | Medium   | `GroupTabBar.tsx`       |
| 5   | Section labels visually misaligned — span only first pill's width | Medium   | `CategoryPicker.tsx`    |
| 6   | Fixed 18px label reserve may clip on accessibility font sizes     | Low      | `CategoryPicker.tsx`    |
| 7   | "NO GROUP" label shown when no categories are assigned to groups  | Low      | `CategoryPicker.tsx`    |
| 8   | Blank label rendered for orphaned `groupID` (timing gap)          | Low      | `CategoryPicker.tsx`    |
| 9   | `CategoryPickerItem.isUngrouped` JSDoc contradicts implementation | Low      | `types.ts`              |
| 10  | `canDeleteCategories` uses global count, not group-scoped count   | Low      | `useCategoryDerived.ts` |
| 11  | Auto-select effect may fire spuriously on sync reference churn    | Low      | `useCategoryDerived.ts` |
| 12  | `scrollIntoView` competes with active momentum scroll on iOS      | Low      | `CategoryPicker.tsx`    |
