import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { almacenamiento, claveCache } from "../lib/almacenamiento";
import { crearRepositorioFintrack, ServicioFintrack } from "../services";

const CLAVE_ACCESO_LOCAL = "fintrack:acceso-local:v1";
type ContextoSesion = {
  usuarioId: string;
  local: boolean;
  sesion: Session | null;
  cargando: boolean;
  error: string | null;
  servicio: ServicioFintrack;
  cerrarSesion: () => Promise<void>;
  entrarDemo: () => Promise<void>;
  entrarPersonal: () => Promise<void>;
};
const Contexto = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState(false);
  const [personal, setPersonal] = useState(false);
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clienteQuery = useQueryClient();
  const usuarioId = local
    ? personal
      ? "dispositivo"
      : "demo"
    : (sesion?.user.id ?? "sin-sesion");
  const servicio = useMemo(
    () =>
      new ServicioFintrack(
        crearRepositorioFintrack(
          local ? undefined : usuarioId,
          local ? (personal ? "local" : "demo") : "supabase",
        ),
      ),
    [usuarioId, local, personal],
  );

  useEffect(() => {
    let vivo = true;
    void almacenamiento
      .getItem(CLAVE_ACCESO_LOCAL)
      .then((modo) => {
        if (vivo && (modo === "local" || modo === "demo")) {
          setPersonal(modo === "local");
          setLocal(true);
        }
      })
      .catch(() => {
        if (vivo) setError("No pudimos recuperar el acceso local.");
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    if (!isSupabaseConfigured)
      return () => {
        vivo = false;
      };
    let activo = true;
    let recibioEvento = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      recibioEvento = true;
      if (activo) {
        setSesion(nuevaSesion);
        if (nuevaSesion) setLocal(false);
        setCargando(false);
        setError(null);
      }
    });
    void supabase.auth
      .getSession()
      .then(({ data, error: fallo }) => {
        if (!activo || recibioEvento) return;
        setSesion(data.session);
        if (data.session) setLocal(false);
        setError(
          fallo
            ? "No pudimos recuperar tu sesión. Inicia sesión nuevamente."
            : null,
        );
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setError("No pudimos recuperar tu sesión. Revisa tu conexión.");
          setCargando(false);
        }
      });
    const actualizarRefresco = (estado: string) => {
      if (estado === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    actualizarRefresco(AppState.currentState);
    const escucha = AppState.addEventListener("change", actualizarRefresco);
    return () => {
      activo = false;
      vivo = false;
      subscription.unsubscribe();
      escucha.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    // Las vistas y los resultados remotos nunca se comparten entre usuarios.
    clienteQuery.removeQueries({
      predicate: (query) =>
        query.queryKey[0] === "fintrack" && query.queryKey[1] !== usuarioId,
    });
  }, [clienteQuery, usuarioId]);

  async function cerrarSesion() {
    if (local) {
      await almacenamiento.removeItem(CLAVE_ACCESO_LOCAL);
      setLocal(false);
      setSesion(null);
      clienteQuery.clear();
      return;
    }
    const { error: fallo } = await supabase.auth.signOut({ scope: "local" });
    if (fallo)
      throw new Error(
        "No pudimos cerrar la sesión. Revisa tu conexión e inténtalo de nuevo.",
      );
    clienteQuery.clear();
    await almacenamiento.removeItem(claveCache(usuarioId));
  }

  async function entrarLocal(esPersonal: boolean) {
    await almacenamiento.setItem(
      CLAVE_ACCESO_LOCAL,
      esPersonal ? "local" : "demo",
    );
    setPersonal(esPersonal);
    setLocal(true);
    setCargando(false);
    setError(null);
  }

  return (
    <Contexto.Provider
      value={{
        usuarioId,
        local,
        sesion,
        cargando,
        error,
        servicio,
        cerrarSesion,
        entrarDemo: () => entrarLocal(false),
        entrarPersonal: () => entrarLocal(true),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSesion requiere SesionProvider");
  return contexto;
}
