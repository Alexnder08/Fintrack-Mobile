import type {
  DatosFintrack,
  MovimientoConMoneda,
  NuevoMovimiento,
  NuevaCuenta,
} from "../data";
import type { Cuenta } from "../domain";

export type ModoDatos = "demo" | "local" | "supabase";

export interface RepositorioFintrack {
  readonly modo: ModoDatos;
  cargarDatos(): Promise<DatosFintrack>;
  crearMovimiento(movimiento: NuevoMovimiento): Promise<MovimientoConMoneda>;
  actualizarMovimiento(
    id: string,
    movimiento: NuevoMovimiento,
  ): Promise<MovimientoConMoneda>;
  eliminarMovimiento(id: string): Promise<void>;
  crearCuenta(cuenta: NuevaCuenta): Promise<Cuenta>;
  actualizarCuenta(id: string, cuenta: NuevaCuenta): Promise<Cuenta>;
  eliminarCuenta(id: string): Promise<void>;
  guardarPlan?(plan: Plan): Promise<void>;
  eliminarPlan?(tipo: Plan["tipo"], id: string): Promise<void>;
  actualizarNombre?(nombre: string): Promise<void>;
}

export type Plan =
  | { tipo: "meta"; id?: string; nombre: string; importeCentavos: number }
  | {
      tipo: "presupuesto";
      id?: string;
      categoriaId: string;
      periodoInicio: string;
      importeCentavos: number;
    }
  | { tipo: "aporte"; id?: string; metaId: string; importeCentavos: number };

export class ErrorRepositorioFintrack extends Error {
  readonly recurso: string;
  readonly causa: unknown;

  constructor(recurso: string, causa: unknown) {
    super(`No se pudo completar la operación de ${recurso}.`);
    this.name = "ErrorRepositorioFintrack";
    this.recurso = recurso;
    this.causa = causa;
  }
}

export function mensajeError(error: unknown): string {
  if (error instanceof ErrorRepositorioFintrack) {
    const causa = error.causa as {
      code?: string;
      message?: string;
      status?: number;
    } | null;
    if (causa?.code === "23503")
      return "Esta cuenta tiene movimientos asociados. Elimina o cambia esos movimientos antes de borrar la cuenta.";
    if (causa?.code === "23505")
      return "Ya existe un registro con esos datos. Revisa el nombre e inténtalo de nuevo.";
    if (causa?.code === "42501" || causa?.status === 403)
      return "No tienes permiso para modificar estos datos. Vuelve a iniciar sesión.";
    if (error.recurso.includes("sesion"))
      return "Tu sesión no está disponible. Vuelve a iniciar sesión y revisa tu conexión.";
    if (
      causa?.message?.includes("fetch") ||
      causa?.message?.includes("network")
    )
      return "No pudimos conectar con el servidor. Revisa tu conexión y vuelve a intentarlo; tus cambios aún no se han guardado.";
    if (error.recurso.includes("almacenamiento"))
      return "No pudimos guardar los datos en este dispositivo. Revisa el espacio disponible y vuelve a intentarlo.";
    return error.message + " Revisa tu conexión e inténtalo de nuevo.";
  }
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación. Vuelve a intentarlo.";
}
