// src/features/settings/components/CategoriesGroupsSection.tsx
// Renders the "Categories & Groups" card in the settings sheet.
// Supports grouped layout (with collapsible groups) and flat layout (no groups).

import type { JSX } from "react";
import type { Category, CategoryGroup } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import type { GroupDragState } from "@/features/settings/hooks/useGroupDrag";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { GroupRow } from "./GroupRow";
import { UngroupedSection } from "./UngroupedSection";
import { FlatLayout } from "./FlatLayout";

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
  groupRowHeightsRef: React.RefObject<number[]>;
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
  onOpenAddSheet: () => void;
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
  groupRowHeightsRef,
  handleGroupDragPointerDown,
  expandedGroupIDs,
  toggleGroup,
  onRenameCategory,
  onDeleteCategory,
  onRenameGroup,
  onDeleteGroup,
  onAssignGroup,
  onOpenAddSheet,
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
        <>
          <div ref={catContainerRef}>
            {/* Group sections */}
            <div ref={groupsContainerRef} className="flex flex-col gap-2">
              {(() => {
                const orderedGroups = groupDragState
                  ? groupDragState.liveOrder.map(id => groups.find(g => g.id === id)!).filter(Boolean)
                  : groups;
                const draggingGroupID = groupDragState
                  ? groups[groupDragState.idx]?.id
                  : null;

                return orderedGroups.map((group, groupVisualIdx) => {
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
                      const draggedOrigIdx = groupDragState.originalOrder.indexOf(draggingGroupID ?? "");
                      if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
                        const dir = liveIdx > origIdx ? -1 : 1;
                        const h = (groupRowHeightsRef.current ?? [])[draggedOrigIdx] ?? groupDragState.rowHeight;
                        groupTranslateY = dir * (h + 8);
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
                      onRenameCategory={onRenameCategory}
                      onDeleteCategory={onDeleteCategory}
                      onRenameGroup={onRenameGroup}
                      onDeleteGroup={onDeleteGroup}
                    />
                  );
                });
              })()}
            </div>

            {/* No Group section */}
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
        </>
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
      <div className="pt-1">
        <div className="border-t mb-3" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.1 }} />
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] active:opacity-80"
          style={{
            color: "var(--color-brand-green)",
            backgroundColor: "rgba(var(--color-brand-green-rgb), 0.10)",
            touchAction: "manipulation",
          }}
          onClick={onOpenAddSheet}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Category or Group
        </button>
      </div>
    </SettingsCard>
  );
}
