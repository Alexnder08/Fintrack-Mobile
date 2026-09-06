import {
  Bell,
  Eye,
  EyeOff,
  MoreHorizontal,
  ReceiptText,
  Send,
  WalletCards,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { IconButton, Money, Screen, Surface, Text } from "../../components";
import { colors, radii, spacing, touchTarget } from "../../theme";
import {
  DemoNotice,
  FeatureState,
  type FeatureStatus,
  SectionHeader,
  TransactionRow,
  type TransactionItem,
} from "../shared";

export interface WeeklyExpense {
  day: string;
  amount: number;
}

export interface HomeScreenProps {
  status?: FeatureStatus;
  userName?: string;
  balance?: number;
  income?: number;
  expenses?: number;
  comparisonPercent?: number;
  currency?: string;
  locale?: string;
  balanceHidden?: boolean;
  weeklyExpenses?: WeeklyExpense[];
  transactions?: TransactionItem[];
  onToggleBalance?: () => void;
  onNotifications?: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  onPay?: () => void;
  onMore?: () => void;
  onViewAll?: () => void;
  onRetry?: () => void;
}

const demoWeeklyExpenses: WeeklyExpense[] = [
  { day: "L", amount: 120 },
  { day: "M", amount: 280 },
  { day: "X", amount: 190 },
  { day: "J", amount: 420 },
  { day: "V", amount: 310 },
  { day: "S", amount: 510 },
  { day: "D", amount: 240 },
];

const demoTransactions: TransactionItem[] = [
  {
    id: "demo-1",
    title: "Supermercado",
    detail: "Alimentación · Hoy",
    amount: 86.4,
    kind: "expense",
  },
  {
    id: "demo-2",
    title: "Sueldo",
    detail: "Ingreso · Ayer",
    amount: 3200,
    kind: "income",
  },
  {
    id: "demo-3",
    title: "Ahorro del mes",
    detail: "Transferencia · 4 sep",
    amount: 450,
    kind: "transfer",
  },
];

interface QuickActionProps {
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
}

function QuickAction({ label, icon: Icon, onPress }: QuickActionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View accessible={false} style={styles.quickActionIcon}>
        <Icon color={colors.primary} size={22} strokeWidth={2} />
      </View>
      <Text align="center" role="caption">
        {label}
      </Text>
    </Pressable>
  );
}

export function HomeScreen({
  status = "ready",
  userName = "Joel",
  balance = 7450.8,
  income = 5600,
  expenses = 2384.2,
  comparisonPercent = 8.4,
  currency = "PEN",
  locale = "es-PE",
  balanceHidden,
  weeklyExpenses = demoWeeklyExpenses,
  transactions = demoTransactions,
  onToggleBalance,
  onNotifications,
  onSend,
  onReceive,
  onPay,
  onMore,
  onViewAll,
  onRetry,
}: HomeScreenProps) {
  const [localHidden, setLocalHidden] = useState(false);
  const isBalanceHidden = balanceHidden ?? localHidden;
  const maximumExpense = Math.max(
    ...weeklyExpenses.map((item) => item.amount),
    1,
  );
  const trendTone = comparisonPercent >= 0 ? "positive" : "negative";

  if (status !== "ready") {
    return (
      <Screen>
        <FeatureState
          emptyDescription="Crea tu primera cuenta para empezar a ver tu resumen."
          emptyTitle="Tu inicio está listo"
          onRetry={onRetry}
          status={status}
        />
      </Screen>
    );
  }

  const handleToggleBalance = () => {
    if (onToggleBalance) onToggleBalance();
    else setLocalHidden((current) => !current);
  };

  return (
    <Screen contentContainerStyle={styles.screenContent} scrollable>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text role="heading">Hola, {userName}</Text>
          <DemoNotice />
        </View>
        <IconButton
          accessibilityLabel="Abrir notificaciones"
          onPress={onNotifications}
        >
          <Bell color={colors.text} size={22} strokeWidth={2} />
        </IconButton>
      </View>

      <Surface padding="lg" tone="raised">
        <View style={styles.balanceHeader}>
          <Text role="label" tone="secondary">
            Balance total
          </Text>
          <IconButton
            accessibilityLabel={
              isBalanceHidden ? "Mostrar balance" : "Ocultar balance"
            }
            onPress={handleToggleBalance}
            variant="plain"
          >
            {isBalanceHidden ? (
              <EyeOff color={colors.textSecondary} size={21} />
            ) : (
              <Eye color={colors.textSecondary} size={21} />
            )}
          </IconButton>
        </View>
        <Money
          amount={balance}
          currency={currency}
          hideAmount={isBalanceHidden}
          locale={locale}
          size="display"
        />
        <Text role="caption" tone={trendTone}>
          {comparisonPercent >= 0 ? "+" : ""}
          {comparisonPercent.toFixed(1)}% frente al periodo anterior
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text role="caption" tone="secondary">
              Ingresos
            </Text>
            <Money
              amount={income}
              currency={currency}
              kind="income"
              locale={locale}
            />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text role="caption" tone="secondary">
              Gastos
            </Text>
            <Money
              amount={expenses}
              currency={currency}
              kind="expense"
              locale={locale}
            />
          </View>
        </View>
      </Surface>

      <View accessibilityLabel="Acciones rápidas" style={styles.quickActions}>
        <QuickAction icon={Send} label="Enviar" onPress={onSend} />
        <QuickAction icon={WalletCards} label="Recibir" onPress={onReceive} />
        <QuickAction icon={ReceiptText} label="Pagar" onPress={onPay} />
        <QuickAction icon={MoreHorizontal} label="Más" onPress={onMore} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Gasto semanal" />
        <Surface
          accessibilityLabel="Gráfica de gastos de los últimos siete días"
          padding="lg"
        >
          <View style={styles.chart}>
            {weeklyExpenses.map((item) => {
              const height = Math.max((item.amount / maximumExpense) * 116, 8);
              const formatted = new Intl.NumberFormat(locale, {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              }).format(item.amount);

              return (
                <View key={item.day} style={styles.barColumn}>
                  <View
                    accessibilityLabel={`${item.day}: ${formatted}`}
                    accessibilityRole="image"
                    style={[styles.bar, { height }]}
                  />
                  <Text role="caption" tone="secondary">
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader
          actionLabel="Ver todo"
          onAction={onViewAll}
          title="Movimientos recientes"
        />
        {transactions.length > 0 ? (
          <Surface padding="md">
            {transactions.map((transaction, index) => (
              <TransactionRow
                currency={currency}
                isLast={index === transactions.length - 1}
                item={transaction}
                key={transaction.id}
                locale={locale}
              />
            ))}
          </Surface>
        ) : (
          <Surface padding="lg">
            <Text role="title">Aún no hay movimientos</Text>
            <Text role="bodySmall" tone="secondary">
              Registra un ingreso o un gasto para verlo aquí.
            </Text>
          </Surface>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    alignSelf: "center",
    gap: spacing.lg,
    width: "100%",
    maxWidth: 760,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  balanceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    gap: spacing.xxs,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    minHeight: touchTarget.minimum,
  },
  quickActionIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  section: {
    gap: spacing.sm,
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.xs,
    height: 152,
    justifyContent: "space-between",
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  bar: {
    width: "64%",
    minWidth: 12,
    maxWidth: 28,
    borderRadius: radii.xs,
    backgroundColor: colors.primary,
  },
});
