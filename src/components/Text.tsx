import type { ReactNode } from "react";
import {
  Text as NativeText,
  type TextProps as NativeTextProps,
  type TextStyle,
} from "react-native";

import { colors, typography, type InterfaceTypographyRole } from "../theme";

export type TextTone =
  "primary" | "secondary" | "muted" | "positive" | "negative" | "warning";

const toneColors: Record<TextTone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  positive: colors.positive,
  negative: colors.negative,
  warning: colors.warning,
};

export interface TextProps extends Omit<NativeTextProps, "role"> {
  children?: ReactNode;
  role?: InterfaceTypographyRole;
  tone?: TextTone;
  align?: TextStyle["textAlign"];
}

export function Text({
  role = "body",
  tone = "primary",
  align,
  style,
  maxFontSizeMultiplier,
  ...props
}: TextProps) {
  return (
    <NativeText
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        typography[role],
        { color: toneColors[tone], textAlign: align },
        style,
      ]}
      {...props}
    />
  );
}
