// app/(main)/settings.tsx — Dedicated settings screen.
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useCallback } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSyncStore } from "@/store/useSyncStore";
import { useCategoryDrag } from "@/features/settings/hooks/useCategoryDrag";
import { useGroupDrag } from "@/features/settings/hooks/useGroupDrag";
import { AppearanceSection } from "@/features/settings/components/AppearanceSection";
import { ColorThemeSection } from "@/features/settings/components/ColorThemeSection";
import { TextSizeSection } from "@/features/settings/components/TextSizeSection";
import { NameSection } from "@/features/settings/components/NameSection";
import { SyncSection } from "@/features/settings/components/SyncSection";
import { DataSection } from "@/features/settings/components/DataSection";
import { CategoriesGroupsSection } from "@/features/settings/components/CategoriesGroupsSection";

/** Full settings screen composing all settings sections. */
export default function SettingsScreen(): React.JSX.Element {
  const { theme, userName, appearanceMode, colorTheme, textSize, setUserName, setAppearanceMode, setColorTheme, setTextSize, resetToNewUser } = useSettingsStore();
  const { categories, groups, reorderCategories, moveGroups, resetCategories } = useCategoriesStore();
  const { isSyncEnabled, syncCode, syncStatus, syncedDeviceCount, enableSync, disableSync, adoptSyncCode } = useSyncStore();

  const handleReset = useCallback(() => {
    if (isSyncEnabled && syncCode) {
      const codeToDelete = syncCode;
      import("@/services/syncService").then(
        ({ ensureAnonymousAuth, deleteSyncData }) =>
          ensureAnonymousAuth()
            .then(() => deleteSyncData(codeToDelete))
            .catch((err: unknown) =>
              console.error("Failed to delete cloud data on reset:", err),
            ),
      );
    }
    void disableSync(false);
    resetCategories();
    resetToNewUser();
    router.replace("/");
  }, [isSyncEnabled, syncCode, disableSync, resetCategories, resetToNewUser]);
  const insets = useSafeAreaInsets();

  const {
    catDragState,
    isDraggingCat,
    onRowLayout,
    makeCatGesture,
    getCatTranslate,
  } = useCategoryDrag(categories, reorderCategories);

  const {
    groupDragState,
    isDraggingGroup,
    onGroupRowLayout,
    makeGroupGesture,
    getGroupTranslate,
    expandedGroupIDs,
    toggleGroup,
  } = useGroupDrag(groups, moveGroups);

  const isDragging = isDraggingCat || isDraggingGroup;

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceBackground }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.borderSubtle, backgroundColor: theme.surfaceBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.doneBtn,
            { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.doneBtnText, { color: theme.textSecondary }]}>Done</Text>
        </Pressable>
      </View>

      {/* Scrollable content — disabled during any drag so scroll doesn't fight gesture */}
      <ScrollView
        scrollEnabled={!isDragging}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <CategoriesGroupsSection
          categories={categories}
          groups={groups}
          catDragState={catDragState}
          groupDragState={groupDragState}
          makeCatGesture={makeCatGesture}
          getCatTranslate={getCatTranslate}
          makeGroupGesture={makeGroupGesture}
          getGroupTranslate={getGroupTranslate}
          onRowLayout={onRowLayout}
          onGroupRowLayout={onGroupRowLayout}
          expandedGroupIDs={expandedGroupIDs}
          toggleGroup={toggleGroup}
        />
        <AppearanceSection appearanceMode={appearanceMode} onChangeMode={setAppearanceMode} />
        <ColorThemeSection colorTheme={colorTheme} onChangeTheme={setColorTheme} />
        <TextSizeSection textSize={textSize} onChangeSize={setTextSize} />
        <NameSection userName={userName} onChangeName={setUserName} />
        <SyncSection
          isSyncEnabled={isSyncEnabled}
          syncCode={syncCode}
          syncStatus={syncStatus}
          syncedDeviceCount={syncedDeviceCount}
          onEnableSync={enableSync}
          onDisableSync={disableSync}
          onAdoptSyncCode={adoptSyncCode}
        />
        <DataSection onReset={handleReset} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
});
