// src/components/BottomBar.tsx
import { useState } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import ActionSheet from "@/components/ui/action-sheet";
import { HapticService } from "@/services/hapticService";

/** Bottom bar — shows a clear-checked button when checked items exist. */
const BottomBar = () => {
  const store = useCategoriesStore();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const hasCheckedItems =
    store.selectedCategory?.items.some((item) => item.isChecked) ?? false;

  if (!hasCheckedItems) return null;

  return (
    <>
      <footer
        className="sticky bottom-0 z-10 px-4 pt-3 pb-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, var(--color-surface-background) 100%)",
        }}
      >
        <button
          className="press-scale w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.96] active:opacity-75"
          style={{
            color: "var(--color-danger)",
            backgroundColor: "rgba(212, 75, 74, 0.08)",
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
          Clear Checked Items
        </button>
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
