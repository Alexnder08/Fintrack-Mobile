import { AccountsScreen } from "@/src/features/accounts";
import { useFintrack } from "@/src/hooks";
import { useRouter } from "expo-router";
import { DataNotice } from "@/src/features/shared/DataNotice";

export default function CuentasRoute() {
  const { props, refetch, status, data, error } = useFintrack();
  const router = useRouter();

  return (
    <AccountsScreen
      {...props?.accounts}
      onRetry={() => void refetch()}
      status={status}
      onAddAccount={
        data?.sinConexion ? undefined : () => router.push("/cuenta")
      }
      onAccountPress={
        data?.sinConexion
          ? undefined
          : (cuenta) =>
              router.push({ pathname: "/cuenta", params: { id: cuenta.id } })
      }
      onViewAllTransactions={() => router.push("/movimientos")}
      notice={
        <DataNotice data={data} error={error} onRetry={() => void refetch()} />
      }
    />
  );
}
