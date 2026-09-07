import { AnalysisScreen } from "@/src/features/analysis";
import { useFintrack } from "@/src/hooks";

export default function AnalisisRoute() {
  const { props, refetch, status } = useFintrack();

  return (
    <AnalysisScreen
      {...props?.analysis}
      onRetry={() => void refetch()}
      status={status}
    />
  );
}
