// src/screens/SettingsSheet.tsx
import { useState, useRef, useCallback, useEffect, Fragment, type ReactNode } from "react";
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
import ActionSheet from "@/components/ui/action-sheet";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";
import { cn } from "@/lib/utils";
import type { TextSize } from "@/store/useSettingsStore";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputClass =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

/** Maps each TextSize key to the corresponding Tailwind font-size class. */
const TEXT_SIZE_TAILWIND: Record<string, string> = {
  xs: "text-xs",
  s: "text-sm",
  m: "text-base",
  l: "text-lg",
  xl: "text-xl",
};

/** Maps each appearance mode to a small inline SVG icon (12×12 viewport). */
const APPEARANCE_ICONS: Record<string, ReactNode> = {
  system: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  light: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

const SettingsSheet = ({ isOpen, onOpenChange }: SettingsSheetProps) => {
  const store = useCategoriesStore();
  const settings = useSettingsStore();
  const sync = useSyncStore();

  const [categoryToRename, setCategoryToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDisableSyncDialogOpen, setIsDisableSyncDialogOpen] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [isAdoptingCode, setIsAdoptingCode] = useState(false);

  // ── Groups state ──
  const [groupToRename, setGroupToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameGroupName, setRenameGroupName] = useState("");

  // ── Delete confirmation state ──
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [selectedCategoryForGroup, setSelectedCategoryForGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isGroupActionSheetOpen, setIsGroupActionSheetOpen] = useState(false);

  // ── Unified Add flow state ──
  const [isAddActionSheetOpen, setIsAddActionSheetOpen] = useState(false);
  const [addMode, setAddMode] = useState<"category" | "group" | null>(null);
  const [addCategoryName, setAddCategoryName] = useState("");
  const [addCategoryGroupID, setAddCategoryGroupID] = useState<string | null>(null);
  const [addGroupDialogName, setAddGroupDialogName] = useState("");

  // ── Drag-to-reorder state ──
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [groupDragIndex, setGroupDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [groupOverIndex, setGroupOverIndex] = useState<number | null>(null);
  // Ghost Y position (top of the fixed ghost element, in viewport px)
  const [ghostY, setGhostY] = useState(0);
  const [groupGhostY, setGroupGhostY] = useState(0);
  // Height of the dragged row (captured at drag start for ghost sizing)
  const ghostHeightRef = useRef(0);
  const groupGhostHeightRef = useRef(0);
  // How far down inside the row the pointer hit (so ghost doesn't jump)
  const dragOffsetY = useRef(0);
  const groupDragOffsetY = useRef(0);
  // Refs that mirror state for use inside stable window event handlers (avoid stale closures)
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const groupDragIndexRef = useRef<number | null>(null);
  const groupOverIndexRef = useRef<number | null>(null);
  // catContainerRef wraps all category rows (both grouped and ungrouped) for snapshotRects
  const catContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRects = useRef<DOMRect[]>([]);
  const groupItemRects = useRef<DOMRect[]>([]);
  // Ref for the groups container div (used by snapshotGroupRects)
  const groupsContainerRef = useRef<HTMLDivElement>(null);

  // ── Categories & Groups redesign state ──
  const [expandedGroupIDs, setExpandedGroupIDs] = useState<Set<string>>(() => new Set());
  const dragContext = useRef<{ groupID: string | null }>({ groupID: null });
  // Saved expanded state before a group drag — restored on drop
  const savedExpandedGroupIDsRef = useRef<Set<string>>(new Set());

  const renameInputRef = useRef<HTMLInputElement>(null);
  const sheetFocusSentinelRef = useRef<HTMLDivElement>(null);

  // ── Swipe-to-dismiss state ──
  const swipeDismissStartY = useRef(0);
  const swipeDismissStartTime = useRef(0);
  const [swipeTranslateY, setSwipeTranslateY] = useState(0);
  // Tracks whether a real downward drag has been confirmed, preventing mouse
  // hover or non-primary-button clicks from triggering a dismiss gesture.
  const isDismissDraggingRef = useRef(false);

  const handleDismissPointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore right-click, middle-click, etc.
    if (e.button !== 0) return;
    isDismissDraggingRef.current = false;
    swipeDismissStartY.current = e.clientY;
    swipeDismissStartTime.current = Date.now();
    setSwipeTranslateY(0);
    // setPointerCapture is deferred to PointerMove once drag intent is confirmed
  }, []);

  const handleDismissPointerMove = useCallback((e: React.PointerEvent) => {
    // On mouse, only track movement while the primary button is held
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    const dy = e.clientY - swipeDismissStartY.current;
    if (!isDismissDraggingRef.current && Math.abs(dy) > 5) {
      isDismissDraggingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (isDismissDraggingRef.current && dy > 0) setSwipeTranslateY(dy);
  }, []);

  const handleDismissPointerUp = useCallback((e: React.PointerEvent, onClose: () => void) => {
    // No-op if no real drag was ever confirmed
    if (!isDismissDraggingRef.current) return;
    isDismissDraggingRef.current = false;
    const dy = e.clientY - swipeDismissStartY.current;
    const dt = Date.now() - swipeDismissStartTime.current;
    const velocity = dy / dt; // px/ms
    if (dy > 80 || velocity > 0.5) {
      onClose();
    }
    setSwipeTranslateY(0);
  }, []);

  // Snapshot all category item rects when drag begins (works for both grouped and flat layouts)
  const snapshotRects = useCallback(() => {
    const container = catContainerRef.current ?? listRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>("[data-cat-idx]");
    // itemRects is indexed by flat category index, not visual order
    const arr: DOMRect[] = new Array(store.categories.length);
    items.forEach(el => {
      const idx = Number(el.getAttribute("data-cat-idx"));
      arr[idx] = el.getBoundingClientRect();
    });
    itemRects.current = arr;
  }, [store.categories.length]);

  // Snapshot all group item rects when drag begins
  const snapshotGroupRects = useCallback(() => {
    if (!groupsContainerRef.current) return;
    const items = groupsContainerRef.current.querySelectorAll<HTMLElement>("[data-group-idx]");
    groupItemRects.current = Array.from(items).map((el) => el.getBoundingClientRect());
  }, []);

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent, visualIdx: number, groupID: string | null = null) => {
      if (e.button !== 0) return;
      e.preventDefault();

      dragContext.current = { groupID };

      const scopedCategories = groupID
        ? store.categories.filter(c => c.groupID === groupID)
        : store.categories.filter(c => !c.groupID);

      const scopedItem = scopedCategories[visualIdx];
      const flatIdx = store.categories.indexOf(scopedItem);

      snapshotRects();
      const rect = itemRects.current[flatIdx];
      if (rect) {
        ghostHeightRef.current = rect.height;
        dragOffsetY.current = e.clientY - rect.top;
        setGhostY(rect.top);
      }
      dragIndexRef.current = flatIdx;
      overIndexRef.current = flatIdx;
      setDragIndex(flatIdx);
      setOverIndex(flatIdx);
    },
    [snapshotRects, store.categories],
  );

  // Stable window handlers — read from refs, never from closed-over state
  const handleDragPointerMove = useCallback((e: PointerEvent) => {
    if (dragIndexRef.current === null) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    const newGhostY = e.clientY - dragOffsetY.current;
    setGhostY(newGhostY);

    const cats = store.categories;
    const scopedCategories = dragContext.current.groupID !== null
      ? cats.filter(c => c.groupID === dragContext.current.groupID)
      : cats.filter(c => !c.groupID);

    const scopedRects = scopedCategories.map(cat => itemRects.current[cats.indexOf(cat)]);

    let newScopedOverIdx = scopedRects.length - 1;
    const ghostMid = newGhostY + ghostHeightRef.current / 2;
    for (let i = 0; i < scopedRects.length; i++) {
      if (!scopedRects[i]) continue;
      if (ghostMid < scopedRects[i].top + scopedRects[i].height / 2) { newScopedOverIdx = i; break; }
    }

    const newOverFlatIdx = cats.indexOf(scopedCategories[newScopedOverIdx]);
    overIndexRef.current = newOverFlatIdx;
    setOverIndex(newOverFlatIdx);
  }, [store.categories]);

  const handleDragPointerUp = useCallback(() => {
    const di = dragIndexRef.current;
    const oi = overIndexRef.current;
    dragIndexRef.current = null;
    overIndexRef.current = null;
    dragContext.current = { groupID: null };
    if (di !== null && oi !== null && di !== oi) {
      store.moveCategories(di, oi);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [store]);

  // Attach category drag handlers to window once on mount — stable refs mean no stale closure
  useEffect(() => {
    window.addEventListener("pointermove", handleDragPointerMove);
    window.addEventListener("pointerup", handleDragPointerUp);
    window.addEventListener("pointercancel", handleDragPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleDragPointerMove);
      window.removeEventListener("pointerup", handleDragPointerUp);
      window.removeEventListener("pointercancel", handleDragPointerUp);
    };
  }, [handleDragPointerMove, handleDragPointerUp]);

  const handleGroupDragPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      snapshotGroupRects();
      const rect = groupItemRects.current[idx];
      if (rect) {
        groupGhostHeightRef.current = rect.height;
        groupDragOffsetY.current = e.clientY - rect.top;
        setGroupGhostY(rect.top);
      }
      groupDragIndexRef.current = idx;
      groupOverIndexRef.current = idx;
      setGroupDragIndex(idx);
      setGroupOverIndex(idx);
      setExpandedGroupIDs(prev => {
        savedExpandedGroupIDsRef.current = new Set(prev);
        return new Set();
      });
    },
    [snapshotGroupRects],
  );

  const handleGroupDragPointerMove = useCallback((e: PointerEvent) => {
    if (groupDragIndexRef.current === null) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    const newGhostY = e.clientY - groupDragOffsetY.current;
    setGroupGhostY(newGhostY);

    const rects = groupItemRects.current;
    let newOverIdx = rects.length - 1;
    const ghostMid = newGhostY + groupGhostHeightRef.current / 2;
    for (let i = 0; i < rects.length; i++) {
      if (!rects[i]) continue;
      if (ghostMid < rects[i].top + rects[i].height / 2) { newOverIdx = i; break; }
    }
    groupOverIndexRef.current = newOverIdx;
    setGroupOverIndex(newOverIdx);
  }, []);

  const handleGroupDragPointerUp = useCallback(() => {
    const di = groupDragIndexRef.current;
    const oi = groupOverIndexRef.current;
    groupDragIndexRef.current = null;
    groupOverIndexRef.current = null;
    if (di !== null && oi !== null && di !== oi) {
      store.moveGroups(di, oi);
    }
    setGroupDragIndex(null);
    setGroupOverIndex(null);
    setExpandedGroupIDs(savedExpandedGroupIDsRef.current);
  }, [store]);

  // Attach group drag handlers to window once on mount
  useEffect(() => {
    window.addEventListener("pointermove", handleGroupDragPointerMove);
    window.addEventListener("pointerup", handleGroupDragPointerUp);
    window.addEventListener("pointercancel", handleGroupDragPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGroupDragPointerMove);
      window.removeEventListener("pointerup", handleGroupDragPointerUp);
      window.removeEventListener("pointercancel", handleGroupDragPointerUp);
    };
  }, [handleGroupDragPointerMove, handleGroupDragPointerUp]);

  // ── Add handlers ──
  function handleAddCategoryConfirm() {
    const trimmed = addCategoryName.trim();
    if (!trimmed) return;
    if (addCategoryGroupID) {
      store.addCategoryWithGroup(trimmed, addCategoryGroupID);
    } else {
      store.addCategory(trimmed);
    }
    setAddMode(null);
    setAddCategoryName("");
    setAddCategoryGroupID(null);
  }

  function handleAddGroupConfirm() {
    const trimmed = addGroupDialogName.trim();
    if (!trimmed) return;
    store.addGroup(trimmed);
    setAddMode(null);
    setAddGroupDialogName("");
  }

  // ── Categories & Groups redesign functions ──
  function toggleGroup(groupID: string) {
    setExpandedGroupIDs(prev => {
      const next = new Set(prev);
      if (next.has(groupID)) {
        next.delete(groupID);
      } else {
        next.add(groupID);
      }
      return next;
    });
  }

  // Initialize expandedGroupIDs to all groups expanded on mount and when groups change
  useEffect(() => {
    setExpandedGroupIDs(prev => {
      const currentGroupIDs = new Set(store.groups.map(g => g.id));
      const next = new Set(prev);

      // Add any new groups (defaulting to expanded)
      for (const id of currentGroupIDs) {
        if (!next.has(id)) {
          next.add(id);
        }
      }

      // Remove groups that no longer exist
      for (const id of next) {
        if (!currentGroupIDs.has(id)) {
          next.delete(id);
        }
      }

      return next;
    });
  }, [store.groups]);

  function handleRenameSave() {
    if (!categoryToRename) return;
    const trimmed = renameCategoryName.trim();
    if (!trimmed) return;
    store.renameCategory(categoryToRename.id, trimmed);
    setCategoryToRename(null);
    setRenameCategoryName("");
  }

  function handleReset() {
    // If sync is active, delete the cloud document before wiping local state.
    // Ensure anonymous auth is valid before attempting the delete.
    // Non-fatal if the delete fails — local reset proceeds regardless.
    if (sync.isSyncEnabled && sync.syncCode) {
      const codeToDelete = sync.syncCode;
      import("@/services/syncService").then(({ ensureAnonymousAuth, deleteSyncData }) =>
        ensureAnonymousAuth()
          .then(() => deleteSyncData(codeToDelete))
          .catch((err) => console.error("Failed to delete cloud data on reset:", err)),
      );
    }

    // Disable sync locally (cloud delete handled above, so pass false)
    sync.disableSync(false);
    store.resetCategories();
    settings.resetToNewUser();
    setIsResetDialogOpen(false);
    onOpenChange(false);
  }

  // ── Group handlers ──
  function handleRenameGroupSave() {
    if (!groupToRename) return;
    const trimmed = renameGroupName.trim();
    if (!trimmed) return;
    store.renameGroup(groupToRename.id, trimmed);
    setGroupToRename(null);
    setRenameGroupName("");
  }

  function handleCategoryGroupChange(groupID: string | null) {
    if (!selectedCategoryForGroup) return;
    store.setCategoryGroup(selectedCategoryForGroup.id, groupID ?? undefined);
    setSelectedCategoryForGroup(null);
    setIsGroupActionSheetOpen(false);
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-3xl max-h-[90dvh] overflow-y-auto"
          initialFocus={sheetFocusSentinelRef}
          style={{
            backgroundColor: "var(--color-surface-background)",
            boxShadow: "var(--elevation-sheet)",
            transform: `translateY(${swipeTranslateY}px)`,
            transition: swipeTranslateY === 0 ? "transform 0.3s ease-out" : "none",
          }}
        >
          {/* Focus sentinel — absorbs auto-focus on open so no button appears focused */}
          <div ref={sheetFocusSentinelRef} tabIndex={-1} className="sr-only" aria-hidden />
          {/* Drag indicator — also the swipe-to-dismiss grab target */}
          {/* The pill is hidden on desktop (coarse pointer = touch only) */}
          <div
            className="flex justify-center pt-3 pb-1 touch-none cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handleDismissPointerDown}
            onPointerMove={handleDismissPointerMove}
            onPointerUp={(e) => handleDismissPointerUp(e, () => onOpenChange(false))}
            onPointerCancel={(e) => handleDismissPointerUp(e, () => onOpenChange(false))}
          >
            <div
              className="hidden pointer-coarse:block w-10 h-[5px] rounded-full"
              style={{ backgroundColor: "var(--color-text-secondary)", opacity: 0.25 }}
            />
          </div>
          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-1">
            <SheetTitle
              className="text-2xl font-bold"
              style={{ color: "var(--color-brand-green)" }}
            >
              Settings
            </SheetTitle>
            <Button
              variant="ghost"
              className="font-semibold text-sm rounded-full px-4 hover:!bg-[color:var(--color-surface-input)] focus-visible:!border-[color:var(--color-brand-green)] focus-visible:!ring-[color:var(--color-brand-green)]/30"
              style={{
                color: "var(--color-brand-green)",
                backgroundColor: "rgba(var(--color-brand-green-rgb), 0.12)",
                touchAction: "manipulation",
              }}
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-10 pt-2">

            {/* Categories & Groups */}
            <SettingsCard>
              <SectionLabel>Categories & Groups</SectionLabel>

              {/* Groups discoverability caption — only when no groups */}
              {store.groups.length === 0 && (
                <p className="text-xs -mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Categories live inside groups. Create groups to organize your lists.
                </p>
              )}

              {/* ── Grouped layout (groups exist) ── */}
              {store.groups.length > 0 && (
                <>
                  {/* All category rows are inside catContainerRef for unified pointer handling */}
                  <div
                    ref={catContainerRef}
                  >
                    {/* Group sections */}
                    <div
                      ref={groupsContainerRef}
                      className="flex flex-col gap-2"
                    >
                      {store.groups.map((group, groupVisualIdx) => {
                        const isExpanded = expandedGroupIDs.has(group.id);
                        const groupCategories = store.categories.filter(c => c.groupID === group.id);
                        const isGroupDragging = groupVisualIdx === groupDragIndex;
                        const isLastGroup = groupVisualIdx === store.groups.length - 1;

                        return (
                          <Fragment key={group.id}>
                            {groupDragIndex !== null && groupOverIndex === groupVisualIdx && groupOverIndex !== groupDragIndex && (
                              <div style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0" }} />
                            )}
                            <div
                              data-group-idx={groupVisualIdx}
                              className="rounded-xl overflow-hidden"
                              style={{
                                opacity: isGroupDragging ? 0 : 1,
                                transition: "opacity 120ms ease",
                                boxShadow: `inset 0 0 0 1.5px rgba(var(--color-brand-deep-green-rgb), 0.15)`,
                              }}
                            >
                              {/* Group header */}
                              <div
                                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none"
                                style={{
                                  backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
                                }}
                                onClick={() => toggleGroup(group.id)}
                              >
                                {/* Drag handle */}
                                <div
                                  className="touch-none cursor-grab active:cursor-grabbing p-1 -m-1 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    handleGroupDragPointerDown(e, groupVisualIdx);
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                    style={{ color: "var(--color-brand-teal)", opacity: 0.55 }}>
                                    <line x1="4" y1="7" x2="20" y2="7" />
                                    <line x1="4" y1="12" x2="20" y2="12" />
                                    <line x1="4" y1="17" x2="20" y2="17" />
                                  </svg>
                                </div>

                                {/* Chevron */}
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                  className="shrink-0"
                                  style={{
                                    color: "var(--color-brand-teal)",
                                    opacity: 0.75,
                                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                    transition: "transform 200ms ease-out",
                                  }}>
                                  <path d="M9 18l6-6-6-6" />
                                </svg>

                                {/* Group name */}
                                <span className="flex-1 text-sm font-semibold tracking-[-0.01em]"
                                  style={{ color: "var(--color-text-primary)" }}>
                                  {group.name}
                                </span>

                                {/* Category count badge */}
                                {groupCategories.length > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `rgba(var(--color-brand-teal-rgb), 0.14)`,
                                      color: "var(--color-brand-teal)",
                                    }}>
                                    {groupCategories.length}
                                  </span>
                                )}

                                {/* Rename */}
                                <button
                                  className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
                                  style={{ opacity: 0.55 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenameGroupName(group.name);
                                    setGroupToRename({ id: group.id, name: group.name });
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                </button>

                                {/* Delete */}
                                <button
                                  className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
                                  style={{ opacity: 0.55 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGroupToDelete({ id: group.id, name: group.name });
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>

                              {/* Collapsible category sub-list */}
                              <div
                                className="overflow-hidden"
                                style={{
                                  maxHeight: isExpanded ? "600px" : "0px",
                                  transition: "max-height 220ms ease-out",
                                }}
                              >
                                {/* Left-border accent column + rows */}
                                <div className="relative"
                                  style={{ backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.05)` }}>
                                  {/* Teal left accent bar */}
                                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
                                    style={{ backgroundColor: `rgba(var(--color-brand-teal-rgb), 0.35)` }} />

                                  <div className="flex flex-col pl-8 pr-2 py-1.5 gap-0.5">
                                    {groupCategories.map((category, visualIdx) => {
                                      const flatIdx = store.categories.indexOf(category);
                                      const isDragging = dragIndex === flatIdx;
                                      const isLast = visualIdx === groupCategories.length - 1;
                                      return (
                                        <Fragment key={category.id}>
                                          {dragIndex !== null && overIndex === flatIdx && overIndex !== dragIndex && (
                                            <div style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0" }} />
                                          )}
                                          <div
                                            data-cat-idx={flatIdx}
                                            className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
                                            style={{
                                              opacity: isDragging ? 0 : 1,
                                              transition: "opacity 120ms ease",
                                            }}
                                          >
                                            {/* Drag handle */}
                                            <div
                                              className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                                              onPointerDown={(e) => handleDragPointerDown(e, visualIdx, group.id)}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                style={{ color: "var(--color-brand-teal)", opacity: 0.4 }}>
                                                <line x1="4" y1="7" x2="20" y2="7" />
                                                <line x1="4" y1="12" x2="20" y2="12" />
                                                <line x1="4" y1="17" x2="20" y2="17" />
                                              </svg>
                                            </div>

                                            <span className="flex-1 text-sm" style={{ color: "var(--color-text-primary)" }}>
                                              {category.name}
                                            </span>

                                            <button
                                              className="p-1.5 rounded-md transition-all active:scale-[0.9]"
                                              style={{ opacity: 0.5 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setRenameCategoryName(category.name);
                                                setCategoryToRename({ id: category.id, name: category.name });
                                              }}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                                stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                <path d="m15 5 4 4" />
                                              </svg>
                                            </button>

                                            <button
                                              className="p-1.5 rounded-md transition-all active:scale-[0.9] disabled:opacity-20"
                                              style={{ opacity: 0.5 }}
                                              disabled={!store.canDeleteCategories}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCategoryToDelete({ id: category.id, name: category.name });
                                              }}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                                stroke="var(--color-danger)"
                                                strokeWidth="2"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                              </svg>
                                            </button>
                                          </div>
                                          {/* Trailing indicator — shown when dragging to the bottom of this group */}
                                          {isLast && dragIndex !== null && overIndex === flatIdx && overIndex !== dragIndex && (
                                            <div style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0" }} />
                                          )}
                                        </Fragment>
                                      );
                                    })}
                                    {groupCategories.length === 0 && (
                                      <p className="text-xs py-2 pl-1" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
                                        No categories yet
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Trailing indicator — shown when dragging to the bottom of the group list */}
                            {isLastGroup && groupDragIndex !== null && groupOverIndex === groupVisualIdx && groupOverIndex !== groupDragIndex && (
                              <div style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0" }} />
                            )}
                          </Fragment>
                        );
                      })}
                    </div>

                    {/* No Group section */}
                    {(() => {
                      const ungrouped = store.categories.filter(c => !c.groupID);
                      if (ungrouped.length === 0) return null;
                      return (
                        <div className="mt-2">
                          {/* Divider */}
                          <div className="flex items-center gap-2 mb-2">
                            <hr className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest px-1"
                              style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>
                              No Group
                            </span>
                            <hr className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
                          </div>

                          <div className="flex flex-col gap-1">
                            {ungrouped.map((category, visualIdx) => {
                              const flatIdx = store.categories.indexOf(category);
                              const isDragging = dragIndex === flatIdx;
                              const isLast = visualIdx === ungrouped.length - 1;
                              return (
                                <Fragment key={category.id}>
                                  {dragIndex !== null && overIndex === flatIdx && overIndex !== dragIndex && (
                                    <div style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0" }} />
                                  )}
                                  <div
                                    data-cat-idx={flatIdx}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                                    style={{
                                      backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.07)`,
                                      opacity: isDragging ? 0 : 1,
                                      transition: "opacity 120ms ease",
                                    }}
                                  >
                                    {/* Drag handle */}
                                    <div
                                      className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                                      onPointerDown={(e) => handleDragPointerDown(e, visualIdx, null)}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                        style={{ color: "var(--color-brand-teal)", opacity: 0.45 }}>
                                        <line x1="4" y1="7" x2="20" y2="7" />
                                        <line x1="4" y1="12" x2="20" y2="12" />
                                        <line x1="4" y1="17" x2="20" y2="17" />
                                      </svg>
                                    </div>

                                    <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                                      {category.name}
                                    </span>

                                    {/* Assign chip */}
                                    <button
                                      className="flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all active:scale-[0.94]"
                                      style={{
                                        backgroundColor: `rgba(var(--color-brand-teal-rgb), 0.12)`,
                                        color: "var(--color-brand-teal)",
                                      }}
                                      onClick={() => {
                                        setSelectedCategoryForGroup({ id: category.id, name: category.name });
                                        setIsGroupActionSheetOpen(true);
                                      }}
                                    >
                                      + Assign
                                    </button>

                                    <button
                                      className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
                                      style={{ opacity: 0.55 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRenameCategoryName(category.name);
                                        setCategoryToRename({ id: category.id, name: category.name });
                                      }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        <path d="m15 5 4 4" />
                                      </svg>
                                    </button>

                                    <button
                                      className="p-1.5 rounded-lg transition-all active:scale-[0.9] disabled:opacity-20"
                                      style={{ opacity: 0.55 }}
                                      disabled={!store.canDeleteCategories}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoryToDelete({ id: category.id, name: category.name });
                                      }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="var(--color-danger)"
                                        strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </div>
                                  {/* Trailing indicator — shown when dragging to the bottom of the ungrouped section */}
                                  {isLast && dragIndex !== null && overIndex === flatIdx && overIndex !== dragIndex && (
                                    <div style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0" }} />
                                  )}
                                </Fragment>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* ── Flat layout (no groups) ── */}
              {store.groups.length === 0 && (
                <ul
                  ref={listRef}
                  className="flex flex-col gap-1.5"
                >
                  {store.categories.map((category, idx) => {
                    const isDragging = idx === dragIndex;
                    const isLast = idx === store.categories.length - 1;
                    return (
                      <Fragment key={category.id}>
                        {dragIndex !== null && overIndex === idx && overIndex !== dragIndex && (
                          <li style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0", listStyle: "none" }} />
                        )}
                        <li
                          data-cat-idx={idx}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                          style={{
                            backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.07)`,
                            opacity: isDragging ? 0 : 1,
                            transition: "opacity 120ms ease",
                          }}
                        >
                          <div
                            className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                            onPointerDown={(e) => handleDragPointerDown(e, idx)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              style={{ color: "var(--color-brand-teal)", opacity: 0.45 }}>
                              <line x1="4" y1="7" x2="20" y2="7" />
                              <line x1="4" y1="12" x2="20" y2="12" />
                              <line x1="4" y1="17" x2="20" y2="17" />
                            </svg>
                          </div>

                          <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {category.name}
                          </span>

                          <button
                            className="p-1.5 rounded-lg transition-all active:scale-[0.9]"
                            style={{ opacity: 0.55 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameCategoryName(category.name);
                              setCategoryToRename({ id: category.id, name: category.name });
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>

                          <button
                            className="p-1.5 rounded-lg transition-all active:scale-[0.9] disabled:opacity-20"
                            style={{ opacity: 0.55 }}
                            disabled={!store.canDeleteCategories}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete({ id: category.id, name: category.name });
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke="var(--color-danger)"
                              strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </li>
                        {/* Trailing indicator — shown when dragging to the bottom of the flat list */}
                        {isLast && dragIndex !== null && overIndex === idx && overIndex !== dragIndex && (
                          <li aria-hidden style={{ height: 2, borderRadius: 2, backgroundColor: "var(--color-brand-green)", opacity: 0.85, margin: "1px 0", listStyle: "none" }} />
                        )}
                      </Fragment>
                    );
                  })}
                </ul>
              )}

              {!store.canDeleteCategories && (
                <p className="text-xs px-1" style={{ color: "var(--color-text-secondary)" }}>
                  At least one category is required.
                </p>
              )}

              {/* ── Add controls ── */}
              <div className="pt-1">
                {/* Separator */}
                <div className="border-t mb-3" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.1 }} />

                {/* Unified "+ Add" pill button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] active:opacity-80"
                  style={{
                    color: "var(--color-brand-green)",
                    backgroundColor: `rgba(var(--color-brand-green-rgb), 0.10)`,
                    touchAction: "manipulation",
                  }}
                  onClick={() => setIsAddActionSheetOpen(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Category or Group
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
                  // Ignore empty values to prevent deselection
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
                    <span className="flex items-center gap-1.5">
                      {APPEARANCE_ICONS[mode]}
                      {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingsCard>

            {/* Text Size */}
            <SettingsCard>
              <SectionLabel>Text Size</SectionLabel>
              <ToggleGroup
                value={[settings.textSize]}
                onValueChange={(values: string[]) => {
                  if (values.length > 0) {
                    settings.setTextSize(values[0] as TextSize);
                  }
                  // Ignore empty values to prevent deselection
                }}
                className="w-full rounded-xl p-1"
                style={{
                  backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.10)`,
                }}
              >
                {(["xs", "s", "m", "l", "xl"] as const).map((size) => (
                  <ToggleGroupItem
                    key={size}
                    value={size}
                    className={cn(
                      "flex-1 !rounded-lg font-semibold hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all",
                      TEXT_SIZE_TAILWIND[size],
                    )}
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {size.toUpperCase()}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingsCard>

            {/* Name */}
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

            {/* Sync & Backup */}
            <SettingsCard>
              <SectionLabel>Sync & Backup</SectionLabel>
              {sync.isSyncEnabled ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      Sync Code
                    </span>
                    {/* Sync status badge */}
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: sync.syncStatus === "error"
                          ? `rgba(var(--color-danger-rgb), 0.12)`
                          : `rgba(var(--color-brand-green-rgb), 0.12)`,
                        color: sync.syncStatus === "error"
                          ? "var(--color-danger)"
                          : "var(--color-brand-green)",
                      }}
                    >
                      {sync.syncStatus === "syncing" ? "Syncing…" : sync.syncStatus === "error" ? "Error" : "Synced"}
                    </span>
                    <button
                      className="text-xs font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80 active:scale-[0.96]"
                      style={{ color: "var(--color-brand-green)", backgroundColor: "rgba(var(--color-brand-green-rgb), 0.1)" }}
                      onClick={() => navigator.clipboard.writeText(sync.syncCode)}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm p-2 rounded-lg break-all" style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}>
                    {sync.syncCode}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    Share this code with others to sync your list, or use it on another device.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                      style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
                      onClick={() => setIsAdoptingCode(true)}
                    >
                      Switch Code
                    </button>
                    <button
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                      style={{ color: "var(--color-danger)", backgroundColor: "rgba(var(--color-danger-rgb), 0.08)" }}
                      onClick={() => setIsDisableSyncDialogOpen(true)}
                    >
                      Disable
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
                    Switching to a different code will replace your current data.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
                    Enable cloud sync to backup your data and share it across devices.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                      style={{ color: "var(--color-brand-green)", backgroundColor: "rgba(var(--color-brand-green-rgb), 0.1)" }}
                      onClick={sync.enableSync}
                      disabled={sync.syncStatus === "syncing"}
                    >
                      {sync.syncStatus === "syncing" ? "Enabling..." : "New Code"}
                    </button>
                    <button
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                      style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
                      onClick={() => setIsAdoptingCode(true)}
                      disabled={sync.syncStatus === "syncing"}
                    >
                      Enter Code
                    </button>
                  </div>
                </>
              )}
            </SettingsCard>

            {/* Account Management */}
            <SettingsCard>
              <SectionLabel>Data</SectionLabel>
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96] active:opacity-75"
                style={{
                  color: "var(--color-danger)",
                  backgroundColor: `rgba(var(--color-danger-rgb), 0.08)`,
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

      {/* Adopt Sync Code Dialog */}
      <Dialog open={isAdoptingCode} onOpenChange={setIsAdoptingCode}>
        <DialogContent
          showCloseButton={false}
          className="gap-3"
        >
          <DialogHeader>
            <DialogTitle>Enter Sync Code</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Paste the sync code from another device to load and sync that data.
          </p>
          <Input
            value={syncCodeInput}
            onChange={(e) => setSyncCodeInput(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            className={inputClass}
            autoFocus
          />
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                setIsAdoptingCode(false);
                setSyncCodeInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              onClick={() => {
                sync.adoptSyncCode(syncCodeInput.trim());
                setIsAdoptingCode(false);
                setSyncCodeInput("");
              }}
              disabled={!syncCodeInput.trim()}
            >
              Adopt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Sync Confirmation Dialog */}
      <Dialog open={isDisableSyncDialogOpen} onOpenChange={setIsDisableSyncDialogOpen}>
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>Disable Sync</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            What would you like to do with your cloud backup?
          </p>
          <div className="flex flex-col gap-2 mt-1">
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
              onClick={() => {
                sync.disableSync(false);
                setIsDisableSyncDialogOpen(false);
              }}
            >
              <span className="block font-semibold">Keep cloud backup</span>
              <span className="block text-xs mt-0.5 font-normal" style={{ color: "var(--color-text-secondary)" }}>
                Sync is disabled locally. Re-enter your code later to restore.
              </span>
            </button>
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ backgroundColor: "rgba(var(--color-danger-rgb), 0.08)", color: "var(--color-danger)" }}
              onClick={() => {
                sync.disableSync(true);
                setIsDisableSyncDialogOpen(false);
              }}
            >
              <span className="block font-semibold">Delete cloud data</span>
              <span className="block text-xs mt-0.5 font-normal" style={{ color: "var(--color-text-secondary)" }}>
                Permanently removes your data from the cloud. Cannot be undone.
              </span>
            </button>
          </div>
          <Button
            variant="ghost"
            className="w-full rounded-xl hover:!bg-[color:var(--color-surface-input)] mt-1"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={() => setIsDisableSyncDialogOpen(false)}
          >
            Cancel
          </Button>
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

      {/* Rename Group Dialog */}
      <Dialog
        open={groupToRename !== null}
        onOpenChange={(open) => {
          if (!open) {
            setGroupToRename(null);
            setRenameGroupName("");
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gap-3"
        >
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Choose a new name for "{groupToRename?.name}".
          </p>
          <Input
            value={renameGroupName}
            onChange={(e) => setRenameGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRenameGroupSave();
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
                setGroupToRename(null);
                setRenameGroupName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              onClick={handleRenameGroupSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
      >
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>Delete Category?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            "{categoryToDelete?.name}" will be permanently deleted. This cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => setCategoryToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-semibold text-white"
              style={{ backgroundColor: "var(--color-danger)" }}
              onClick={() => {
                if (categoryToDelete) {
                  store.deleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog
        open={groupToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setGroupToDelete(null);
        }}
      >
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>Delete Group?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            "{groupToDelete?.name}" will be permanently deleted. Categories inside it will become ungrouped.
          </p>
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => setGroupToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-semibold text-white"
              style={{ backgroundColor: "var(--color-danger)" }}
              onClick={() => {
                if (groupToDelete) {
                  store.deleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Assignment ActionSheet */}
      <ActionSheet
        isOpen={isGroupActionSheetOpen}
        onClose={() => setIsGroupActionSheetOpen(false)}
        title={`Assign "${selectedCategoryForGroup?.name}" to Group`}
        actions={[
          {
            label: "No Group",
            onClick: () => handleCategoryGroupChange(null),
          },
          ...store.groups.map(group => ({
            label: group.name,
            onClick: () => handleCategoryGroupChange(group.id),
          })),
        ]}
      />

      {/* Add Category or Group ActionSheet */}
      <ActionSheet
        isOpen={isAddActionSheetOpen}
        onClose={() => setIsAddActionSheetOpen(false)}
        title="Add"
        actions={[
          {
            label: "Add a Category",
            onClick: () => {
              setIsAddActionSheetOpen(false);
              setAddCategoryGroupID(null);
              setAddCategoryName("");
              setAddMode("category");
            },
          },
          {
            label: "Add a Group",
            onClick: () => {
              setIsAddActionSheetOpen(false);
              setAddGroupDialogName("");
              setAddMode("group");
            },
          },
        ]}
      />

      {/* Add Category Dialog */}
      <Dialog
        open={addMode === "category"}
        onOpenChange={(open) => {
          if (!open) {
            setAddMode(null);
            setAddCategoryName("");
            setAddCategoryGroupID(null);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <Input
            value={addCategoryName}
            onChange={(e) => setAddCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (store.groups.length === 0) handleAddCategoryConfirm();
              }
            }}
            placeholder="Category name"
            className={inputClass}
            autoFocus
            autoCapitalize="words"
          />
          {store.groups.length > 0 && (
            <select
              value={addCategoryGroupID ?? ""}
              onChange={(e) => setAddCategoryGroupID(e.target.value || null)}
              className="h-11 w-full rounded-xl border-transparent px-3 text-sm"
              style={{
                backgroundColor: "var(--color-surface-input)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="">No Group (ungrouped)</option>
              {store.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                setAddMode(null);
                setAddCategoryName("");
                setAddCategoryGroupID(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              disabled={addCategoryName.trim().length === 0}
              onClick={handleAddCategoryConfirm}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog
        open={addMode === "group"}
        onOpenChange={(open) => {
          if (!open) {
            setAddMode(null);
            setAddGroupDialogName("");
          }
        }}
      >
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>New Group</DialogTitle>
          </DialogHeader>
          <Input
            value={addGroupDialogName}
            onChange={(e) => setAddGroupDialogName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddGroupConfirm();
              }
            }}
            placeholder="Group name"
            className={inputClass}
            autoFocus
            autoCapitalize="words"
          />
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                setAddMode(null);
                setAddGroupDialogName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              disabled={addGroupDialogName.trim().length === 0}
              onClick={handleAddGroupConfirm}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category drag ghost ── */}
      {dragIndex !== null && (() => {
        const dragged = store.categories[dragIndex];
        if (!dragged) return null;
        return (
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: ghostY,
              left: 16,
              right: 16,
              height: ghostHeightRef.current,
              pointerEvents: "none",
              zIndex: 9999,
              borderRadius: 12,
              backgroundColor: "var(--color-surface-card)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14)",
              transform: "scale(1.02)",
              transformOrigin: "center center",
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingLeft: 12,
              paddingRight: 12,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ color: "var(--color-brand-teal)", opacity: 0.6, flexShrink: 0 }}>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dragged.name}
            </span>
          </div>
        );
      })()}

      {/* ── Group drag ghost ── */}
      {groupDragIndex !== null && (() => {
        const dragged = store.groups[groupDragIndex];
        if (!dragged) return null;
        return (
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: groupGhostY,
              left: 16,
              right: 16,
              height: groupGhostHeightRef.current,
              pointerEvents: "none",
              zIndex: 9999,
              borderRadius: 12,
              backgroundColor: "var(--color-surface-card)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14)",
              transform: "scale(1.02)",
              transformOrigin: "center center",
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingLeft: 12,
              paddingRight: 12,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ color: "var(--color-brand-teal)", opacity: 0.6, flexShrink: 0 }}>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dragged.name}
            </span>
          </div>
        );
      })()}

    </>
  );
};

// ── Helpers ────────────────────────────────────────────────

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: "var(--color-surface-card)",
        boxShadow: "var(--elevation-card)",
      }}
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
