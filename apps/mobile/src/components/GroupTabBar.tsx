// src/components/GroupTabBar.tsx — Horizontally-scrollable group tab bar with animated underline.
import { useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { HapticService } from "@/services/hapticService";

interface GroupTabBarProps {
  groups: { id: string; name: string; sortOrder: number }[];
  selectedGroupID: string | null;
  onSelectGroup: (id: string | null) => void;
}

/** Horizontally-scrollable group tab bar. An Animated underline slides to the active tab. */
export function GroupTabBar({ groups, selectedGroupID, onSelectGroup }: GroupTabBarProps) {
  const { theme } = useSettingsStore();
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const allTabs = [{ id: null as string | null, name: "All" }, ...sortedGroups.map(g => ({ id: g.id as string | null, name: g.name }))];

  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);

  function moveUnderline(index: number) {
    const layout = tabLayouts.current[index];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(underlineX, { toValue: layout.x, useNativeDriver: false, tension: 300, friction: 28 }),
      Animated.spring(underlineW, { toValue: layout.width, useNativeDriver: false, tension: 300, friction: 28 }),
    ]).start();
  }

  const activeIndex = selectedGroupID === null ? 0 : sortedGroups.findIndex(g => g.id === selectedGroupID) + 1;

  useEffect(() => {
    moveUnderline(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {allTabs.map((tab, index) => {
          const isSelected = tab.id === selectedGroupID;
          return (
            <Pressable
              key={tab.id ?? "__all__"}
              onLayout={(e) => {
                tabLayouts.current[index] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
                if (index === activeIndex) moveUnderline(index);
              }}
              onPress={() => {
                onSelectGroup(tab.id);
                HapticService.selection();
              }}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? theme.brandGreen : theme.textSecondary, fontWeight: isSelected ? "600" : "500" },
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}

        <Animated.View
          style={[
            styles.underline,
            { backgroundColor: theme.brandGreen, left: underlineX, width: underlineW },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    gap: 4,
    paddingBottom: 6,
    position: "relative",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 14,
  },
  underline: {
    position: "absolute",
    bottom: 3,
    height: 2,
    borderRadius: 1,
  },
});
