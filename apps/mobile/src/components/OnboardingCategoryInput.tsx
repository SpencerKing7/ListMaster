// src/components/OnboardingCategoryInput.tsx — Category input + pending list for onboarding setup.
import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import { capitalizeWords } from "@/lib/utils";

interface OnboardingCategoryInputProps {
  categories: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

/** Category input field with add button and pending category list. */
export function OnboardingCategoryInput({
  categories,
  onAdd,
  onRemove,
}: OnboardingCategoryInputProps) {
  const { theme } = useSettingsStore();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const trimmed = text.trim();

  function addCategory(): void {
    if (!trimmed) return;
    if (categories.some((n) => n.toLowerCase() === trimmed.toLowerCase()))
      return;
    onAdd(trimmed);
    setText("");
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.brandTeal }]}>
        Categories
      </Text>

      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceInput,
              color: theme.textPrimary,
              borderColor: theme.borderSubtle,
            },
          ]}
          placeholder="e.g., Groceries, Tasks…"
          placeholderTextColor={theme.textSecondary}
          value={text}
          onChangeText={(val) => setText(capitalizeWords(val))}
          onSubmitEditing={addCategory}
          autoCapitalize="words"
          returnKeyType="send"
        />
        <Pressable
          onPress={addCategory}
          disabled={trimmed.length === 0}
          style={styles.addButton}
        >
          <Svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
            stroke="none"
          >
            <Circle
              cx="12"
              cy="12"
              r="10"
              fill={trimmed.length === 0 ? theme.borderSubtle : theme.brandGreen}
            />
            <Line
              x1="12"
              y1="8"
              x2="12"
              y2="16"
              stroke={theme.textOnBrand}
              strokeWidth={2}
            />
            <Line
              x1="8"
              y1="12"
              x2="16"
              y2="12"
              stroke={theme.textOnBrand}
              strokeWidth={2}
            />
          </Svg>
        </Pressable>
      </View>

      {categories.length > 0 && (
        <View style={styles.list}>
          {categories.map((name) => (
            <View
              key={name}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.surfaceInput,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="none"
              >
                <Circle cx="12" cy="12" r="10" fill={theme.brandGreen} />
                <Polyline
                  points="9,12 11,14 15,10"
                  stroke={theme.textOnBrand}
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>
              <Text
                style={[styles.chipText, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Pressable onPress={() => onRemove(name)} hitSlop={8}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" fill={theme.borderSubtle} />
                  <Line
                    x1="8"
                    y1="8"
                    x2="16"
                    y2="16"
                    stroke={theme.textSecondary}
                    strokeWidth={2}
                  />
                  <Line
                    x1="16"
                    y1="8"
                    x2="8"
                    y2="16"
                    stroke={theme.textSecondary}
                    strokeWidth={2}
                  />
                </Svg>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    flex: 1,
    fontSize: 14,
  },
});
