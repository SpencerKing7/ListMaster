// src/components/primitives/Button.tsx — Pressable button with press-scale feedback.
import { Pressable, Text, StyleSheet, type PressableProps, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

/** Pressable button with variant styling and press-scale animation. */
export function Button({ children, variant = "primary", style, textStyle, fullWidth, ...props }: ButtonProps) {
  const { theme } = useSettingsStore();

  const bgColor = (() => {
    if (variant === "primary") return theme.brandGreen;
    if (variant === "secondary") return theme.surfaceInput;
    if (variant === "danger") return `rgba(${hexToRgb(theme.danger)}, 0.12)`;
    return "transparent";
  })();

  const textColor = (() => {
    if (variant === "primary") return theme.textOnBrand;
    if (variant === "danger") return theme.danger;
    if (variant === "ghost") return theme.textSecondary;
    return theme.textPrimary;
  })();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: bgColor, opacity: pressed ? 0.82 : props.disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text style={[styles.text, { color: textColor }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
