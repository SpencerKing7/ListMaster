// src/components/AddItemInput.tsx
// Minimal always-visible input row for adding new checklist items.

import { useState, useRef, useEffect, type JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";

interface AddItemInputProps {
  /** When true, focuses the input on mount (e.g. after transitioning from empty state). */
  focusOnMount?: boolean;
}

/** Compact, always-visible input row for adding new items. Sits above the list
 *  with a ghost style so it doesn't dominate the screen. */
export function AddItemInput({ focusOnMount = false }: AddItemInputProps): JSX.Element {
  const store = useCategoriesStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusOnMount) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trimmedName = newItemName.trim();

  function addItem(): void {
    if (!trimmedName || !store.selectedCategory) return;
    store.addItemToSelectedCategory(trimmedName);
    setNewItemName("");
    HapticService.light();
    // Reset caret position so iOS recalculates shift state without keyboard dismissal
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, 0);
    });
  }

  return (
    <div className="px-1">
      <div
        className="flex items-center h-9 rounded-xl px-3 gap-1.5"
        style={{
          backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.07)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Dim plus icon — always visible as a hint */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-brand-green)", opacity: 0.5, flexShrink: 0 }}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>

        <input
          ref={inputRef}
          placeholder="Add an item…"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="flex-1 bg-transparent outline-none placeholder:opacity-35"
          style={{
            color: "var(--color-text-primary)",
            caretColor: "var(--color-brand-green)",
            fontSize: "var(--text-size-base)",
            fontWeight: 500,
          }}
          enterKeyHint="send"
          autoCapitalize="sentences"
          spellCheck={false}
        />

        {/* Submit button — only appears when there is text */}
        {trimmedName.length > 0 && (
          <button
            className="press-scale shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-brand-green)",
              touchAction: "manipulation",
            }}
            onClick={addItem}
            aria-label="Add item"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
