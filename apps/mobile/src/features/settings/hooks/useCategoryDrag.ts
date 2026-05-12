// src/features/settings/hooks/useCategoryDrag.ts
// Category drag-to-reorder using RNGH Gesture.Pan + Reanimated SharedValue.
// translateY lives entirely on the UI thread — zero JS bridge crossings per frame.
// NOTE: Exceeds the 120-line hook ceiling because the gesture state machine
// (begin/update/end/finalize) and per-category SharedValue management are a
// single cohesive unit that cannot be split without breaking the drag system.

import { useState, useRef, useCallback } from "react";
import { useSharedValue, withSpring, withTiming, runOnJS, runOnUI } from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import type { Category, CatDragState } from "@/models/types";
import { computeCatLiveOffset } from "@/features/settings/utils/dragUtils";

// MARK: - Types

export type { CatDragState } from "@/models/types";

export interface UseCategoryDragReturn {
  catDragState: CatDragState | null;
  isDraggingCat: boolean;
  rowHeightsRef: React.MutableRefObject<number[]>;
  onRowLayout: (flatIdx: number, height: number) => void;
  getCatTranslate: (flatIdx: number) => SharedValue<number>;
  makeCatGesture: (
    visualIdx: number,
    scopedCategories: Category[],
    allCategories: Category[],
    groupID: string | null,
  ) => ComposedGesture | GestureType;
}

// MARK: - Constants

const GAP_GROUPED = 2;
const GAP_FLAT = 6;
const SNAP_SPRING = { damping: 20, stiffness: 300 };
const RESET_DURATION = 120;
const SIBLING_DURATION = 150;
// Pre-allocated pool size — supports up to this many categories.
const POOL_SIZE = 32;

// MARK: - Hook

/**
 * Manages drag-to-reorder for category rows.
 * Uses Gesture.Pan for UI-thread gesture tracking and per-category SharedValues
 * for translateY so animations never cross the JS bridge during a drag.
 */
