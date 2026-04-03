// src/features/settings/components/GroupCategoryList.tsx
// Collapsible category sub-list rendered inside a GroupRow.

import type { JSX } from "react";
import type { Category } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import { computeCatLiveOffset } from "@/features/settings/utils/dragUtils";
import { CategoryRow } from "./CategoryRow";

// MARK: - Props

/** Props for the {@link GroupCategoryList} component. */
interface GroupCategoryListProps {
  /** The parent group's ID — used to scope drag state. */
  groupID: string;
  /** Whether this section is currently expanded. */
  isExpanded: boolean;
  /** Whether this group is actively being dragged (skip collapse animation). */
  isGroupDragging: boolean;
  /** Categories belonging to this group, in display order. */
  groupCategories: Category[];
  /** Full categories array (needed for flat-index lookup). */
  categories: Category[];
  /** Current category drag state, or `null` when idle. */
  catDragState: CatDragState | null;
  /** Whether any category can be deleted (≥2 total). */
  canDeleteCategories: boolean;
  /** Called when a category drag handle receives pointer-down. */
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  /** Opens the rename dialog for a category. */
  onRenameCategory: (id: string, name: string) => void;
  /** Opens the delete dialog for a category. */
  onDeleteCategory: (id: string, name: string) => void;
}

// MARK: - Component

/** Collapsible category sub-list with teal accent bar and drag offset support. */
export function GroupCategoryList({
  groupID,
  isExpanded,
  isGroupDragging,
  groupCategories,
  categories,
  catDragState,
  canDeleteCategories,
  handleDragPointerDown,
  onRenameCategory,
  onDeleteCategory,
}: GroupCategoryListProps): JSX.Element {
  const scopedDS = catDragState?.groupID === groupID ? catDragState : null;
  const draggingCatID = scopedDS
    ? categories[scopedDS.flatIdx]?.id
    : null;

  return (
    <div
      className="overflow-hidden"
      style={{
        maxHeight: isExpanded ? "600px" : "0px",
        // Skip the collapse animation while this group is being dragged
        // so the layout reflows instantly and the row stays under the finger.
        transition: isGroupDragging ? "none" : "max-height 220ms ease-out",
      }}
    >
      <div className="relative"
        style={{ backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.05)" }}>
        {/* Teal left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
          style={{ backgroundColor: "rgba(var(--color-brand-teal-rgb), 0.35)" }} />

        <div className="flex flex-col pl-8 pr-2 py-1.5 gap-0.5">
          {groupCategories.map((category, visualIdx) => {
            const flatIdx = categories.indexOf(category);
            const isDragging = category.id === draggingCatID;

            let catTranslateY = 0;
            if (scopedDS) {
              if (isDragging) {
                catTranslateY = scopedDS.translateY;
              } else {
                const origIdx = scopedDS.originalOrder.indexOf(category.id);
                const liveIdx = scopedDS.liveOrder.indexOf(category.id);
                if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
                  const liveOffset = computeCatLiveOffset(scopedDS, liveIdx);
                  const origOffset = scopedDS.originalOffsets[origIdx] ?? 0;
                  catTranslateY = liveOffset - origOffset;
                }
              }
            }

            return (
              <CategoryRow
                key={category.id}
                category={category}
                flatIdx={flatIdx}
                visualIdx={visualIdx}
                groupID={groupID}
                isDragging={isDragging}
                catTranslateY={catTranslateY}
                canDelete={canDeleteCategories}
                variant="grouped"
                handleDragPointerDown={handleDragPointerDown}
                onRename={onRenameCategory}
                onDelete={onDeleteCategory}
              />
            );
          })}
          {groupCategories.length === 0 && (
            <p className="text-xs py-2 pl-1" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
              No categories yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
