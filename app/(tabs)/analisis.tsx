import { AnalysisScreen } from "@/src/features/analysis";
import { useFintrack } from "@/src/hooks";
import { useState } from "react";
import type { AnalysisPeriod } from "@/src/features/analysis/AnalysisScreen";
import { DataNotice } from "@/src/features/shared/DataNotice";
import { useRouter } from "expo-router";

export default function AnalisisRoute() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<AnalysisPeriod>("month");
  const { props, refetch, status, data, error } = useFintrack(periodo);

  return (
    <AnalysisScreen
      {...props?.analysis}
      onRetry={() => void refetch()}
      status={status}
      period={periodo}
      onPeriodChange={setPeriodo}
      onManageBudgets={() =>
        router.push({ pathname: "/planes", params: { tipo: "presupuesto" } })
      }
      notice={
        <DataNotice data={data} error={error} onRetry={() => void refetch()} />
      }
    />
  );
}
