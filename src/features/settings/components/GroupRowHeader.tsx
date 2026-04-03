// src/features/settings/components/GroupRowHeader.tsx
// Header row for a collapsible group: drag handle, chevron, name, badge, actions.

import type { JSX } from "react";
import type { CategoryGroup } from "@/models/types";

// MARK: - Props

/** Props for the {@link GroupRowHeader} component. */
interface GroupRowHeaderProps {
  /** The group to render the header for. */
  group: CategoryGroup;
  /** The visual index of this group in the list (for drag). */
  groupVisualIdx: number;
  /** Whether this group's category sub-list is expanded. */
  isExpanded: boolean;
  /** Number of categories in this group. */
  categoryCount: number;
  /** Called when the drag handle receives a pointer-down event. */
  onDragPointerDown: (e: React.PointerEvent, idx: number) => void;
  /** Toggles expand/collapse for this group. */
  onToggle: (groupID: string) => void;
  /** Called to open the rename dialog for this group. */
  onRename: (id: string, name: string) => void;
  /** Called to open the delete dialog for this group. */
  onDelete: (id: string, name: string) => void;
}

// MARK: - Component

/** The header bar for a group row: drag handle, chevron, name, badge, rename/delete. */
export function GroupRowHeader({
  group,
  groupVisualIdx,
  isExpanded,
  categoryCount,
  onDragPointerDown,
  onToggle,
  onRename,
  onDelete,
}: GroupRowHeaderProps): JSX.Element {
  return (
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
          onDragPointerDown(e, groupVisualIdx);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ color: "var(--color-brand-teal)", opacity: 0.55 }}>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </div>

      {/* Group name */}
      <button
        className="flex-1 text-left text-sm font-semibold tracking-[-0.01em] py-0.5"
        style={{ color: "var(--color-text-primary)", touchAction: "manipulation" }}
        onClick={() => onToggle(group.id)}
      >
        {group.name}
      </button>

      {/* Chevron */}
      <button
        className="flex items-center justify-center p-1 -m-1 shrink-0 rounded-md transition-all active:opacity-50"
        style={{ touchAction: "manipulation" }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(group.id);
        }}
        aria-label={isExpanded ? `Collapse ${group.name}` : `Expand ${group.name}`}
        aria-expanded={isExpanded}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{
            color: "var(--color-brand-teal)",
            opacity: 0.75,
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 200ms ease-out",
          }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Category count badge */}
      {categoryCount > 0 && (
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: "rgba(var(--color-brand-teal-rgb), 0.14)",
            color: "var(--color-brand-teal)",
          }}>
          {categoryCount}
        </span>
      )}

      {/* Rename */}
      <button
        className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
        style={{ opacity: 0.55 }}
        onClick={(e) => {
          e.stopPropagation();
          onRename(group.id, group.name);
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
          onDelete(group.id, group.name);
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
}
