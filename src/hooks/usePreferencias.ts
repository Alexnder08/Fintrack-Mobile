import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { almacenamiento, clavePreferencias } from "../lib/almacenamiento";
import { useSesion } from "./useSesion";

const esquema = z.object({ balanceOculto: z.boolean() });
const predeterminadas = { balanceOculto: false };
export function usePreferencias() {
  const { usuarioId } = useSesion();
  const [preferencias, setPreferencias] = useState(predeterminadas);
  const [usuarioCargado, setUsuarioCargado] = useState<string | null>(null);
  const cargando = usuarioCargado !== usuarioId;
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const ocupado = useRef(false);
  useEffect(() => {
    let activo = true;
    void almacenamiento
      .getItem(clavePreferencias(usuarioId))
      .then((valor) => {
        if (activo)
          setPreferencias(
            valor ? esquema.parse(JSON.parse(valor)) : predeterminadas,
          );
      })
      .catch(() => {
        if (activo)
          setError("No pudimos recuperar tu preferencia de privacidad.");
      })
      .finally(() => {
        if (activo) setUsuarioCargado(usuarioId);
      });
    return () => {
      activo = false;
    };
  }, [usuarioId]);

  async function alternarBalance() {
    if (cargando || ocupado.current) return;
    ocupado.current = true;
    setGuardando(true);
    setError(null);
    const siguientes = { balanceOculto: !preferencias.balanceOculto };
    try {
      await almacenamiento.setItem(
        clavePreferencias(usuarioId),
        JSON.stringify(siguientes),
      );
      setPreferencias(siguientes);
    } catch {
      setError("No pudimos guardar tu preferencia. Inténtalo nuevamente.");
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  }
  return { preferencias, cargando, guardando, error, alternarBalance };
}
