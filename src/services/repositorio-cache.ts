import type { Cuenta } from "../domain";
import type { DatosFintrack, NuevoMovimiento, NuevaCuenta } from "../data";
import {
  almacenamiento,
  claveCache,
  guardarDatos,
  leerDatos,
  type AlmacenClaveValor,
} from "../lib/almacenamiento";
import {
  ErrorRepositorioFintrack,
  type Plan,
  type RepositorioFintrack,
} from "./repositorio-fintrack";

/** Caché por usuario; solo permite lectura de la última copia ante fallos de red. */
export class RepositorioConCache implements RepositorioFintrack {
  readonly modo = "supabase" as const;
  sinConexion = false;
  advertenciaPersistencia: string | undefined;
  constructor(
    private readonly remoto: RepositorioFintrack,
    private readonly usuarioId: string,
    private readonly almacen: AlmacenClaveValor = almacenamiento,
  ) {}

  async cargarDatos(): Promise<DatosFintrack> {
    this.advertenciaPersistencia = undefined;
    let datos: DatosFintrack;
    try {
      datos = await this.remoto.cargarDatos();
      if (datos.perfil.usuarioId !== this.usuarioId)
        throw new Error("La sesión cambió. Vuelve a abrir esta sección.");
      this.sinConexion = false;
    } catch (error) {
      const causa =
        error instanceof ErrorRepositorioFintrack ? error.causa : error;
      const detalle = causa as { message?: string; status?: number } | null;
      const esRed =
        (causa instanceof TypeError ||
          /network|failed to fetch|fetch failed|network request failed/i.test(
            detalle?.message ?? "",
          )) &&
        !detalle?.status;
      if (!esRed) throw error;
      const copia = await leerDatos(claveCache(this.usuarioId), this.almacen);
      if (!copia || copia.perfil.usuarioId !== this.usuarioId) throw error;
      this.sinConexion = true;
      return copia;
    }
    try {
      await guardarDatos(claveCache(this.usuarioId), datos, this.almacen);
    } catch {
      this.advertenciaPersistencia =
        "Tus datos están en el servidor, pero no pudimos guardar una copia local. Revisa el espacio disponible.";
    }
    return datos;
  }

  private exigirConexion(): void {
    if (this.sinConexion)
      throw new Error(
        "Estás viendo una copia guardada. Reconecta y actualiza antes de modificar datos.",
      );
  }
  guardarPlan(plan: Plan): Promise<void> {
    this.exigirConexion();
    if (!this.remoto.guardarPlan) throw new Error("Operación no disponible.");
    return this.remoto.guardarPlan(plan);
  }
  eliminarPlan(tipo: Plan["tipo"], id: string): Promise<void> {
    this.exigirConexion();
    if (!this.remoto.eliminarPlan) throw new Error("Operación no disponible.");
    return this.remoto.eliminarPlan(tipo, id);
  }
  actualizarNombre(nombre: string): Promise<void> {
    this.exigirConexion();
    if (!this.remoto.actualizarNombre)
      throw new Error("Operación no disponible.");
    return this.remoto.actualizarNombre(nombre);
  }
  crearMovimiento(nuevo: NuevoMovimiento) {
    this.exigirConexion();
    return this.remoto.crearMovimiento(nuevo);
  }
  actualizarMovimiento(id: string, nuevo: NuevoMovimiento) {
    this.exigirConexion();
    return this.remoto.actualizarMovimiento(id, nuevo);
  }
  eliminarMovimiento(id: string) {
    this.exigirConexion();
    return this.remoto.eliminarMovimiento(id);
  }
  crearCuenta(nueva: NuevaCuenta): Promise<Cuenta> {
    this.exigirConexion();
    return this.remoto.crearCuenta(nueva);
  }
  actualizarCuenta(id: string, nueva: NuevaCuenta): Promise<Cuenta> {
    this.exigirConexion();
    return this.remoto.actualizarCuenta(id, nueva);
  }
  eliminarCuenta(id: string) {
    this.exigirConexion();
    return this.remoto.eliminarCuenta(id);
  }
}
