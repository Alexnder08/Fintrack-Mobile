import { ProfileScreen } from "@/src/features/profile";
import { useFintrack } from "@/src/hooks";

export default function PerfilRoute() {
  const { props, refetch, status } = useFintrack();

  return (
    <ProfileScreen
      {...props?.profile}
      onRetry={() => void refetch()}
      status={status}
    />
  );
}
