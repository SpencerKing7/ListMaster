// src/components/CategoryPickerPill.tsx
// A single pill for the CategoryPicker scroll row.
import type { JSX, RefObject } from "react";
import type { Category } from "@/models/types";
import { HapticService } from "@/services/hapticService";

/** Props for the {@link CategoryPickerPill} component. */
export interface CategoryPickerPillProps {
  /** The category this pill represents. */
  category: Category;
  /** Whether this category has no group in an "All" view. */
  isUngrouped: boolean;
  /** Whether this pill is the currently selected category. */
  isSelected: boolean;
  /**
   * Ref to the drag state tracker — prevents `selectCategory` from firing
   * on scroll-release when the user drags the picker instead of tapping.
   */
  hasDraggedRef: RefObject<boolean>;
  /** Called when the pill is tapped without a preceding drag. */
  onSelect: (id: string) => void;
}

/**
 * Renders a single category pill.
 * Used inside the {@link CategoryPicker} scroll row.
 */
export function CategoryPickerPill({
  category,
  isUngrouped,
  isSelected,
  hasDraggedRef,
  onSelect,
}: CategoryPickerPillProps): JSX.Element {
  return (
    <div className="flex-1 min-w-fit">
      <button
        data-category-id={category.id}
        onPointerDown={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onClick={() => {
          if (!hasDraggedRef.current) {
            onSelect(category.id);
            HapticService.selection();
          }
        }}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.97] w-full${isSelected ? " shadow-sm" : ""}`}
        style={
          isSelected
            ? {
              backgroundColor: "var(--color-surface-card)",
              color: "var(--color-brand-green)",
              fontWeight: 700,
              opacity: isUngrouped ? 0.65 : 1,
              touchAction: "pan-x",
              boxShadow:
                "0 2px 8px rgba(var(--color-brand-deep-green-rgb), 0.16), 0 1px 2px rgba(var(--color-brand-deep-green-rgb), 0.10)",
              transition:
                "background-color var(--duration-element) var(--ease-decelerate), box-shadow var(--duration-element) var(--ease-decelerate), color var(--duration-element) var(--ease-decelerate)",
            }
            : {
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              opacity: isUngrouped ? 0.55 : 1,
              fontStyle: isUngrouped ? "italic" : "normal",
              touchAction: "pan-x",
              transition:
                "background-color var(--duration-element) var(--ease-decelerate), box-shadow var(--duration-element) var(--ease-decelerate), color var(--duration-element) var(--ease-decelerate)",
            }
        }
      >
        {category.name}
      </button>
    </div>
  );
}
