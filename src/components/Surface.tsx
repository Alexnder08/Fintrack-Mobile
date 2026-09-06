import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radii, spacing, type SpacingName } from "../theme";

export type SurfaceTone =
  "default" | "raised" | "muted" | "positive" | "negative" | "warning";

const toneStyles = StyleSheet.create({
  default: { backgroundColor: colors.surface },
  raised: { backgroundColor: colors.surfaceRaised },
  muted: { backgroundColor: colors.surfaceMuted },
  positive: { backgroundColor: colors.positiveSurface },
  negative: { backgroundColor: colors.negativeSurface },
  warning: { backgroundColor: colors.warningSurface },
});

export interface SurfaceProps extends ViewProps {
  children?: ReactNode;
  tone?: SurfaceTone;
  padding?: SpacingName;
}

export function Surface({
  children,
  tone = "default",
  padding = "md",
  style,
  ...props
}: SurfaceProps) {
  return (
    <View
      style={[
        styles.base,
        toneStyles[tone],
        { padding: spacing[padding] },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export const Card = Surface;

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
  },
});
