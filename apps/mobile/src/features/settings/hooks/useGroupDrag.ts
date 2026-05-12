// src/features/settings/hooks/useGroupDrag.ts
// Group drag-to-reorder using RNGH Gesture.Pan + Reanimated SharedValue.
// Collapses groups on drag start; restores expanded state on release.
// NOTE: Exceeds the 120-line hook ceiling for the same reason as useCategoryDrag.

import { useState, useRef, useCallback } from "react";
import { useSharedValue, withTiming, runOnJS, runOnUI } from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import type { CategoryGroup, GroupDragState } from "@/models/types";
import { computeGroupLiveOffset } from "@/features/settings/utils/dragUtils";
import { useExpandedGroups } from "./useExpandedGroups";

// MARK: - Types

export type { GroupDragState } from "@/models/types";

export interface UseGroupDragReturn {
  groupDragState: GroupDragState | null;
  isDraggingGroup: boolean;
  groupRowHeightsRef: React.MutableRefObject<number[]>;
  onGroupRowLayout: (idx: number, height: number) => void;
  getGroupTranslate: (idx: number) => SharedValue<number>;
  makeGroupGesture: (idx: number) => ComposedGesture | GestureType;
  expandedGroupIDs: Set<string>;
  toggleGroup: (groupID: string) => void;
  setExpandedGroupIDs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

// MARK: - Constants

const GAP = 8;
const RESET_DURATION = 120;
const SIBLING_DURATION = 150;
// Pre-allocated pool size — supports up to this many groups.
const POOL_SIZE = 16;

// MARK: - Hook

/**
 * Manages drag-to-reorder for group rows.
 * Collapses all groups during the drag gesture and restores them on release.
 * Mirrors useCategoryDrag — no refs captured inside worklets.
 */
export function useGroupDrag(
  groups: CategoryGroup[],
  moveGroups: (from: number, to: number) => void,
): UseGroupDragReturn {
  const [groupDragState, setGroupDragState] = useState<GroupDragState | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const stateRef = useRef<GroupDragState | null>(null);
  const groupRowHeightsRef = useRef<number[]>([]);
  const savedExpandedRef = useRef<Set<string>>(new Set());

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

  const translatePool = useRef<SharedValue<number>[]>([
    sv0, sv1, sv2, sv3, sv4, sv5, sv6, sv7,
    sv8, sv9, sv10, sv11, sv12, sv13, sv14, sv15,
  ]);

  const { expandedGroupIDs, setExpandedGroupIDs, toggleGroup } = useExpandedGroups(groups);

  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const moveGroupsRef = useRef(moveGroups);
  moveGroupsRef.current = moveGroups;

  const onGroupRowLayout = useCallback((idx: number, height: number) => {
    groupRowHeightsRef.current[idx] = height;
  }, []);

  const getGroupTranslate = useCallback((idx: number): SharedValue<number> => {
    return translatePool.current[idx % POOL_SIZE];
  }, []);

  // Compute sibling target offsets on JS thread, then apply on UI thread.
  // groupsRef is NOT captured here — pool is the only closed-over worklet value.
  const updateSiblingTranslates = useCallback((ds: GroupDragState): void => {
    const gs = groupsRef.current;
    const updates: Array<{ poolIdx: number; targetY: number }> = [];
    ds.liveOrder.forEach((id, liveIdx) => {
      const origIdx = ds.originalOrder.indexOf(id);
      const groupIdx = gs.findIndex((g) => g.id === id);
      if (groupIdx === -1) return;
      const liveOffset = computeGroupLiveOffset(ds, liveIdx);
      const origOffset = ds.originalOffsets[origIdx] ?? 0;
      updates.push({ poolIdx: groupIdx % POOL_SIZE, targetY: liveOffset - origOffset });
    });
    const pool = translatePool.current;
    runOnUI(() => {
      "worklet";
      updates.forEach(({ poolIdx, targetY }) => {
        pool[poolIdx].value = withTiming(targetY, { duration: SIBLING_DURATION });
      });
    })();
  }, []);

  const resetAllTranslates = useCallback((ds: GroupDragState): void => {
    const gs = groupsRef.current;
    const poolIndices: number[] = [];
    ds.originalOrder.forEach((id) => {
      const groupIdx = gs.findIndex((g) => g.id === id);
      if (groupIdx !== -1) poolIndices.push(groupIdx % POOL_SIZE);
    });
    const pool = translatePool.current;
    runOnUI(() => {
      "worklet";
      poolIndices.forEach((idx) => {
        pool[idx].value = withTiming(0, { duration: RESET_DURATION });
      });
    })();
  }, []);

  const commitReorder = useCallback((): void => {
    const ds = stateRef.current;
    stateRef.current = null;
    setGroupDragState(null);
    setIsDraggingGroup(false);
    setExpandedGroupIDs(savedExpandedRef.current);
    if (!ds) return;

    resetAllTranslates(ds);

    if (ds.liveOrder.join() === ds.originalOrder.join()) return;
    const gs = groupsRef.current;
    const origIdx = ds.originalOrder.indexOf(gs[ds.idx]?.id ?? "");
    const finalIdx = ds.liveOrder.indexOf(gs[ds.idx]?.id ?? "");
    if (origIdx !== -1 && finalIdx !== -1 && origIdx !== finalIdx) {
      moveGroupsRef.current(origIdx, finalIdx);
    }
  }, [resetAllTranslates, setExpandedGroupIDs]);

  const cancelDrag = useCallback((): void => {
    const ds = stateRef.current;
    if (!ds) return; // commitReorder already ran
    resetAllTranslates(ds);
    stateRef.current = null;
    setGroupDragState(null);
    setIsDraggingGroup(false);
    setExpandedGroupIDs(savedExpandedRef.current);
  }, [resetAllTranslates, setExpandedGroupIDs]);

  // JS-thread: hit-test and update live order during drag.
  // Reads stateRef.current itself — do not pass stateRef into the worklet.
  const handleMove = useCallback((dy: number): void => {
    const ds = stateRef.current;
    if (!ds) return;
    const count = ds.liveOrder.length;
    const gs = groupsRef.current;
    const draggedID = gs[ds.idx]?.id ?? "";
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

    let newIdx = draggedLiveIdx;
    for (let i = 0; i < count; i++) {
      if (i === draggedLiveIdx) continue;
      const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
      const slotMid = liveOffsets[i] + (ds.heights[origI] ?? ds.rowHeight) / 2;
      if (i < draggedLiveIdx && draggedMid < slotMid) { newIdx = i; break; }
      if (i > draggedLiveIdx && draggedMid > slotMid) { newIdx = i; }
    }

    if (newIdx === draggedLiveIdx) return;

    const newLiveOrder = [...ds.liveOrder];
    const [item] = newLiveOrder.splice(draggedLiveIdx, 1);
    newLiveOrder.splice(newIdx, 0, item);

    const next: GroupDragState = { ...ds, liveOrder: newLiveOrder };
    stateRef.current = next;
    setGroupDragState(next);
    updateSiblingTranslates(next);
  }, [updateSiblingTranslates]);

  const beginDrag = useCallback((idx: number): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const gs = groupsRef.current;
    const heights = gs.map((_, i) => groupRowHeightsRef.current[i] ?? 48);

    const originalOffsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < heights.length; i++) {
      originalOffsets.push(acc);
      acc += heights[i] + GAP;
    }

    const liveOrder = gs.map((g) => g.id);
    const next: GroupDragState = {
      idx,
      liveOrder,
      originalOrder: [...liveOrder],
      rowHeight: heights[idx] ?? 48,
      originalOffsets,
      gap: GAP,
      heights,
    };
    stateRef.current = next;
    setGroupDragState(next);
    setIsDraggingGroup(true);
    savedExpandedRef.current = new Set(expandedGroupIDs);
    setExpandedGroupIDs(new Set<string>());
  }, [expandedGroupIDs, setExpandedGroupIDs]);

  const makeGroupGesture = useCallback((idx: number): ComposedGesture | GestureType => {
    const translateY = getGroupTranslate(idx);

    return Gesture.Pan()
      .activateAfterLongPress(0)
      .minDistance(4)
      .onBegin(() => {
        runOnJS(beginDrag)(idx);
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
  }, [getGroupTranslate, beginDrag, handleMove, commitReorder, cancelDrag]);

  return {
    groupDragState,
    isDraggingGroup,
    groupRowHeightsRef,
    onGroupRowLayout,
    getGroupTranslate,
    makeGroupGesture,
    expandedGroupIDs,
    toggleGroup,
    setExpandedGroupIDs,
  };
}
