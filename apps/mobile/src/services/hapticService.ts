// src/services/hapticService.ts — Haptic feedback service wrapping expo-haptics.
import * as Haptics from "expo-haptics";

/**
 * HapticService provides iOS-equivalent haptic feedback via expo-haptics.
 * Maps to UIImpactFeedbackGenerator and UINotificationFeedbackGenerator.
 */
export const HapticService = {
  light: () =>
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () =>
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () =>
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => void Haptics.selectionAsync(),
};
