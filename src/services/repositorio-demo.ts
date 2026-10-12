import {
  clonarDatosDemo,
  type DatosFintrack,
  type MovimientoConMoneda,
  type NuevoMovimiento,
  type NuevaCuenta,
} from "../data";
import type { Cuenta } from "../domain";
import {
  almacenamiento,
  CLAVE_DATOS_DEMO,
  guardarDatos,
  leerDatos,
  type AlmacenClaveValor,
} from "../lib/almacenamiento";
import {
  ErrorRepositorioFintrack,
  type RepositorioFintrack,
  type Plan,
} from "./repositorio-fintrack";

export class RepositorioFintrackDemo implements RepositorioFintrack {
  readonly modo: "demo" | "local";
  private datos: DatosFintrack | null = null;
  private cola: Promise<unknown> = Promise.resolve();
  private secuencia = 0;
  constructor(
    private readonly almacen: AlmacenClaveValor = almacenamiento,
    private readonly personal = false,
  ) {
    this.modo = personal ? "local" : "demo";
  }
  private get clave() {
    return this.personal ? "fintrack:datos-personales:v1" : CLAVE_DATOS_DEMO;
  }

  private ejecutar<T>(
    operacion: (datos: DatosFintrack) => Promise<T>,
  ): Promise<T> {
    const siguiente = this.cola.then(async () => {
      if (!this.datos) {
        try {
          this.datos = await leerDatos(this.clave, this.almacen);
          if (!this.datos) {
            const demo = clonarDatosDemo();
            const iniciales: DatosFintrack = this.personal
              ? {
                  ...demo,
                  perfil: {
                    ...demo.perfil,
                    usuarioId: "dispositivo",
                    nombreMostrar: "Mi perfil",
                    correo: null,
                  },
                  cuentas: [],
                  movimientos: [],
                  presupuestos: [],
                  metas: [],
                  aportesMeta: [],
                  categorias: demo.categorias.map((item) => ({
                    ...item,
                    usuarioId: "dispositivo",
                  })),
                }
              : demo;
            await guardarDatos(this.clave, iniciales, this.almacen);
            this.datos = iniciales;
          }
        } catch (error) {
          throw new ErrorRepositorioFintrack("almacenamiento local", error);
        }
      }
      return operacion(this.datos);
    });
    this.cola = siguiente.catch(() => undefined);
    return siguiente;
  }

  private async confirmar(datos: DatosFintrack): Promise<void> {
    try {
      await guardarDatos(this.clave, datos, this.almacen);
      this.datos = datos;
    } catch (error) {
      throw new ErrorRepositorioFintrack("almacenamiento local", error);
    }
  }

  private id(tipo: string): string {
    return `local-${tipo}-${Date.now()}-${++this.secuencia}-${Math.random().toString(36).slice(2)}`;
  }

  cargarDatos(): Promise<DatosFintrack> {
    return this.ejecutar(
      async (datos) => JSON.parse(JSON.stringify(datos)) as DatosFintrack,
    );
  }

  actualizarNombre(nombre: string): Promise<void> {
    return this.ejecutar(async (datos) => {
      await this.confirmar({
        ...datos,
        perfil: { ...datos.perfil, nombreMostrar: nombre },
      });
    });
  }
  guardarPlan(plan: Plan): Promise<void> {
    return this.ejecutar(async (datos) => {
      const identidad = {
        id: plan.id ?? this.id(plan.tipo),
        usuarioId: datos.perfil.usuarioId,
      };
      if (plan.tipo === "meta") {
        const item = {
          ...identidad,
          nombre: plan.nombre,
          objetivoCentavos: plan.importeCentavos,
          fechaObjetivo: null,
          estado: "activa" as const,
        };
        await this.confirmar({
          ...datos,
          metas: [...datos.metas.filter((meta) => meta.id !== item.id), item],
        });
      } else if (plan.tipo === "presupuesto") {
        if (
          datos.presupuestos.some(
            (p) =>
              p.id !== plan.id &&
              p.categoriaId === plan.categoriaId &&
              p.periodoInicio === plan.periodoInicio,
          )
        )
          throw new Error(
            "Ya existe un presupuesto para esta categoría y mes. Edita el existente.",
          );
        const item = {
          ...identidad,
          categoriaId: plan.categoriaId,
          periodoInicio: plan.periodoInicio,
          importeCentavos: plan.importeCentavos,
          porcentajeAdvertencia: 80,
        };
        await this.confirmar({
          ...datos,
          presupuestos: [
            ...datos.presupuestos.filter((p) => p.id !== item.id),
            item,
          ],
        });
      } else {
        const item = {
          ...identidad,
          metaId: plan.metaId,
          importeCentavos: plan.importeCentavos,
          aportadoEn: new Date().toISOString(),
        };
        await this.confirmar({
          ...datos,
          aportesMeta: [
            ...datos.aportesMeta.filter((a) => a.id !== item.id),
            item,
          ],
        });
      }
    });
  }
  eliminarPlan(tipo: Plan["tipo"], id: string): Promise<void> {
    return this.ejecutar(async (datos) => {
      if (tipo === "meta" && datos.aportesMeta.some((a) => a.metaId === id))
        throw new Error("Elimina primero los aportes de esta meta.");
      await this.confirmar({
        ...datos,
        metas:
          tipo === "meta"
            ? datos.metas.filter((i) => i.id !== id)
            : datos.metas,
        presupuestos:
          tipo === "presupuesto"
            ? datos.presupuestos.filter((i) => i.id !== id)
            : datos.presupuestos,
        aportesMeta:
          tipo === "aporte"
            ? datos.aportesMeta.filter((i) => i.id !== id)
            : datos.aportesMeta,
      });
    });
  }

