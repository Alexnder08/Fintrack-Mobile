import {
  Bell,
  ChevronRight,
  Download,
  Fingerprint,
  Flame,
  HelpCircle,
  LogOut,
  Moon,
  Target,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { Money, Screen, Surface, Text } from "../../components";
import { colors, radii, spacing, touchTarget } from "../../theme";
import {
  DemoNotice,
  FeatureState,
  type FeatureStatus,
  ProgressBar,
  SectionHeader,
} from "../shared";

export interface SavingsGoalSummary {
  id: string;
  name: string;
  saved: number;
  target: number;
  deadline?: string;
}

export interface ProfileScreenProps {
  status?: FeatureStatus;
  name?: string;
  email?: string;
  savingsRate?: number;
  activeGoals?: number;
  streakDays?: number;
  goals?: SavingsGoalSummary[];
  currency?: string;
  locale?: string;
  biometricsEnabled?: boolean;
  onBiometricsChange?: (enabled: boolean) => void;
  onNotifications?: () => void;
  onAppearance?: () => void;
  onExport?: () => void;
  onHelp?: () => void;
  onManageGoals?: () => void;
  onSignOut?: () => void;
  onRetry?: () => void;
}

const demoGoals: SavingsGoalSummary[] = [
  {
    id: "emergency",
    name: "Fondo de emergencia",
    saved: 2850,
    target: 5000,
    deadline: "Diciembre 2026",
  },
  {
    id: "trip",
    name: "Viaje",
    saved: 1240,
    target: 3200,
    deadline: "Marzo 2027",
  },
];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FT"
  );
}

interface SettingRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingRow({
  icon: Icon,
  label,
  description,
  onPress,
  isLast = false,
}: SettingRowProps) {
  return (
    <Pressable
      accessibilityHint={description}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        !isLast && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View accessible={false} style={styles.settingIcon}>
        <Icon color={colors.textSecondary} size={21} strokeWidth={2} />
      </View>
      <View style={styles.settingCopy}>
        <Text role="label">{label}</Text>
        <Text role="caption" tone="secondary">
          {description}
        </Text>
      </View>
      <ChevronRight color={colors.textMuted} size={20} />
    </Pressable>
  );
}

