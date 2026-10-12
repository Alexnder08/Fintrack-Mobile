import { HomeScreen } from "@/src/features/home";
import { useFintrack } from "@/src/hooks";
import { useRouter } from "expo-router";
import { usePreferencias } from "@/src/hooks/usePreferencias";
import { DataNotice } from "@/src/features/shared/DataNotice";
import { Text } from "@/src/components";

export default function InicioRoute() {
  const { props, refetch, status, data, error } = useFintrack();
  const router = useRouter();
  const preferencias = usePreferencias();

  return (
    <HomeScreen
      {...props?.home}
      onRetry={() => void refetch()}
      status={status}
      balanceHidden={
        preferencias.cargando || preferencias.preferencias.balanceOculto
      }
      onToggleBalance={() => void preferencias.alternarBalance()}
      onSend={
        data?.sinConexion
          ? undefined
          : () =>
              router.push({
                pathname: "/movimiento",
                params: { tipo: "transferencia" },
              })
      }
      onReceive={
        data?.sinConexion
          ? undefined
          : () =>
              router.push({
                pathname: "/movimiento",
                params: { tipo: "ingreso" },
              })
      }
      onPay={
        data?.sinConexion
          ? undefined
          : () =>
              router.push({
                pathname: "/movimiento",
                params: { tipo: "gasto" },
              })
      }
      onMore={() => router.push("/movimientos")}
      onViewAll={() => router.push("/movimientos")}
      onNotifications={() => router.push("/analisis")}
      onTransactionPress={
        data?.sinConexion
          ? undefined
          : (id) => router.push({ pathname: "/movimiento", params: { id } })
      }
      notice={
        <>
          <DataNotice
            data={data}
            error={error}
            onRetry={() => void refetch()}
          />
          {preferencias.error ? (
            <Text accessibilityRole="alert" tone="warning">
              {preferencias.error}
            </Text>
          ) : null}
        </>
      }
    />
  );
}
