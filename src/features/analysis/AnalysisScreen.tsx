import { CircleAlert, PieChart } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Money, Screen, Surface, Text } from "../../components";
import { colors, radii, spacing, touchTarget } from "../../theme";
import {
  DemoNotice,
  FeatureState,
  type FeatureStatus,
  ProgressBar,
  SectionHeader,
} from "../shared";

export type AnalysisPeriod = "week" | "month" | "year";

export interface CategoryDistribution {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetSummary {
  id: string;
  name: string;
  spent: number;
  limit: number;
}

export interface AnalysisScreenProps {
  status?: FeatureStatus;
  isDemo?: boolean;
  period?: AnalysisPeriod;
  totalSpent?: number;
  currency?: string;
  locale?: string;
  categories?: CategoryDistribution[];
  budgets?: BudgetSummary[];
  onPeriodChange?: (period: AnalysisPeriod) => void;
  onManageBudgets?: () => void;
  onRetry?: () => void;
}

const periodLabels: Record<AnalysisPeriod, string> = {
  week: "Semana",
  month: "Mes",
  year: "Año",
};

const demoCategories: CategoryDistribution[] = [
  {
    id: "food",
    name: "Alimentación",
    amount: 742.3,
    percentage: 36,
    color: colors.categories.essential,
  },
  {
    id: "home",
    name: "Hogar",
    amount: 536.1,
    percentage: 26,
    color: colors.categories.lifestyle,
  },
  {
    id: "transport",
    name: "Transporte",
    amount: 432.8,
    percentage: 21,
    color: colors.categories.variable,
  },
  {
    id: "other",
    name: "Otros",
    amount: 350.6,
    percentage: 17,
    color: colors.categories.savings,
  },
];

const demoBudgets: BudgetSummary[] = [
  { id: "budget-food", name: "Alimentación", spent: 742.3, limit: 1000 },
  { id: "budget-transport", name: "Transporte", spent: 432.8, limit: 500 },
  { id: "budget-leisure", name: "Entretenimiento", spent: 368, limit: 350 },
];

export function AnalysisScreen({
  status = "ready",
  isDemo = true,
  period,
  totalSpent = 2061.8,
  currency = "PEN",
  locale = "es-PE",
  categories = demoCategories,
  budgets = demoBudgets,
  onPeriodChange,
  onManageBudgets,
  onRetry,
}: AnalysisScreenProps) {
  const [localPeriod, setLocalPeriod] = useState<AnalysisPeriod>("month");
  const selectedPeriod = period ?? localPeriod;
  const visiblePeriods: AnalysisPeriod[] = onPeriodChange
    ? ["week", "month", "year"]
    : ["month"];

  if (status !== "ready") {
    return (
      <Screen>
        <FeatureState
          emptyDescription="Registra movimientos para comparar tus gastos por categoría."
          emptyTitle="Tu análisis aparecerá aquí"
          onRetry={onRetry}
          status={status}
        />
      </Screen>
    );
  }

  const selectPeriod = (nextPeriod: AnalysisPeriod) => {
    if (onPeriodChange) onPeriodChange(nextPeriod);
    else setLocalPeriod(nextPeriod);
  };

  return (
    <Screen contentContainerStyle={styles.screenContent} scrollable>
      <View style={styles.headingGroup}>
        <Text role="heading">Análisis</Text>
        {isDemo ? <DemoNotice /> : null}
      </View>

      <View
        accessibilityLabel="Periodo del análisis"
        accessibilityRole="tablist"
        style={styles.periodSelector}
      >
        {visiblePeriods.map((item) => {
          const isSelected = item === selectedPeriod;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{
                disabled: !onPeriodChange,
                selected: isSelected,
              }}
              disabled={!onPeriodChange}
              key={item}
              onPress={() => selectPeriod(item)}
              style={({ pressed }) => [
                styles.periodOption,
                isSelected && styles.periodOptionSelected,
                pressed && styles.pressed,
                !onPeriodChange && !isSelected && styles.disabled,
              ]}
            >
              <Text
                role="label"
                style={isSelected && styles.periodLabelSelected}
                tone={isSelected ? "primary" : "secondary"}
              >
                {periodLabels[item]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Surface padding="lg" tone="raised">
        <View style={styles.totalHeader}>
          <View style={styles.totalCopy}>
            <Text role="caption" tone="secondary">
              Gastado este{" "}
              {periodLabels[selectedPeriod].toLocaleLowerCase(locale)}
            </Text>
            <Money
              amount={totalSpent}
              currency={currency}
              kind="expense"
              locale={locale}
              size="display"
            />
          </View>
          <View accessible={false} style={styles.analysisIcon}>
            <PieChart color={colors.primary} size={26} />
          </View>
        </View>

        <View
          accessibilityLabel={`Distribución de gastos en ${categories.length} categorías`}
          accessibilityRole="image"
          style={styles.distributionBar}
        >
          {categories.map((category) => (
            <View
              key={category.id}
              style={{
                backgroundColor: category.color,
                flex: Math.max(category.percentage, 1),
              }}
            />
          ))}
        </View>

        <View style={styles.categoryList}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: category.color },
                ]}
              />
              <View style={styles.categoryCopy}>
                <Text numberOfLines={1} role="bodySmall">
                  {category.name}
                </Text>
                <Text role="caption" tone="secondary">
                  {category.percentage}% del gasto
                </Text>
              </View>
              <Money
                amount={category.amount}
                currency={currency}
                kind="expense"
                locale={locale}
                size="small"
              />
            </View>
          ))}
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader
          actionLabel="Administrar"
          onAction={onManageBudgets}
          title="Presupuestos"
        />
        <Surface padding="md">
          {budgets.map((budget, index) => {
            const percentage =
              budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
            const isExceeded = percentage >= 100;
            const isWarning = percentage >= 80 && !isExceeded;
            const tone = isExceeded
              ? "negative"
              : isWarning
                ? "warning"
                : "positive";
            const remaining = budget.limit - budget.spent;

            return (
              <View
                key={budget.id}
                style={[
                  styles.budgetRow,
                  index < budgets.length - 1 && styles.divider,
                ]}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetCopy}>
                    <Text role="label">{budget.name}</Text>
                    <Text role="caption" tone={tone}>
                      {isExceeded
                        ? `Excedido por ${new Intl.NumberFormat(locale, { style: "currency", currency }).format(Math.abs(remaining))}`
                        : `${Math.round(percentage)}% utilizado`}
                    </Text>
                  </View>
                  {(isExceeded || isWarning) && (
                    <View accessible={false}>
                      <CircleAlert
                        color={isExceeded ? colors.negative : colors.warning}
                        size={20}
                      />
                    </View>
                  )}
                </View>
                <ProgressBar
                  label={`${budget.name}: ${Math.round(percentage)} por ciento utilizado`}
                  tone={tone}
                  value={percentage}
                />
                <View style={styles.budgetAmounts}>
                  <Money
                    amount={budget.spent}
                    currency={currency}
                    locale={locale}
                    size="small"
                  />
                  <Text role="caption" tone="secondary">
                    de{" "}
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency,
                    }).format(budget.limit)}
                  </Text>
                </View>
              </View>
            );
          })}
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
  headingGroup: {
    gap: spacing.xs,
  },
  periodSelector: {
    flexDirection: "row",
    padding: spacing.xxs,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  periodOption: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: touchTarget.minimum,
    borderRadius: radii.sm,
  },
  periodOptionSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  periodLabelSelected: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.46,
  },
  totalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  totalCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  analysisIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.positiveSurface,
  },
  distributionBar: {
    flexDirection: "row",
    height: 14,
    overflow: "hidden",
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  categoryList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  categoryCopy: {
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  budgetRow: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  budgetHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  budgetCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  budgetAmounts: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs,
  },
});
