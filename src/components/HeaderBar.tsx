// src/components/HeaderBar.tsx
import { useState } from "react";
import type { JSX } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { CategoryPicker } from "./CategoryPicker";
import { GroupTabBar } from "./GroupTabBar";

interface HeaderBarProps {
  onOpenSettings: () => void;
  scrolled?: boolean;
  onRefresh?: () => void;
}

/** Top header bar — greeting, settings button, optional refresh, group tabs, and category picker. */
export function HeaderBar({ onOpenSettings, scrolled = false, onRefresh }: HeaderBarProps): JSX.Element {
  const { userName } = useSettingsStore();
  const { hasGroups, groups, selectedGroupID, selectGroup } = useCategoriesStore();
  const trimmedName = userName.trim();
  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      onRefresh?.();
    }, 800);
  }

  return (
    <header
      className="sticky top-0 z-10 px-4 pt-2 pb-2"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
        background:
          "linear-gradient(to top, transparent 0%, var(--color-surface-chrome, var(--color-surface-background)) 35%, var(--color-surface-chrome, var(--color-surface-background)) 100%)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {trimmedName.length > 0 && (
          <p
            className={`font-bold flex-1 min-w-0 truncate transition-all duration-220 ease-out ${scrolled ? "text-sm opacity-60" : "text-2xl"
              }`}
            style={{
              color: "var(--color-text-primary)",
              letterSpacing: scrolled ? "0" : "-0.01em",
              transform: scrolled ? "scale(0.75) translateX(-8%)" : "scale(1)",
              transformOrigin: "left center",
            }}
          >
            Welcome,{" "}
            <span style={{ color: "var(--color-brand-green)" }}>{trimmedName}</span>
          </p>
        )}
        {trimmedName.length === 0 && <div className="flex-1" />}
        <button
          onClick={handleRefresh}
          className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center press-scale"
          style={{
            touchAction: "manipulation",
            backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 0.3s ease-out",
              animation: isRefreshing ? "spin 0.7s linear infinite" : "none",
            }}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
        <button
          onClick={onOpenSettings}
          className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center press-scale"
          style={{
            touchAction: "manipulation",
            backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="var(--color-brand-teal)"
            stroke="none"
          >
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
          </svg>
        </button>
      </div>
      {hasGroups && (
        <GroupTabBar
          groups={groups}
          selectedGroupID={selectedGroupID}
          onSelectGroup={selectGroup}
        />
      )}
      <CategoryPicker />
    </header>
  );
};


