import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

export interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  edges = ["top", "right", "bottom", "left"],
  style,
  contentContainerStyle,
  scrollProps,
}: ScreenProps) {
  const contentStyle = [
    styles.content,
    padded && styles.padded,
    contentContainerStyle,
  ];

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
});
