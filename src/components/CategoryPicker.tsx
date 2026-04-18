// src/components/CategoryPicker.tsx
import { useEffect } from "react";
import type { JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { usePickerScroll } from "@/store/usePickerScroll";
import { HapticService } from "@/services/hapticService";

/** Horizontally scrollable pill row for selecting a category. Supports drag-to-scroll on touch and arrow buttons on desktop. */
export function CategoryPicker(): JSX.Element {
  const { pickerCategories, selectedCategoryID, selectCategory } =
    useCategoriesStore();
  const {
    scrollRef,
    hasDraggedRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePickerScroll();

  // Scroll selected pill into view when selection changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const selectedEl = container.querySelector(
      `[data-category-id="${selectedCategoryID}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedCategoryID, scrollRef]);

  return (
    <>
      <p
        className="px-2 pb-1 text-[10px] font-medium tracking-wide uppercase"
        style={{
          color: "var(--color-text-secondary)",
          opacity: pickerCategories.some((p) => p.isUngrouped) ? 0.55 : 0,
          visibility: pickerCategories.some((p) => p.isUngrouped) ? "visible" : "hidden",
        }}
        aria-hidden="true"
      >
        Ungrouped
      </p>
      <div
        className="rounded-full px-1 py-1 w-full"
        style={{
          background: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
        }}
      >
        {pickerCategories.length === 0 ? (
          <div className="flex items-center justify-center py-2 px-4">
            <p className="text-xs font-medium text-center" style={{ color: "var(--color-text-secondary)" }}>
              No lists in this group yet
            </p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="overflow-x-auto cursor-grab active:cursor-grabbing w-full"
            style={{ scrollbarWidth: "none", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="flex gap-1 w-full">
              {pickerCategories.map(({ category, isUngrouped }, index) => {
                const isSelected = category.id === selectedCategoryID;
                const showSeparator =
                  !isUngrouped &&
                  index > 0 &&
                  pickerCategories[index - 1].isUngrouped;
                return (
                  <div key={category.id} className="flex-1 flex items-center gap-1">
                    {showSeparator && (
                      <div
                        className="self-stretch w-px mx-0.5 rounded-full"
                        style={{ background: `rgba(var(--color-brand-deep-green-rgb), 0.20)` }}
                      />
                    )}
                    <button
                      data-category-id={category.id}
                      onPointerDown={(e) => {
                        // Release implicit pointer capture so the scroll container
                        // can take over capture when a drag threshold is crossed.
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }}
                      onClick={() => {
                        if (!hasDraggedRef.current) {
                          selectCategory(category.id);
                          HapticService.selection();
                        }
                      }}
                      className={`flex-1 min-w-max rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.97] ${isSelected ? "shadow-sm" : ""}`}
                      style={
                        isSelected
                          ? {
                            backgroundColor: "var(--color-surface-card)",
                            color: "var(--color-brand-green)",
                            fontWeight: 700,
                            opacity: isUngrouped ? 0.65 : 1,
                            boxShadow: "0 2px 8px rgba(var(--color-brand-deep-green-rgb), 0.16), 0 1px 2px rgba(var(--color-brand-deep-green-rgb), 0.10)",
                            transition: "background-color var(--duration-element) var(--ease-decelerate), box-shadow var(--duration-element) var(--ease-decelerate), color var(--duration-element) var(--ease-decelerate)",
                          }
                          : {
                            backgroundColor: "transparent",
                            color: "var(--color-text-secondary)",
                            opacity: isUngrouped ? 0.55 : 1,
                            fontStyle: isUngrouped ? "italic" : "normal",
                            transition: "background-color var(--duration-element) var(--ease-decelerate), box-shadow var(--duration-element) var(--ease-decelerate), color var(--duration-element) var(--ease-decelerate)",
                          }
                      }
                    >
                      {category.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};


