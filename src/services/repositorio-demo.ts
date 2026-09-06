import {
  clonarDatosDemo,
  type DatosFintrack,
  type MovimientoConMoneda,
  type NuevoMovimiento,
} from "../data";
import type { RepositorioFintrack } from "./repositorio-fintrack";

export class RepositorioFintrackDemo implements RepositorioFintrack {
  readonly modo = "demo" as const;
  private datos: DatosFintrack = clonarDatosDemo();
  private secuencia = 1;

  async cargarDatos(): Promise<DatosFintrack> {
    return {
      perfil: { ...this.datos.perfil },
      cuentas: this.datos.cuentas.map((cuenta) => ({ ...cuenta })),
      categorias: this.datos.categorias.map((categoria) => ({ ...categoria })),
      movimientos: this.datos.movimientos.map((movimiento) => ({
        ...movimiento,
      })),
      presupuestos: this.datos.presupuestos.map((presupuesto) => ({
        ...presupuesto,
      })),
      metas: this.datos.metas.map((meta) => ({ ...meta })),
      aportesMeta: this.datos.aportesMeta.map((aporte) => ({ ...aporte })),
    };
  }

  async crearMovimiento(nuevo: NuevoMovimiento): Promise<MovimientoConMoneda> {
    const movimiento: MovimientoConMoneda = {
      ...nuevo,
      id: `demo-movimiento-${this.secuencia++}`,
      usuarioId: this.datos.perfil.usuarioId,
    };

    this.datos = {
      ...this.datos,
      movimientos: [movimiento, ...this.datos.movimientos],
    };
    return { ...movimiento };
  }

  async eliminarMovimiento(id: string): Promise<void> {
    this.datos = {
      ...this.datos,
      movimientos: this.datos.movimientos.filter(
        (movimiento) => movimiento.id !== id,
      ),
    };
  }
}
