// src/screens/SettingsSheet.tsx
import { useState, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputClass =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

const SettingsSheet = ({ isOpen, onOpenChange }: SettingsSheetProps) => {
  const store = useCategoriesStore();
  const settings = useSettingsStore();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToRename, setCategoryToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // ── Drag-to-reorder state ──
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragOffsetY = useRef(0);
  const dragNodeY = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRects = useRef<DOMRect[]>([]);

  const renameInputRef = useRef<HTMLInputElement>(null);
  const sheetFocusSentinelRef = useRef<HTMLDivElement>(null);
  const trimmedNewCategoryName = newCategoryName.trim();

  // ── Swipe-to-dismiss state ──
  const swipeDismissStartY = useRef(0);
  const swipeDismissStartTime = useRef(0);
  const [swipeTranslateY, setSwipeTranslateY] = useState(0);

  const handleDismissPointerDown = useCallback((e: React.PointerEvent) => {
    swipeDismissStartY.current = e.clientY;
    swipeDismissStartTime.current = Date.now();
    setSwipeTranslateY(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDismissPointerMove = useCallback((e: React.PointerEvent) => {
    const dy = e.clientY - swipeDismissStartY.current;
    if (dy > 0) setSwipeTranslateY(dy);
  }, []);

  const handleDismissPointerUp = useCallback((e: React.PointerEvent, onClose: () => void) => {
    const dy = e.clientY - swipeDismissStartY.current;
    const dt = Date.now() - swipeDismissStartTime.current;
    const velocity = dy / dt; // px/ms
    if (dy > 80 || velocity > 0.5) {
      onClose();
    }
    setSwipeTranslateY(0);
  }, []);

  // Snapshot all item rects when drag begins
  const snapshotRects = useCallback(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-cat-idx]");
    itemRects.current = Array.from(items).map((el) => el.getBoundingClientRect());
  }, []);

  // Determine which index the pointer is over
  const getDropIndex = useCallback((clientY: number) => {
    const rects = itemRects.current;
    for (let i = 0; i < rects.length; i++) {
      const mid = rects[i].top + rects[i].height / 2;
      if (clientY < mid) return i;
    }
    return rects.length - 1;
  }, []);

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      // Only primary button (touch or left-click)
      if (e.button !== 0) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      snapshotRects();
      const rect = itemRects.current[idx];
      dragOffsetY.current = e.clientY - rect.top;
      dragNodeY.current = e.clientY;
      setDragIndex(idx);
      setOverIndex(idx);
    },
    [snapshotRects],
  );

  const handleDragPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragIndex === null) return;
      dragNodeY.current = e.clientY;
      setOverIndex(getDropIndex(e.clientY));
    },
    [dragIndex, getDropIndex],
  );

  const handleDragPointerUp = useCallback(() => {
    if (dragIndex === null || overIndex === null) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    if (dragIndex !== overIndex) {
      store.moveCategories(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, store]);

  function addCategory() {
    if (!trimmedNewCategoryName) return;
    store.addCategory(trimmedNewCategoryName);
    setNewCategoryName("");
  }

  function handleRenameSave() {
    if (!categoryToRename) return;
    const trimmed = renameCategoryName.trim();
    if (!trimmed) return;
    store.renameCategory(categoryToRename.id, trimmed);
    setCategoryToRename(null);
    setRenameCategoryName("");
  }

  function handleReset() {
    store.resetCategories();
    settings.resetToNewUser();
    setIsResetDialogOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-2xl max-h-[90dvh] overflow-y-auto"
          initialFocus={sheetFocusSentinelRef}
          style={{
            backgroundColor: "var(--color-surface-background)",
            transform: `translateY(${swipeTranslateY}px)`,
            transition: swipeTranslateY === 0 ? "transform 0.3s ease-out" : "none",
          }}
        >
          {/* Focus sentinel — absorbs auto-focus on open so no button appears focused */}
          <div ref={sheetFocusSentinelRef} tabIndex={-1} className="sr-only" aria-hidden />
          {/* Drag indicator — also the swipe-to-dismiss grab target */}
          <div
            className="flex justify-center pt-2 pb-1 touch-none cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handleDismissPointerDown}
            onPointerMove={handleDismissPointerMove}
            onPointerUp={(e) => handleDismissPointerUp(e, () => onOpenChange(false))}
            onPointerCancel={(e) => handleDismissPointerUp(e, () => onOpenChange(false))}
          >
            <div
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: "var(--color-text-secondary)", opacity: 0.3 }}
            />
          </div>
          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between pr-4 pb-2">
            <SheetTitle
              className="text-2xl font-bold"
              style={{ color: "var(--color-brand-green)" }}
            >
              Settings
            </SheetTitle>
            <Button
              variant="ghost"
              className="font-semibold text-sm rounded-full px-4 hover:!bg-[color:var(--color-surface-input)] !border-[color:var(--color-brand-green)]/40 focus-visible:!border-[color:var(--color-brand-green)] focus-visible:!ring-[color:var(--color-brand-green)]/30"
              style={{ color: "var(--color-brand-green)" }}
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-10 pt-2">

            {/* Profile */}
            <SettingsCard>
              <SectionLabel>Name</SectionLabel>
              <Input
                value={settings.userName}
                onChange={(e) => settings.setUserName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
                style={{ color: "var(--color-text-primary)" }}
              />
            </SettingsCard>

            {/* Categories List */}
            <SettingsCard>
              <SectionLabel>Categories</SectionLabel>
              <ul
                ref={listRef}
                className="flex flex-col gap-1.5"
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                onPointerCancel={handleDragPointerUp}
              >
                {(() => {
                  // Compute visual order during drag
                  const cats = store.categories;
                  const indices = cats.map((_, i) => i);
                  if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
                    const [moved] = indices.splice(dragIndex, 1);
                    indices.splice(overIndex, 0, moved);
                  }
                  return indices.map((srcIdx) => {
                    const category = cats[srcIdx];
                    const isDragging = srcIdx === dragIndex;
                    return (
                      <li
                        key={category.id}
                        data-cat-idx={srcIdx}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-transform duration-150"
                        style={{
                          backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.06)`,
                          opacity: isDragging ? 0.5 : 1,
                          transform: isDragging ? "scale(0.97)" : undefined,
                        }}
                      >
                        {/* Drag handle */}
                        <div
                          className="touch-none cursor-grab active:cursor-grabbing select-none p-1 -m-1 active:scale-[0.96] transition-transform"
                          onPointerDown={(e) => handleDragPointerDown(e, srcIdx)}
                        >
                          <svg
                            width="15" height="15" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ color: "var(--color-brand-teal)", opacity: 0.5, flexShrink: 0 }}
                          >
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                          </svg>
                        </div>

                        <span
                          className="flex-1 text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {category.name}
                        </span>

                        <button
                          className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all active:scale-[0.96] active:opacity-75"
                          onClick={() => {
                            setRenameCategoryName(category.name);
                            setCategoryToRename({ id: category.id, name: category.name });
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="var(--color-brand-teal)" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>

                        <button
                          className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all active:scale-[0.96] active:opacity-75 disabled:opacity-20"
                          disabled={!store.canDeleteCategories}
                          onClick={() => store.deleteCategory(category.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="var(--color-danger)" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </li>
                    );
                  });
                })()}
              </ul>
              {!store.canDeleteCategories && (
                <p className="text-xs mt-2 px-1" style={{ color: "var(--color-text-secondary)" }}>
                  At least one category is required.
                </p>
              )}

              {/* Add category inline */}
              <div className="flex gap-2 items-center mt-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="Add new category"
                  className={`flex-1 ${inputClass}`}
                  style={{ color: "var(--color-text-primary)" }}
                />
                <button
                  className="h-11 w-11 flex items-center justify-center rounded-xl text-white shrink-0 transition-all disabled:opacity-30 active:scale-[0.96] active:opacity-75"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                  disabled={trimmedNewCategoryName.length === 0}
                  onClick={addCategory}
                >
                  <svg
                    width="20"
                    height="20"
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
              </div>
            </SettingsCard>

            {/* Appearance */}
            <SettingsCard>
              <SectionLabel>Appearance</SectionLabel>
              <ToggleGroup
                value={[settings.appearanceMode]}
                onValueChange={(values: string[]) => {
                  if (values.length > 0) {
                    settings.setAppearanceMode(
                      values[0] as "system" | "light" | "dark"
                    );
                  }
                }}
                className="w-full rounded-xl p-1"
                style={{
                  backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.10)`,
                }}
              >
                {(["system", "light", "dark"] as const).map((mode) => (
                  <ToggleGroupItem
                    key={mode}
                    value={mode}
                    className="flex-1 !rounded-lg text-xs font-semibold capitalize hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingsCard>

            {/* Data Management */}
            <SettingsCard>
              <SectionLabel>Data Management</SectionLabel>
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96] active:opacity-75"
                style={{
                  color: "var(--color-danger)",
                  backgroundColor: `rgba(212, 75, 74, 0.08)`,
                }}
                onClick={() => setIsResetDialogOpen(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
                Reset to New User
              </button>
              <p className="text-xs text-center mt-1.5 px-2" style={{ color: "var(--color-text-secondary)" }}>
                Clears all data and restarts the onboarding process.
              </p>
            </SettingsCard>

          </div>
        </SheetContent>
      </Sheet>

      {/* Rename Dialog */}
      <Dialog
        open={categoryToRename !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryToRename(null);
            setRenameCategoryName("");
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gap-3"
        >
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Choose a new name for "{categoryToRename?.name}".
          </p>
          <Input
            ref={renameInputRef}
            value={renameCategoryName}
            onChange={(e) => setRenameCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRenameSave();
              }
            }}
            className={inputClass}
            autoFocus
          />
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                setCategoryToRename(null);
                setRenameCategoryName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              onClick={handleRenameSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-3"
        >
          <DialogHeader>
            <DialogTitle>Reset to New User?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            This will clear all your data and restart the onboarding process. This cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => setIsResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-semibold text-white"
              style={{ backgroundColor: "var(--color-danger)" }}
              onClick={handleReset}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Helpers ────────────────────────────────────────────────

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-4 py-4"
      style={{ backgroundColor: "var(--color-surface-card)" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wide"
      style={{ color: "var(--color-brand-teal)" }}
    >
      {children}
    </p>
  );
}

export default SettingsSheet;
