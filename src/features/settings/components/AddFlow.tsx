// src/features/settings/components/AddFlow.tsx
// ActionSheet + Dialog pair for the unified "Add Category or Group" flow.

import type { JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionSheet } from "@/components/ui/action-sheet";
import type { CategoryGroup } from "@/models/types";

// MARK: - Constants

const INPUT_CLASS =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

// MARK: - Props

interface AddFlowProps {
  isAddActionSheetOpen: boolean;
  onCloseAddActionSheet: () => void;
  addMode: "category" | "group" | null;
  onSetAddMode: (mode: "category" | "group" | null) => void;
  addCategoryName: string;
  onSetAddCategoryName: (name: string) => void;
  addCategoryGroupID: string | null;
  onSetAddCategoryGroupID: (id: string | null) => void;
  addGroupDialogName: string;
  onSetAddGroupDialogName: (name: string) => void;
  onAddCategoryConfirm: () => void;
  onAddGroupConfirm: () => void;
  groups: CategoryGroup[];
}

// MARK: - Component

/** ActionSheet + Dialog pair for the unified "Add Category or Group" flow. */
export function AddFlow({
  isAddActionSheetOpen,
  onCloseAddActionSheet,
  addMode,
  onSetAddMode,
  addCategoryName,
  onSetAddCategoryName,
  addCategoryGroupID,
  onSetAddCategoryGroupID,
  addGroupDialogName,
  onSetAddGroupDialogName,
  onAddCategoryConfirm,
  onAddGroupConfirm,
  groups,
}: AddFlowProps): JSX.Element {
  return (
    <>
      <ActionSheet
        isOpen={isAddActionSheetOpen}
        onClose={onCloseAddActionSheet}
        title="Add"
        actions={[
          {
            label: "Add a Category",
            onClick: () => {
              onCloseAddActionSheet();
              onSetAddCategoryGroupID(null);
              onSetAddCategoryName("");
              onSetAddMode("category");
            },
          },
          {
            label: "Add a Group",
            onClick: () => {
              onCloseAddActionSheet();
              onSetAddGroupDialogName("");
              onSetAddMode("group");
            },
          },
        ]}
      />

      {/* Add Category Dialog */}
      <Dialog
        open={addMode === "category"}
        onOpenChange={(open) => {
          if (!open) {
            onSetAddMode(null);
            onSetAddCategoryName("");
            onSetAddCategoryGroupID(null);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <Input
            value={addCategoryName}
            onChange={(e) => onSetAddCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (groups.length === 0) onAddCategoryConfirm();
              }
            }}
            placeholder="Category name"
            className={INPUT_CLASS}
            autoFocus
            autoCapitalize="words"
          />
          {groups.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium px-0.5" style={{ color: "var(--color-text-secondary)" }}>
                Group
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSetAddCategoryGroupID(null)}
                  className="h-9 rounded-xl px-3 text-sm font-medium transition-colors"
                  style={{
                    touchAction: "manipulation",
                    backgroundColor: addCategoryGroupID === null
                      ? "var(--color-brand-green)"
                      : "var(--color-surface-input)",
                    color: addCategoryGroupID === null ? "#fff" : "var(--color-text-secondary)",
                  }}
                >
                  No Group
                </button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onSetAddCategoryGroupID(group.id)}
                    className="h-9 rounded-xl px-3 text-sm font-medium transition-colors"
                    style={{
                      touchAction: "manipulation",
                      backgroundColor: addCategoryGroupID === group.id
                        ? "var(--color-brand-green)"
                        : "var(--color-surface-input)",
                      color: addCategoryGroupID === group.id ? "#fff" : "var(--color-text-primary)",
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
                onSetAddMode(null);
                onSetAddCategoryName("");
                onSetAddCategoryGroupID(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              disabled={addCategoryName.trim().length === 0}
              onClick={onAddCategoryConfirm}
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
            onSetAddMode(null);
            onSetAddGroupDialogName("");
          }
        }}
      >
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>New Group</DialogTitle>
          </DialogHeader>
          <Input
            value={addGroupDialogName}
            onChange={(e) => onSetAddGroupDialogName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onAddGroupConfirm(); }
            }}
            placeholder="Group name"
            className={INPUT_CLASS}
            autoFocus
            autoCapitalize="words"
          />
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                onSetAddMode(null);
                onSetAddGroupDialogName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              disabled={addGroupDialogName.trim().length === 0}
              onClick={onAddGroupConfirm}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
