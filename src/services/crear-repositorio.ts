import { isDemoMode, isSupabaseConfigured, supabase } from "../lib/supabase";
import type { RepositorioFintrack } from "./repositorio-fintrack";
import { RepositorioFintrackDemo } from "./repositorio-demo";
import { RepositorioFintrackSupabase } from "./repositorio-supabase";
import { RepositorioConCache } from "./repositorio-cache";

/**
 * El modo demo se elige sin Supabase o mediante una bandera explicita local.
 * Un error remoto se propaga y nunca activa datos ficticios como fallback.
 */
export function crearRepositorioFintrack(
  usuarioId?: string,
  modo?: "demo" | "local" | "supabase",
): RepositorioFintrack {
  if (modo === "local") return new RepositorioFintrackDemo(undefined, true);
  return modo === "supabase" ||
    (modo !== "demo" && isSupabaseConfigured && !isDemoMode)
    ? usuarioId
      ? new RepositorioConCache(
          new RepositorioFintrackSupabase(supabase),
          usuarioId,
        )
      : new RepositorioFintrackSupabase(supabase)
    : new RepositorioFintrackDemo();
}
