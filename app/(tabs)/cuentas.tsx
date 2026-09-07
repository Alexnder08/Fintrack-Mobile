import { AccountsScreen } from "@/src/features/accounts";
import { useFintrack } from "@/src/hooks";

export default function CuentasRoute() {
  const { props, refetch, status } = useFintrack();

  return (
    <AccountsScreen
      {...props?.accounts}
      onRetry={() => void refetch()}
      status={status}
    />
  );
}
