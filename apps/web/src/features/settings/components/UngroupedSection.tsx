// src/features/settings/components/UngroupedSection.tsx
// Renders ungrouped categories below the group sections, with an "Assign" chip.

import type { JSX } from "react";
import type { Category } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import { computeCatLiveOffset } from "@/features/settings/utils/dragUtils";
import { CategoryRow } from "./CategoryRow";

// MARK: - Props

/** Props for the ungrouped-categories section. */
export interface UngroupedSectionProps {
  categories: Category[];
  catDragState: CatDragState | null;
  canDeleteCategories: boolean;
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  inlineEditingCategoryID: string | null;
  setInlineEditingCategoryID: (id: string | null) => void;
  renameCategoryName: string;
  onRenameCategoryNameChange: (v: string) => void;
  saveRenameCategory: () => void;
  onDeleteCategory: (id: string, name: string) => void;
  onAssignGroup: (categoryId: string, categoryName: string) => void;
}

// MARK: - Component

/** Renders ungrouped categories with drag handles, inline rename, delete, and an "Assign" chip. */
export function UngroupedSection({
  categories,
  catDragState,
  canDeleteCategories,
  handleDragPointerDown,
  inlineEditingCategoryID,
  setInlineEditingCategoryID,
  renameCategoryName,
  onRenameCategoryNameChange,
  saveRenameCategory,
  onDeleteCategory,
  onAssignGroup,
}: UngroupedSectionProps): JSX.Element | null {
  const ungrouped = categories.filter((c) => !c.groupID);
  if (ungrouped.length === 0) return null;

  const scopedDS = catDragState?.groupID === null ? catDragState : null;
  const draggingCatID = scopedDS ? categories[scopedDS.flatIdx]?.id : null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <hr className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-widest px-1"
          style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}
        >
          No Group
        </span>
        <hr className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
      </div>

      <div className="flex flex-col gap-1">
        {ungrouped.map((category, visualIdx) => {
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
              groupID={null}
              isDragging={isDragging}
              catTranslateY={catTranslateY}
              canDelete={canDeleteCategories}
              variant="flat"
              handleDragPointerDown={handleDragPointerDown}
              inlineEditingCategoryID={inlineEditingCategoryID}
              setInlineEditingCategoryID={setInlineEditingCategoryID}
              renameCategoryName={renameCategoryName}
              onRenameCategoryNameChange={onRenameCategoryNameChange}
              saveRenameCategory={saveRenameCategory}
              onDelete={onDeleteCategory}
              onAssignGroup={() => onAssignGroup(category.id, category.name)}
            />
          );
        })}
      </div>
    </div>
  );
}
