// src/features/settings/components/FlatLayout.tsx
// Flat category list used when no groups exist.

import type { JSX } from "react";
import type { Category } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import { CategoryRow } from "./CategoryRow";

/** Props for the flat (no-groups) category list layout. */
export interface FlatLayoutProps {
  listRef: React.RefObject<HTMLUListElement | null>;
  categories: Category[];
  catDragState: CatDragState | null;
  canDeleteCategories: boolean;
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string, name: string) => void;
}

// MARK: - Component

/** Flat category list used when no groups exist. */
export function FlatLayout({
  listRef,
  categories,
  catDragState,
  canDeleteCategories,
  handleDragPointerDown,
  onRenameCategory,
  onDeleteCategory,
}: FlatLayoutProps): JSX.Element {
  const scopedDS = catDragState?.groupID === null ? catDragState : null;
  const draggingCatID = scopedDS ? categories[scopedDS.flatIdx]?.id : null;

  // Always render in the original DOM order; visual reorder is driven
  // entirely by translateY so siblings animate smoothly.
  const GAP = 6; // matches gap-1.5 (6px)
  return (
    <ul ref={listRef} className="flex flex-col gap-1.5">
      {categories.map((category, idx) => {
        const flatIdx = idx;
        const isDragging = category.id === draggingCatID;

        let catTranslateY = 0;
        if (scopedDS) {
          if (isDragging) {
            catTranslateY = scopedDS.translateY;
          } else {
            const origIdx = scopedDS.originalOrder.indexOf(category.id);
            const liveIdx = scopedDS.liveOrder.indexOf(category.id);
            if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
              catTranslateY = (liveIdx - origIdx) * (scopedDS.rowHeight + GAP);
            }
          }
        }

        return (
          <CategoryRow
            key={category.id}
            category={category}
            flatIdx={flatIdx}
            visualIdx={idx}
            groupID={null}
            isDragging={isDragging}
            catTranslateY={catTranslateY}
            canDelete={canDeleteCategories}
            variant="flat"
            handleDragPointerDown={handleDragPointerDown}
            onRename={onRenameCategory}
            onDelete={onDeleteCategory}
          />
        );
      })}
    </ul>
  );
}
