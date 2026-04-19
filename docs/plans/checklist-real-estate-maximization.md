# Checklist Real Estate Maximization Plan

> **Goal:** Maximize the vertical space available for checklist items on mobile by eliminating dead space and relocating the add-item input out of the scroll area.

---

## Problem Analysis

The current layout stacks these elements vertically within `h-dvh`:

| Element                                             | Approx height | Notes                                                 |
| --------------------------------------------------- | ------------- | ----------------------------------------------------- |
| HeaderBar (greeting + group tabs + category picker) | ~110–140 px   | `pb-4`, `mb-4` on greeting row — generous spacing     |
| AddItemInput (inside CategoryPanel)                 | ~60 px        | `h-12` + `px-1` wrapper + parent `pt-1` + `pb-1`      |
| ListMetaBar (check-all + sort)                      | ~40 px        | `mt-4 mb-1` — large top margin                        |
| Scroll mask fade zones                              | ~56 px        | 24px top + 32px bottom of masked/invisible content    |
| BottomBar (nav + clear)                             | ~60 px        | `pt-2` + safe-area padding                            |
| **Total overhead**                                  | **~330 px**   | On a 667px iPhone SE screen, that's **~50% non-list** |

---

## Proposed Changes (ordered by impact)

### 1. Replace AddItemInput with a FAB that opens an inline overlay ⭐ Highest impact

**Current:** `AddItemInput` sits at the top of `CategoryPanel` as a permanent `h-12` card, occupying ~60px of scroll space at all times — even when the user isn't adding items (which is most of the time).

**⚠️ iOS keyboard constraint:** On iOS Safari, `h-dvh` does **not** resize when the software keyboard opens — the keyboard overlays the viewport. Elements in the `sticky bottom-0` BottomBar are hidden behind the keyboard. If we placed a text input there, the user would tap it, the keyboard would open, and the input would disappear behind the keyboard. The `visualViewport` API can detect keyboard height, but repositioning with it is fragile and has caused regressions in this codebase before. **We must not put a focusable input inside the BottomBar.**

**Proposed: FAB + overlay pattern (keyboard-safe)**

1. **Remove** the permanent `AddItemInput` card from `CategoryPanel`'s scroll area.
2. **Add a small `+` FAB** (floating action button) to the `BottomBar`'s centre cell (where "Clear N" currently lives, or beside it). This is a non-focusable button — no keyboard risk.
3. **On FAB tap**, render an `AddItemOverlay` — a small input row that appears **inside the scrollable `CategoryPanel` area at the top**, auto-focused. Because it's inside the `overflow-y-auto` scroll container, iOS will scroll it into view above the keyboard naturally (the same safe behaviour the current `AddItemInput` uses).
4. **On submit**, the input clears but **stays open** for rapid multi-item entry (matching current behaviour). The existing blur/refocus trick for iOS auto-capitalize reset must continue to work — this means **blur must NOT dismiss the input**. Dismissal happens only on: (a) tapping the FAB again (toggle off), (b) switching categories via BottomBar chevrons, or (c) tapping an explicit "Done"/"✕" button on the input row itself.
5. The `AddItemOverlay` uses the exact same input markup as today's `AddItemInput` — same `enterKeyHint="send"`, same blur/refocus trick for auto-capitalize reset. The blur/refocus cycle must not trigger `onDismiss`; use a `isDismissingRef` guard or only dismiss on explicit user action, never on the `blur` event.

**Layout in BottomBar (idle):** `[◀ Prev] [+ Add] [Clear 3] [Next ▶]`
**Layout in BottomBar (input open):** `[◀ Prev] [+ Add (active)] [Clear 3] [Next ▶]` — the FAB gets a highlighted state to indicate the overlay is open.

**Why this is keyboard-safe:**

- The text input is **never** inside the BottomBar. It's inside the scrollable content area, exactly where the current input lives — so iOS keyboard push/scroll behaviour is identical to today.
- The FAB in the BottomBar is just a `<button>` — no keyboard interaction, no viewport issues.
- No `visualViewport` hacks, no `position: fixed` inputs, no `env(keyboard-inset-height)`.

**Scroll-to-top on open:** When the user taps the FAB while scrolled deep into the list, the input at the top of the scroll area would be off-screen. On FAB tap, call `scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })` to bring the input into view before focusing it. Use a short `requestAnimationFrame` delay between the scroll and the focus to let iOS settle.

**Empty list special case:** When `category.items.length === 0`, always show the `AddItemInput` (skip the FAB gate) — identical to today's behaviour. The `EmptyState` subtitle stays "Add your first item above." The FAB in the BottomBar should appear in its active/highlighted state to reflect that the input is visible.

**Category switching resets state:** When `store.selectedCategory` changes (prev/next chevron or picker tap), `isAddingItem` must reset to `false`. Use a `useEffect` watching `store.selectedCategory?.id` that calls `setIsAddingItem(false)` in `MainScreen`.

**Benefit:** The ~60px input card is only visible when the user is actively adding items. The rest of the time, that space belongs to checklist items.

**Files affected:**

- `src/components/BottomBar.tsx` — add FAB button in centre cell, accept `onAddItem` callback
- `src/components/AddItemInput.tsx` — refactor to accept `isVisible` + `onDismiss` props; conditionally render; auto-focus on mount when visible; **do NOT dismiss on blur** (the blur/refocus auto-capitalize trick fires blur transiently)
- `src/components/CategoryPanel.tsx` — conditionally render `<AddItemInput>` based on `isAddingItem` prop (always show when items list is empty); accept `isAddingItem` + `scrollContainerRef` props
- `src/screens/MainScreen.tsx` — hold `isAddingItem` state, pass it down to both `CategoryPanel` and `BottomBar`; add `useEffect` to reset `isAddingItem` to `false` when `selectedCategory` changes

