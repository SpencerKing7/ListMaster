// src/components/primitives/Dialog.tsx — Modal dialog with backdrop and animated card.
import { useEffect, useRef } from "react";
import { type ReactNode } from "react";
import {
  Modal,
  Text,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: ReactNode;
}

/** Centered modal dialog with animated entrance and semi-opaque backdrop. */
export function Dialog({ visible, onDismiss, title, children }: DialogProps) {
  const { theme } = useSettingsStore();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 280, friction: 22 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.surfaceOverlay }]} onPress={onDismiss}>
        <Pressable onPress={() => undefined}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: theme.surfaceCard, borderColor: theme.borderDialog },
              { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
            ]}
          >
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
            {children}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 340,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
