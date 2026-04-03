// src/features/settings/hooks/useGroupDrag.ts
// Custom hook encapsulating group drag-to-reorder logic for SettingsSheet.
// NOTE: 230 lines — exceeds the 120-line hook target because pointer-event drag
// logic (down/move/up/cancel), collapse tracking, and commit-on-drop are a single
// cohesive interaction that cannot be split without breaking the drag state machine.

import { useState, useRef, useCallback, useEffect } from "react";
import type { CategoryGroup } from "@/models/types";

// MARK: - Types

/** State shape for an in-progress group drag gesture. */
export interface GroupDragState {
  /** Index of the group being dragged within the groups array. */
  idx: number;
  /** Live translateY offset for the dragged row (pointer delta from start). */
  translateY: number;
  /** Live order of group IDs, updated each frame. */
  liveOrder: string[];
  /** Original order of group IDs at drag start. */
  originalOrder: string[];
  /** Height of the dragged row in px. */
  rowHeight: number;
}

/** Return shape for the {@link useGroupDrag} hook. */
export interface UseGroupDragReturn {
  groupDragState: GroupDragState | null;
  groupsContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the snapshotted heights of group rows — used by the section component for translateY. */
  groupRowHeightsRef: React.RefObject<number[]>;
  handleGroupDragPointerDown: (e: React.PointerEvent, idx: number) => void;
  /** Set of expanded group IDs — managed here because group drags collapse/restore them. */
  expandedGroupIDs: Set<string>;
  /** Toggles a single group's expanded/collapsed state. */
  toggleGroup: (groupID: string) => void;
  /** Setter for expandedGroupIDs — used by the parent's init effect. */
  setExpandedGroupIDs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

// MARK: - Hook

/**
 * Manages the pointer-based drag-to-reorder interaction for group rows.
 *
 * Also owns the expanded/collapsed state for groups because group drags
 * automatically collapse all groups during the gesture and restore them on drop.
 *
 * @param groups - The full array of groups from the store.
 * @param moveGroups - Store action to persist the reorder.
 * @returns Drag state, container ref, pointerDown handler, and expanded-groups state.
 */
export function useGroupDrag(
  groups: CategoryGroup[],
  moveGroups: (from: number, to: number) => void,
): UseGroupDragReturn {
  const [groupDragState, setGroupDragState] = useState<GroupDragState | null>(
    null,
  );
  const [expandedGroupIDs, setExpandedGroupIDs] = useState<Set<string>>(
    () => new Set(),
  );

  const groupDragStateRef = useRef<GroupDragState | null>(null);
  const groupDragPointerStartY = useRef(0);
  const groupRowHeightsRef = useRef<number[]>([]);
  const groupsContainerRef = useRef<HTMLDivElement>(null);
  const hasGroupDraggedRef = useRef(false);
  const savedExpandedGroupIDsRef = useRef<Set<string>>(new Set());

  // Stable refs so window handlers don't need to re-register.
  const groupsRef = useRef(groups);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const moveGroupsRef = useRef(moveGroups);
  useEffect(() => {
    moveGroupsRef.current = moveGroups;
  }, [moveGroups]);

  /** Toggles a single group's expanded/collapsed state. */
  const toggleGroup = useCallback((groupID: string) => {
    setExpandedGroupIDs((prev) => {
      const next = new Set(prev);
      if (next.has(groupID)) {
        next.delete(groupID);
      } else {
        next.add(groupID);
      }
      return next;
    });
  }, []);

  // Initialize expandedGroupIDs when groups change (add new, remove stale).
  useEffect(() => {
    setExpandedGroupIDs((prev) => {
      const currentGroupIDs = new Set(groups.map((g) => g.id));
      const next = new Set(prev);
      for (const id of currentGroupIDs) {
        if (!next.has(id)) next.add(id);
      }
      for (const id of next) {
        if (!currentGroupIDs.has(id)) next.delete(id);
      }
      return next;
    });
  }, [groups]);

  const handleGroupDragPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const heights: number[] = [];
      if (groupsContainerRef.current) {
        groupsRef.current.forEach((_, i) => {
          const el = groupsContainerRef.current!.querySelector<HTMLElement>(
            `[data-group-idx="${i}"]`,
          );
          heights.push(el ? el.getBoundingClientRect().height : 48);
        });
      } else {
        groupsRef.current.forEach(() => heights.push(48));
      }

      groupDragPointerStartY.current = e.clientY;
      groupRowHeightsRef.current = heights;
      hasGroupDraggedRef.current = false;

      const liveOrder = groupsRef.current.map((g) => g.id);
      const newState: GroupDragState = {
        idx,
        translateY: 0,
        liveOrder,
        originalOrder: [...liveOrder],
        rowHeight: heights[idx] ?? 48,
      };
      groupDragStateRef.current = newState;
      setGroupDragState(newState);
    },
    [],
  );

  const handleGroupDragPointerMove = useCallback((e: PointerEvent) => {
    const ds = groupDragStateRef.current;
    if (!ds) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    // Collapse groups on first move.
    if (!hasGroupDraggedRef.current) {
      hasGroupDraggedRef.current = true;
      setExpandedGroupIDs((prev) => {
        savedExpandedGroupIDsRef.current = new Set(prev);
        return new Set();
      });
    }

    const dy = e.clientY - groupDragPointerStartY.current;
    const count = ds.liveOrder.length;
    const draggedIdx = ds.liveOrder.indexOf(
      groupsRef.current[ds.idx]?.id ?? "",
    );

    const GAP = 8;
    const offsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < count; i++) {
      offsets.push(acc);
      acc += (groupRowHeightsRef.current[i] ?? ds.rowHeight) + GAP;
    }

    const draggedOriginalOffset = offsets[draggedIdx] ?? 0;
    const draggedCurrentTop = draggedOriginalOffset + dy;
    const draggedMid = draggedCurrentTop + ds.rowHeight / 2;

    let newIdx = draggedIdx;
    for (let i = 0; i < count; i++) {
      if (i === draggedIdx) continue;
      const slotMid =
        offsets[i] + (groupRowHeightsRef.current[i] ?? ds.rowHeight) / 2;
      if (i < draggedIdx && draggedMid < slotMid) {
        newIdx = i;
        break;
      }
      if (i > draggedIdx && draggedMid > slotMid) {
        newIdx = i;
      }
    }

    let newLiveOrder = ds.liveOrder;
    if (newIdx !== draggedIdx) {
      newLiveOrder = [...ds.liveOrder];
      const [item] = newLiveOrder.splice(draggedIdx, 1);
      newLiveOrder.splice(newIdx, 0, item);
    }

    const next: GroupDragState = {
      ...ds,
      translateY: dy,
      liveOrder: newLiveOrder,
    };
    groupDragStateRef.current = next;
    setGroupDragState(next);
  }, []);

  const handleGroupDragPointerUp = useCallback(() => {
    const ds = groupDragStateRef.current;
    const didDrag = hasGroupDraggedRef.current;
    groupDragStateRef.current = null;
    hasGroupDraggedRef.current = false;
    setGroupDragState(null);

    if (didDrag) {
      setExpandedGroupIDs(savedExpandedGroupIDsRef.current);
    }

    if (!ds || ds.liveOrder.join() === ds.originalOrder.join()) return;

    const groups = groupsRef.current;
    const originalIdx = ds.originalOrder.indexOf(groups[ds.idx]?.id ?? "");
    const finalIdx = ds.liveOrder.indexOf(groups[ds.idx]?.id ?? "");
    if (originalIdx !== -1 && finalIdx !== -1 && originalIdx !== finalIdx) {
      moveGroupsRef.current(originalIdx, finalIdx);
    }
  }, []);

  // Attach handlers to window once on mount.
  useEffect(() => {
    window.addEventListener("pointermove", handleGroupDragPointerMove);
    window.addEventListener("pointerup", handleGroupDragPointerUp);
    window.addEventListener("pointercancel", handleGroupDragPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGroupDragPointerMove);
      window.removeEventListener("pointerup", handleGroupDragPointerUp);
      window.removeEventListener("pointercancel", handleGroupDragPointerUp);
    };
  }, [handleGroupDragPointerMove, handleGroupDragPointerUp]);

  return {
    groupDragState,
    groupsContainerRef,
    groupRowHeightsRef,
    handleGroupDragPointerDown,
    expandedGroupIDs,
    toggleGroup,
    setExpandedGroupIDs,
  };
}
