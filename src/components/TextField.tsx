import { useId } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { colors, radii, spacing, touchTarget, typography } from "../theme";
import { Text } from "./Text";

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  error,
  hint,
  style,
  accessibilityHint,
  multiline,
  editable = true,
  ...props
}: TextFieldProps) {
  const nativeId = useId();
  const helpText = error ?? hint;

  return (
    <View style={styles.group}>
      <Text nativeID={`${nativeId}-label`} role="label">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint ?? helpText}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          style,
        ]}
        {...props}
      />
      {helpText ? (
        <Text role="caption" tone={error ? "negative" : "secondary"}>
          {helpText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  input: {
    minHeight: touchTarget.minimum,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: colors.negative,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.onDisabled,
    opacity: 0.72,
  },
});
