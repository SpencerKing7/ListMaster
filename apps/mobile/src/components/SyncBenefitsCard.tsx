// src/components/SyncBenefitsCard.tsx — Card listing sync benefits on the onboarding sync screen.
import { View, Text, Animated, StyleSheet } from "react-native";
import Svg, { Path, Polyline, Line, Rect } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";

interface SyncFeatureRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function SyncFeatureRow({ icon, title, subtitle }: SyncFeatureRowProps) {
  const { theme } = useSettingsStore();
  return (
    <View style={styles.featureRow}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

interface SyncBenefitsCardProps {
  animValue: Animated.Value;
}

/** Animated card with three cloud-sync benefit rows. */
export function SyncBenefitsCard({ animValue }: SyncBenefitsCardProps) {
  const { theme } = useSettingsStore();

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceCard,
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <SyncFeatureRow
        icon={
          <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.brandTeal}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Polyline points="16,16 12,12 8,16" />
            <Line x1="12" y1="12" x2="12" y2="21" />
            <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </Svg>
        }
        title="Automatic cloud backup"
        subtitle="Your lists are safely stored online"
      />
      <SyncFeatureRow
        icon={
          <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.brandTeal}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <Line x1="12" y1="18" x2="12.01" y2="18" />
          </Svg>
        }
        title="Access from any device"
        subtitle="Sync seamlessly across all your devices"
      />
      <SyncFeatureRow
        icon={
          <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.brandTeal}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </Svg>
        }
        title="Private to you — no account needed"
        subtitle="Secure and anonymous cloud storage"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 32,
    marginTop: 32,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 32,
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  featureSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
});
