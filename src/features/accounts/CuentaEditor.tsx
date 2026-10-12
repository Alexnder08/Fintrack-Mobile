import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Screen, Surface, Text, TextField } from "../../components";
import { decimalACentavos, type DatosFintrack } from "../../data";
import type { Cuenta } from "../../domain";
import { useOperaciones } from "../../hooks/useOperaciones";
import { mensajeError } from "../../services";
import { colors, spacing } from "../../theme";
import { Opciones } from "../shared/Opciones";
import { PageHeader } from "../shared/PageHeader";

export function CuentaEditor({
  datos,
  cuenta,
}: {
  datos: DatosFintrack;
  cuenta?: Cuenta;
}) {
  const router = useRouter();
  const operaciones = useOperaciones();
  const ocupado = useRef(false);
  const [nombre, setNombre] = useState(cuenta?.nombre ?? "");
  const [tipo, setTipo] = useState<Cuenta["tipo"]>(cuenta?.tipo ?? "corriente");
  const [saldo, setSaldo] = useState(
    ((cuenta?.saldoInicialCentavos ?? 0) / 100).toFixed(2),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const movimientos = cuenta
    ? datos.movimientos.filter(
        (item) =>
          item.cuentaId === cuenta.id || item.cuentaDestinoId === cuenta.id,
      )
    : [];
  async function guardar() {
    if (ocupado.current) return;
    setError(null);
    if (!nombre.trim()) {
      setError("Escribe un nombre para la cuenta.");
      return;
    }
    let saldoInicialCentavos: number;
    try {
      if (!/^-?\d+(?:[.,]\d{1,2})?$/.test(saldo.trim())) throw new Error();
      saldoInicialCentavos = decimalACentavos(saldo.trim().replace(",", "."));
    } catch {
      setError(
        "Escribe un saldo válido con hasta dos decimales. Para deudas, usa un importe negativo.",
      );
      return;
    }
    const nueva = {
      nombre: nombre.trim(),
      tipo,
      codigoMoneda: cuenta?.codigoMoneda ?? datos.perfil.codigoMoneda,
      saldoInicialCentavos,
      color: cuenta?.color ?? colors.primary,
      archivada: false,
    };
    ocupado.current = true;
    try {
      await operaciones.mutateAsync(
        cuenta
          ? { tipo: "actualizarCuenta", id: cuenta.id, datos: nueva }
          : { tipo: "crearCuenta", datos: nueva },
      );
      if (router.canGoBack()) router.back();
      else router.replace("/cuentas");
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      ocupado.current = false;
    }
  }
  async function eliminar() {
    if (!cuenta || ocupado.current) return;
    ocupado.current = true;
    setError(null);
    try {
      await operaciones.mutateAsync({ tipo: "eliminarCuenta", id: cuenta.id });
      if (router.canGoBack()) router.back();
      else router.replace("/cuentas");
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      ocupado.current = false;
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Screen scrollable contentContainerStyle={styles.content}>
        <PageHeader title={cuenta ? "Editar cuenta" : "Nueva cuenta"} />
        <Text tone="secondary">
          Registra una cuenta propia para organizar tu dinero. Moneda:{" "}
          {cuenta?.codigoMoneda ?? datos.perfil.codigoMoneda}.
        </Text>
        <TextField
          label="Nombre de la cuenta"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Por ejemplo, ahorros"
          maxLength={80}
          editable={!operaciones.isPending}
        />
        <Opciones
          label="Tipo de cuenta"
          valor={tipo}
          disabled={operaciones.isPending}
          opciones={[
            { valor: "corriente", nombre: "Corriente" },
            { valor: "ahorro", nombre: "Ahorro" },
            { valor: "efectivo", nombre: "Efectivo" },
            { valor: "credito", nombre: "Crédito" },
          ]}
          onChange={setTipo}
        />
        <TextField
          label="Saldo inicial"
          hint="El saldo actual se calcula con este saldo y tus movimientos. Usa un importe negativo para deudas."
          value={saldo}
          onChangeText={setSaldo}
          keyboardType={
            Platform.OS === "ios" ? "numbers-and-punctuation" : "default"
          }
          editable={!operaciones.isPending}
        />
        {error ? (
          <Text accessibilityRole="alert" tone="negative">
            {error}
          </Text>
        ) : null}
        <Button
          label={cuenta ? "Guardar cambios" : "Crear cuenta"}
          fullWidth
          loading={operaciones.isPending}
          onPress={() => void guardar()}
        />
        {cuenta ? (
          <View style={styles.group}>
            <Button
              label={`Ver movimientos (${movimientos.length})`}
              variant="tonal"
              fullWidth
              onPress={() =>
                router.push({
                  pathname: "/movimientos",
                  params: { cuenta: cuenta.id },
                })
              }
            />
            <Button
              label="Registrar movimiento"
              variant="outline"
              fullWidth
              onPress={() =>
                router.push({
                  pathname: "/movimiento",
                  params: { cuenta: cuenta.id },
                })
              }
            />
            <Button
              label="Eliminar cuenta"
              variant="text"
              fullWidth
              disabled={operaciones.isPending || movimientos.length > 0}
              onPress={() => setConfirmar(true)}
            />
            {movimientos.length > 0 ? (
              <Text tone="secondary">
                Para eliminar esta cuenta, primero elimina o cambia sus
                movimientos a otra cuenta.
              </Text>
            ) : null}
            {confirmar ? (
              <Surface>
                <View style={styles.group}>
                  <Text role="title">¿Eliminar esta cuenta?</Text>
                  <Text tone="secondary">
                    Esta acción no se puede deshacer.
                  </Text>
                  <Button
                    label="Confirmar eliminación"
                    loading={operaciones.isPending}
                    onPress={() => void eliminar()}
                  />
                  <Button
                    label="Conservar cuenta"
                    variant="text"
                    disabled={operaciones.isPending}
                    onPress={() => setConfirmar(false)}
                  />
                </View>
              </Surface>
            ) : null}
          </View>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: spacing.lg,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  group: { gap: spacing.md },
});
