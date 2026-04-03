// src/features/settings/hooks/useCategoryDrag.ts
// Custom hook encapsulating category drag-to-reorder logic for SettingsSheet.
// NOTE: 207 lines — exceeds the 120-line hook target because pointer-event drag
// logic (down/move/up/cancel), placeholder tracking, and commit-on-drop are a single
// cohesive interaction that cannot be split without breaking the drag state machine.

import { useState, useRef, useCallback, useEffect } from "react";
import type { Category } from "@/models/types";

// MARK: - Types

/** State shape for an in-progress category drag gesture. */
export interface CatDragState {
  /** Flat index into the store's categories array of the row being dragged. */
  flatIdx: number;
  /** Scope: which group (or null for ungrouped / flat layout). */
  groupID: string | null;
  /** Live translateY offset for the dragged row (pointer delta from start). */
  translateY: number;
  /** Live order of scoped category IDs, updated each frame. */
  liveOrder: string[];
  /** Original scoped order at drag start — used to compute sibling offsets. */
  originalOrder: string[];
  /** Height of the dragged row in px. */
  rowHeight: number;
  /** Per-original-index cumulative Y offsets (top of each slot in original layout). */
  originalOffsets: number[];
  /** Gap in px between rows in this scope. */
  gap: number;
  /** Row heights snapshot in original order. */
  heights: number[];
}

/** Return shape for the {@link useCategoryDrag} hook. */
export interface UseCategoryDragReturn {
  catDragState: CatDragState | null;
  catContainerRef: React.RefObject<HTMLDivElement | null>;
  listRef: React.RefObject<HTMLUListElement | null>;
  dragContext: React.RefObject<{ groupID: string | null }>;
  handleDragPointerDown: (
    e: React.PointerEvent,
    visualIdx: number,
    groupID?: string | null,
  ) => void;
}

// MARK: - Hook

/**
 * Manages the pointer-based drag-to-reorder interaction for category rows.
 *
 * Attaches pointermove/pointerup handlers to `window` once on mount so
 * pointer capture works correctly even when the pointer leaves the row.
 *
 * @param categories - The full flat array of categories from the store.
 * @param reorderCategories - Store action to persist a full reorder by ID array.
 * @returns Drag state, container refs, and a pointerDown handler.
 */
