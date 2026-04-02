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
          {/* Previous category chevron — hidden when at the first category */}
          {store.canSelectPreviousCategory ? (
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
              <span className="max-w-[120px] truncate">{store.previousCategory?.name ?? ""}</span>
            </button>
          ) : (
            <div />
          )}

          {/* Clear checked button — sits in the centre between the chevrons */}
          {hasCheckedItems && (
            <button
              className="press-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                color: "var(--color-danger)",
                backgroundColor: "rgba(212, 75, 74, 0.10)",
                touchAction: "manipulation",
              }}
              onClick={() => {
                setIsActionSheetOpen(true);
                HapticService.light();
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

          {/* Next category chevron — hidden when at the last category */}
          {store.canSelectNextCategory ? (
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
              <span className="max-w-[120px] truncate">{store.nextCategory?.name ?? ""}</span>
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
          ) : (
            <div />
          )}
        </div>
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