  crearMovimiento(nuevo: NuevoMovimiento): Promise<MovimientoConMoneda> {
    return this.ejecutar(async (datos) => {
      const movimiento: MovimientoConMoneda = {
        ...nuevo,
        id: this.id("movimiento"),
        usuarioId: datos.perfil.usuarioId,
      };
      await this.confirmar({
        ...datos,
        movimientos: [movimiento, ...datos.movimientos],
      });
      return { ...movimiento };
    });
  }

  actualizarMovimiento(
    id: string,
    nuevo: NuevoMovimiento,
  ): Promise<MovimientoConMoneda> {
    return this.ejecutar(async (datos) => {
      if (!datos.movimientos.some((item) => item.id === id))
        throw new Error("El movimiento ya no existe. Actualiza la lista.");
      const movimiento: MovimientoConMoneda = {
        ...nuevo,
        id,
        usuarioId: datos.perfil.usuarioId,
      };
      await this.confirmar({
        ...datos,
        movimientos: datos.movimientos.map((item) =>
          item.id === id ? movimiento : item,
        ),
      });
      return { ...movimiento };
    });
  }

  eliminarMovimiento(id: string): Promise<void> {
    return this.ejecutar(async (datos) => {
      if (!datos.movimientos.some((item) => item.id === id))
        throw new Error("El movimiento ya no existe. Actualiza la lista.");
      await this.confirmar({
        ...datos,
        movimientos: datos.movimientos.filter((item) => item.id !== id),
      });
    });
  }

  crearCuenta(nueva: NuevaCuenta): Promise<Cuenta> {
    return this.ejecutar(async (datos) => {
      const cuenta: Cuenta = {
        ...nueva,
        id: this.id("cuenta"),
        usuarioId: datos.perfil.usuarioId,
      };
      await this.confirmar({ ...datos, cuentas: [...datos.cuentas, cuenta] });
      return { ...cuenta };
    });
  }

  actualizarCuenta(id: string, nueva: NuevaCuenta): Promise<Cuenta> {
    return this.ejecutar(async (datos) => {
      if (!datos.cuentas.some((item) => item.id === id))
        throw new Error("La cuenta ya no existe. Actualiza la lista.");
      const cuenta: Cuenta = {
        ...nueva,
        id,
        usuarioId: datos.perfil.usuarioId,
      };
      await this.confirmar({
        ...datos,
        cuentas: datos.cuentas.map((item) => (item.id === id ? cuenta : item)),
      });
      return { ...cuenta };
    });
  }

  eliminarCuenta(id: string): Promise<void> {
    return this.ejecutar(async (datos) => {
      if (
        datos.movimientos.some(
          (item) => item.cuentaId === id || item.cuentaDestinoId === id,
        )
      )
        throw new Error(
          "Esta cuenta tiene movimientos. Elimínalos o cámbialos de cuenta antes de borrarla.",
        );
      if (!datos.cuentas.some((item) => item.id === id))
        throw new Error("La cuenta ya no existe. Actualiza la lista.");
      await this.confirmar({
        ...datos,
        cuentas: datos.cuentas.filter((item) => item.id !== id),
      });
    });
  }
}
