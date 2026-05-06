// src/features/settings/components/CategoriesGroupsSection.tsx
// Renders the "Categories & Groups" card in the settings sheet.
// Supports grouped layout (with collapsible groups) and flat layout (no groups).

import type { JSX } from "react";
import type { Category, CategoryGroup } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import type { GroupDragState } from "@/features/settings/hooks/useGroupDrag";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { GroupsMapSection } from "./GroupsMapSection";
import { UngroupedSection } from "./UngroupedSection";
import { FlatLayout } from "./FlatLayout";
import { AddButtons } from "./AddButtons";

// MARK: - Props

interface CategoriesGroupsSectionProps {
  // ── Store data ──
  categories: Category[];
  groups: CategoryGroup[];
  canDeleteCategories: boolean;

  // ── Category drag ──
  catDragState: CatDragState | null;
  catContainerRef: React.RefObject<HTMLDivElement | null>;
  listRef: React.RefObject<HTMLUListElement | null>;
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;

  // ── Group drag ──
  groupDragState: GroupDragState | null;
  groupsContainerRef: React.RefObject<HTMLDivElement | null>;
  handleGroupDragPointerDown: (e: React.PointerEvent, idx: number) => void;

  // ── Expanded groups ──
  expandedGroupIDs: Set<string>;
  toggleGroup: (groupID: string) => void;

  // ── Callbacks ──
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string, name: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string, name: string) => void;
  onAssignGroup: (categoryId: string, categoryName: string) => void;
  onAddCategory: () => void;
  onAddGroup: () => void;
  onAddCategoryInGroup?: (groupID: string) => void;
}

// MARK: - Component

/** The "Categories & Groups" settings card with drag-to-reorder support. */
export function CategoriesGroupsSection({
  categories,
  groups,
  canDeleteCategories,
  catDragState,
  catContainerRef,
  listRef,
  handleDragPointerDown,
  groupDragState,
  groupsContainerRef,
  handleGroupDragPointerDown,
  expandedGroupIDs,
  toggleGroup,
  onRenameCategory,
  onDeleteCategory,
  onRenameGroup,
  onDeleteGroup,
  onAssignGroup,
  onAddCategory,
  onAddGroup,
  onAddCategoryInGroup,
}: CategoriesGroupsSectionProps): JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Categories &amp; Groups</SectionLabel>

      {/* Groups discoverability caption — only when no groups */}
      {groups.length === 0 && (
        <p className="text-xs -mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Categories live inside groups. Create groups to organize your lists.
        </p>
      )}

      {/* ── Grouped layout (groups exist) ── */}
      {groups.length > 0 && (
        <div ref={catContainerRef}>
          <GroupsMapSection
            groups={groups}
            categories={categories}
            canDeleteCategories={canDeleteCategories}
            groupDragState={groupDragState}
            groupsContainerRef={groupsContainerRef}
            catDragState={catDragState}
            handleGroupDragPointerDown={handleGroupDragPointerDown}
            handleDragPointerDown={handleDragPointerDown}
            expandedGroupIDs={expandedGroupIDs}
            toggleGroup={toggleGroup}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
            onAddCategoryInGroup={onAddCategoryInGroup}
          />
          <UngroupedSection
            categories={categories}
            catDragState={catDragState}
            canDeleteCategories={canDeleteCategories}
            handleDragPointerDown={handleDragPointerDown}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
            onAssignGroup={onAssignGroup}
          />
        </div>
      )}

      {/* ── Flat layout (no groups) ── */}
      {groups.length === 0 && (
        <FlatLayout
          listRef={listRef}
          categories={categories}
          catDragState={catDragState}
          canDeleteCategories={canDeleteCategories}
          handleDragPointerDown={handleDragPointerDown}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}

      {!canDeleteCategories && (
        <p className="text-xs px-1" style={{ color: "var(--color-text-secondary)" }}>
          At least one category is required.
        </p>
      )}

      {/* ── Add controls ── */}
      <AddButtons onAddCategory={onAddCategory} onAddGroup={onAddGroup} />
    </SettingsCard>
  );
}
