import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Screen, Surface, Text, TextField } from "../../components";
import {
  decimalACentavos,
  type DatosFintrack,
  type MovimientoConMoneda,
  type NuevoMovimiento,
} from "../../data";
import {
  useBorradorMovimiento,
  type BorradorMovimiento,
} from "../../hooks/useBorradorMovimiento";
import { useOperaciones } from "../../hooks/useOperaciones";
import { useSesion } from "../../hooks/useSesion";
import { claveBorrador } from "../../lib/almacenamiento";
import { mensajeError } from "../../services";
import { spacing } from "../../theme";
import { Opciones } from "../shared/Opciones";
import { PageHeader } from "../shared/PageHeader";

function fechaLocal(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
export function MovimientoEditor({
  datos,
  movimiento,
  tipoInicial = "gasto",
  cuentaInicial,
}: {
  datos: DatosFintrack;
  movimiento?: MovimientoConMoneda;
  tipoInicial?: BorradorMovimiento["tipo"];
  cuentaInicial?: string;
}) {
  const router = useRouter();
  const { usuarioId } = useSesion();
  const operaciones = useOperaciones();
  const ocupado = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<{ importe?: string; fecha?: string }>(
    {},
  );
  const [confirmar, setConfirmar] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const cuentas = datos.cuentas.filter(
    (cuenta) =>
      !cuenta.archivada && cuenta.codigoMoneda === datos.perfil.codigoMoneda,
  );
  const inicial: BorradorMovimiento = {
    tipo: movimiento?.tipo ?? tipoInicial,
    importe: movimiento ? (movimiento.importeCentavos / 100).toFixed(2) : "",
    descripcion: movimiento?.descripcion ?? "",
    cuentaId: movimiento?.cuentaId ?? cuentaInicial ?? cuentas[0]?.id ?? "",
    cuentaDestinoId: movimiento?.cuentaDestinoId ?? "",
    categoriaId:
      movimiento?.categoriaId ??
      datos.categorias.find(
        (item) => item.tipo === tipoInicial && !item.archivada,
      )?.id ??
      "",
    fecha: fechaLocal(
      movimiento ? new Date(movimiento.ocurridoEn) : new Date(),
    ),
  };
  const { borrador, cambiar, listo, errorLocal, descartar } =
    useBorradorMovimiento(claveBorrador(usuarioId, movimiento?.id), inicial);
  const categorias = datos.categorias.filter(
    (item) => item.tipo === borrador.tipo && !item.archivada,
  );
  const bloqueado = !listo || operaciones.isPending || terminado;

  async function guardar() {
    if (ocupado.current || bloqueado) return;
    setError(null);
    setErrores({});
    let importeCentavos: number;
    try {
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(borrador.importe.trim()))
        throw new Error();
      importeCentavos = decimalACentavos(
        borrador.importe.trim().replace(",", "."),
      );
      if (importeCentavos <= 0) throw new Error();
    } catch {
      setErrores({
        importe:
          "Escribe un importe mayor que cero, con hasta dos decimales. Por ejemplo: 25,50.",
      });
      return;
    }
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(borrador.fecha);
    const fecha = coincidencia
      ? new Date(
          Number(coincidencia[1]),
          Number(coincidencia[2]) - 1,
          Number(coincidencia[3]),
          12,
        )
      : null;
    if (
      !fecha ||
      !Number.isFinite(fecha.getTime()) ||
      fechaLocal(fecha) !== borrador.fecha
    ) {
      setErrores({ fecha: "Escribe una fecha válida con formato AAAA-MM-DD." });
      return;
    }
    const base = {
      importeCentavos,
      codigoMoneda: datos.perfil.codigoMoneda,
      descripcion: borrador.descripcion.trim(),
      cuentaId: borrador.cuentaId,
      ocurridoEn:
        movimiento && borrador.fecha === inicial.fecha
          ? movimiento.ocurridoEn
          : fecha.toISOString(),
    };
    const nuevo: NuevoMovimiento =
      borrador.tipo === "transferencia"
        ? {
            ...base,
            tipo: "transferencia",
            categoriaId: null,
            cuentaDestinoId: borrador.cuentaDestinoId,
          }
        : {
            ...base,
            tipo: borrador.tipo,
            categoriaId: borrador.categoriaId,
            cuentaDestinoId: null,
          };
    ocupado.current = true;
    try {
      await operaciones.mutateAsync(
        movimiento
          ? { tipo: "actualizarMovimiento", id: movimiento.id, datos: nuevo }
          : { tipo: "crearMovimiento", datos: nuevo },
      );
      setTerminado(true);
      try {
        await descartar();
        if (router.canGoBack()) router.back();
        else router.replace("/movimientos");
      } catch {
        setError(
          "El movimiento se guardó, pero no pudimos limpiar el borrador local. Puedes volver a la lista.",
        );
      }
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      ocupado.current = false;
    }
  }
  async function eliminar() {
    if (!movimiento || ocupado.current || bloqueado) return;
    ocupado.current = true;
    setError(null);
    try {
      await operaciones.mutateAsync({
        tipo: "eliminarMovimiento",
        id: movimiento.id,
      });
      setTerminado(true);
      await descartar().catch(() => undefined);
      if (router.canGoBack()) router.back();
      else router.replace("/movimientos");
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
        <PageHeader
          title={movimiento ? "Editar movimiento" : "Nuevo movimiento"}
        />
        <Text tone="secondary">
          Registra tus ingresos, gastos o transferencias entre tus propias
          cuentas.
        </Text>
        {errorLocal ? (
          <Text accessibilityRole="alert" tone="warning">
            {errorLocal}
          </Text>
        ) : null}
        {cuentas.length === 0 ? (
          <View style={styles.group}>
            <Text>
              No tienes cuentas en {datos.perfil.codigoMoneda}. Crea una para
              registrar movimientos.
            </Text>
            <Button
              label="Crear mi primera cuenta"
              onPress={() => router.replace("/cuenta")}
            />
          </View>
        ) : (
          <>
            <Opciones
              label="Tipo de movimiento"
              valor={borrador.tipo}
              disabled={bloqueado}
              opciones={[
                { valor: "gasto", nombre: "Gasto" },
                { valor: "ingreso", nombre: "Ingreso" },
                { valor: "transferencia", nombre: "Transferencia" },
              ]}
              onChange={(tipo) =>
                cambiar({
                  tipo,
                  categoriaId:
                    datos.categorias.find(
                      (item) => item.tipo === tipo && !item.archivada,
                    )?.id ?? "",
                  cuentaDestinoId: "",
                })
              }
            />
            <TextField
              label={`Importe (${datos.perfil.codigoMoneda})`}
              value={borrador.importe}
              onChangeText={(importe) => cambiar({ importe })}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={errores.importe}
              editable={!bloqueado}
            />
            <TextField
              label="Descripción"
              value={borrador.descripcion}
              onChangeText={(descripcion) => cambiar({ descripcion })}
              placeholder="Por ejemplo, almuerzo"
              maxLength={500}
              editable={!bloqueado}
            />
            <Opciones
              label={
                borrador.tipo === "transferencia"
                  ? "Cuenta de origen"
                  : "Cuenta"
              }
              valor={borrador.cuentaId}
              disabled={bloqueado}
              opciones={cuentas.map((item) => ({
                valor: item.id,
                nombre: item.nombre,
              }))}
              onChange={(cuentaId) =>
                cambiar({
                  cuentaId,
                  ...(cuentaId === borrador.cuentaDestinoId
                    ? { cuentaDestinoId: "" }
                    : {}),
                })
              }
            />
            {borrador.tipo === "transferencia" ? (
              <>
                <Opciones
                  label="Cuenta de destino"
                  valor={borrador.cuentaDestinoId}
                  disabled={bloqueado}
                  opciones={cuentas
                    .filter((item) => item.id !== borrador.cuentaId)
                    .map((item) => ({ valor: item.id, nombre: item.nombre }))}
                  onChange={(cuentaDestinoId) => cambiar({ cuentaDestinoId })}
                />
                {cuentas.length < 2 ? (
                  <Text tone="warning">
                    Necesitas dos cuentas en la misma moneda para hacer una
                    transferencia.
                  </Text>
                ) : null}
              </>
            ) : (
              <Opciones
                label="Categoría"
                valor={borrador.categoriaId}
                disabled={bloqueado}
                opciones={categorias.map((item) => ({
                  valor: item.id,
                  nombre: item.nombre,
                }))}
                onChange={(categoriaId) => cambiar({ categoriaId })}
              />
            )}
            <TextField
              label="Fecha"
              value={borrador.fecha}
              onChangeText={(fecha) => cambiar({ fecha })}
              placeholder="AAAA-MM-DD"
              autoCapitalize="none"
              maxLength={10}
              error={errores.fecha}
              editable={!bloqueado}
            />
            {error ? (
              <Text accessibilityRole="alert" tone="negative">
                {error}
              </Text>
            ) : null}
            <Button
              label={movimiento ? "Guardar cambios" : "Guardar movimiento"}
              fullWidth
              loading={operaciones.isPending}
              disabled={
                bloqueado ||
                (borrador.tipo === "transferencia" && cuentas.length < 2)
              }
              onPress={() => void guardar()}
            />
            {terminado ? (
              <Button
                label="Volver a movimientos"
                variant="tonal"
                fullWidth
                onPress={() => router.replace("/movimientos")}
              />
            ) : null}
            {movimiento && !terminado ? (
              <Button
                label="Eliminar movimiento"
                variant="text"
                fullWidth
                disabled={bloqueado}
                onPress={() => setConfirmar(true)}
              />
            ) : null}
            {confirmar && !terminado ? (
              <Surface>
                <View style={styles.group}>
                  <Text role="title">¿Eliminar este movimiento?</Text>
                  <Text tone="secondary">
                    Se recalcularán los saldos. Esta acción no se puede
                    deshacer.
                  </Text>
                  <Button
                    label="Confirmar eliminación"
                    disabled={bloqueado}
                    loading={operaciones.isPending}
                    onPress={() => void eliminar()}
                  />
                  <Button
                    label="Conservar movimiento"
                    variant="text"
                    disabled={bloqueado}
                    onPress={() => setConfirmar(false)}
                  />
                </View>
              </Surface>
            ) : null}
          </>
        )}
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
