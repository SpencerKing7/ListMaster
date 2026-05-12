// src/features/settings/components/SegmentedControl.tsx
// Generic segmented control (radio-group) used for Appearance, Color, Text Size.
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill-style segmented control matching the web ToggleGroup. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: `${theme.brandDeepGreen}1f` },
      ]}
    >
      {segments.map((seg) => {
        const isSelected = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => onChange(seg.value)}
            style={({ pressed }) => [
              styles.segment,
              isSelected && {
                backgroundColor: theme.surfaceCard,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
              },
              !isSelected && pressed && { opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? theme.brandGreen : theme.textSecondary,
                  fontWeight: isSelected ? "600" : "500",
                },
              ]}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  segment: {
    flex: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
  },
  label: {
    fontSize: 12,
  },
});
