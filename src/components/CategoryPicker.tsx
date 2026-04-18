// src/components/CategoryPicker.tsx
import { useEffect, useMemo, useRef } from "react";
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

  /**
   * When a pill is tapped, the resulting selectedCategoryID change should not
   * trigger scrollIntoView — the pill is already visible and the smooth scroll
   * fights the active touch momentum on iOS Safari. Set this ref true in the
   * pill onClick and clear it in the effect.
   */
  const skipNextScrollRef = useRef(false);

  /** Map of groupID → group name for fast label lookup. */
  const groupNameMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups],
  );

  // Scroll selected pill into view when selection changes programmatically
  // (e.g. arrow nav, auto-select). Skip when the user tapped a pill directly —
  // scrollIntoView would fight the active touch momentum on iOS Safari.
  useEffect(() => {
    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }
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

  /** True when at least one picker entry is grouped — suppresses the "No Group" label
   *  when every category is ungrouped (user created groups but assigned nothing yet). */
  const hasGroupedCategories = pickerCategories.some((p) => !p.isUngrouped);

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
          className="overflow-x-auto w-full picker-scroll"
          style={{ touchAction: "pan-x" }}
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
            className={`rounded-full px-1 py-1 flex items-center gap-1 min-w-max w-full`}
            style={{
              background: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
              marginTop: groups.length > 0 ? 24 : 0,
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
                  <div
                    key={category.id}
                    style={{ position: "relative" }}
                    className="flex-1 min-w-fit"
                  >
                    {/* Section label — floats above pill bar, left-aligned to group start */}
                    {(() => {
                      if (!isAllView || !isFirstOfSection) return null;
                      // Suppress "No Group" label when every category is ungrouped
                      // (user has groups but assigned nothing yet).
                      const labelText = isUngrouped
                        ? (hasGroupedCategories ? "No Group" : "")
                        : (groupNameMap.get(currGroupID ?? "") ?? "");
                      if (!labelText) return null;
                      return (
                        <span
                          className="text-[8px] font-semibold uppercase tracking-wider whitespace-nowrap leading-none"
                          style={{
                            color: "var(--color-text-secondary)",
                            opacity: 0.55,
                            position: "absolute",
                            bottom: "100%",
                            left: 0,
                            paddingBottom: 6,
                          }}
                          aria-hidden="true"
                        >
                          {labelText}
                        </span>
                      );
                    })()}

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