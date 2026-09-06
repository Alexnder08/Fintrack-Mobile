import { StateView } from "@/src/components";
import { Screen } from "@/src/components/Screen";

export default function PerfilRoute() {
  return (
    <Screen edges={["top", "left", "right"]}>
      <StateView
        kind="empty"
        title="Tu perfil"
        description="Aquí controlarás seguridad, avisos y exportaciones."
      />
    </Screen>
  );
}
