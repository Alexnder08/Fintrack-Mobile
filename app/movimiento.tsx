import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, StateView } from "@/src/components";
import { MovimientoEditor } from "@/src/features/movements/MovimientoEditor";
import { useFintrack } from "@/src/hooks";
import { mensajeError } from "@/src/services";

export default function MovimientoRoute() {
  const parametros = useLocalSearchParams<{
    id?: string;
    tipo?: string;
    cuenta?: string;
  }>();
  const router = useRouter();
  const { data, error, refetch } = useFintrack();
  if (!data)
    return (
      <Screen>
        <StateView
          kind={error ? "error" : "loading"}
          title={
            error ? "No pudimos abrir el formulario" : "Cargando tus cuentas"
          }
          description={error ? mensajeError(error) : "Un momento, por favor."}
          actionLabel={error ? "Reintentar" : undefined}
          onAction={() => void refetch()}
        />
      </Screen>
    );
  const movimiento = data.datos.movimientos.find(
    (item) => item.id === parametros.id,
  );
  if (parametros.id && !movimiento)
    return (
      <Screen>
        <StateView
          kind="empty"
          title="Este movimiento ya no existe"
          description="Vuelve a la lista para consultar tus movimientos actuales."
          actionLabel="Ver movimientos"
          onAction={() => router.replace("/movimientos")}
        />
      </Screen>
    );
  return (
    <MovimientoEditor
      key={parametros.id ?? "nuevo"}
      datos={data.datos}
      movimiento={movimiento}
      cuentaInicial={parametros.cuenta}
      tipoInicial={
        parametros.tipo === "ingreso" || parametros.tipo === "transferencia"
          ? parametros.tipo
          : "gasto"
      }
    />
  );
}
