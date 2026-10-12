import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, StateView } from "@/src/components";
import { CuentaEditor } from "@/src/features/accounts/CuentaEditor";
import { useFintrack } from "@/src/hooks";
import { mensajeError } from "@/src/services";

export default function CuentaRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, error, refetch } = useFintrack();
  if (!data)
    return (
      <Screen>
        <StateView
          kind={error ? "error" : "loading"}
          title={error ? "No pudimos abrir la cuenta" : "Cargando tus cuentas"}
          description={error ? mensajeError(error) : "Un momento, por favor."}
          actionLabel={error ? "Reintentar" : undefined}
          onAction={() => void refetch()}
        />
      </Screen>
    );
  const cuenta = data.datos.cuentas.find((item) => item.id === id);
  if (id && !cuenta)
    return (
      <Screen>
        <StateView
          kind="empty"
          title="Esta cuenta ya no existe"
          description="Vuelve a la lista de cuentas."
          actionLabel="Ver cuentas"
          onAction={() => router.replace("/cuentas")}
        />
      </Screen>
    );
  return (
    <CuentaEditor key={id ?? "nueva"} datos={data.datos} cuenta={cuenta} />
  );
}
