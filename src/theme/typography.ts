import type { TextStyle } from "react-native";

export const fontFamilies = {
  interfaceRegular: "Outfit_400Regular",
  interfaceMedium: "Outfit_500Medium",
  interfaceSemibold: "Outfit_600SemiBold",
  interfaceBold: "Outfit_700Bold",
  numericSemibold: "JetBrainsMono_600SemiBold",
  numericBold: "JetBrainsMono_700Bold",
} as const;

/** Named roles prevent one-off font sizes and preserve a predictable hierarchy. */
export const typography = {
  display: {
    fontFamily: fontFamilies.interfaceBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.7,
  },
  heading: {
    fontFamily: fontFamilies.interfaceBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.45,
  },
  title: {
    fontFamily: fontFamilies.interfaceSemibold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.interfaceRegular,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.interfaceRegular,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamilies.interfaceSemibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamilies.interfaceMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.15,
  },
  moneyDisplay: {
    fontFamily: fontFamilies.numericBold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  moneyBody: {
    fontFamily: fontFamilies.numericSemibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.15,
    fontVariant: ["tabular-nums"],
  },
  moneySmall: {
    fontFamily: fontFamilies.numericSemibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
} satisfies Record<string, TextStyle>;

export type TypographyRole = keyof typeof typography;
export type InterfaceTypographyRole = Exclude<
  TypographyRole,
  "moneyDisplay" | "moneyBody" | "moneySmall"
>;
