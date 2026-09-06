import { StyleSheet, View } from "react-native";

import { Money, Screen, Surface, Text } from "@/src/components";
import { spacing } from "@/src/theme";

export default function InicioRoute() {
  return (
    <Screen scrollable edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text role="heading">Tu dinero, con claridad</Text>
        <Text tone="secondary">Resumen del mes</Text>
      </View>
      <Surface tone="raised" padding="lg">
        <Text role="label" tone="secondary">
          Saldo disponible
        </Text>
        <Money amount={12450.8} currency="PEN" size="display" />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.xl },
});
