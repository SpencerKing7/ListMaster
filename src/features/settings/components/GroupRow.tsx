// src/features/settings/components/GroupRow.tsx
// A single collapsible group: header + category sub-list.
// Composes GroupRowHeader and GroupCategoryList.

import type { JSX } from "react";
import type { Category, CategoryGroup } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import { GroupRowHeader } from "./GroupRowHeader";
import { GroupCategoryList } from "./GroupCategoryList";

/** Props for a collapsible group row in the settings card. */
export interface GroupRowProps {
  group: CategoryGroup;
  groupVisualIdx: number;
  isExpanded: boolean;
  isGroupDragging: boolean;
  groupTranslateY: number;
  groupCategories: Category[];
  categories: Category[];
  catDragState: CatDragState | null;
  canDeleteCategories: boolean;
  handleGroupDragPointerDown: (e: React.PointerEvent, idx: number) => void;
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  toggleGroup: (groupID: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string, name: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string, name: string) => void;
}

// MARK: - Component

/** A single collapsible group with its category sub-list. */
export function GroupRow({
  group,
  groupVisualIdx,
  isExpanded,
  isGroupDragging,
  groupTranslateY,
  groupCategories,
  categories,
  catDragState,
  canDeleteCategories,
  handleGroupDragPointerDown,
  handleDragPointerDown,
  toggleGroup,
  onRenameCategory,
  onDeleteCategory,
  onRenameGroup,
  onDeleteGroup,
}: GroupRowProps): JSX.Element {
  return (
    <div
      data-group-idx={groupVisualIdx}
      className="rounded-xl overflow-hidden"
      style={{
        boxShadow: isGroupDragging
          ? "0 8px 24px rgba(0,0,0,0.22), inset 0 0 0 1.5px rgba(var(--color-brand-deep-green-rgb), 0.15)"
          : "inset 0 0 0 1.5px rgba(var(--color-brand-deep-green-rgb), 0.15)",
        transform: `translateY(${groupTranslateY}px)`,
        transition: isGroupDragging
          ? "box-shadow 120ms ease"
          : "transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms ease",
        zIndex: isGroupDragging ? 10 : undefined,
        position: "relative",
        scale: isGroupDragging ? "1.01" : "1",
      }}
    >
      <GroupRowHeader
        group={group}
        groupVisualIdx={groupVisualIdx}
        isExpanded={isExpanded}
        categoryCount={groupCategories.length}
        onDragPointerDown={handleGroupDragPointerDown}
        onToggle={toggleGroup}
        onRename={onRenameGroup}
        onDelete={onDeleteGroup}
      />

      <GroupCategoryList
        groupID={group.id}
        isExpanded={isExpanded}
        isGroupDragging={isGroupDragging}
        groupCategories={groupCategories}
        categories={categories}
        catDragState={catDragState}
        canDeleteCategories={canDeleteCategories}
        handleDragPointerDown={handleDragPointerDown}
        onRenameCategory={onRenameCategory}
        onDeleteCategory={onDeleteCategory}
      />
    </div>
  );
}
