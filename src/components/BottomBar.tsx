// src/components/BottomBar.tsx
import type { JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";

interface BottomBarProps {
  isAddingItem: boolean;
  onToggleAddItem: () => void;
}

/** Bottom bar — shows chevron navigation, FAB for adding items, and clear-checked button when checked items exist. */
export function BottomBar({ isAddingItem, onToggleAddItem }: BottomBarProps): JSX.Element {
  const store = useCategoriesStore();

  const checkedCount =
    store.selectedCategory?.items.filter((item) => item.isChecked).length ?? 0;
  const hasCheckedItems = checkedCount > 0;

  return (
    <footer
      className="sticky bottom-0 z-10 px-4 pt-2"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        background:
          "linear-gradient(to bottom, transparent 0%, var(--color-surface-chrome, var(--color-surface-background)) 40%, var(--color-surface-chrome, var(--color-surface-background)) 100%)",
      }}
    >
      {/* ── Navigation row: 4-column grid ── */}
      <div className="grid mb-2" style={{ gridTemplateColumns: "auto auto auto auto" }}>
        {/* Left cell — previous chevron or empty */}
        <div className="flex items-center justify-start">
          {store.canSelectPreviousCategory && (
            <button
              className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                color: "var(--color-brand-green)",
                backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)",
                touchAction: "manipulation",
              }}
              onClick={() => {
                store.selectPreviousCategory();
                HapticService.selection();
              }}
              aria-label="Previous list"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="max-w-[100px] truncate">{store.previousCategory?.name ?? ""}</span>
            </button>
          )}
        </div>

        {/* FAB cell — always visible */}
        <div className="flex items-center justify-center">
          <button
            className={`press-scale w-9 h-9 rounded-full flex items-center justify-center ${isAddingItem ? "bg-opacity-100" : "bg-opacity-60"}`}
            style={{
              backgroundColor: isAddingItem
                ? "var(--color-brand-green)"
                : "rgba(var(--color-brand-deep-green-rgb), 0.10)",
              color: isAddingItem ? "white" : "var(--color-brand-green)",
              touchAction: "manipulation",
            }}
            onClick={() => {
              onToggleAddItem();
              HapticService.light();
            }}
            aria-label={isAddingItem ? "Close add item" : "Add item"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isAddingItem ? (
                <line x1="18" y1="6" x2="6" y2="18" />
              ) : (
                <line x1="12" y1="5" x2="12" y2="19" />
              )}
              {!isAddingItem && <line x1="5" y1="12" x2="19" y2="12" />}
            </svg>
          </button>
        </div>

        {/* Clear cell — only when checked items exist */}
        <div className="flex items-center justify-center">
          {hasCheckedItems && (
            <button
              className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                color: "var(--color-danger)",
                backgroundColor: "rgba(var(--color-danger-rgb), 0.12)",
                touchAction: "manipulation",
              }}
              onClick={() => {
                store.clearCheckedItemsInSelectedCategory();
                HapticService.medium();
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Clear {checkedCount}
            </button>
          )}
        </div>

        {/* Right cell — next chevron or empty */}
        <div className="flex items-center justify-end">
          {store.canSelectNextCategory && (
            <button
              className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                color: "var(--color-brand-green)",
                backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)",
                touchAction: "manipulation",
              }}
              onClick={() => {
                store.selectNextCategory();
                HapticService.selection();
              }}
              aria-label="Next list"
            >
              <span className="max-w-[100px] truncate">{store.nextCategory?.name ?? ""}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

