import type {
  DatosFintrack,
  MovimientoConMoneda,
  NuevoMovimiento,
} from "../data";

export type ModoDatos = "demo" | "supabase";

export interface RepositorioFintrack {
  readonly modo: ModoDatos;
  cargarDatos(): Promise<DatosFintrack>;
  crearMovimiento(movimiento: NuevoMovimiento): Promise<MovimientoConMoneda>;
  eliminarMovimiento(id: string): Promise<void>;
}

export class ErrorRepositorioFintrack extends Error {
  readonly recurso: string;
  readonly causa: unknown;

  constructor(recurso: string, causa: unknown) {
    super(`No se pudo completar la operacion de ${recurso}`);
    this.name = "ErrorRepositorioFintrack";
    this.recurso = recurso;
    this.causa = causa;
  }
}
