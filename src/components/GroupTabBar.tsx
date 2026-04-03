// src/components/GroupTabBar.tsx
import { useRef, useLayoutEffect, useCallback } from "react";

// MARK: - GroupTabBar

interface GroupTabBarProps {
  groups: { id: string; name: string; sortOrder: number }[];
  selectedGroupID: string | null;
  onSelectGroup: (id: string | null) => void;
}

/**
 * Horizontally-scrollable group tab bar. Displays an "All" tab first, followed
 * by user-defined groups. An underline indicator slides to the active tab using
 * spring easing. Drag-to-scroll is handled via Pointer Events with the same
 * setPointerCapture pattern as CategoryPicker.
 */
export default function GroupTabBar({
  groups,
  selectedGroupID,
  onSelectGroup,
}: GroupTabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const underlineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll refs — useRef for instant reads in click/pointerUp handlers
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);

  // All groups sorted by sortOrder
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Update underline position when selection or groups change
  useLayoutEffect(() => {
    const underline = underlineRef.current;
    const container = containerRef.current;
    if (!underline || !container) return;

    const activeIndex =
      selectedGroupID === null
        ? 0
        : sortedGroups.findIndex((g) => g.id === selectedGroupID) + 1;
    const activeButton = tabRefs.current[activeIndex];

    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    underline.style.left = `${buttonRect.left - containerRect.left + container.scrollLeft}px`;
    underline.style.width = `${buttonRect.width}px`;
  }, [selectedGroupID, sortedGroups]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    scrollLeftStartRef.current = container.scrollLeft;
    // setPointerCapture is deferred to PointerMove once drag intent is confirmed
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const dx = e.clientX - dragStartXRef.current;
    if (!hasDraggedRef.current && Math.abs(dx) > 5) {
      hasDraggedRef.current = true;
      container.setPointerCapture(e.pointerId);
    }
    if (hasDraggedRef.current) {
      container.scrollLeft = scrollLeftStartRef.current - dx;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    const container = containerRef.current;
    if (container?.hasPointerCapture(e.pointerId)) {
      container.releasePointerCapture(e.pointerId);
    }
    // Reset hasDraggedRef after click event has had a chance to fire
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 0);
  }, []);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Groups"
      className="relative overflow-x-auto pb-[3px] mb-3 mt-1"
      style={{
        scrollbarWidth: "none",
        touchAction: "pan-y",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex gap-1">
        {/* "All" tab */}
        <button
          ref={(el) => { tabRefs.current[0] = el; }}
          role="tab"
          className="px-3 py-1 text-sm whitespace-nowrap transition-all active:opacity-50 select-none"
          style={{
            fontWeight: selectedGroupID === null ? 600 : 500,
            color: selectedGroupID === null
              ? "var(--color-brand-green)"
              : "var(--color-text-secondary)",
            touchAction: "manipulation",
          }}
          onClick={() => {
            if (!hasDraggedRef.current) onSelectGroup(null);
          }}
          aria-pressed={selectedGroupID === null}
          aria-label="All lists"
        >
          All
        </button>

        {/* Group tabs */}
        {sortedGroups.map((group, index) => {
          const isSelected = selectedGroupID === group.id;
          return (
            <button
              key={group.id}
              ref={(el) => { tabRefs.current[index + 1] = el; }}
              role="tab"
              className="px-3 py-1 text-sm whitespace-nowrap transition-all active:opacity-50 select-none"
              style={{
                fontWeight: isSelected ? 600 : 500,
                color: isSelected
                  ? "var(--color-brand-green)"
                  : "var(--color-text-secondary)",
                touchAction: "manipulation",
              }}
              onClick={() => {
                if (!hasDraggedRef.current) onSelectGroup(group.id);
              }}
              aria-pressed={isSelected}
              aria-label={group.name}
            >
              {group.name}
            </button>
          );
        })}
      </div>

      {/* Sliding underline indicator — positioned with inline style using CSS vars */}
      <div
        ref={underlineRef}
        style={{
          position: "absolute",
          bottom: "3px",
          height: "2px",
          borderRadius: "1px",
          backgroundColor: "var(--color-brand-green)",
          left: "0px",
          width: "0px",
          transition:
            "left var(--duration-element) var(--spring-snap), width var(--duration-element) var(--spring-snap)",
        }}
      />
    </div>
  );
}