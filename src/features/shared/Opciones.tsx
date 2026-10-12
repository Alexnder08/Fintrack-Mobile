import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../components";
import { colors, radii, spacing, touchTarget } from "../../theme";

export function Opciones<T extends string>({
  label,
  opciones,
  valor,
  onChange,
  disabled = false,
}: {
  label: string;
  opciones: readonly { valor: T; nombre: string }[];
  valor: T;
  onChange: (valor: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.group}>
      <Text role="label">{label}</Text>
      <View accessibilityLabel={label} style={styles.options}>
        {opciones.map((opcion) => (
          <Pressable
            key={opcion.valor}
            accessibilityRole="radio"
            accessibilityLabel={opcion.nombre}
            accessibilityState={{ checked: valor === opcion.valor, disabled }}
            disabled={disabled}
            onPress={() => onChange(opcion.valor)}
            style={({ pressed }) => [
              styles.option,
              valor === opcion.valor && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              role="label"
              style={{
                color: valor === opcion.valor ? colors.onPrimary : colors.text,
              }}
            >
              {opcion.nombre}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  option: {
    minHeight: touchTarget.minimum,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  selected: { backgroundColor: colors.primary },
  pressed: { opacity: 0.76 },
});
