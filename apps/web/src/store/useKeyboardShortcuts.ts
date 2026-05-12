// src/store/useKeyboardShortcuts.ts
// Global keyboard shortcut handler for MainScreen.

import { useEffect, type RefObject } from "react";
import { HapticService } from "@/services/hapticService";
import { useCategoriesStore } from "@/store/useCategoriesStore";

/** Returns true when a text-editable element is focused — shortcuts are suppressed. */
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * Registers global keyboard shortcuts for the MainScreen:
 * - `ArrowLeft` / `ArrowRight` — navigate to previous / next category
 * - `/` or `n` — focus the add-item input
 * - `Escape` — blur any focused input / dismiss open overlays
 *
 * All shortcuts are suppressed when an input or textarea is focused,
 * except Escape which always works.
 */
export function useKeyboardShortcuts(
  addInputRef: RefObject<HTMLInputElement | null>,
  isSettingsOpen: boolean,
  onCloseSettings: () => void,
): void {
  const store = useCategoriesStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      // Escape — always handled; blur input or close settings
      if (e.key === "Escape") {
        if (isInputFocused()) {
          (document.activeElement as HTMLElement).blur();
          return;
        }
        if (isSettingsOpen) {
          onCloseSettings();
        }
        return;
      }

      // All other shortcuts suppressed while typing
      if (isInputFocused()) return;

      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (store.canSelectPreviousCategory) {
          store.selectPreviousCategory();
          HapticService.selection();
        }
        return;
      }

      if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (store.canSelectNextCategory) {
          store.selectNextCategory();
          HapticService.selection();
        }
        return;
      }

      if (e.key === "/" || e.key === "n") {
        e.preventDefault();
        addInputRef.current?.focus();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store, addInputRef, isSettingsOpen, onCloseSettings]);
}
