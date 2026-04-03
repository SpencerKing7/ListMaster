// src/features/settings/utils/dragUtils.ts
// Shared drag-to-reorder offset computation utilities.
// Used by GroupRow, UngroupedSection, FlatLayout, and CategoriesGroupsSection.

import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import type { GroupDragState } from "@/features/settings/hooks/useGroupDrag";

/**
 * Computes the cumulative Y offset of a slot in the live order for category drags.
 *
 * @param ds - The current category drag state snapshot.
 * @param liveIdx - The index in the live (reordered) array.
 * @returns The pixel offset from the top of the drag container.
 */
export function computeCatLiveOffset(
  ds: CatDragState,
  liveIdx: number,
): number {
  let offset = 0;
  for (let i = 0; i < liveIdx; i++) {
    const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
    offset += (ds.heights[origI] ?? ds.rowHeight) + ds.gap;
  }
  return offset;
}

/**
 * Computes the cumulative Y offset of a slot in the live order for group drags.
 *
 * @param ds - The current group drag state snapshot.
 * @param liveIdx - The index in the live (reordered) array.
 * @returns The pixel offset from the top of the drag container.
 */
export function computeGroupLiveOffset(
  ds: GroupDragState,
  liveIdx: number,
): number {
  let offset = 0;
  for (let i = 0; i < liveIdx; i++) {
    const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
    offset += (ds.heights[origI] ?? ds.rowHeight) + ds.gap;
  }
  return offset;
}
