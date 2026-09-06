import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii, spacing, touchTarget } from "../theme";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "tonal" | "outline" | "text";

export interface ButtonProps extends Omit<
  PressableProps,
  "children" | "style"
> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  tonal: { backgroundColor: colors.surfaceMuted },
  outline: { borderWidth: 1, borderColor: colors.border },
  text: { backgroundColor: "transparent" },
});

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const foreground = isDisabled
    ? colors.onDisabled
    : variant === "primary"
      ? colors.onPrimary
      : colors.text;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text role="label" style={{ color: foreground }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: touchTarget.minimum,
    minWidth: touchTarget.minimum,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.72,
  },
});
