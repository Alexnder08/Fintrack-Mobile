import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";

import { colors, spacing } from "../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export type StateViewKind = "loading" | "empty" | "error" | "offline";

export interface StateViewProps extends ViewProps {
  kind: StateViewKind;
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function StateView({
  kind,
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
  ...props
}: StateViewProps) {
  const isLoading = kind === "loading";

  return (
    <View
      accessibilityLiveRegion={
        kind === "error" || kind === "offline" ? "assertive" : "polite"
      }
      accessibilityRole={kind === "error" ? "alert" : undefined}
      style={[styles.container, style]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        icon
      )}
      <View style={styles.copy}>
        <Text
          align="center"
          role="title"
          tone={kind === "error" ? "negative" : "primary"}
        >
          {title}
        </Text>
        {description ? (
          <Text align="center" role="bodySmall" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {!isLoading && actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={kind === "error" ? "outline" : "tonal"}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    minHeight: 220,
    padding: spacing.lg,
  },
  copy: {
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: 360,
  },
});
