// src/screens/SettingsSheet.tsx
import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
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
  // Category drag — live-row model: the dragged row translates with the pointer;
  // other rows slide to fill the gap as the pointer crosses their midpoint.
  const [catDragState, setCatDragState] = useState<{
    /** Flat index into store.categories of the row being dragged */
    flatIdx: number;
    /** Scope: which group (or null for ungrouped / flat layout) */
    groupID: string | null;
    /** Live translateY offset for the dragged row (pointer delta from start) */
    translateY: number;
    /** Live order of scoped category IDs, updated each frame */
    liveOrder: string[];
    /** Original scoped order at drag start — used to compute sibling offsets */
    originalOrder: string[];
    /** Height of the dragged row in px */
    rowHeight: number;
  } | null>(null);

  // Group drag — same live-row model
  const [groupDragState, setGroupDragState] = useState<{
    idx: number;
    translateY: number;
    liveOrder: string[];
    originalOrder: string[];
    rowHeight: number;
  } | null>(null);

  // Refs that shadow state for use inside stable window event handlers
  const catDragStateRef = useRef<typeof catDragState>(null);
  const groupDragStateRef = useRef<typeof groupDragState>(null);
  const catDragPointerStartY = useRef(0);
  const groupDragPointerStartY = useRef(0);

  // Heights of each scoped row — snapshotted at drag start
  const catRowHeightsRef = useRef<number[]>([]);
  const groupRowHeightsRef = useRef<number[]>([]);

  const hasGroupDraggedRef = useRef(false);

  // catContainerRef wraps all category rows (both grouped and ungrouped) for snapshotRects
  const catContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Ref for the groups container div (used by snapshotGroupRects)
  const groupsContainerRef = useRef<HTMLDivElement>(null);

  // ── Categories & Groups redesign state ──
  const [expandedGroupIDs, setExpandedGroupIDs] = useState<Set<string>>(() => new Set());
  const dragContext = useRef<{ groupID: string | null }>({ groupID: null });
  // Saved expanded state before a group drag — restored on drop
  const savedExpandedGroupIDsRef = useRef<Set<string>>(new Set());

  const renameInputRef = useRef<HTMLInputElement>(null);
  const sheetFocusSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Stable ref-wrappers so window listeners are registered exactly once and
  // never need to be removed/re-added when store changes mid-drag.
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  // ── Category drag handlers (live-row model) ──

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent, visualIdx: number, groupID: string | null = null) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const scopedCategories = groupID !== null
        ? store.categories.filter(c => c.groupID === groupID)
        : store.categories.filter(c => !c.groupID);

      // Snapshot heights from the live DOM rows in this scope
      const container = catContainerRef.current ?? listRef.current;
      const heights: number[] = [];
      if (container) {
        scopedCategories.forEach(cat => {
          const flatIdx = store.categories.indexOf(cat);
          const el = container.querySelector<HTMLElement>(`[data-cat-idx="${flatIdx}"]`);
          heights.push(el ? el.getBoundingClientRect().height : 44);
        });
      } else {
        scopedCategories.forEach(() => heights.push(44));
      }

      const scopedItem = scopedCategories[visualIdx];
      const flatIdx = store.categories.indexOf(scopedItem);
      const liveOrder = scopedCategories.map(c => c.id);

      catDragPointerStartY.current = e.clientY;
      catRowHeightsRef.current = heights;
      dragContext.current = { groupID };

      const newState = {
        flatIdx,
        groupID,
        translateY: 0,
        liveOrder,
        originalOrder: [...liveOrder],
        rowHeight: heights[visualIdx] ?? 44,
      };
      catDragStateRef.current = newState;
      setCatDragState(newState);
    },
    [store.categories],
  );

  const handleDragPointerMove = useCallback((e: PointerEvent) => {
    const ds = catDragStateRef.current;
    if (!ds) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    const dy = e.clientY - catDragPointerStartY.current;

    const scopedCount = ds.liveOrder.length;
    const draggedScopedIdx = ds.liveOrder.indexOf(
      storeRef.current.categories[ds.flatIdx]?.id ?? "",
    );

    const GAP = 4;
    const offsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < scopedCount; i++) {
      offsets.push(acc);
      acc += (catRowHeightsRef.current[i] ?? ds.rowHeight) + GAP;
    }

    const draggedOriginalOffset = offsets[draggedScopedIdx] ?? 0;
    const draggedCurrentTop = draggedOriginalOffset + dy;
    const draggedMid = draggedCurrentTop + ds.rowHeight / 2;

    let newScopedIdx = draggedScopedIdx;
    for (let i = 0; i < scopedCount; i++) {
      if (i === draggedScopedIdx) continue;
      const slotMid = offsets[i] + (catRowHeightsRef.current[i] ?? ds.rowHeight) / 2;
      if (i < draggedScopedIdx && draggedMid < slotMid) {
        newScopedIdx = i;
        break;
      }
      if (i > draggedScopedIdx && draggedMid > slotMid) {
        newScopedIdx = i;
      }
    }

    let newLiveOrder = ds.liveOrder;
    if (newScopedIdx !== draggedScopedIdx) {
      newLiveOrder = [...ds.liveOrder];
      const [item] = newLiveOrder.splice(draggedScopedIdx, 1);
      newLiveOrder.splice(newScopedIdx, 0, item);
    }

    const next = { ...ds, translateY: dy, liveOrder: newLiveOrder };
    catDragStateRef.current = next;
    setCatDragState(next);
  }, []);

  const handleDragPointerUp = useCallback(() => {
    const ds = catDragStateRef.current;
    catDragStateRef.current = null;
    dragContext.current = { groupID: null };
    setCatDragState(null);
    if (!ds) return;

    // No-op if order didn't change
    if (ds.liveOrder.join() === ds.originalOrder.join()) return;

    const store = storeRef.current;
    const draggedID = store.categories[ds.flatIdx]?.id;
    if (!draggedID) return;

    const originalFlatIdx = ds.flatIdx;

    const scopedCategories = ds.groupID !== null
      ? store.categories.filter(c => c.groupID === ds.groupID)
      : store.categories.filter(c => !c.groupID);

    // Build the new full flat ID order by substituting liveOrder into the scoped slots
    const newFullOrder = store.categories.map(c => c.id);
    scopedCategories.forEach((cat, scopedPos) => {
      const flatIdx = store.categories.indexOf(cat);
      newFullOrder[flatIdx] = ds.liveOrder[scopedPos];
    });

    const finalFlatIdx = newFullOrder.indexOf(draggedID);
    if (finalFlatIdx !== -1 && finalFlatIdx !== originalFlatIdx) {
      store.moveCategories(originalFlatIdx, finalFlatIdx);
    }
  }, []);

  // Attach category drag handlers to window once on mount
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

  // ── Group drag handlers (live-row model) ──

  const handleGroupDragPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      // Snapshot heights of all group rows
      const heights: number[] = [];
      if (groupsContainerRef.current) {
        store.groups.forEach((_, i) => {
          const el = groupsContainerRef.current!.querySelector<HTMLElement>(`[data-group-idx="${i}"]`);
          heights.push(el ? el.getBoundingClientRect().height : 48);
        });
      } else {
        store.groups.forEach(() => heights.push(48));
      }

      groupDragPointerStartY.current = e.clientY;
      groupRowHeightsRef.current = heights;
      hasGroupDraggedRef.current = false;

      const liveOrder = store.groups.map(g => g.id);
      const newState = {
        idx,
        translateY: 0,
        liveOrder,
        originalOrder: [...liveOrder],
        rowHeight: heights[idx] ?? 48,
      };
      groupDragStateRef.current = newState;
      setGroupDragState(newState);
    },
    [store.groups],
  );

  const handleGroupDragPointerMove = useCallback((e: PointerEvent) => {
    const ds = groupDragStateRef.current;
    if (!ds) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    // Collapse groups on first move
    if (!hasGroupDraggedRef.current) {
      hasGroupDraggedRef.current = true;
      setExpandedGroupIDs(prev => {
        savedExpandedGroupIDsRef.current = new Set(prev);
        return new Set();
      });
    }

    const dy = e.clientY - groupDragPointerStartY.current;
    const count = ds.liveOrder.length;
    const draggedIdx = ds.liveOrder.indexOf(storeRef.current.groups[ds.idx]?.id ?? "");

    const GAP = 8;
    const offsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < count; i++) {
      offsets.push(acc);
      acc += (groupRowHeightsRef.current[i] ?? ds.rowHeight) + GAP;
    }

    const draggedOriginalOffset = offsets[draggedIdx] ?? 0;
    const draggedCurrentTop = draggedOriginalOffset + dy;
    const draggedMid = draggedCurrentTop + ds.rowHeight / 2;

    let newIdx = draggedIdx;
    for (let i = 0; i < count; i++) {
      if (i === draggedIdx) continue;
      const slotMid = offsets[i] + (groupRowHeightsRef.current[i] ?? ds.rowHeight) / 2;
      if (i < draggedIdx && draggedMid < slotMid) {
        newIdx = i;
        break;
      }
      if (i > draggedIdx && draggedMid > slotMid) {
        newIdx = i;
      }
    }

    let newLiveOrder = ds.liveOrder;
    if (newIdx !== draggedIdx) {
      newLiveOrder = [...ds.liveOrder];
      const [item] = newLiveOrder.splice(draggedIdx, 1);
      newLiveOrder.splice(newIdx, 0, item);
    }

    const next = { ...ds, translateY: dy, liveOrder: newLiveOrder };
    groupDragStateRef.current = next;
    setGroupDragState(next);
  }, []);

  const handleGroupDragPointerUp = useCallback(() => {
    const ds = groupDragStateRef.current;
    const didDrag = hasGroupDraggedRef.current;
    groupDragStateRef.current = null;
    hasGroupDraggedRef.current = false;
    setGroupDragState(null);

    if (didDrag) {
      setExpandedGroupIDs(savedExpandedGroupIDsRef.current);
    }

    if (!ds || ds.liveOrder.join() === ds.originalOrder.join()) return;

    const store = storeRef.current;
    const originalIdx = ds.originalOrder.indexOf(store.groups[ds.idx]?.id ?? "");
    const finalIdx = ds.liveOrder.indexOf(store.groups[ds.idx]?.id ?? "");
    if (originalIdx !== -1 && finalIdx !== -1 && originalIdx !== finalIdx) {
      store.moveGroups(originalIdx, finalIdx);
    }
  }, []);

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
          className="rounded-t-3xl max-h-[90dvh]"
          initialFocus={sheetFocusSentinelRef}
          style={{
            backgroundColor: "var(--color-surface-background)",
            boxShadow: "var(--elevation-sheet)",
          }}
        >
          {/* Inner scroll container */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto max-h-[90dvh]"
          >
            {/* Focus sentinel — absorbs auto-focus on open so no button appears focused */}
            <div ref={sheetFocusSentinelRef} tabIndex={-1} className="sr-only" aria-hidden />
            {/* Header */}
            <SheetHeader
              className="flex flex-row items-center justify-between px-5 pb-3 pt-4"
            >
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
                        {(() => {
                          // Use liveOrder for rendering when a group drag is active
                          const orderedGroups = groupDragState
                            ? groupDragState.liveOrder.map(id => store.groups.find(g => g.id === id)!).filter(Boolean)
                            : store.groups;
                          const draggingGroupID = groupDragState
                            ? store.groups[groupDragState.idx]?.id
                            : null;

                          return orderedGroups.map((group, groupVisualIdx) => {
                            const isExpanded = expandedGroupIDs.has(group.id);
                            const groupCategories = store.categories.filter(c => c.groupID === group.id);
                            const isGroupDragging = group.id === draggingGroupID;

                            // Compute translateY for this group row
                            let groupTranslateY = 0;
                            if (groupDragState) {
                              if (isGroupDragging) {
                                groupTranslateY = groupDragState.translateY;
                              } else {
                                // Shift non-dragged rows to fill the gap
                                const origIdx = groupDragState.originalOrder.indexOf(group.id);
                                const liveIdx = groupDragState.liveOrder.indexOf(group.id);
                                const draggedOrigIdx = groupDragState.originalOrder.indexOf(draggingGroupID ?? "");
                                if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
                                  // Row shifted — apply offset equal to the dragged row's height + gap
                                  const dir = liveIdx > origIdx ? -1 : 1;
                                  const h = groupRowHeightsRef.current[draggedOrigIdx] ?? groupDragState.rowHeight;
                                  groupTranslateY = dir * (h + 8);
                                }
                              }
                            }

                            return (
                              <div
                                key={group.id}
                                data-group-idx={groupVisualIdx}
                                className="rounded-xl overflow-hidden"
                                style={{
                                  boxShadow: isGroupDragging
                                    ? `0 8px 24px rgba(0,0,0,0.22), inset 0 0 0 1.5px rgba(var(--color-brand-deep-green-rgb), 0.15)`
                                    : `inset 0 0 0 1.5px rgba(var(--color-brand-deep-green-rgb), 0.15)`,
                                  transform: `translateY(${groupTranslateY}px)`,
                                  transition: isGroupDragging
                                    ? "box-shadow 120ms ease"
                                    : "transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms ease",
                                  zIndex: isGroupDragging ? 10 : undefined,
                                  position: "relative",
                                  scale: isGroupDragging ? "1.01" : "1",
                                }}
                              >
                                {/* Group header */}
                                <div
                                  className="flex items-center gap-2.5 px-3 py-2.5 select-none"
                                  style={{
                                    backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
                                  }}
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

                                  {/* Chevron — dedicated button for toggling expand/collapse */}
                                  <button
                                    className="flex items-center justify-center p-1 -m-1 shrink-0 rounded-md transition-all active:opacity-50"
                                    style={{ touchAction: "manipulation" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(group.id);
                                    }}
                                    aria-label={isExpanded ? `Collapse ${group.name}` : `Expand ${group.name}`}
                                    aria-expanded={isExpanded}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                      style={{
                                        color: "var(--color-brand-teal)",
                                        opacity: 0.75,
                                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                        transition: "transform 200ms ease-out",
                                      }}>
                                      <path d="M9 18l6-6-6-6" />
                                    </svg>
                                  </button>

                                  {/* Group name — also acts as a tap target for toggling */}
                                  <button
                                    className="flex-1 text-left text-sm font-semibold tracking-[-0.01em] py-0.5"
                                    style={{ color: "var(--color-text-primary)", touchAction: "manipulation" }}
                                    onClick={() => toggleGroup(group.id)}
                                  >
                                    {group.name}
                                  </button>

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
                                      {(() => {
                                        // Render in liveOrder if this group is being dragged within
                                        const scopedDS = catDragState?.groupID === group.id ? catDragState : null;
                                        const draggingCatID = scopedDS
                                          ? store.categories[scopedDS.flatIdx]?.id
                                          : null;
                                        const orderedCats = scopedDS
                                          ? scopedDS.liveOrder.map(id => store.categories.find(c => c.id === id)!).filter(Boolean)
                                          : groupCategories;

                                        return orderedCats.map((category, visualIdx) => {
                                          const flatIdx = store.categories.indexOf(category);
                                          const isDragging = category.id === draggingCatID;

                                          let catTranslateY = 0;
                                          if (scopedDS) {
                                            if (isDragging) {
                                              catTranslateY = scopedDS.translateY;
                                            } else {
                                              const origIdx = scopedDS.originalOrder.indexOf(category.id);
                                              const liveIdx = scopedDS.liveOrder.indexOf(category.id);
                                              if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
                                                const dir = liveIdx > origIdx ? -1 : 1;
                                                catTranslateY = dir * (scopedDS.rowHeight + 4);
                                              }
                                            }
                                          }

                                          return (
                                            <div
                                              key={category.id}
                                              data-cat-idx={flatIdx}
                                              className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
                                              style={{
                                                transform: `translateY(${catTranslateY}px)`,
                                                transition: isDragging
                                                  ? "box-shadow 120ms ease"
                                                  : "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
                                                boxShadow: isDragging
                                                  ? "0 4px 16px rgba(0,0,0,0.18)"
                                                  : undefined,
                                                zIndex: isDragging ? 10 : undefined,
                                                position: "relative",
                                                backgroundColor: isDragging
                                                  ? "var(--color-surface-card)"
                                                  : undefined,
                                                scale: isDragging ? "1.02" : "1",
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
                                          );
                                        });
                                      })()}
                                      {groupCategories.length === 0 && (
                                        <p className="text-xs py-2 pl-1" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
                                          No categories yet
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* No Group section */}
                      {(() => {
                        const ungrouped = store.categories.filter(c => !c.groupID);
                        if (ungrouped.length === 0) return null;
                        const scopedDS = catDragState?.groupID === null ? catDragState : null;
                        const draggingCatID = scopedDS ? store.categories[scopedDS.flatIdx]?.id : null;
                        const orderedUngrouped = scopedDS
                          ? scopedDS.liveOrder.map(id => store.categories.find(c => c.id === id)!).filter(Boolean)
                          : ungrouped;
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
                              {orderedUngrouped.map((category, visualIdx) => {
                                const flatIdx = store.categories.indexOf(category);
                                const isDragging = category.id === draggingCatID;

                                let catTranslateY = 0;
                                if (scopedDS) {
                                  if (isDragging) {
                                    catTranslateY = scopedDS.translateY;
                                  } else {
                                    const origIdx = scopedDS.originalOrder.indexOf(category.id);
                                    const liveIdx = scopedDS.liveOrder.indexOf(category.id);
                                    if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
                                      const dir = liveIdx > origIdx ? -1 : 1;
                                      catTranslateY = dir * (scopedDS.rowHeight + 4);
                                    }
                                  }
                                }

                                return (
                                  <div
                                    key={category.id}
                                    data-cat-idx={flatIdx}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                                    style={{
                                      backgroundColor: isDragging
                                        ? "var(--color-surface-card)"
                                        : `rgba(var(--color-brand-deep-green-rgb), 0.07)`,
                                      transform: `translateY(${catTranslateY}px)`,
                                      transition: isDragging
                                        ? "box-shadow 120ms ease"
                                        : "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
                                      boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.18)" : undefined,
                                      zIndex: isDragging ? 10 : undefined,
                                      position: "relative",
                                      scale: isDragging ? "1.02" : "1",
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
                    {(() => {
                      const scopedDS = catDragState?.groupID === null ? catDragState : null;
                      const draggingCatID = scopedDS ? store.categories[scopedDS.flatIdx]?.id : null;
                      const orderedCats = scopedDS
                        ? scopedDS.liveOrder.map(id => store.categories.find(c => c.id === id)!).filter(Boolean)
                        : store.categories;

                      return orderedCats.map((category, idx) => {
                        const flatIdx = store.categories.indexOf(category);
                        const isDragging = category.id === draggingCatID;

                        let catTranslateY = 0;
                        if (scopedDS) {
                          if (isDragging) {
                            catTranslateY = scopedDS.translateY;
                          } else {
                            const origIdx = scopedDS.originalOrder.indexOf(category.id);
                            const liveIdx = scopedDS.liveOrder.indexOf(category.id);
                            if (origIdx !== -1 && liveIdx !== -1 && origIdx !== liveIdx) {
                              const dir = liveIdx > origIdx ? -1 : 1;
                              catTranslateY = dir * (scopedDS.rowHeight + 4);
                            }
                          }
                        }

                        return (
                          <li
                            key={category.id}
                            data-cat-idx={flatIdx}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                            style={{
                              backgroundColor: isDragging
                                ? "var(--color-surface-card)"
                                : `rgba(var(--color-brand-deep-green-rgb), 0.07)`,
                              transform: `translateY(${catTranslateY}px)`,
                              transition: isDragging
                                ? "box-shadow 120ms ease"
                                : "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
                              boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.18)" : undefined,
                              zIndex: isDragging ? 10 : undefined,
                              position: "relative",
                              scale: isDragging ? "1.02" : "1",
                            }}
                          >
                            <div
                              className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                              onPointerDown={(e) => handleDragPointerDown(e, idx, null)}
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
                        );
                      });
                    })()}
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
          </div>{/* end inner scroll container */}
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
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium px-0.5" style={{ color: "var(--color-text-secondary)" }}>
                Group
              </p>
              <div className="flex flex-wrap gap-2">
                {/* "No Group" option */}
                <button
                  type="button"
                  onClick={() => setAddCategoryGroupID(null)}
                  className="h-9 rounded-xl px-3 text-sm font-medium transition-colors"
                  style={{
                    touchAction: "manipulation",
                    backgroundColor: addCategoryGroupID === null
                      ? "var(--color-brand-green)"
                      : "var(--color-surface-input)",
                    color: addCategoryGroupID === null
                      ? "#fff"
                      : "var(--color-text-secondary)",
                  }}
                >
                  No Group
                </button>
                {store.groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setAddCategoryGroupID(group.id)}
                    className="h-9 rounded-xl px-3 text-sm font-medium transition-colors"
                    style={{
                      touchAction: "manipulation",
                      backgroundColor: addCategoryGroupID === group.id
                        ? "var(--color-brand-green)"
                        : "var(--color-surface-input)",
                      color: addCategoryGroupID === group.id
                        ? "#fff"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
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
