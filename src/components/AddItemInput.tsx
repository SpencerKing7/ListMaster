// src/components/AddItemInput.tsx
// Inline input row for adding new checklist items.

import { useState, useRef, useEffect, type JSX } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";

interface AddItemInputProps {
  isVisible: boolean;
  onDismiss: () => void;
}

/** Inline input row for adding new items. Lives inside the scrollable list
 *  so the iOS keyboard scrolls it into view naturally — no position:fixed hacks. */
export function AddItemInput({ isVisible, onDismiss }: AddItemInputProps): JSX.Element | null {
  const store = useCategoriesStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedName = newItemName.trim();

  // Auto-focus when becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  function addItem(): void {
    if (!trimmedName || !store.selectedCategory) return;
    store.addItemToSelectedCategory(trimmedName);
    setNewItemName("");
    HapticService.light();
    // Blur then refocus so iOS resets the keyboard shift state (auto-capitalize)
    inputRef.current?.blur();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className="px-1">
      <div
        className="flex items-center h-12 rounded-[16px] px-4 gap-2"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <input
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
          className="flex-1 bg-transparent font-medium outline-none placeholder:opacity-40"
          style={{
            color: "var(--color-text-primary)",
            caretColor: "var(--color-brand-green)",
            fontSize: "var(--text-size-base)",
          }}
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          className="press-scale shrink-0 p-1 rounded-lg transition-all disabled:opacity-25"
          style={{ color: "var(--color-brand-green)" }}
          disabled={trimmedName.length === 0}
          onClick={addItem}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className="press-scale shrink-0 p-1 rounded-lg transition-all"
          style={{ color: "var(--color-text-secondary)" }}
          onClick={onDismiss}
          aria-label="Close add item"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
