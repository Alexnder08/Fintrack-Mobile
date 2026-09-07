import { isDemoMode, isSupabaseConfigured, supabase } from "../lib/supabase";
import type { RepositorioFintrack } from "./repositorio-fintrack";
import { RepositorioFintrackDemo } from "./repositorio-demo";
import { RepositorioFintrackSupabase } from "./repositorio-supabase";

/**
 * El modo demo se elige sin Supabase o mediante una bandera explicita local.
 * Un error remoto se propaga y nunca activa datos ficticios como fallback.
 */
export function crearRepositorioFintrack(): RepositorioFintrack {
  return isSupabaseConfigured && !isDemoMode
    ? new RepositorioFintrackSupabase(supabase)
    : new RepositorioFintrackDemo();
}
