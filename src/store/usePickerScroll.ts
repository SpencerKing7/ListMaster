// src/store/usePickerScroll.ts
// Scroll state and interaction handlers for the CategoryPicker scroll container.

import { useRef, useCallback } from "react";

// MARK: - Types

/** Return type for usePickerScroll. */
export interface UsePickerScrollReturn {
  /** Ref to attach to the scrollable container div. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the user has dragged far enough to suppress the next click. */
  hasDraggedRef: React.RefObject<boolean>;
  /** Pointer down handler. */
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Pointer move handler. */
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Pointer up / leave / cancel handler. */
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

// MARK: - Hook

/**
 * Manages drag-to-scroll for the CategoryPicker horizontal scroll container.
 *
 * Pill buttons must release their implicit pointer capture on pointerdown
 * (`e.currentTarget.releasePointerCapture(e.pointerId)`) so that this hook
 * can take over capture once the horizontal drag threshold (5px) is crossed.
 *
 * - Movement < 5px and quick release → no drag, click fires normally on pill.
 * - Movement ≥ 5px → drag mode, hasDraggedRef suppresses the pill's onClick.
 */
export function usePickerScroll(): UsePickerScrollReturn {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // Touch scrolling is handled natively via touch-action: pan-x.
      // Only intercept mouse pointer for drag-to-scroll.
      if (e.pointerType !== "mouse") return;
      const el = scrollRef.current;
      if (!el) return;
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      startXRef.current = e.clientX;
      scrollLeftStartRef.current = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const dx = e.clientX - startXRef.current;
      if (!hasDraggedRef.current && Math.abs(dx) > 5) {
        hasDraggedRef.current = true;
      }
      if (hasDraggedRef.current) {
        el.scrollLeft = scrollLeftStartRef.current - dx;
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDraggingRef.current = false;
      const el = scrollRef.current;
      if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 0);
    },
    [],
  );

  return {
    scrollRef,
    hasDraggedRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}