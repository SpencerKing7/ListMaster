// src/components/BottomBar.tsx
import { useState } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import ActionSheet from "@/components/ui/action-sheet";
import { HapticService } from "@/services/hapticService";

/** Bottom bar — shows chevron navigation and clear-checked button when checked items exist. */
const BottomBar = () => {
  const store = useCategoriesStore();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const checkedCount =
    store.selectedCategory?.items.filter((item) => item.isChecked).length ?? 0;
  const hasCheckedItems = checkedCount > 0;

  return (
    <>
      <footer
        className="sticky bottom-0 z-10 px-4 pt-2"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, var(--color-surface-background) 100%)",
        }}
      >
        {/* ── Chevron navigation row ── */}
        <div className="flex items-center justify-between mb-2">
          {/* Previous category chevron */}
          <button
            className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              color: store.canSelectPreviousCategory
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
              opacity: store.canSelectPreviousCategory ? 1 : 0.3,
              backgroundColor: store.canSelectPreviousCategory
                ? "rgba(var(--color-brand-deep-green-rgb), 0.10)"
                : "transparent",
              touchAction: "manipulation",
              transition:
                "opacity 200ms ease-out, background-color 200ms ease-out, color 200ms ease-out",
            }}
            disabled={!store.canSelectPreviousCategory}
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
            {store.previousCategory?.name ?? ""}
          </button>

          {/* Next category chevron */}
          <button
            className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              color: store.canSelectNextCategory
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
              opacity: store.canSelectNextCategory ? 1 : 0.3,
              backgroundColor: store.canSelectNextCategory
                ? "rgba(var(--color-brand-deep-green-rgb), 0.10)"
                : "transparent",
              touchAction: "manipulation",
              transition:
                "opacity 200ms ease-out, background-color 200ms ease-out, color 200ms ease-out",
            }}
            disabled={!store.canSelectNextCategory}
            onClick={() => {
              store.selectNextCategory();
              HapticService.selection();
            }}
            aria-label="Next list"
          >
            {store.nextCategory?.name ?? ""}
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
        </div>

        {/* ── Clear checked button (conditional) ── */}
        {hasCheckedItems && (
          <button
            className="press-scale w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{
              color: "var(--color-danger)",
              backgroundColor: "rgba(212, 75, 74, 0.10)",
              boxShadow: "0 1px 4px rgba(212,75,74,0.12)",
            }}
            onClick={() => {
              setIsActionSheetOpen(true);
              HapticService.light();
            }}
          >
            <svg
              width="16"
              height="16"
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
            Clear {checkedCount} Checked {checkedCount === 1 ? "Item" : "Items"}
          </button>
        )}
      </footer>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="Clear Checked Items?"
        message="This will remove all checked items from this list."
        actions={[
          {
            label: "Clear",
            onClick: () => {
              store.clearCheckedItemsInSelectedCategory();
              HapticService.medium();
            },
            destructive: true,
          },
        ]}
      />
    </>
  );
};

export default BottomBar;
