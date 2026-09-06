import { StateView } from "@/src/components";
import { Screen } from "@/src/components/Screen";

export default function AnalisisRoute() {
  return (
    <Screen edges={["top", "left", "right"]}>
      <StateView
        kind="empty"
        title="Análisis en preparación"
        description="Tus tendencias aparecerán cuando registres movimientos."
      />
    </Screen>
  );
}
