/**
 * HapticService provides iOS-equivalent haptic feedback using the Vibration API.
 * This is the closest web equivalent to UIImpactFeedbackGenerator.
 */
export const HapticService = {
  light: () => navigator.vibrate?.(8),
  medium: () => navigator.vibrate?.(15),
  heavy: () => navigator.vibrate?.(25),
  success: () => navigator.vibrate?.([8, 40, 8]),
  error: () => navigator.vibrate?.(40),
  selection: () => navigator.vibrate?.(4),
};
