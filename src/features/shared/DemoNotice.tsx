import { StyleSheet, View } from "react-native";

import { Text } from "../../components";
import { colors, radii, spacing } from "../../theme";

export function DemoNotice() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <View style={styles.dot} />
      <Text role="caption" tone="secondary">
        Datos de demostración
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
