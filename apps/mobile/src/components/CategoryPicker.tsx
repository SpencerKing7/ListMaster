// src/components/CategoryPicker.tsx — Horizontally-scrollable pill row for selecting the active category.
import { useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";

/** Horizontally scrollable pill row for selecting a category. */
export function CategoryPicker() {
  const { theme } = useSettingsStore();
  const { pickerCategories, selectedCategoryID, selectCategory, groups, selectedGroupID } = useCategoriesStore();
  const scrollRef = useRef<ScrollView>(null);
  const pillLayouts = useRef<Record<string, number>>({});

  // MARK: - Scroll selected pill into center
  useEffect(() => {
    const x = pillLayouts.current[selectedCategoryID ?? ""];
    if (x == null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ x: Math.max(0, x - 60), animated: true });
  }, [selectedCategoryID]);

  const isAllView = selectedGroupID === null && groups.length > 0;

  if (pickerCategories.length === 0) {
    return (
      <View style={[styles.emptyPill, { backgroundColor: `rgba(26,94,75,0.12)` }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No lists in this group yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { marginTop: groups.length > 0 ? 8 : 0 }]}>
      {/* Background track */}
      <View style={[styles.track, { backgroundColor: `rgba(26,94,75,0.12)` }]} />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {pickerCategories.map(({ category, isUngrouped }, index) => {
          const prevGroupID = index > 0 ? pickerCategories[index - 1].category.groupID : "__none__";
          const currGroupID = category.groupID;
          const isFirstOfSection = isAllView && (index === 0 || prevGroupID !== currGroupID);
          const isSelected = category.id === selectedCategoryID;

          return (
            <View key={category.id} style={styles.pillWrapper}>
              {/* Divider between groups in All view */}
              {isAllView && isFirstOfSection && index > 0 && (
                <View style={[styles.divider, { backgroundColor: `rgba(26,94,75,0.45)` }]} />
              )}

              <Pressable
                onLayout={(e) => {
                  pillLayouts.current[category.id] = e.nativeEvent.layout.x;
                }}
                onPress={() => {
                  selectCategory(category.id);
                  HapticService.selection();
                }}
                style={({ pressed }) => [
                  styles.pill,
                  isSelected
                    ? {
                        backgroundColor: theme.surfaceCard,
                        shadowColor: theme.brandDeepGreen,
                        shadowOpacity: 0.16,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                      }
                    : { backgroundColor: "transparent" },
                  { opacity: pressed ? 0.75 : isUngrouped ? (isSelected ? 0.65 : 0.55) : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isSelected ? theme.brandGreen : theme.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                      fontStyle: isUngrouped && !isSelected ? "italic" : "normal",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 6,
    borderRadius: 100,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  pillWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  divider: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  pill: {
    height: 28,
    borderRadius: 100,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 12,
  },
  emptyPill: {
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
