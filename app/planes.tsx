import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import {
  Button,
  Money,
  Screen,
  Surface,
  Text,
  TextField,
} from "@/src/components";
import { PageHeader } from "@/src/features/shared/PageHeader";
import { Opciones } from "@/src/features/shared/Opciones";
import { useFintrack } from "@/src/hooks";
import { useOperaciones } from "@/src/hooks/useOperaciones";
import { decimalACentavos } from "@/src/data";
import { mensajeError, type Plan } from "@/src/services";
import { spacing } from "@/src/theme";

export default function PlanesRoute() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const presupuestos = tipo === "presupuesto";
  const { data, error: errorDatos, refetch } = useFintrack();
  const operacion = useOperaciones();
  const [editor, setEditor] = useState<{
    tipo: Plan["tipo"];
    id?: string;
    metaId?: string;
  } | null>(null);
  const [nombre, setNombre] = useState("");
  const [importe, setImporte] = useState("");
  const [categoria, setCategoria] = useState("");
  const [mes, setMes] = useState(
    () =>
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  );
  const [error, setError] = useState<string | null>(null);
  const [borrar, setBorrar] = useState<{
    tipo: Plan["tipo"];
    id: string;
  } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  function abrir(
    tipo: Plan["tipo"],
    id?: string,
    metaId?: string,
    valor = 0,
    etiqueta = "",
    cat = "",
    periodo?: string,
  ) {
    setEditor({ tipo, id, metaId });
    setImporte(valor ? (valor / 100).toFixed(2) : "");
    setNombre(etiqueta);
    setCategoria(cat);
    if (periodo) setMes(periodo.slice(0, 7));
    setError(null);
    setAviso(null);
  }
  async function guardar() {
    if (!editor || operacion.isPending) return;
    setError(null);
    try {
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(importe.trim()))
        throw new Error("Escribe un importe válido, por ejemplo 100,50.");
      const importeCentavos = decimalACentavos(
        importe.trim().replace(",", "."),
      );
      const base = { id: editor.id, importeCentavos };
      const plan: Plan =
        editor.tipo === "meta"
          ? { ...base, tipo: "meta", nombre: nombre.trim() }
          : editor.tipo === "presupuesto"
            ? {
                ...base,
                tipo: "presupuesto",
                categoriaId: categoria,
                periodoInicio: mes + "-01",
              }
            : { ...base, tipo: "aporte", metaId: editor.metaId ?? "" };
      await operacion.mutateAsync({ tipo: "guardarPlan", datos: plan });
      setEditor(null);
      setAviso("Guardado correctamente.");
    } catch (fallo) {
      setError(mensajeError(fallo));
    }
  }
  async function eliminar() {
    if (!borrar || operacion.isPending) return;
    try {
      await operacion.mutateAsync({
        tipo: "eliminarPlan",
        recurso: borrar.tipo,
        id: borrar.id,
      });
      setBorrar(null);
      setAviso("Registro eliminado.");
      setError(null);
    } catch (fallo) {
      setError(mensajeError(fallo));
    }
  }
  const datos = data?.datos;
  const bloqueado = operacion.isPending || data?.sinConexion;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Screen scrollable contentContainerStyle={{ gap: spacing.md }}>
        <PageHeader title={presupuestos ? "Presupuestos" : "Metas de ahorro"} />
        {error || errorDatos ? (
          <Text accessibilityRole="alert" tone="negative">
            {error ?? mensajeError(errorDatos)}
          </Text>
        ) : null}
        {aviso ? (
          <Text accessibilityLiveRegion="polite" tone="positive">
            {aviso}
          </Text>
        ) : null}
        {!datos ? (
          <Button label="Actualizar datos" onPress={() => void refetch()} />
        ) : (
          <>
            {data?.sinConexion ? (
              <Text tone="warning">
                Estás viendo una copia local. Reconecta para modificarla.
              </Text>
            ) : null}
            {editor ? (
              <Surface padding="md">
                <View style={{ gap: spacing.md }}>
                  <Text role="title">
                    {editor.tipo === "aporte"
                      ? "Aporte a tu meta"
                      : editor.id
                        ? "Editar"
                        : "Crear"}
                  </Text>
                  {editor.tipo === "meta" ? (
                    <TextField
                      label="Nombre de la meta"
                      maxLength={80}
                      value={nombre}
                      onChangeText={setNombre}
                      editable={!bloqueado}
                    />
                  ) : null}
                  {editor.tipo === "presupuesto" ? (
                    <>
                      <Opciones
                        label="Categoría de gasto"
                        valor={categoria}
                        disabled={bloqueado}
                        opciones={datos.categorias
                          .filter((c) => c.tipo === "gasto" && !c.archivada)
                          .map((c) => ({ valor: c.id, nombre: c.nombre }))}
                        onChange={setCategoria}
                      />
                      <TextField
                        label="Mes (AAAA-MM)"
                        value={mes}
                        onChangeText={setMes}
                        maxLength={7}
                        editable={!bloqueado}
                      />
                    </>
                  ) : null}
                  <TextField
                    label={`Importe (${datos.perfil.codigoMoneda})`}
                    value={importe}
                    onChangeText={setImporte}
                    keyboardType="decimal-pad"
                    editable={!bloqueado}
                  />
                  {editor.tipo === "aporte" ? (
                    <Text role="caption" tone="secondary">
                      Este aporte mide tu ahorro destinado a la meta. No
                      modifica el saldo de tus cuentas.
                    </Text>
                  ) : null}
                  <Button
                    label="Guardar"
                    loading={operacion.isPending}
                    disabled={bloqueado}
                    onPress={() => void guardar()}
                  />
                  <Button
                    label="Cancelar"
                    variant="text"
                    disabled={operacion.isPending}
                    onPress={() => setEditor(null)}
                  />
                </View>
              </Surface>
            ) : (
              <Button
                label={presupuestos ? "Crear presupuesto" : "Crear meta"}
                disabled={bloqueado}
                onPress={() => abrir(presupuestos ? "presupuesto" : "meta")}
              />
            )}
            {borrar ? (
              <Surface padding="md">
                <View style={{ gap: spacing.sm }}>
                  <Text>
                    ¿Eliminar este registro? Esta acción no se puede deshacer.
                  </Text>
                  <Button
                    label="Confirmar eliminación"
                    loading={operacion.isPending}
                    onPress={() => void eliminar()}
                  />
                  <Button
                    label="Cancelar"
                    variant="text"
                    disabled={operacion.isPending}
                    onPress={() => setBorrar(null)}
                  />
                </View>
              </Surface>
            ) : null}
            {presupuestos ? (
              <>
                {datos.presupuestos.length === 0 ? (
                  <Text tone="secondary">
                    Define cuánto puedes gastar en cada categoría y mes.
                  </Text>
                ) : null}
                {datos.presupuestos.map((p) => (
                  <Surface padding="md" key={p.id}>
                    <View style={{ gap: spacing.sm }}>
                      <Text role="title">
                        {
                          datos.categorias.find((c) => c.id === p.categoriaId)
                            ?.nombre
                        }
                      </Text>
                      <Text tone="secondary">
                        {p.periodoInicio.slice(0, 7)}
                      </Text>
                      <Money
                        amount={p.importeCentavos / 100}
                        currency={datos.perfil.codigoMoneda}
                      />
                      <Button
                        label="Editar presupuesto"
                        variant="tonal"
                        disabled={bloqueado}
                        onPress={() =>
                          abrir(
                            "presupuesto",
                            p.id,
                            undefined,
                            p.importeCentavos,
                            "",
                            p.categoriaId,
                            p.periodoInicio,
                          )
                        }
                      />
                      <Button
                        label="Eliminar presupuesto"
                        variant="text"
                        disabled={bloqueado}
                        onPress={() =>
                          setBorrar({ tipo: "presupuesto", id: p.id })
                        }
                      />
                    </View>
                  </Surface>
                ))}
              </>
            ) : (
              <>
                {datos.metas.length === 0 ? (
                  <Text tone="secondary">
                    Crea tu primera meta y registra tus aportes.
                  </Text>
                ) : null}
                {datos.metas.map((m) => {
                  const aportes = datos.aportesMeta.filter(
                    (a) => a.metaId === m.id,
                  );
                  return (
                    <Surface key={m.id} padding="md">
                      <View style={{ gap: spacing.sm }}>
                        <Text role="title">{m.nombre}</Text>
                        <Text tone="secondary">Ahorrado / objetivo</Text>
                        <Money
                          amount={
                            aportes.reduce((s, a) => s + a.importeCentavos, 0) /
                            100
                          }
                          currency={datos.perfil.codigoMoneda}
                        />
                        <Money
                          amount={m.objetivoCentavos / 100}
                          currency={datos.perfil.codigoMoneda}
                        />
                        <Button
                          label="Registrar aporte"
                          disabled={bloqueado}
                          onPress={() => abrir("aporte", undefined, m.id)}
                        />
                        <Button
                          label="Editar meta"
                          variant="tonal"
                          disabled={bloqueado}
                          onPress={() =>
                            abrir(
                              "meta",
                              m.id,
                              undefined,
                              m.objetivoCentavos,
                              m.nombre,
                            )
                          }
                        />
                        <Button
                          label="Eliminar meta"
                          variant="text"
                          disabled={bloqueado}
                          onPress={() => setBorrar({ tipo: "meta", id: m.id })}
                        />
                        {aportes.map((a) => (
                          <View key={a.id} style={{ gap: spacing.xs }}>
                            <Text role="caption" tone="secondary">
                              Aporte ·{" "}
                              {new Date(a.aportadoEn).toLocaleDateString(
                                "es-PE",
                              )}
                            </Text>
                            <Money
                              amount={a.importeCentavos / 100}
                              currency={datos.perfil.codigoMoneda}
                            />
                            <Button
                              label="Editar aporte"
                              variant="tonal"
                              disabled={bloqueado}
                              onPress={() =>
                                abrir("aporte", a.id, m.id, a.importeCentavos)
                              }
                            />
                            <Button
                              label="Eliminar aporte"
                              variant="text"
                              disabled={bloqueado}
                              onPress={() =>
                                setBorrar({ tipo: "aporte", id: a.id })
                              }
                            />
                          </View>
                        ))}
                      </View>
                    </Surface>
                  );
                })}
              </>
            )}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
