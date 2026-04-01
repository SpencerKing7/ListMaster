// src/components/BottomBar.tsx
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import ActionSheet from "@/components/ui/action-sheet";
import { HapticService } from "@/services/hapticService";

const BottomBar = () => {
  const store = useCategoriesStore();
  const [newItemName, setNewItemName] = useState("");
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedName = newItemName.trim();
  const hasCheckedItems =
    store.selectedCategory?.items.some((item) => item.isChecked) ?? false;

  // Keyboard-safe layout
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${offset}px`,
      );
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  function addItem() {
    if (!trimmedName || !store.selectedCategory) return;
    store.addItemToSelectedCategory(trimmedName);
    setNewItemName("");
    inputRef.current?.focus();
  }

  return (
    <>
      <footer
        className="sticky bottom-0 z-10 px-4 pt-3.5 pb-3"
        style={{
          paddingBottom: "calc(var(--keyboard-inset, 0px) + 12px)",
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 35%, var(--color-surface-background) 100%)",
        }}
      >
        <div className="flex flex-col gap-2.5">
          {/* Add item row */}
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              placeholder="Add an item"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              className="flex-1 h-10 rounded-full px-4 border-brand-green/20 bg-surface-card focus-visible:ring-brand-green"
            />
            <Button
              className="press-scale rounded-full h-10 px-5 text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--color-brand-green)" }}
              disabled={trimmedName.length === 0 || !store.selectedCategory}
              onClick={addItem}
            >
              Add
            </Button>
          </div>

          {/* Clear checked items button */}
          {hasCheckedItems && (
            <button
              className="p-2 rounded-full bg-surface-input press-scale"
              style={{ backgroundColor: "var(--color-surface-input)" }}
              onClick={() => {
                setIsActionSheetOpen(true);
                HapticService.light();
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
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
