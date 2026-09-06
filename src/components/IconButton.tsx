import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii, touchTarget } from "../theme";

export type IconButtonVariant = "plain" | "tonal" | "primary";

export interface IconButtonProps extends Omit<
  PressableProps,
  "children" | "style"
> {
  accessibilityLabel: string;
  children: ReactNode;
  variant?: IconButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles = StyleSheet.create({
  plain: { backgroundColor: "transparent" },
  tonal: { backgroundColor: colors.surfaceMuted },
  primary: { backgroundColor: colors.primary },
});

export function IconButton({
  accessibilityLabel,
  children,
  variant = "tonal",
  loading = false,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.onPrimary : colors.primary}
        />
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: touchTarget.minimum,
    minHeight: touchTarget.minimum,
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.46,
  },
});
