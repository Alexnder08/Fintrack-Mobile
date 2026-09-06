import type { TextProps } from "react-native";

import { colors, typography } from "../theme";
import { Text } from "./Text";

export type MoneyKind = "neutral" | "income" | "expense";
export type MoneySize = "display" | "body" | "small";

export interface MoneyProps extends Omit<TextProps, "children" | "role"> {
  amount: number;
  currency: string;
  locale?: string;
  kind?: MoneyKind;
  size?: MoneySize;
  hideAmount?: boolean;
}

const roleBySize = {
  display: "moneyDisplay",
  body: "moneyBody",
  small: "moneySmall",
} as const;

export function Money({
  amount,
  currency,
  locale = "es-PE",
  kind = "neutral",
  size = "body",
  hideAmount = false,
  style,
  accessibilityLabel,
  ...props
}: MoneyProps) {
  const signedAmount =
    kind === "expense"
      ? -Math.abs(amount)
      : kind === "income"
        ? Math.abs(amount)
        : amount;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(signedAmount);
  const label =
    kind === "expense" ? "Gasto" : kind === "income" ? "Ingreso" : "Importe";
  const color =
    kind === "expense"
      ? colors.negative
      : kind === "income"
        ? colors.positive
        : colors.text;

  return (
    <Text
      accessibilityLabel={
        accessibilityLabel ??
        (hideAmount ? "Importe oculto" : `${label}: ${formatted}`)
      }
      role="body"
      style={[typography[roleBySize[size]], { color }, style]}
      {...props}
    >
      {hideAmount ? "••••••" : formatted}
    </Text>
  );
}
