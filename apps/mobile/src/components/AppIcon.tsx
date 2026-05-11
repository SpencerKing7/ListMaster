// src/components/AppIcon.tsx — Branded checklist icon used in splash and welcome screens.
import { View } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";

interface AppIconProps {
  size?: number;
}

/** Rounded square app icon with a checklist SVG. */
export function AppIcon({ size = 96 }: AppIconProps) {
  const { theme } = useSettingsStore();
  const radius = Math.round(size * 0.27);
  const iconSize = Math.round(size * 0.5);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: theme.brandGreen,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.brandGreen,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <Svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.textOnBrand}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Line x1="9" y1="6" x2="20" y2="6" />
        <Line x1="9" y1="12" x2="20" y2="12" />
        <Line x1="9" y1="18" x2="20" y2="18" />
        <Polyline points="4,6 5,7 7,5" />
        <Polyline points="4,12 5,13 7,11" />
        <Polyline points="4,18 5,19 7,17" />
      </Svg>
    </View>
  );
}
