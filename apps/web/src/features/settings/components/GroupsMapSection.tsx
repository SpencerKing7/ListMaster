// src/features/settings/components/GroupsMapSection.tsx
// Drag-sortable list of group rows inside the "Categories & Groups" settings card.

import type { JSX } from "react";
import type { Category, CategoryGroup } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import type { GroupDragState } from "@/features/settings/hooks/useGroupDrag";
import { computeGroupLiveOffset } from "@/features/settings/utils/dragUtils";
import { GroupRow } from "./GroupRow";

// MARK: - Props

interface GroupsMapSectionProps {
  groups: CategoryGroup[];
  categories: Category[];
  canDeleteCategories: boolean;
  groupDragState: GroupDragState | null;
  groupsContainerRef: React.RefObject<HTMLDivElement | null>;
  catDragState: CatDragState | null;
  handleGroupDragPointerDown: (e: React.PointerEvent, idx: number) => void;
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  expandedGroupIDs: Set<string>;
  toggleGroup: (groupID: string) => void;
  inlineEditingCategoryID: string | null;
  setInlineEditingCategoryID: (id: string | null) => void;
  renameCategoryName: string;
  onRenameCategoryNameChange: (v: string) => void;
  saveRenameCategory: () => void;
  onDeleteCategory: (id: string, name: string) => void;
  inlineEditingGroupID: string | null;
  setInlineEditingGroupID: (id: string | null) => void;
  renameGroupName: string;
  onRenameGroupNameChange: (v: string) => void;
  saveRenameGroup: () => void;
  onDeleteGroup: (id: string, name: string) => void;
  onAddCategoryInGroup?: (groupID: string) => void;
}

// MARK: - Component

/** Renders the ordered list of drag-sortable group rows. */
export function GroupsMapSection({
  groups,
  categories,
  canDeleteCategories,
  groupDragState,
  groupsContainerRef,
  catDragState,
  handleGroupDragPointerDown,
  handleDragPointerDown,
  expandedGroupIDs,
  toggleGroup,
  inlineEditingCategoryID,
  setInlineEditingCategoryID,
  renameCategoryName,
  onRenameCategoryNameChange,
  saveRenameCategory,
  onDeleteCategory,
  inlineEditingGroupID,
  setInlineEditingGroupID,
  renameGroupName,
  onRenameGroupNameChange,
  saveRenameGroup,
  onDeleteGroup,
  onAddCategoryInGroup,
}: GroupsMapSectionProps): JSX.Element {
  // Always render in original DOM order; visual reorder is driven by translateY.
  const draggingGroupID = groupDragState ? groups[groupDragState.idx]?.id : null;

  return (
    <div ref={groupsContainerRef} className="flex flex-col gap-2">
      {groups.map((group, groupVisualIdx) => {
        const isExpanded = expandedGroupIDs.has(group.id);
        const groupCategories = categories.filter(c => c.groupID === group.id);
        const isGroupDragging = group.id === draggingGroupID;

        let groupTranslateY = 0;
        if (groupDragState) {
          if (isGroupDragging) {
            groupTranslateY = groupDragState.translateY;
          } else {
            const origIdx = groupDragState.originalOrder.indexOf(group.id);
            const liveIdx = groupDragState.liveOrder.indexOf(group.id);
            if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
              const liveOffset = computeGroupLiveOffset(groupDragState, liveIdx);
              const origOffset = groupDragState.originalOffsets[origIdx] ?? 0;
              groupTranslateY = liveOffset - origOffset;
            }
          }
        }

        return (
          <GroupRow
            key={group.id}
            group={group}
            groupVisualIdx={groupVisualIdx}
            isExpanded={isExpanded}
            isGroupDragging={isGroupDragging}
            groupTranslateY={groupTranslateY}
            groupCategories={groupCategories}
            categories={categories}
            catDragState={catDragState}
            canDeleteCategories={canDeleteCategories}
            handleGroupDragPointerDown={handleGroupDragPointerDown}
            handleDragPointerDown={handleDragPointerDown}
            toggleGroup={toggleGroup}
            inlineEditingCategoryID={inlineEditingCategoryID}
            setInlineEditingCategoryID={setInlineEditingCategoryID}
            renameCategoryName={renameCategoryName}
            onRenameCategoryNameChange={onRenameCategoryNameChange}
            saveRenameCategory={saveRenameCategory}
            onDeleteCategory={onDeleteCategory}
            inlineEditingGroupID={inlineEditingGroupID}
            setInlineEditingGroupID={setInlineEditingGroupID}
            renameGroupName={renameGroupName}
            onRenameGroupNameChange={onRenameGroupNameChange}
            saveRenameGroup={saveRenameGroup}
            onDeleteGroup={onDeleteGroup}
            onAddCategory={onAddCategoryInGroup ? () => onAddCategoryInGroup(group.id) : undefined}
          />
        );
      })}
    </div>
  );
}
