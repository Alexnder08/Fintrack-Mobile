import { useState } from "react";
import { Button, Screen, Text, TextField } from "@/src/components";
import { PageHeader } from "@/src/features/shared/PageHeader";
import { useFintrack } from "@/src/hooks";
import { useOperaciones } from "@/src/hooks/useOperaciones";
import { usePreferencias } from "@/src/hooks/usePreferencias";
import { mensajeError } from "@/src/services";
import { spacing } from "@/src/theme";

export default function AjustesRoute() {
  const { data } = useFintrack();
  const operacion = useOperaciones();
  const preferencias = usePreferencias();
  const [nombre, setNombre] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  async function guardar() {
    try {
      await operacion.mutateAsync({
        tipo: "actualizarNombre",
        nombre: nombre ?? data?.perfil.nombreMostrar ?? "",
      });
      setAviso("Perfil guardado.");
    } catch (error) {
      setAviso(mensajeError(error));
    }
  }
  return (
    <Screen scrollable contentContainerStyle={{ gap: spacing.md }}>
      <PageHeader title="Mi perfil y privacidad" />
      <TextField
        label="Tu nombre"
        value={nombre ?? data?.perfil.nombreMostrar ?? ""}
        onChangeText={setNombre}
        maxLength={80}
        editable={!operacion.isPending && !data?.sinConexion}
      />
      <Button
        label="Guardar perfil"
        loading={operacion.isPending}
        disabled={!data || data.sinConexion}
        onPress={() => void guardar()}
      />
      {aviso ? <Text accessibilityLiveRegion="polite">{aviso}</Text> : null}
      <Text role="title">Privacidad</Text>
      <Button
        label={
          preferencias.preferencias.balanceOculto
            ? "Mostrar balance en Inicio"
            : "Ocultar balance en Inicio"
        }
        variant="tonal"
        disabled={preferencias.cargando}
        onPress={() => void preferencias.alternarBalance()}
      />
      {preferencias.error ? (
        <Text tone="negative">{preferencias.error}</Text>
      ) : null}
      <Text role="title">Cómo usar Fintrack</Text>
      <Text>1. En Cuentas, crea una cuenta e indica su saldo inicial.</Text>
      <Text>
        2. En Inicio, registra un ingreso, gasto o transferencia. Puedes editar
        y eliminar cada registro desde Movimientos.
      </Text>
      <Text>
        3. En Análisis, define presupuestos por categoría y mes. En Perfil, crea
        metas y registra aportes.
      </Text>
      <Text>
        4. Exporta tus datos desde Perfil para conservar una copia. Cerrar
        sesión conserva los datos guardados.
      </Text>
      <Text tone="secondary">
        El modo en este dispositivo guarda tus datos localmente. Desinstalar la
        app borra esa información. El modo con cuenta guarda los datos en el
        servidor.
      </Text>
    </Screen>
  );
}
