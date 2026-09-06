import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { Money, Text } from "../../components";
import { colors, radii, spacing } from "../../theme";

export type TransactionKind = "income" | "expense" | "transfer";

export interface TransactionItem {
  id: string;
  title: string;
  detail: string;
  amount: number;
  kind: TransactionKind;
}

interface TransactionRowProps {
  item: TransactionItem;
  currency: string;
  locale?: string;
  isLast?: boolean;
}

const iconByKind = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
};

export function TransactionRow({
  item,
  currency,
  locale,
  isLast = false,
}: TransactionRowProps) {
  const Icon = iconByKind[item.kind];
  const iconColor =
    item.kind === "income"
      ? colors.positive
      : item.kind === "expense"
        ? colors.negative
        : colors.info;

  return (
    <View
      accessibilityLabel={`${item.title}, ${item.detail}`}
      style={[styles.container, !isLast && styles.divider]}
    >
      <View accessible={false} style={styles.iconContainer}>
        <Icon color={iconColor} size={20} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} role="label">
          {item.title}
        </Text>
        <Text numberOfLines={1} role="caption" tone="secondary">
          {item.detail}
        </Text>
      </View>
      <Money
        amount={item.amount}
        currency={currency}
        kind={item.kind === "transfer" ? "neutral" : item.kind}
        locale={locale}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
