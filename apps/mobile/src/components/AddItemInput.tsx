// src/components/AddItemInput.tsx — Always-visible input row for adding new checklist items.
import { useState, useRef, useEffect } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import Svg, { Line } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";
import { capitalizeFirst } from "@/lib/utils";

interface AddItemInputProps {
  focusOnMount?: boolean;
}

/** Compact, always-visible input row for adding new items. */
export function AddItemInput({ focusOnMount = false }: AddItemInputProps) {
  const { theme, textSizeSp } = useSettingsStore();
  const store = useCategoriesStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!focusOnMount) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trimmedName = newItemName.trim();

  function addItem(): void {
    if (!trimmedName || !store.selectedCategory) return;
    store.addItemToSelectedCategory(trimmedName);
    setNewItemName("");
    HapticService.light();
    // Blur + re-focus resets iOS shift key capitalization
    inputRef.current?.blur();
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: `rgba(26,94,75,0.07)`,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.brandGreen} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <Line x1={12} y1={5} x2={12} y2={19} />
          <Line x1={5} y1={12} x2={19} y2={12} />
        </Svg>

        <TextInput
          ref={inputRef}
          placeholder="Add an item…"
          placeholderTextColor={theme.textPlaceholder}
          value={newItemName}
          onChangeText={(val) => setNewItemName(capitalizeFirst(val))}
          onSubmitEditing={addItem}
          style={[styles.input, { color: theme.textPrimary, fontSize: textSizeSp }]}
          returnKeyType="send"
          autoCapitalize="sentences"
          blurOnSubmit={false}
        />

        {trimmedName.length > 0 && (
          <Pressable
            onPress={addItem}
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: theme.brandGreen, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={12} y1={5} x2={12} y2={19} />
              <Line x1={5} y1={12} x2={19} y2={12} />
            </Svg>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontWeight: "500",
    paddingVertical: 0,
  },
  submitButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
