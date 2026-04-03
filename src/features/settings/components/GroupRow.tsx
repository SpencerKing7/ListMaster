// src/features/settings/components/GroupRow.tsx
// A single collapsible group header with its nested category sub-list.

import type { JSX } from "react";
import type { Category, CategoryGroup } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import { CategoryRow } from "./CategoryRow";

/** Compute the cumulative Y offset of a slot in the live order. */
function computeCatLiveOffset(ds: CatDragState, liveIdx: number): number {
  let offset = 0;
  for (let i = 0; i < liveIdx; i++) {
    const origI = ds.originalOrder.indexOf(ds.liveOrder[i]);
    offset += (ds.heights[origI] ?? ds.rowHeight) + ds.gap;
  }
  return offset;
}

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
      {/* Group header */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 select-none"
        style={{ backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.12)" }}
      >
        {/* Drag handle */}
        <div
          className="touch-none cursor-grab active:cursor-grabbing p-1 -m-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleGroupDragPointerDown(e, groupVisualIdx);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ color: "var(--color-brand-teal)", opacity: 0.55 }}>
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </div>

        {/* Chevron */}
        <button
          className="flex items-center justify-center p-1 -m-1 shrink-0 rounded-md transition-all active:opacity-50"
          style={{ touchAction: "manipulation" }}
          onClick={(e) => {
            e.stopPropagation();
            toggleGroup(group.id);
          }}
          aria-label={isExpanded ? `Collapse ${group.name}` : `Expand ${group.name}`}
          aria-expanded={isExpanded}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{
              color: "var(--color-brand-teal)",
              opacity: 0.75,
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 200ms ease-out",
            }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Group name */}
        <button
          className="flex-1 text-left text-sm font-semibold tracking-[-0.01em] py-0.5"
          style={{ color: "var(--color-text-primary)", touchAction: "manipulation" }}
          onClick={() => toggleGroup(group.id)}
        >
          {group.name}
        </button>

        {/* Category count badge */}
        {groupCategories.length > 0 && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(var(--color-brand-teal-rgb), 0.14)",
              color: "var(--color-brand-teal)",
            }}>
            {groupCategories.length}
          </span>
        )}

        {/* Rename */}
        <button
          className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
          style={{ opacity: 0.55 }}
          onClick={(e) => {
            e.stopPropagation();
            onRenameGroup(group.id, group.name);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>

        {/* Delete */}
        <button
          className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
          style={{ opacity: 0.55 }}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteGroup(group.id, group.name);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Collapsible category sub-list */}
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
            {(() => {
              const scopedDS = catDragState?.groupID === group.id ? catDragState : null;
              const draggingCatID = scopedDS
                ? categories[scopedDS.flatIdx]?.id
                : null;

              // Always render in original DOM order; visual reorder is
              // driven entirely by translateY for smooth animation.
              return groupCategories.map((category, visualIdx) => {
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
                    groupID={group.id}
                    isDragging={isDragging}
                    catTranslateY={catTranslateY}
                    canDelete={canDeleteCategories}
                    variant="grouped"
                    handleDragPointerDown={handleDragPointerDown}
                    onRename={onRenameCategory}
                    onDelete={onDeleteCategory}
                  />
                );
              });
            })()}
            {groupCategories.length === 0 && (
              <p className="text-xs py-2 pl-1" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
                No categories yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
