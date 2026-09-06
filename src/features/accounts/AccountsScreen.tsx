import {
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  WalletCards,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
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

export type AccountKind = "checking" | "savings" | "cash" | "credit";

export interface AccountSummary {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  detail: string;
  color: string;
}

export interface AccountsScreenProps {
  status?: FeatureStatus;
  netWorth?: number;
  assets?: number;
  debts?: number;
  currency?: string;
  locale?: string;
  accounts?: AccountSummary[];
  transactions?: TransactionItem[];
  onAddAccount?: () => void;
  onAccountPress?: (account: AccountSummary) => void;
  onViewAllTransactions?: () => void;
  onRetry?: () => void;
}

const demoAccounts: AccountSummary[] = [
  {
    id: "checking",
    name: "Cuenta principal",
    kind: "checking",
    balance: 4820.8,
    detail: "Corriente · •••• 8421",
    color: colors.info,
  },
  {
    id: "savings",
    name: "Ahorros",
    kind: "savings",
    balance: 3130,
    detail: "Ahorro · Meta mensual",
    color: colors.positive,
  },
  {
    id: "credit",
    name: "Tarjeta cotidiana",
    kind: "credit",
    balance: -500,
    detail: "Crédito · Corte 18 sep",
    color: colors.negative,
  },
];

const demoTransactions: TransactionItem[] = [
  {
    id: "account-demo-1",
    title: "Pago de servicios",
    detail: "Cuenta principal · Hoy",
    amount: 146.7,
    kind: "expense",
  },
  {
    id: "account-demo-2",
    title: "Aporte a ahorros",
    detail: "Transferencia · Ayer",
    amount: 450,
    kind: "transfer",
  },
  {
    id: "account-demo-3",
    title: "Ingreso independiente",
    detail: "Cuenta principal · 3 sep",
    amount: 780,
    kind: "income",
  },
];

const iconByKind: Record<AccountKind, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  cash: WalletCards,
  credit: CreditCard,
};

interface AccountRowProps {
  account: AccountSummary;
  currency: string;
  locale: string;
  onPress?: () => void;
}

function AccountRow({ account, currency, locale, onPress }: AccountRowProps) {
  const Icon = iconByKind[account.kind];
  const isDebt = account.kind === "credit" && account.balance < 0;

  return (
    <Pressable
      accessibilityHint="Abre el detalle y los movimientos de esta cuenta"
      accessibilityLabel={`${account.name}, ${account.detail}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface padding="md" tone="raised">
        <View style={styles.accountHeader}>
          <View
            accessible={false}
            style={[
              styles.accountIcon,
              { backgroundColor: `${account.color}1F` },
            ]}
          >
            <Icon color={account.color} size={22} strokeWidth={2} />
          </View>
          <View style={styles.accountCopy}>
            <Text numberOfLines={1} role="label">
              {account.name}
            </Text>
            <Text numberOfLines={1} role="caption" tone="secondary">
              {account.detail}
            </Text>
          </View>
          <Money
            amount={Math.abs(account.balance)}
            currency={currency}
            kind={isDebt ? "expense" : "neutral"}
            locale={locale}
          />
        </View>
      </Surface>
    </Pressable>
  );
}

export function AccountsScreen({
  status = "ready",
  netWorth = 7450.8,
  assets = 7950.8,
  debts = 500,
  currency = "PEN",
  locale = "es-PE",
  accounts = demoAccounts,
  transactions = demoTransactions,
  onAddAccount,
  onAccountPress,
  onViewAllTransactions,
  onRetry,
}: AccountsScreenProps) {
  if (status !== "ready") {
    return (
      <Screen>
        <FeatureState
          emptyDescription="Agrega efectivo, ahorro, cuenta corriente o crédito para comenzar."
          emptyTitle="Aún no tienes cuentas"
          onRetry={onRetry}
          status={status}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.screenContent} scrollable>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text role="heading">Cuentas</Text>
          <DemoNotice />
        </View>
        <IconButton
          accessibilityLabel="Agregar cuenta"
          onPress={onAddAccount}
          variant="primary"
        >
          <Plus color={colors.onPrimary} size={22} strokeWidth={2.2} />
        </IconButton>
      </View>

      <Surface padding="lg" tone="raised">
        <Text role="label" tone="secondary">
          Patrimonio neto
        </Text>
        <Money
          amount={netWorth}
          currency={currency}
          locale={locale}
          size="display"
        />
        <View style={styles.worthBreakdown}>
          <View style={styles.worthItem}>
            <Text role="caption" tone="secondary">
              Activos
            </Text>
            <Money
              amount={assets}
              currency={currency}
              kind="income"
              locale={locale}
              size="small"
            />
          </View>
          <View style={styles.worthItem}>
            <Text role="caption" tone="secondary">
              Deudas
            </Text>
            <Money
              amount={debts}
              currency={currency}
              kind="expense"
              locale={locale}
              size="small"
            />
          </View>
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Mis cuentas" />
        {accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.map((account) => (
              <AccountRow
                account={account}
                currency={currency}
                key={account.id}
                locale={locale}
                onPress={() => onAccountPress?.(account)}
              />
            ))}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onAddAccount}
            style={({ pressed }) => [
              styles.addAccount,
              pressed && styles.pressed,
            ]}
          >
            <Plus color={colors.primary} size={22} />
            <View style={styles.addAccountCopy}>
              <Text role="label">Agregar una cuenta</Text>
              <Text role="caption" tone="secondary">
                Empieza con el balance que tienes hoy.
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          actionLabel="Ver todo"
          onAction={onViewAllTransactions}
          title="Últimos movimientos"
        />
        <Surface padding="md">
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <TransactionRow
                currency={currency}
                isLast={index === transactions.length - 1}
                item={transaction}
                key={transaction.id}
                locale={locale}
              />
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text role="label">Sin movimientos todavía</Text>
              <Text role="caption" tone="secondary">
                Tus operaciones aparecerán aquí.
              </Text>
            </View>
          )}
        </Surface>
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
  worthBreakdown: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  worthItem: {
    flex: 1,
    gap: spacing.xxs,
  },
  section: {
    gap: spacing.sm,
  },
  accountsList: {
    gap: spacing.sm,
  },
  accountHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: touchTarget.minimum,
  },
  accountIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: radii.md,
  },
  accountCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.72,
  },
  addAccount: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  addAccountCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  emptyTransactions: {
    gap: spacing.xxs,
    paddingVertical: spacing.md,
  },
});
