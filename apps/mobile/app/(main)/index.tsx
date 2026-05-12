// app/(main)/index.tsx — Main checklist screen: header, category panel, bottom bar.
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { HeaderBar } from "@/components/HeaderBar";
import { BottomBar } from "@/components/BottomBar";
import { CategoryPanel } from "@/components/CategoryPanel";
import { useCategoriesStore } from "@/store/useCategoriesStore";

/** Main checklist screen. */
export default function MainScreen(): React.JSX.Element {
  const { theme } = useSettingsStore();
  const { reload } = useCategoriesStore();

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.surfaceBackground }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.flex, { backgroundColor: theme.surfaceBackground }]}>
          <HeaderBar onRefresh={reload} />
          <View style={styles.content}>
            <CategoryPanel />
          </View>
          <BottomBar />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1 },
});
