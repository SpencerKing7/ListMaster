// src/components/ListMetaBar.tsx — Row above the item list with check-all toggle, item count, and sort controls.
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Polyline, Path } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import { HapticService } from "@/services/hapticService";
import type { SortOrder, SortDirection } from "@/models/types";

interface ListMetaBarProps {
  itemCount: number;
  allChecked: boolean;
  sortOrder: SortOrder;
  sortDirection: SortDirection;
  onCheckAll: () => void;
  onUncheckAll: () => void;
  onChangeSortOrder: (next: SortOrder) => void;
  onChangeSortDirection: (next: SortDirection) => void;
}

/** Renders check-all button + item count (left) and sort controls (right). */
export function ListMetaBar({
  itemCount,
  allChecked,
  sortOrder,
  sortDirection,
  onCheckAll,
  onUncheckAll,
  onChangeSortOrder,
  onChangeSortDirection,
}: ListMetaBarProps) {
  const { theme } = useSettingsStore();

  return (
    <View style={styles.container}>
      {/* Left: check-all + count */}
      <View style={styles.left}>
        <Pressable
          onPress={() => {
            if (allChecked) onUncheckAll(); else onCheckAll();
            HapticService.medium();
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          {allChecked ? (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={10} fill={theme.brandGreen} />
              <Polyline points="9,12 11,14 15,10" stroke="white" strokeWidth={2.2} />
            </Svg>
          ) : (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={10} stroke={theme.brandTeal} strokeOpacity={0.8} />
            </Svg>
          )}
        </Pressable>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Text>
      </View>

      {/* Right: sort controls */}
      <View style={styles.right}>
        {/* Sort order */}
        <Pressable
          onPress={() => {
            onChangeSortOrder(sortOrder === "date" ? "alpha" : "date");
            HapticService.light();
          }}
          style={({ pressed }) => [styles.sortButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 6h18M7 12h10M11 18h2" />
          </Svg>
          <Text style={[styles.sortText, { color: theme.textSecondary }]}>
            {sortOrder === "alpha" ? "A–Z" : "Date Added"}
          </Text>
        </Pressable>

        <Text style={[styles.divider, { color: theme.textSecondary }]}>|</Text>

        {/* Sort direction */}
        <Pressable
          onPress={() => {
            onChangeSortDirection(sortDirection === "asc" ? "desc" : "asc");
            HapticService.light();
          }}
          style={({ pressed }) => [styles.sortButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.textSecondary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: [{ scaleY: sortDirection === "desc" ? -1 : 1 }] }}
          >
            <Path d="M12 5v14M5 12l7-7 7 7" />
          </Svg>
          <Text style={[styles.sortText, { color: theme.textSecondary }]}>
            {sortDirection === "asc" ? "Asc" : "Desc"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  count: {
    fontSize: 12,
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    fontSize: 11,
    opacity: 0.3,
  },
});