export function ProfileScreen({
  status = "ready",
  name = "Joel Alexander",
  email = "joel.demo@fintrack.app",
  savingsRate = 28,
  activeGoals = 2,
  streakDays = 12,
  goals = demoGoals,
  currency = "PEN",
  locale = "es-PE",
  biometricsEnabled,
  onBiometricsChange,
  onNotifications,
  onAppearance,
  onExport,
  onHelp,
  onManageGoals,
  onSignOut,
  onRetry,
}: ProfileScreenProps) {
  const [localBiometrics, setLocalBiometrics] = useState(false);
  const biometricsActive = biometricsEnabled ?? localBiometrics;

  if (status !== "ready") {
    return (
      <Screen>
        <FeatureState
          emptyDescription="Completa tu nombre y moneda para personalizar Fintrack."
          emptyTitle="Completa tu perfil"
          onRetry={onRetry}
          status={status}
        />
      </Screen>
    );
  }

  const changeBiometrics = (enabled: boolean) => {
    if (onBiometricsChange) onBiometricsChange(enabled);
    else setLocalBiometrics(enabled);
  };

  return (
    <Screen contentContainerStyle={styles.screenContent} scrollable>
      <View style={styles.headingGroup}>
        <Text role="heading">Perfil</Text>
        <DemoNotice />
      </View>

      <View style={styles.identity}>
        <View accessibilityLabel={`Avatar de ${name}`} style={styles.avatar}>
          <Text align="center" role="title" style={styles.avatarText}>
            {initials(name)}
          </Text>
        </View>
        <View style={styles.identityCopy}>
          <Text role="title">{name}</Text>
          <Text role="bodySmall" tone="secondary">
            {email}
          </Text>
        </View>
      </View>

      <Surface padding="md" tone="raised">
        <View style={styles.statsRow}>
          <View
            accessibilityLabel={`${savingsRate} por ciento de ahorro`}
            style={styles.stat}
          >
            <Text align="center" role="title" tone="positive">
              {savingsRate}%
            </Text>
            <Text align="center" role="caption" tone="secondary">
              Ahorro
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View
            accessibilityLabel={`${activeGoals} metas activas`}
            style={styles.stat}
          >
            <Target color={colors.info} size={21} />
            <Text align="center" role="caption" tone="secondary">
              {activeGoals} metas
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View
            accessibilityLabel={`Racha de ${streakDays} días`}
            style={styles.stat}
          >
            <Flame color={colors.warning} size={21} />
            <Text align="center" role="caption" tone="secondary">
              {streakDays} días
            </Text>
          </View>
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader
          actionLabel="Administrar"
          onAction={onManageGoals}
          title="Metas de ahorro"
        />
        <Surface padding="md">
          {goals.length > 0 ? (
            goals.map((goal, index) => {
              const percentage =
                goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
              return (
                <View
                  key={goal.id}
                  style={[
                    styles.goalRow,
                    index < goals.length - 1 && styles.divider,
                  ]}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalCopy}>
                      <Text role="label">{goal.name}</Text>
                      {goal.deadline ? (
                        <Text role="caption" tone="secondary">
                          Objetivo: {goal.deadline}
                        </Text>
                      ) : null}
                    </View>
                    <Text role="caption" tone="positive">
                      {Math.min(Math.round(percentage), 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    label={`${goal.name}: ${Math.round(percentage)} por ciento completado`}
                    value={percentage}
                  />
                  <View style={styles.goalAmounts}>
                    <Money
                      amount={goal.saved}
                      currency={currency}
                      locale={locale}
                      size="small"
                    />
                    <Text role="caption" tone="secondary">
                      de{" "}
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency,
                      }).format(goal.target)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyGoals}>
              <Text role="label">Crea una meta que te motive</Text>
              <Text role="caption" tone="secondary">
                Define un monto y sigue cada aporte.
              </Text>
            </View>
          )}
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Preferencias" />
        <Surface padding="none">
          <SettingRow
            description="Alertas de presupuesto y recordatorios"
            icon={Bell}
            label="Notificaciones"
            onPress={onNotifications}
          />
          <View style={[styles.settingRow, styles.divider]}>
            <View accessible={false} style={styles.settingIcon}>
              <Fingerprint color={colors.textSecondary} size={21} />
            </View>
            <View style={styles.settingCopy}>
              <Text role="label">Bloqueo biométrico</Text>
              <Text role="caption" tone="secondary">
                Protege el acceso en este dispositivo
              </Text>
            </View>
            <Switch
              accessibilityLabel="Bloqueo biométrico"
              ios_backgroundColor={colors.surfaceMuted}
              onValueChange={changeBiometrics}
              thumbColor={
                biometricsActive ? colors.onPrimary : colors.textSecondary
              }
              trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
              value={biometricsActive}
            />
          </View>
          <SettingRow
            description="Tema oscuro y contraste"
            icon={Moon}
            label="Apariencia"
            onPress={onAppearance}
          />
          <SettingRow
            description="CSV o resumen PDF"
            icon={Download}
            label="Exportar datos"
            onPress={onExport}
          />
          <SettingRow
            description="Preguntas frecuentes y soporte"
            icon={HelpCircle}
            isLast
            label="Ayuda"
            onPress={onHelp}
          />
        </Surface>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onSignOut}
        style={({ pressed }) => [
          styles.signOutButton,
          pressed && styles.pressed,
        ]}
      >
        <LogOut color={colors.negative} size={19} />
        <Text role="label" tone="negative">
          Cerrar sesión
        </Text>
      </Pressable>
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
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: colors.onPrimary,
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  statsRow: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  stat: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xxs,
    justifyContent: "center",
    minHeight: 64,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  section: {
    gap: spacing.sm,
  },
  goalRow: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  goalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  goalCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  goalAmounts: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs,
  },
  emptyGoals: {
    gap: spacing.xxs,
    paddingVertical: spacing.md,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  settingCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.7,
  },
  signOutButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: touchTarget.minimum,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
});