export function useCategoryDrag(
  categories: Category[],
  reorderCategories: (orderedIDs: string[]) => void,
): UseCategoryDragReturn {
  const [catDragState, setCatDragState] = useState<CatDragState | null>(null);

  const catDragStateRef = useRef<CatDragState | null>(null);
  const catDragPointerStartY = useRef(0);
  const catRowHeightsRef = useRef<number[]>([]);
  const catContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dragContext = useRef<{ groupID: string | null }>({ groupID: null });

  // Stable ref for categories so window event handlers don't re-register.
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const reorderCategoriesRef = useRef(reorderCategories);
  useEffect(() => {
    reorderCategoriesRef.current = reorderCategories;
  }, [reorderCategories]);

  const handleDragPointerDown = useCallback(
    (
      e: React.PointerEvent,
      visualIdx: number,
      groupID: string | null = null,
    ) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const cats = categoriesRef.current;
      const scopedCategories =
        groupID !== null
          ? cats.filter((c) => c.groupID === groupID)
          : cats.filter((c) => !c.groupID);

      const container = catContainerRef.current ?? listRef.current;
      const heights: number[] = [];
      if (container) {
        scopedCategories.forEach((cat) => {
          const flatIdx = cats.indexOf(cat);
          const el = container.querySelector<HTMLElement>(
            `[data-cat-idx="${flatIdx}"]`,
          );
          heights.push(el ? el.getBoundingClientRect().height : 44);
        });
      } else {
        scopedCategories.forEach(() => heights.push(44));
      }

      const scopedItem = scopedCategories[visualIdx];
      const flatIdx = cats.indexOf(scopedItem);
      const liveOrder = scopedCategories.map((c) => c.id);

      catDragPointerStartY.current = e.clientY;
      catRowHeightsRef.current = heights;
      dragContext.current = { groupID };

      // Compute per-slot cumulative Y offsets in original order.
      const GAP =
        groupID !== null
          ? 2
          : groupID === null && cats.some((c) => c.groupID)
            ? 4
            : 6;
      const originalOffsets: number[] = [];
      let acc = 0;
      for (let i = 0; i < scopedCategories.length; i++) {
        originalOffsets.push(acc);
        acc += heights[i] + GAP;
      }

      const newState: CatDragState = {
        flatIdx,
        groupID,
        translateY: 0,
        liveOrder,
        originalOrder: [...liveOrder],
        rowHeight: heights[visualIdx] ?? 44,
        originalOffsets,
        gap: GAP,
        heights,
      };
      catDragStateRef.current = newState;
      setCatDragState(newState);
    },
    [],
  );

  const handleDragPointerMove = useCallback((e: PointerEvent) => {
    const ds = catDragStateRef.current;
    if (!ds) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    const dy = e.clientY - catDragPointerStartY.current;
    const scopedCount = ds.liveOrder.length;
    const cats = categoriesRef.current;
    const draggedID = cats[ds.flatIdx]?.id ?? "";
    const draggedOrigIdx = ds.originalOrder.indexOf(draggedID);

    // Build cumulative offsets in the LIVE order so hit-testing is accurate.
    const heights = catRowHeightsRef.current;
    const gap = ds.gap;
    const liveOffsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < scopedCount; i++) {
      liveOffsets.push(acc);
      const origIdx = ds.originalOrder.indexOf(ds.liveOrder[i]);
      acc += (heights[origIdx] ?? ds.rowHeight) + gap;
    }

    // Dragged item's current visual midpoint.
    const draggedOrigOffset = ds.originalOffsets[draggedOrigIdx] ?? 0;
    const draggedCurrentTop = draggedOrigOffset + dy;
    const draggedMid = draggedCurrentTop + ds.rowHeight / 2;

    // Find which live-order slot the dragged midpoint falls into.
    const draggedLiveIdx = ds.liveOrder.indexOf(draggedID);
    let newLiveIdx = draggedLiveIdx;
    for (let i = 0; i < scopedCount; i++) {
      if (i === draggedLiveIdx) continue;
      const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
      const slotMid = liveOffsets[i] + (heights[origI] ?? ds.rowHeight) / 2;
      if (i < draggedLiveIdx && draggedMid < slotMid) {
        newLiveIdx = i;
        break;
      }
      if (i > draggedLiveIdx && draggedMid > slotMid) {
        newLiveIdx = i;
      }
    }

    let newLiveOrder = ds.liveOrder;
    if (newLiveIdx !== draggedLiveIdx) {
      newLiveOrder = [...ds.liveOrder];
      const [item] = newLiveOrder.splice(draggedLiveIdx, 1);
      newLiveOrder.splice(newLiveIdx, 0, item);
    }

    const next: CatDragState = {
      ...ds,
      translateY: dy,
      liveOrder: newLiveOrder,
    };
    catDragStateRef.current = next;
    setCatDragState(next);
  }, []);

  const handleDragPointerUp = useCallback(() => {
    const ds = catDragStateRef.current;
    catDragStateRef.current = null;
    dragContext.current = { groupID: null };
    setCatDragState(null);
    if (!ds) return;

    if (ds.liveOrder.join() === ds.originalOrder.join()) return;

    const cats = categoriesRef.current;
    const draggedID = cats[ds.flatIdx]?.id;
    if (!draggedID) return;

    // Build the desired full flat order by replacing each scoped slot
    // with the corresponding item from liveOrder.
    const scopedCategories =
      ds.groupID !== null
        ? cats.filter((c) => c.groupID === ds.groupID)
        : cats.filter((c) => !c.groupID);

    // Map each scoped slot's flat index to the new ID from liveOrder.
    const newFullOrder = cats.map((c) => c.id);
    scopedCategories.forEach((cat, scopedPos) => {
      const flatIdx = cats.indexOf(cat);
      newFullOrder[flatIdx] = ds.liveOrder[scopedPos];
    });

    reorderCategoriesRef.current(newFullOrder);
  }, []);

  // Attach handlers to window once on mount.
  useEffect(() => {
    window.addEventListener("pointermove", handleDragPointerMove);
    window.addEventListener("pointerup", handleDragPointerUp);
    window.addEventListener("pointercancel", handleDragPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleDragPointerMove);
      window.removeEventListener("pointerup", handleDragPointerUp);
      window.removeEventListener("pointercancel", handleDragPointerUp);
    };
  }, [handleDragPointerMove, handleDragPointerUp]);

  return {
    catDragState,
    catContainerRef,
    listRef,
    dragContext,
    handleDragPointerDown,
  };
}
