import { View, StyleSheet } from "react-native";
import { Button, Text } from "../../components";
import { mensajeError, type DatosPantallasFintrack } from "../../services";
import { colors, spacing } from "../../theme";

export function DataNotice({
  data,
  error,
  onRetry,
}: {
  data?: DatosPantallasFintrack;
  error?: unknown;
  onRetry: () => void;
}) {
  const mensaje = data?.sinConexion
    ? "Sin conexión. Estás viendo la última copia guardada; reconecta para editar."
    : (data?.advertenciaPersistencia ?? (error ? mensajeError(error) : null));
  if (!mensaje) return null;
  return (
    <View style={styles.notice}>
      <Text accessibilityRole="alert" tone="warning">
        {mensaje}
      </Text>
      <Button label="Actualizar" variant="text" onPress={onRetry} />
    </View>
  );
}
const styles = StyleSheet.create({
  notice: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
});
