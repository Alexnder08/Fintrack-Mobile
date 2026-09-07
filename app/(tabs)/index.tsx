import { HomeScreen } from "@/src/features/home";
import { useFintrack } from "@/src/hooks";

export default function InicioRoute() {
  const { props, refetch, status } = useFintrack();

  return (
    <HomeScreen
      {...props?.home}
      onRetry={() => void refetch()}
      status={status}
    />
  );
}
