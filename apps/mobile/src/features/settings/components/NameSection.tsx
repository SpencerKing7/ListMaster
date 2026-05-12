// src/features/settings/components/NameSection.tsx
import { TextInput, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { capitalizeWords } from "@/lib/utils";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

interface NameSectionProps {
  userName: string;
  onChangeName: (name: string) => void;
}

/** Settings card containing the user name text input. */
export function NameSection({ userName, onChangeName }: NameSectionProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <SettingsCard>
      <SectionLabel>Name</SectionLabel>
      <TextInput
        value={userName}
        onChangeText={(text) => onChangeName(capitalizeWords(text))}
        placeholder="Your name"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="words"
        returnKeyType="done"
        style={[
          styles.input,
          {
            color: theme.textPrimary,
            backgroundColor: theme.surfaceInput,
            borderColor: theme.borderSubtle,
          },
        ]}
      />
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
});
