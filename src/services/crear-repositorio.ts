import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { RepositorioFintrack } from "./repositorio-fintrack";
import { RepositorioFintrackDemo } from "./repositorio-demo";
import { RepositorioFintrackSupabase } from "./repositorio-supabase";

/**
 * El modo demo solo se elige cuando Supabase no esta configurado.
 * Un error remoto se propaga y nunca activa datos ficticios como fallback.
 */
export function crearRepositorioFintrack(): RepositorioFintrack {
  return isSupabaseConfigured
    ? new RepositorioFintrackSupabase(supabase)
    : new RepositorioFintrackDemo();
}
