// src/features/settings/components/CategoryRow.tsx
// A single category row with drag handle, rename, and delete buttons.

import type { JSX } from "react";
import type { Category } from "@/models/types";

/** Props for a single settings category row. */
export interface CategoryRowProps {
  category: Category;
  flatIdx: number;
  visualIdx: number;
  groupID: string | null;
  isDragging: boolean;
  catTranslateY: number;
  canDelete: boolean;
  /** "grouped" rows use a compact layout, "flat" rows use `<li>` with a subtle bg. */
  variant: "grouped" | "flat";
  handleDragPointerDown: (e: React.PointerEvent, visualIdx: number, groupID?: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

// MARK: - Component

/** A single draggable category row inside the settings categories card. */
export function CategoryRow({
  category,
  flatIdx,
  visualIdx,
  groupID,
  isDragging,
  catTranslateY,
  canDelete,
  variant,
  handleDragPointerDown,
  onRename,
  onDelete,
}: CategoryRowProps): JSX.Element {
  const isFlat = variant === "flat";
  const Tag = isFlat ? "li" : "div";
  const sizeClass = isFlat ? "px-3 py-2.5 rounded-xl" : "px-2 py-2 rounded-lg";
  const iconSize = isFlat ? "14" : "13";

  return (
    <Tag
      data-cat-idx={flatIdx}
      className={`flex items-center gap-2.5 ${sizeClass}`}
      style={{
        backgroundColor: isDragging
          ? "var(--color-surface-card)"
          : isFlat ? "rgba(var(--color-brand-deep-green-rgb), 0.07)" : undefined,
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
        onPointerDown={(e) => handleDragPointerDown(e, visualIdx, groupID)}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ color: "var(--color-brand-teal)", opacity: isFlat ? 0.45 : 0.4 }}>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </div>

      <span className={`flex-1 text-sm ${isFlat ? "font-medium" : ""}`} style={{ color: "var(--color-text-primary)" }}>
        {category.name}
      </span>

      {/* Rename */}
      <button
        className={`${isFlat ? "p-1.5 rounded-lg" : "p-1.5 rounded-md"} transition-all active:scale-[0.9]`}
        style={{ opacity: isFlat ? 0.55 : 0.5 }}
        onClick={(e) => {
          e.stopPropagation();
          onRename(category.id, category.name);
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none"
          stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>

      {/* Delete */}
      <button
        className={`${isFlat ? "p-1.5 rounded-lg" : "p-1.5 rounded-md"} transition-all active:scale-[0.9] disabled:opacity-20`}
        style={{ opacity: isFlat ? 0.55 : 0.5 }}
        disabled={!canDelete}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(category.id, category.name);
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none"
          stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </Tag>
  );
}
