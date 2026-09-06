import { StyleSheet, View } from "react-native";

import { Text } from "../../components";
import { spacing, touchTarget } from "../../theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text role="title" style={styles.title}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Text
          accessibilityRole="button"
          onPress={onAction}
          role="label"
          style={styles.action}
          tone="positive"
        >
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  action: {
    minHeight: touchTarget.minimum,
    paddingVertical: spacing.sm,
  },
});
