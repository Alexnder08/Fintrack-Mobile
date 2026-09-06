import { StateView } from "@/src/components";
import { Screen } from "@/src/components/Screen";

export default function CuentasRoute() {
  return (
    <Screen edges={["top", "left", "right"]}>
      <StateView
        kind="empty"
        title="Agrega tu primera cuenta"
        description="Reúne bancos, efectivo y tarjetas en un solo lugar."
      />
    </Screen>
  );
}
