// src/components/CategoryPicker.tsx
import { useRef, useEffect, useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";

const CategoryPicker = () => {
  const { categories, selectedCategoryID, selectCategory } =
    useCategoriesStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Scroll selected pill into view when selection changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const selectedEl = container.querySelector(
      `[data-category-id="${selectedCategoryID}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedCategoryID]);

  // Drag-to-scroll handlers
  const hasDraggedRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = scrollRef.current;
      if (!container) return;
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      startXRef.current = e.clientX;
      scrollLeftRef.current = container.scrollLeft;
      container.style.cursor = "grabbing";
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const container = scrollRef.current;
      if (!container) return;
      const dx = e.clientX - startXRef.current;
      if (!hasDraggedRef.current && Math.abs(dx) > 5) {
        hasDraggedRef.current = true;
        container.setPointerCapture(e.pointerId);
      }
      if (hasDraggedRef.current) {
        container.scrollLeft = scrollLeftRef.current - dx;
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
      const container = scrollRef.current;
      if (!container) return;
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
      container.style.cursor = "grab";
    },
    []
  );

  return (
    <div
      className="rounded-full px-1 py-1 w-full"
      style={{
        background: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
      }}
    >
      <div
        ref={scrollRef}
        className="overflow-x-auto cursor-grab w-full"
        style={{ scrollbarWidth: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Each pill gets flex-1 so they fill the full width evenly.
            min-w-max prevents text from wrapping when the row is narrow. */}
        <div className="flex gap-1 w-full">
          {categories.map((category) => {
            const isSelected = category.id === selectedCategoryID;
            return (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => {
                  selectCategory(category.id);
                  HapticService.selection();
                }}
                className={`flex-1 min-w-max rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${isSelected
                    ? "shadow-sm"
                    : ""
                  }`}
                style={
                  isSelected
                    ? {
                      backgroundColor: "var(--color-surface-card)",
                      color: "var(--color-brand-green)",
                      fontWeight: 700,
                    }
                    : {
                      backgroundColor: "transparent",
                      color: "var(--color-text-secondary)",
                    }
                }
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryPicker;