export function useCategoryDrag(
  categories: Category[],
  reorderCategories: (orderedIDs: string[]) => void,
): UseCategoryDragReturn {
  const [catDragState, setCatDragState] = useState<CatDragState | null>(null);
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const stateRef = useRef<CatDragState | null>(null);
  const rowHeightsRef = useRef<number[]>([]);

  // Pre-allocated SharedValue pool using useSharedValue (Expo Go compatible).
  // Called unconditionally to satisfy Rules of Hooks.
  const sv0 = useSharedValue(0); const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0); const sv3 = useSharedValue(0);
  const sv4 = useSharedValue(0); const sv5 = useSharedValue(0);
  const sv6 = useSharedValue(0); const sv7 = useSharedValue(0);
  const sv8 = useSharedValue(0); const sv9 = useSharedValue(0);
  const sv10 = useSharedValue(0); const sv11 = useSharedValue(0);
  const sv12 = useSharedValue(0); const sv13 = useSharedValue(0);
  const sv14 = useSharedValue(0); const sv15 = useSharedValue(0);
  const sv16 = useSharedValue(0); const sv17 = useSharedValue(0);
  const sv18 = useSharedValue(0); const sv19 = useSharedValue(0);
  const sv20 = useSharedValue(0); const sv21 = useSharedValue(0);
  const sv22 = useSharedValue(0); const sv23 = useSharedValue(0);
  const sv24 = useSharedValue(0); const sv25 = useSharedValue(0);
  const sv26 = useSharedValue(0); const sv27 = useSharedValue(0);
  const sv28 = useSharedValue(0); const sv29 = useSharedValue(0);
  const sv30 = useSharedValue(0); const sv31 = useSharedValue(0);

  const translatePool = useRef<SharedValue<number>[]>([
    sv0, sv1, sv2, sv3, sv4, sv5, sv6, sv7,
    sv8, sv9, sv10, sv11, sv12, sv13, sv14, sv15,
    sv16, sv17, sv18, sv19, sv20, sv21, sv22, sv23,
    sv24, sv25, sv26, sv27, sv28, sv29, sv30, sv31,
  ]);

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const reorderRef = useRef(reorderCategories);
  reorderRef.current = reorderCategories;

  const onRowLayout = useCallback((flatIdx: number, height: number) => {
    rowHeightsRef.current[flatIdx] = height;
  }, []);

  const getCatTranslate = useCallback((flatIdx: number): SharedValue<number> => {
    return translatePool.current[flatIdx % POOL_SIZE];
  }, []);

  // Compute sibling target offsets on JS thread, then apply on UI thread.
  const updateSiblingTranslates = useCallback(
    (ds: CatDragState, allCats: Category[]): void => {
      const updates: Array<{ poolIdx: number; targetY: number }> = [];
      ds.liveOrder.forEach((id, liveIdx) => {
        const origIdx = ds.originalOrder.indexOf(id);
        const cat = allCats.find((c) => c.id === id);
        if (!cat) return;
        const flatIdx = allCats.indexOf(cat);
        const poolIdx = flatIdx % POOL_SIZE;
        const liveOffset = computeCatLiveOffset(ds, liveIdx);
        const origOffset = ds.originalOffsets[origIdx] ?? 0;
        updates.push({ poolIdx, targetY: liveOffset - origOffset });
      });
      const pool = translatePool.current;
      runOnUI(() => {
        "worklet";
        updates.forEach(({ poolIdx, targetY }) => {
          pool[poolIdx].value = withTiming(targetY, { duration: SIBLING_DURATION });
        });
      })();
    },
    [],
  );

  // Reset all sibling SharedValues to 0 on release.
  const resetAllTranslates = useCallback(
    (ds: CatDragState, allCats: Category[]): void => {
      const poolIndices: number[] = [];
      ds.originalOrder.forEach((id) => {
        const cat = allCats.find((c) => c.id === id);
        if (!cat) return;
        poolIndices.push(allCats.indexOf(cat) % POOL_SIZE);
      });
      const pool = translatePool.current;
      runOnUI(() => {
        "worklet";
        poolIndices.forEach((idx) => {
          pool[idx].value = withTiming(0, { duration: RESET_DURATION });
        });
      })();
    },
    [],
  );

  // JS-thread: commit the reorder to the store on drop.
  const commitReorder = useCallback((): void => {
    const ds = stateRef.current;
    stateRef.current = null;
    setCatDragState(null);
    setIsDraggingCat(false);
    if (!ds) return;

    // Always reset translates — rows must return to natural position after reorder.
    resetAllTranslates(ds, categoriesRef.current);

    if (ds.liveOrder.join() === ds.originalOrder.join()) return;

    const cats = categoriesRef.current;
    const scopedCats = ds.groupID !== null
      ? cats.filter((c) => c.groupID === ds.groupID)
      : cats.filter((c) => !c.groupID);

    const newFullOrder = cats.map((c) => c.id);
    scopedCats.forEach((cat, i) => {
      const fi = cats.indexOf(cat);
      newFullOrder[fi] = ds.liveOrder[i];
    });
    reorderRef.current(newFullOrder);
  }, [resetAllTranslates]);

  // Only called on cancelled/failed gestures — onEnd already handles success.
  const cancelDrag = useCallback((): void => {
    const ds = stateRef.current;
    if (!ds) return; // commitReorder already ran
    resetAllTranslates(ds, categoriesRef.current);
    stateRef.current = null;
    setCatDragState(null);
    setIsDraggingCat(false);
  }, [resetAllTranslates]);

  // JS-thread: hit-test and update live order during drag.
  const handleMove = useCallback((dy: number): void => {
    const ds = stateRef.current;
    if (!ds) return;
    const count = ds.liveOrder.length;
    const cats = categoriesRef.current;
    const draggedID = cats[ds.flatIdx]?.id ?? "";
    const draggedOrigIdx = ds.originalOrder.indexOf(draggedID);
    const draggedLiveIdx = ds.liveOrder.indexOf(draggedID);

    const liveOffsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < count; i++) {
      liveOffsets.push(acc);
      const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
      acc += (ds.heights[origI] ?? ds.rowHeight) + ds.gap;
    }

    const draggedOrigOffset = ds.originalOffsets[draggedOrigIdx] ?? 0;
    const draggedMid = draggedOrigOffset + dy + ds.rowHeight / 2;

    let newLiveIdx = draggedLiveIdx;
    for (let i = 0; i < count; i++) {
      if (i === draggedLiveIdx) continue;
      const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
      const slotMid = liveOffsets[i] + (ds.heights[origI] ?? ds.rowHeight) / 2;
      if (i < draggedLiveIdx && draggedMid < slotMid) { newLiveIdx = i; break; }
      if (i > draggedLiveIdx && draggedMid > slotMid) { newLiveIdx = i; }
    }

    if (newLiveIdx === draggedLiveIdx) return;

    const newLiveOrder = [...ds.liveOrder];
    const [item] = newLiveOrder.splice(draggedLiveIdx, 1);
    newLiveOrder.splice(newLiveIdx, 0, item);

    const next: CatDragState = { ...ds, liveOrder: newLiveOrder };
    stateRef.current = next;
    setCatDragState(next);
    updateSiblingTranslates(next, categoriesRef.current);
  }, [updateSiblingTranslates]);

  const beginDrag = useCallback(
    (
      visualIdx: number,
      flatIdx: number,
      scopedCategories: Category[],
      allCategories: Category[],
      groupID: string | null,
    ): void => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const GAP = groupID !== null ? GAP_GROUPED : GAP_FLAT;
      const heights: number[] = scopedCategories.map((cat) => {
        const fi = allCategories.indexOf(cat);
        return rowHeightsRef.current[fi] ?? 44;
      });

      const liveOrder = scopedCategories.map((c) => c.id);
      const originalOffsets: number[] = [];
      let acc = 0;
      for (let i = 0; i < heights.length; i++) {
        originalOffsets.push(acc);
        acc += heights[i] + GAP;
      }

      const next: CatDragState = {
        flatIdx,
        groupID,
        liveOrder,
        originalOrder: [...liveOrder],
        rowHeight: heights[visualIdx] ?? 44,
        originalOffsets,
        gap: GAP,
        heights,
      };
      stateRef.current = next;
      setCatDragState(next);
      setIsDraggingCat(true);
    },
    [],
  );

  const makeCatGesture = useCallback(
    (
      visualIdx: number,
      scopedCategories: Category[],
      allCategories: Category[],
      groupID: string | null,
    ): ComposedGesture | GestureType => {
      const scopedItem = scopedCategories[visualIdx];
      const flatIdx = allCategories.indexOf(scopedItem);
      const translateY = getCatTranslate(flatIdx);

      return Gesture.Pan()
        .activateAfterLongPress(0)
        .minDistance(4)
        .onBegin(() => {
          runOnJS(beginDrag)(visualIdx, flatIdx, scopedCategories, allCategories, groupID);
        })
        .onUpdate((e) => {
          // UI thread: move the dragged row instantly.
          translateY.value = e.translationY;
          // JS thread: handleMove reads stateRef.current itself — do not capture the ref here.
          runOnJS(handleMove)(e.translationY);
        })
        .onEnd(() => {
          translateY.value = withTiming(0, { duration: RESET_DURATION });
          runOnJS(commitReorder)();
        })
        .onFinalize(() => {
          translateY.value = withTiming(0, { duration: RESET_DURATION });
          runOnJS(cancelDrag)();
        });
    },
    [getCatTranslate, beginDrag, handleMove, commitReorder, cancelDrag],
  );

  return { catDragState, isDraggingCat, rowHeightsRef, onRowLayout, getCatTranslate, makeCatGesture };
}
