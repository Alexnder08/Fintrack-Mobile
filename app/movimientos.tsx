import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Button, Screen, StateView, Text, TextField } from "@/src/components";
import { TransactionRow } from "@/src/features/shared";
import { DataNotice } from "@/src/features/shared/DataNotice";
import { Opciones } from "@/src/features/shared/Opciones";
import { PageHeader } from "@/src/features/shared/PageHeader";
import { useFintrack } from "@/src/hooks";
import { mensajeError } from "@/src/services";
import { colors, spacing } from "@/src/theme";

export default function MovimientosRoute() {
  const router = useRouter();
  const { cuenta } = useLocalSearchParams<{ cuenta?: string }>();
  const { data, error, isFetching, refetch } = useFintrack();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const elementos = useMemo(() => {
    if (!data) return [];
    const texto = busqueda
      .trim()
      .toLocaleLowerCase(data.perfil.configuracionRegional);
    return data.datos.movimientos
      .filter(
        (item) =>
          (!cuenta ||
            item.cuentaId === cuenta ||
            item.cuentaDestinoId === cuenta) &&
          (filtro === "todos" || item.tipo === filtro) &&
          (!texto ||
            `${item.descripcion ?? ""} ${item.tipo} ${data.datos.cuentas.find((origen) => origen.id === item.cuentaId)?.nombre ?? ""}`
              .toLocaleLowerCase(data.perfil.configuracionRegional)
              .includes(texto)),
      )
      .sort((a, b) => Date.parse(b.ocurridoEn) - Date.parse(a.ocurridoEn));
  }, [busqueda, cuenta, data, filtro]);
  if (!data)
    return (
      <Screen>
        <PageHeader title="Movimientos" />
        <StateView
          kind={error ? "error" : "loading"}
          title={
            error ? "No pudimos cargar tus movimientos" : "Cargando movimientos"
          }
          description={error ? mensajeError(error) : "Un momento, por favor."}
          actionLabel={error ? "Reintentar" : undefined}
          onAction={() => void refetch()}
        />
      </Screen>
    );
  return (
    <Screen padded={false}>
      <FlatList
        data={elementos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={isFetching}
        onRefresh={() => void refetch()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              title={
                cuenta
                  ? `Movimientos de ${data.datos.cuentas.find((item) => item.id === cuenta)?.nombre ?? "la cuenta"}`
                  : "Movimientos"
              }
            />
            <DataNotice
              data={data}
              error={error}
              onRetry={() => void refetch()}
            />
            <Button
              label="Nuevo movimiento"
              fullWidth
              disabled={data.sinConexion}
              onPress={() =>
                router.push({
                  pathname: "/movimiento",
                  params: cuenta ? { cuenta } : {},
                })
              }
            />
            <TextField
              label="Buscar movimientos"
              placeholder="Descripción o cuenta"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            <Opciones
              label="Filtrar por tipo"
              valor={filtro}
              onChange={setFiltro}
              opciones={[
                { valor: "todos", nombre: "Todos" },
                { valor: "ingreso", nombre: "Ingresos" },
                { valor: "gasto", nombre: "Gastos" },
                { valor: "transferencia", nombre: "Transferencias" },
              ]}
            />
            <Text role="caption" tone="secondary">
              {elementos.length}{" "}
              {elementos.length === 1 ? "movimiento" : "movimientos"}. Toca uno
              para editarlo.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <StateView
            kind="empty"
            title={
              busqueda || filtro !== "todos"
                ? "Sin resultados"
                : "Aún no hay movimientos"
            }
            description={
              busqueda || filtro !== "todos"
                ? "Prueba otra búsqueda o cambia el filtro."
                : "Registra tu primer ingreso o gasto para comenzar."
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.descripcion || item.tipo}`}
            disabled={data.sinConexion}
            onPress={() =>
              router.push({ pathname: "/movimiento", params: { id: item.id } })
            }
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <TransactionRow
              currency={item.codigoMoneda}
              locale={data.perfil.configuracionRegional}
              item={{
                id: item.id,
                title: item.descripcion || item.tipo,
                detail: `${data.datos.cuentas.find((origen) => origen.id === item.cuentaId)?.nombre ?? "Cuenta"} · ${new Intl.DateTimeFormat(data.perfil.configuracionRegional, { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.ocurridoEn))}`,
                amount: item.importeCentavos / 100,
                kind:
                  item.tipo === "ingreso"
                    ? "income"
                    : item.tipo === "gasto"
                      ? "expense"
                      : "transfer",
              }}
            />
          </Pressable>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.md,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  header: { gap: spacing.md, marginBottom: spacing.md },
  row: { backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  pressed: { opacity: 0.76 },
});
