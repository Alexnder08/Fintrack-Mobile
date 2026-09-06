import { Tabs } from "expo-router";
import { ChartPie, House, UserRound, WalletCards } from "lucide-react-native";

import { colors, fontFamilies } from "@/src/theme";

const ICON_SIZE = 22;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.interfaceMedium,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <House color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="analisis"
        options={{
          title: "Análisis",
          tabBarIcon: ({ color }) => (
            <ChartPie color={color} size={ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuentas"
        options={{
          title: "Cuentas",
          tabBarIcon: ({ color }) => (
            <WalletCards color={color} size={ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <UserRound color={color} size={ICON_SIZE} />
          ),
        }}
      />
    </Tabs>
  );
}
