import { ProfileScreen } from "@/src/features/profile";
import { useFintrack } from "@/src/hooks";
import { useState } from "react";
import { Share } from "react-native";
import { useSesion } from "@/src/hooks/useSesion";
import { DataNotice } from "@/src/features/shared/DataNotice";
import { Text } from "@/src/components";
import { useRouter } from "expo-router";

export default function PerfilRoute() {
  const router = useRouter();
  const { props, refetch, status, data, error } = useFintrack();
  const { cerrarSesion } = useSesion();
  const [fallo, setFallo] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState(false);
  async function salir() {
    if (cerrando) return;
    setCerrando(true);
    setFallo(null);
    try {
      await cerrarSesion();
    } catch {
      setFallo(
        "No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.",
      );
    } finally {
      setCerrando(false);
    }
  }
  async function exportar() {
    if (!data) return;
    try {
      await Share.share({
        title: "Datos de Fintrack",
        message: JSON.stringify({ version: 1, datos: data.datos }, null, 2),
      });
    } catch {
      setFallo("No pudimos abrir las opciones para compartir tus datos.");
    }
  }

  return (
    <ProfileScreen
      {...props?.profile}
      onRetry={() => void refetch()}
      status={status}
      onExport={() => void exportar()}
      onManageGoals={() => router.push("/planes")}
      onHelp={() => router.push("/ajustes")}
      onAppearance={() => router.push("/ajustes")}
      onSignOut={!cerrando ? () => void salir() : undefined}
      notice={
        <>
          <DataNotice
            data={data}
            error={error}
            onRetry={() => void refetch()}
          />
          {fallo ? (
            <Text accessibilityRole="alert" tone="negative">
              {fallo}
            </Text>
          ) : null}
        </>
      }
    />
  );
}
