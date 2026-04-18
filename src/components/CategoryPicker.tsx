// src/components/CategoryPicker.tsx
import { useEffect, useMemo } from "react";
import type { JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { usePickerScroll } from "@/store/usePickerScroll";
import { HapticService } from "@/services/hapticService";

/** Horizontally scrollable pill row for selecting a category. Supports drag-to-scroll on touch and arrow buttons on desktop. */
export function CategoryPicker(): JSX.Element {
  const { pickerCategories, selectedCategoryID, selectCategory, groups, selectedGroupID } =
    useCategoriesStore();
  const {
    scrollRef,
    hasDraggedRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePickerScroll();

  /** Map of groupID → group name for fast label lookup. */
  const groupNameMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups],
  );

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

  /** True when we are in the "All" view and groups exist — enables section labels. */
  const isAllView = selectedGroupID === null && groups.length > 0;

  return (
    <>
      {pickerCategories.length === 0 ? (
        <div
          className="rounded-full px-1 py-1 w-full flex items-center justify-center"
          style={{ background: `rgba(var(--color-brand-deep-green-rgb), 0.12)` }}
        >
          <p className="text-xs font-medium text-center py-2 px-4" style={{ color: "var(--color-text-secondary)" }}>
            No lists in this group yet
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-x-auto cursor-grab active:cursor-grabbing w-full"
          style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/*
            Layout strategy: labels are absolutely positioned above each pill,
            so they inherit the pill's width automatically. The pill bar uses a
            single rounded-full background wrapper for visual cohesion.
            margin-top on the wrapper reserves space for labels in isAllView.
          */}
          <div
            className="rounded-full px-1 py-1 flex items-center gap-1 min-w-max"
            style={{
              background: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
              marginTop: isAllView ? 18 : 0,
              position: "relative",
            }}
          >
            {(() => {
              const items: JSX.Element[] = [];
              pickerCategories.forEach(({ category, isUngrouped }, index) => {
                const prevGroupID =
                  index > 0
                    ? pickerCategories[index - 1].category.groupID
                    : "__none__";
                const currGroupID = category.groupID;
                const isFirstOfSection =
                  isAllView && (index === 0 || prevGroupID !== currGroupID);
                const isSelected = category.id === selectedCategoryID;

                // Section divider between groups
                if (isAllView && isFirstOfSection && index > 0) {
                  items.push(
                    <div
                      key={`div-${category.id}`}
                      className="self-stretch w-px rounded-full shrink-0 my-1"
                      style={{
                        background: `rgba(var(--color-brand-deep-green-rgb), 0.22)`,
                      }}
                    />,
                  );
                }

                items.push(
                  <div key={category.id} style={{ position: "relative" }}>
                    {/* Section label — floats above pill bar */}
                    {isAllView && isFirstOfSection && (
                      <span
                        className="text-[8px] font-semibold uppercase tracking-widest whitespace-nowrap leading-none text-center w-full"
                        style={{
                          color: "var(--color-text-secondary)",
                          opacity: 0.45,
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          right: 0,
                          paddingBottom: 3,
                        }}
                        aria-hidden="true"
                      >
                        {isUngrouped ? "No Group" : (groupNameMap.get(currGroupID ?? "") ?? "")}
                      </span>
                    )}

                    {/* Pill button */}
                    <button
                      data-category-id={category.id}
                      onPointerDown={(e) => {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }}
                      onClick={() => {
                        if (!hasDraggedRef.current) {
                          selectCategory(category.id);
                          HapticService.selection();
                        }
                      }}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.97] touch-manipulation ${isSelected ? "shadow-sm" : ""}`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: "var(--color-surface-card)",
                              color: "var(--color-brand-green)",
                              fontWeight: 700,
                              opacity: isUngrouped ? 0.65 : 1,
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
                              transition:
                                "background-color var(--duration-element) var(--ease-decelerate), box-shadow var(--duration-element) var(--ease-decelerate), color var(--duration-element) var(--ease-decelerate)",
                            }
                      }
                    >
                      {category.name}
                    </button>
                  </div>,
                );
              });
              return items;
            })()}
          </div>
        </div>
      )}
    </>
  );
}