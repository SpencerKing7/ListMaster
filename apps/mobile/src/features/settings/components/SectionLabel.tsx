// src/features/settings/components/SectionLabel.tsx
import { Text, View, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface SectionLabelProps {
  children: string;
}

/** Small uppercase teal label at the top of each settings card. */
export function SectionLabel({ children }: SectionLabelProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <View style={[styles.pill, { backgroundColor: `${theme.brandTeal}14` }]}>
      <Text style={[styles.text, { color: theme.brandTeal }]}>{children.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
});
