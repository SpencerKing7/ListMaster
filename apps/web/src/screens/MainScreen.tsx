// src/screens/MainScreen.tsx — Primary route: category picker, checklist panel, and tab bar.
import { useState, useCallback, useEffect, useRef } from "react";
import type { JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HeaderBar } from "@/components/HeaderBar";
import { BottomBar } from "@/components/BottomBar";
import { CategoryPanel } from "@/components/CategoryPanel";
import { SettingsSheet } from "./SettingsSheet";
import { InstallToast } from "@/components/InstallToast";
import { InstallSheet } from "@/components/InstallSheet";
import { useKeyboardShortcuts } from "@/store/useKeyboardShortcuts";

/** Primary app screen — header, category picker, checklist panel, bottom bar, and overlays. */
export function MainScreen(): JSX.Element {
  const store = useCategoriesStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isInstallSheetOpen, setIsInstallSheetOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts(addInputRef, isSettingsOpen, useCallback(() => setIsSettingsOpen(false), []));

  // Reset scroll position on mount and prevent iOS Safari from scrolling the
  // page when the keyboard opens (visualViewport.offsetTop drifts otherwise).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const vv = window.visualViewport;
    if (!vv) return;
    function lockScroll(): void {
      window.scrollTo(0, 0);
    }
    vv.addEventListener("scroll", lockScroll);
    return () => vv.removeEventListener("scroll", lockScroll);
  }, []);

  // Dismiss keyboard on scroll
  const handleScroll = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  }, []);

  // Track scroll position for header animation
  const handleScrollWithPosition = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleScroll();
    const scrollTop = (e.target as HTMLElement).scrollTop;
    setScrolled(scrollTop > 20);
  }, [handleScroll]);

  // Dismiss keyboard when tapping a non-interactive area
  const handleContentPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    const isInteractive =
      tag === "input" ||
      tag === "textarea" ||
      tag === "button" ||
      tag === "select" ||
      target.closest("button, input, textarea, select, [role='button']") !== null;
    if (!isInteractive) {
      const active = document.activeElement as HTMLElement | null;
      active?.blur();
    }
  }, []);

  return (
    <>
      {/* Background layers — outside the overflow-hidden layout box */}
      <div
        className="fixed -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--color-surface-background)",
        }}
      />
      <div
        className="fixed -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          background: "var(--gradient-brand-wide)",
        }}
      />

      {/* App layout — clipped to safe area */}
      <div className="flex flex-col overflow-hidden" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>

        <HeaderBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          scrolled={scrolled}
          onRefresh={() => window.location.reload()}
        />

        {/* Content area with single panel */}
        <div
          className="flex-1 overflow-hidden relative flex flex-col min-h-0"
          onScroll={handleScrollWithPosition}
          onPointerDown={handleContentPointerDown}
        >
          <CategoryPanel
            category={store.selectedCategory}
            scrollContainerRef={scrollContainerRef}
            addInputRef={addInputRef}
          />
        </div>

        <BottomBar />

        <SettingsSheet
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />

        <InstallToast
          onOpenInstallSheet={() => setIsInstallSheetOpen(true)}
          isSuppressed={isSettingsOpen || isInstallSheetOpen}
        />
        <InstallSheet
          isOpen={isInstallSheetOpen}
          onOpenChange={setIsInstallSheetOpen}
        />
      </div>
    </>
  );
}
