// src/features/settings/components/UngroupedSection.tsx
// Renders ungrouped categories below the group sections, with an "Assign" chip.

import type { JSX } from "react";
import type { Category } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import { computeCatLiveOffset } from "@/features/settings/utils/dragUtils";

/** Props for the ungrouped-categories section. */
export interface UngroupedSectionProps {
  categories: Category[];
  catDragState: CatDragState | null;
  canDeleteCategories: boolean;
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string, name: string) => void;
  onAssignGroup: (categoryId: string, categoryName: string) => void;
}

// MARK: - Component

/** Renders ungrouped categories with drag handles, rename/delete, and an "Assign" chip. */
export function UngroupedSection({
  categories,
  catDragState,
  canDeleteCategories,
  handleDragPointerDown,
  onRenameCategory,
  onDeleteCategory,
  onAssignGroup,
}: UngroupedSectionProps): JSX.Element | null {
  const ungrouped = categories.filter(c => !c.groupID);
  if (ungrouped.length === 0) return null;

  const scopedDS = catDragState?.groupID === null ? catDragState : null;
  const draggingCatID = scopedDS ? categories[scopedDS.flatIdx]?.id : null;

  // Always render in original DOM order; visual reorder is driven
  // entirely by translateY for smooth animation.

  return (
    <div className="mt-2">
      {/* Divider */}
      <div className="flex items-center gap-2 mb-2">
        <hr className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest px-1"
          style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>
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
            <div
              key={category.id}
              data-cat-idx={flatIdx}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: isDragging
                  ? "var(--color-surface-card)"
                  : "rgba(var(--color-brand-deep-green-rgb), 0.07)",
                transform: `translateY(${catTranslateY}px)`,
                transition: isDragging
                  ? "box-shadow 120ms ease"
                  : "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
                boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.18)" : undefined,
                zIndex: isDragging ? 10 : undefined,
                position: "relative",
                scale: isDragging ? "1.02" : "1",
              }}
            >
              {/* Drag handle */}
              <div
                className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                onPointerDown={(e) => handleDragPointerDown(e, visualIdx, null)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ color: "var(--color-brand-teal)", opacity: 0.45 }}>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </div>

              <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {category.name}
              </span>

              {/* Assign chip */}
              <button
                className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all active:scale-[0.94]"
                style={{
                  backgroundColor: "rgba(var(--color-brand-teal-rgb), 0.12)",
                  color: "var(--color-brand-teal)",
                }}
                onClick={() => onAssignGroup(category.id, category.name)}
              >
                + Assign
              </button>

              <button
                className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
                style={{ opacity: 0.55 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameCategory(category.id, category.name);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>

              <button
                className="p-1.5 rounded-lg transition-all active:scale-[0.9] disabled:opacity-20"
                style={{ opacity: 0.55 }}
                disabled={!canDeleteCategories}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(category.id, category.name);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
