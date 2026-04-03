// src/features/settings/index.ts
// Barrel export for the settings feature module.
// Only exports items consumed outside the feature (by SettingsSheet).

// ── Section components ──
export { AppearanceSection } from "./components/AppearanceSection";
export { TextSizeSection } from "./components/TextSizeSection";
export { NameSection } from "./components/NameSection";
export { SyncSection } from "./components/SyncSection";
export { DataSection } from "./components/DataSection";
export { CategoriesGroupsSection } from "./components/CategoriesGroupsSection";
export { SettingsDialogPortal } from "./components/SettingsDialogPortal";

// ── Hooks ──
export { useCategoryDrag } from "./hooks/useCategoryDrag";
export type {
  CatDragState,
  UseCategoryDragReturn,
} from "./hooks/useCategoryDrag";

export { useGroupDrag } from "./hooks/useGroupDrag";
export type { GroupDragState, UseGroupDragReturn } from "./hooks/useGroupDrag";

export { useSettingsDialogs } from "./hooks/useSettingsDialogs";
export type { UseSettingsDialogsReturn } from "./hooks/useSettingsDialogs";