### 2. Compact the HeaderBar spacing

**Current:** Greeting row has `mb-4` (16px) below it, header has `pb-4` (16px) padding. Combined: 32px of dead space between greeting and category picker.

**Proposed:**

- Reduce greeting row `mb-4` → `mb-2` (save 8px)
- Reduce header `pb-4` → `pb-2` (save 8px)
- When `scrolled` is true, collapse the greeting to a single-line mini-bar (already partially done with scale transform) and further reduce vertical padding
- **Benefit:** Reclaims ~16px statically, ~30px+ when scrolled.

**Files affected:**

- `src/components/HeaderBar.tsx`

### 3. Compact the ListMetaBar

**Current:** `mt-4 mb-1` gives 16px top margin above the sort controls.

**Proposed:**

- Reduce `mt-4` → `mt-1.5` (save ~10px)
- Reduce overall height by using smaller font/icons (already `text-xs` / 11px icons — could tighten vertical padding)
- **Benefit:** Reclaims ~10px.

**Files affected:**

- `src/components/ListMetaBar.tsx`

### 4. Reduce scroll mask fade zones

**Current:** The CSS mask gradient uses 24px top fade + 32px bottom fade = 56px of partially hidden content.

**Proposed:**

- Reduce to 12px top + 16px bottom (save ~28px of usable visual space)
- Items won't feel clipped because the list padding (`pt-3 pb-10`) already provides breathing room

**Files affected:**

- `src/components/CategoryPanel.tsx` — adjust `maskImage` gradient stops

### 5. Tighten list item spacing

**Current:** Items use `gap-2` (8px) between rows and `pb-10` (40px) bottom padding.

**Proposed:**

- Reduce `gap-2` → `gap-1.5` (save ~2.5px per gap × N items)
- Reduce `pb-10` → `pb-4` (save 24px) since the bottom bar now contains the input and provides visual termination
- **Benefit:** Scales with item count; more items visible at once.

**Files affected:**

- `src/components/CategoryPanel.tsx` — adjust `<ul>` className

### 6. Reduce CategoryPanel container padding

**Current:** `px-4 pt-1` on the panel wrapper plus `pt-2` on the empty-state variant.

**Proposed:**

- Reduce `px-4` → `px-3` for slightly more horizontal room on small screens
- Keep `pt-1` as-is (already minimal)
- **Benefit:** Minor but compounds with item row widths.

**Files affected:**

- `src/components/CategoryPanel.tsx`

---

## Summary of space reclaimed

| Change                     | Pixels saved      |
| -------------------------- | ----------------- |
| AddItemInput → FAB overlay | ~60 px            |
| HeaderBar compaction       | ~16 px            |
| ListMetaBar compaction     | ~10 px            |
| Scroll mask reduction      | ~28 px            |
| List spacing tightening    | ~24 px + per-item |
| **Total**                  | **~138 px+**      |

On an iPhone SE (667px viewport), this takes the list area from ~337px to ~475px — a **~41% increase** in visible checklist space.

---

## Implementation Order

1. **FAB + AddItemInput overlay** (biggest win, most complex)
2. **HeaderBar spacing** (quick, low risk)
3. **ListMetaBar spacing** (quick, low risk)
4. **Scroll mask reduction** (one-line change)
5. **List spacing** (one-line change)
6. **Container padding** (one-line change)
7. **iOS keyboard smoke test** — after step 1, manually verify on iOS Safari (or simulator) that tapping the FAB opens the input, keyboard appears, input is visible above keyboard, and submitting/blurring dismisses cleanly

---

## Risks & Mitigations

- **iOS keyboard (CRITICAL):** The text input is **never** placed inside `BottomBar` or any `position: fixed`/`sticky bottom-0` container. On iOS Safari, `h-dvh` does not shrink when the keyboard opens — it overlays the viewport, hiding fixed-bottom elements. The input always lives inside the `overflow-y-auto` scrollable content area of `CategoryPanel`, which is the same container it uses today. iOS Safari's native "scroll focused element into view" behaviour handles keyboard avoidance automatically. No `visualViewport` API usage. No `env(keyboard-inset-height)`. No JS-driven repositioning.
- **FAB discoverability:** Users accustomed to seeing the input permanently may not realize they need to tap "+". Mitigation: on an empty list, auto-open the input (skip the FAB tap). Show a brief "Tap + to add items" hint in the `EmptyState` subtitle.
- **BottomBar complexity:** Adding the FAB increases BottomBar scope. Mitigation: the FAB is a single `<button>` with an SVG icon — minimal addition (~10 lines). Keep `AddItemInput` as a standalone component composed by `CategoryPanel`.
- **State coordination:** `isAddingItem` state lives in `MainScreen` and is passed to both `CategoryPanel` (to show/hide input) and `BottomBar` (to highlight FAB). This is a simple boolean prop — no new context or store needed.
- **Blur vs. dismiss confusion:** The existing `AddItemInput` uses a `blur()` → `requestAnimationFrame(() => focus())` cycle after each submit to reset iOS auto-capitalize. If we naively dismiss on `blur`, the input would vanish after the first item is added. **Never use the `blur` event as a dismiss trigger.** Dismiss only on explicit user actions (FAB toggle, category switch, done/close button).
- **Scroll position on FAB open:** If the user is scrolled far down when tapping the FAB, the input renders at the top of the scroll container — off-screen. Must programmatically scroll to top before focusing. If this scroll + focus sequence has timing issues on iOS, add a `setTimeout(focus, 300)` after the scroll to let the layout settle.
