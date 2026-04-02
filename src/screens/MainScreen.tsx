// src/screens/MainScreen.tsx
import { useState, useCallback, useEffect } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import HeaderBar from "@/components/HeaderBar";
import BottomBar from "@/components/BottomBar";
import CategoryPanel from "@/components/CategoryPanel";
import SettingsSheet from "./SettingsSheet";

export default function MainScreen() {
  const store = useCategoriesStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Reset scroll position on mount — clears any residual scroll offset left
  // from a previous screen (e.g. onboarding with keyboard open).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
      <div className="relative h-dvh flex flex-col overflow-hidden">

        <HeaderBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          scrolled={scrolled}
          onRefresh={() => window.location.reload()}
        />

        {/* Content area with single panel */}
        <div
          className="flex-1 overflow-hidden relative flex flex-col min-h-0"
          onScroll={handleScrollWithPosition}
        >
          <CategoryPanel category={store.selectedCategory} />
        </div>

        <BottomBar />

        <SettingsSheet
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </>
  );
}
