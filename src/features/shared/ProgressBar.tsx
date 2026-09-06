import { StyleSheet, View } from "react-native";

import { colors, radii } from "../../theme";

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: "positive" | "warning" | "negative" | "info";
}

const toneColors = {
  positive: colors.positive,
  warning: colors.warning,
  negative: colors.negative,
  info: colors.info,
} as const;

export function ProgressBar({
  value,
  label,
  tone = "positive",
}: ProgressBarProps) {
  const normalized = Math.min(Math.max(value, 0), 100);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(normalized) }}
      style={styles.track}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: toneColors[tone], width: `${normalized}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
