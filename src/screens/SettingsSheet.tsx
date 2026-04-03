// src/screens/SettingsSheet.tsx
// Top-level settings bottom-sheet — composes extracted section components.

import { useRef } from "react";
import type { JSX } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";
import {
  CategoriesGroupsSection,
  AppearanceSection,
  TextSizeSection,
  NameSection,
  SyncSection,
  DataSection,
  SettingsDialogPortal,
  useCategoryDrag,
  useGroupDrag,
  useSettingsDialogs,
} from "@/features/settings";

// MARK: - Props

/** Props for the {@link SettingsSheet} component. */
interface SettingsSheetProps {
  /** Whether the sheet is open. */
  isOpen: boolean;
  /** Callback to toggle the sheet open/closed. */
  onOpenChange: (open: boolean) => void;
}

// MARK: - Component

/**
 * Full-screen bottom sheet containing all application settings.
 *
 * Composes CategoriesGroupsSection, AppearanceSection, TextSizeSection,
 * NameSection, SyncSection, DataSection, and associated dialogs.
 */
export function SettingsSheet({ isOpen, onOpenChange }: SettingsSheetProps): JSX.Element {
  const store = useCategoriesStore();
  const settings = useSettingsStore();
  const sync = useSyncStore();

  const catDrag = useCategoryDrag(store.categories, store.reorderCategories);
  const groupDrag = useGroupDrag(store.groups, store.moveGroups);
  const d = useSettingsDialogs(() => onOpenChange(false));

  const sheetFocusSentinelRef = useRef<HTMLDivElement>(null);

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
          <div className="overflow-y-auto max-h-[90dvh]">
            <div ref={sheetFocusSentinelRef} tabIndex={-1} className="sr-only" aria-hidden />

            <SheetHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-4">
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
              <CategoriesGroupsSection
                categories={store.categories}
                groups={store.groups}
                canDeleteCategories={store.canDeleteCategories}
                catDragState={catDrag.catDragState}
                catContainerRef={catDrag.catContainerRef}
                listRef={catDrag.listRef}
                handleDragPointerDown={catDrag.handleDragPointerDown}
                groupDragState={groupDrag.groupDragState}
                groupsContainerRef={groupDrag.groupsContainerRef}
                handleGroupDragPointerDown={groupDrag.handleGroupDragPointerDown}
                expandedGroupIDs={groupDrag.expandedGroupIDs}
                toggleGroup={groupDrag.toggleGroup}
                onRenameCategory={d.openRenameCategory}
                onDeleteCategory={d.openDeleteCategory}
                onRenameGroup={d.openRenameGroup}
                onDeleteGroup={d.openDeleteGroup}
                onAssignGroup={d.openGroupAssignment}
                onOpenAddSheet={d.openAddActionSheet}
              />
              <AppearanceSection
                appearanceMode={settings.appearanceMode}
                onChangeMode={settings.setAppearanceMode}
              />
              <TextSizeSection
                textSize={settings.textSize}
                onChangeSize={settings.setTextSize}
              />
              <NameSection
                userName={settings.userName}
                onChangeName={settings.setUserName}
              />
              <SyncSection
                isSyncEnabled={sync.isSyncEnabled}
                syncCode={sync.syncCode}
                syncStatus={sync.syncStatus}
                onEnableSync={sync.enableSync}
                onDisableSync={sync.disableSync}
                onAdoptSyncCode={sync.adoptSyncCode}
              />
              <DataSection onReset={d.handleReset} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <SettingsDialogPortal d={d} groups={store.groups} />
    </>
  );
}
