// src/components/CategoryPicker.tsx
import { useEffect } from "react";
import type { JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { usePickerScroll } from "@/store/usePickerScroll";
import { CategoryPickerPill } from "@/components/CategoryPickerPill";

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

  // Scroll selected pill into center whenever selection changes (tap or programmatic).
  // Uses container.scroll() instead of scrollIntoView to guarantee only
  // horizontal scrolling — scrollIntoView can scroll the page vertically on
  // desktop, causing the sticky header height to shift.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const selectedEl = container.querySelector(
      `[data-category-id="${selectedCategoryID}"]`,
    );
    if (!selectedEl) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = selectedEl.getBoundingClientRect();
    const targetScrollLeft =
      container.scrollLeft +
      elRect.left -
      containerRect.left -
      (containerRect.width - elRect.width) / 2;
    container.scroll({ left: targetScrollLeft, behavior: "smooth" });
  }, [selectedCategoryID, scrollRef]);

  /** True when we are in the "All" view and groups exist — enables section dividers. */
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
          style={{ marginTop: groups.length > 0 ? 8 : 0, position: "relative", overflow: "hidden" }}
        >
          {/* Rounded background shape — always visible at viewport edges regardless of scroll position */}
          <div
            className="rounded-full absolute pointer-events-none"
            style={{
              background: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
              top: 0,
              left: 0,
              right: 0,
              bottom: 6,
            }}
          />
          <div
            ref={scrollRef}
            className="overflow-x-scroll w-full picker-scroll"
            style={{ touchAction: "pan-x", position: "relative" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className="px-1 py-1 flex items-center gap-1 min-w-max w-full"
              style={{ position: "relative" }}
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
                        className="self-stretch rounded-full shrink-0 my-0.5"
                        style={{
                          width: 2,
                          background: `rgba(var(--color-brand-deep-green-rgb), 0.45)`,
                        }}
                      />,
                    );
                  }

                  items.push(
                    <CategoryPickerPill
                      key={category.id}
                      category={category}
                      isUngrouped={isUngrouped}
                      isSelected={isSelected}
                      hasDraggedRef={hasDraggedRef}
                      onSelect={(id) => {
                        selectCategory(id);
                      }}
                    />,
                  );
                });
                return items;
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
