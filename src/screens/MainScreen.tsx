// src/screens/MainScreen.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import HeaderBar from "@/components/HeaderBar";
import BottomBar from "@/components/BottomBar";
import CategoryPanel from "@/components/CategoryPanel";
import PageIndicator from "@/components/PageIndicator";
import SettingsSheet from "./SettingsSheet";
import { HapticService } from "@/services/hapticService";

function performSlideTransition(
  swipeLeft: boolean,
  contentWidth: number,
  setIsAnimating: (v: boolean) => void,
  setDragOffset: (v: number) => void,
  isTransitioningRef: React.MutableRefObject<boolean>,
  store: ReturnType<typeof useCategoriesStore>,
  contentEl: HTMLDivElement | null,
) {
  isTransitioningRef.current = true;
  const target = swipeLeft ? -contentWidth : contentWidth;

  setIsAnimating(true);
  setDragOffset(target);

  if (!contentEl) return;

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    contentEl.removeEventListener("transitionend", onEnd);

    if (swipeLeft) {
      store.selectNextCategory();
    } else {
      store.selectPreviousCategory();
    }

    // All in one synchronous block — React 19 batches these into a single commit
    setIsAnimating(false);
    setDragOffset(0);
    isTransitioningRef.current = false;
  };

  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName === "transform") settle();
  };
  contentEl.addEventListener("transitionend", onEnd);

  // Safety fallback
  setTimeout(settle, 500);
}

export default function MainScreen() {
  const store = useCategoriesStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isTransitioningRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure content width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Dismiss keyboard on scroll
  const handleScroll = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  }, []);

  // Track scroll position for header animation
  const handleScrollWithPosition = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleScroll();
    const scrollTop = e.currentTarget.scrollTop;
    setScrolled(scrollTop > 20);
  }, [handleScroll]);

  // Swipe gesture handlers — touch and mouse, but only triggers on intentional horizontal drag
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore right-click, middle-click, etc.
      if (e.button !== 0) return;
      if (isTransitioningRef.current) return;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startTimeRef.current = Date.now();
      isDraggingRef.current = false;
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isTransitioningRef.current) return;
      // On mouse, only track movement while the primary button is held
      if (e.pointerType === "mouse" && e.buttons === 0) return;
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;

      // Determine if this is a horizontal swipe
      if (!isDraggingRef.current) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          isDraggingRef.current = true;
          // Capture pointer now that we've confirmed a drag
          contentRef.current?.setPointerCapture(e.pointerId);
        } else {
          return;
        }
      }

      // Apply rubber-band resistance at edges
      const hasNext = store.canSelectNextCategory;
      const hasPrevious = store.canSelectPreviousCategory;
      if ((dx < 0 && !hasNext) || (dx > 0 && !hasPrevious)) {
        setDragOffset(dx * 0.25);
      } else {
        setDragOffset(dx);
      }
    },
    [store.canSelectNextCategory, store.canSelectPreviousCategory]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isTransitioningRef.current) return;
      contentRef.current?.releasePointerCapture(e.pointerId);

      if (!isDraggingRef.current) {
        setDragOffset(0);
        return;
      }
      isDraggingRef.current = false;

      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      const dt = Date.now() - startTimeRef.current;
      const velocity = Math.abs(dx) / dt; // px/ms

      if (Math.abs(dx) <= Math.abs(dy) || (Math.abs(dx) <= 40 && velocity < 0.3)) {
        // Below threshold — snap back with error haptic
        setIsAnimating(true);
        setDragOffset(0);
        HapticService.error();
        setTimeout(() => setIsAnimating(false), 280);
        return;
      }

      const isSwipeLeft = dx < 0;
      const canSwipe = isSwipeLeft
        ? store.canSelectNextCategory
        : store.canSelectPreviousCategory;

      if (!canSwipe) {
        setIsAnimating(true);
        setDragOffset(0);
        setTimeout(() => setIsAnimating(false), 250);
        return;
      }

      performSlideTransition(isSwipeLeft, contentWidth, setIsAnimating, setDragOffset, isTransitioningRef, store, contentRef.current);
      HapticService.selection();
    },
    [contentWidth, store]
  );

  return (
    <div className="relative h-dvh flex flex-col overflow-hidden">
      {/* Base background */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "var(--color-surface-background)",
        }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--gradient-brand-wide)",
        }}
      />

      <HeaderBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        scrolled={scrolled}
        onRefresh={() => window.location.reload()}
      />

      {/* Content area with three-panel sliding layout */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onScroll={handleScrollWithPosition}
      >
        <div
          ref={contentRef}
          className="flex h-full touch-none"
          role="region"
          aria-label={`${store.selectedCategory?.name ?? "List"} — swipe left or right to switch categories`}
          style={{
            width: `${contentWidth * 3}px`,
            transform: `translate3d(${-contentWidth + dragOffset}px, 0, 0)`,
            willChange: "transform",
            transition: isAnimating
              ? "transform var(--duration-page) var(--spring-page)"
              : "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="flex flex-col h-full"
            style={{ width: `${contentWidth}px` }}
          >
            <CategoryPanel category={store.previousCategory} />
          </div>
          <div
            className="flex flex-col h-full"
            style={{ width: `${contentWidth}px` }}
          >
            <CategoryPanel category={store.selectedCategory} />
          </div>
          <div
            className="flex flex-col h-full"
            style={{ width: `${contentWidth}px` }}
          >
            <CategoryPanel category={store.nextCategory} />
          </div>
        </div>
      </div>

      {/* Page indicator dots */}
      {store.categories.length > 1 && (
        <PageIndicator
          count={store.categories.length}
          activeIndex={store.categories.findIndex((c) => c.id === store.selectedCategoryID)}
        />
      )}

      <BottomBar />

      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
