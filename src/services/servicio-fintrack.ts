import {
  calcularProgresoMeta,
  calcularResumenFinanciero,
  calcularResumenPresupuesto,
  sumarCentavos,
  validarMovimiento,
  validarCuenta,
  type Categoria,
  type Centavos,
  type Cuenta,
  type Movimiento,
  type PeriodoTiempo,
  type ResumenFinanciero,
  type ResumenPresupuesto,
} from "../domain";
import type {
  MovimientoConMoneda,
  NuevoMovimiento,
  PerfilUsuario,
  DatosFintrack,
  NuevaCuenta,
} from "../data";
import type { RepositorioFintrack, Plan } from "./repositorio-fintrack";

export interface GastoPorCategoria {
  readonly categoria: Categoria;
  readonly importeCentavos: Centavos;
  readonly porcentaje: number;
}

export interface CuentaConSaldo {
  readonly cuenta: Cuenta;
  readonly saldoCentavos: Centavos;
}

export interface PresupuestoConResumen {
  readonly categoria: Categoria | null;
  readonly resumen: ResumenPresupuesto;
}

export interface MetaConProgreso {
  readonly id: string;
  readonly nombre: string;
  readonly objetivoCentavos: Centavos;
  readonly aportadoCentavos: Centavos;
  readonly restanteCentavos: Centavos;
  readonly porcentajeCompletado: number;
  readonly completada: boolean;
  readonly fechaObjetivo: string | null;
}

export interface DatosPantallasFintrack {
  readonly datos: DatosFintrack;
  readonly sinConexion: boolean;
  readonly advertenciaPersistencia?: string;
  readonly modo: RepositorioFintrack["modo"];
  readonly perfil: PerfilUsuario;
  readonly inicio: {
    readonly resumen: ResumenFinanciero;
    readonly movimientosRecientes: readonly MovimientoConMoneda[];
    readonly gastosSemanales: readonly { day: string; amount: number }[];
  };
  readonly analisis: {
    readonly ingresosCentavos: Centavos;
    readonly gastosCentavos: Centavos;
    readonly gastosPorCategoria: readonly GastoPorCategoria[];
    readonly presupuestos: readonly PresupuestoConResumen[];
  };
  readonly cuentas: {
    readonly elementos: readonly CuentaConSaldo[];
    readonly patrimonioCentavos: Centavos;
    readonly activosCentavos: Centavos;
    readonly deudasCentavos: Centavos;
  };
  readonly perfilFinanciero: {
    readonly metas: readonly MetaConProgreso[];
    readonly porcentajeAhorro: number;
  };
}

function periodoMesLocal(
  ahora: Date,
): PeriodoTiempo & { periodoInicio: string } {
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const inicio = new Date(anio, mes, 1);
  const fin = new Date(anio, mes + 1, 1);
  const periodoInicio = `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
  return {
    periodoInicio,
    inicioEpochMs: inicio.getTime(),
    finExclusivoEpochMs: fin.getTime(),
  };
}

function movimientoEnPeriodo(
  movimiento: Movimiento,
  periodo: PeriodoTiempo,
): boolean {
  const instante = Date.parse(movimiento.ocurridoEn);
  return (
    instante >= periodo.inicioEpochMs && instante < periodo.finExclusivoEpochMs
  );
}

function porcentajeSeguro(parte: number, total: number): number {
  if (total <= 0) return 0;
  const porcentaje = (parte / total) * 100;
  return Number.isFinite(porcentaje) ? Math.round(porcentaje * 100) / 100 : 0;
}

export class ServicioFintrack {
  constructor(private readonly repositorio: RepositorioFintrack) {}

  async cargarPantallas(
    ahora = new Date(),
    seleccion: "week" | "month" | "year" = "month",
  ): Promise<DatosPantallasFintrack> {
    const datos = await this.repositorio.cargarDatos();
    const periodo = periodoMesLocal(ahora);
    const cuentasMonedaPerfil = datos.cuentas.filter(
      (cuenta) => cuenta.codigoMoneda === datos.perfil.codigoMoneda,
    );
    const idsCuenta = new Set(cuentasMonedaPerfil.map((cuenta) => cuenta.id));
    const movimientosMonedaPerfil = datos.movimientos.filter(
      (movimiento) =>
        movimiento.codigoMoneda === datos.perfil.codigoMoneda &&
        idsCuenta.has(movimiento.cuentaId) &&
        (!movimiento.cuentaDestinoId ||
          idsCuenta.has(movimiento.cuentaDestinoId)),
    );
    const inicioAnalisis =
      seleccion === "year"
        ? new Date(ahora.getFullYear(), 0, 1)
        : seleccion === "week"
          ? new Date(
              ahora.getFullYear(),
              ahora.getMonth(),
              ahora.getDate() - ((ahora.getDay() + 6) % 7),
            )
          : new Date(periodo.inicioEpochMs);
    const finAnalisis =
      seleccion === "year"
        ? new Date(ahora.getFullYear() + 1, 0, 1)
        : seleccion === "week"
          ? new Date(
              inicioAnalisis.getFullYear(),
              inicioAnalisis.getMonth(),
              inicioAnalisis.getDate() + 7,
            )
          : new Date(periodo.finExclusivoEpochMs);
    const periodoAnalisis = {
      inicioEpochMs: inicioAnalisis.getTime(),
      finExclusivoEpochMs: finAnalisis.getTime(),
    };
    const movimientosPeriodo = movimientosMonedaPerfil.filter((movimiento) =>
      movimientoEnPeriodo(movimiento, periodoAnalisis),
    );
    const resumenCompleto = calcularResumenFinanciero(
      cuentasMonedaPerfil,
      movimientosMonedaPerfil,
    );
    const resumenPeriodo = calcularResumenFinanciero([], movimientosPeriodo);

    const gastosPorCategoria = datos.categorias
      .filter((categoria) => categoria.tipo === "gasto" && !categoria.archivada)
      .map((categoria) => {
        const importes = movimientosPeriodo
          .filter(
            (movimiento) =>
              movimiento.tipo === "gasto" &&
              movimiento.categoriaId === categoria.id,
          )
          .map((movimiento) => movimiento.importeCentavos);
        const importeCentavos = sumarCentavos(importes);
        return {
          categoria,
          importeCentavos,
          porcentaje: porcentajeSeguro(
            importeCentavos,
            resumenPeriodo.gastosCentavos,
          ),
        };
      })
      .filter((elemento) => elemento.importeCentavos > 0)
      .sort((a, b) => b.importeCentavos - a.importeCentavos);

    const presupuestos = datos.presupuestos
      .filter(
        (presupuesto) => presupuesto.periodoInicio === periodo.periodoInicio,
      )
      .map((presupuesto) => ({
        categoria:
          datos.categorias.find(
            (categoria) => categoria.id === presupuesto.categoriaId,
          ) ?? null,
        resumen: calcularResumenPresupuesto(
          presupuesto,
          movimientosMonedaPerfil.filter((item) =>
            movimientoEnPeriodo(item, periodo),
          ),
          periodo,
        ),
      }));

    const metas = datos.metas
      .filter((meta) => meta.estado !== "cancelada")
      .map((meta) => {
        const progreso = calcularProgresoMeta(meta, datos.aportesMeta);
        return {
          id: meta.id,
          nombre: meta.nombre,
          objetivoCentavos: meta.objetivoCentavos,
          fechaObjetivo: meta.fechaObjetivo,
          ...progreso,
        };
      });

    const ahorroCentavos = Math.max(
      0,
      resumenPeriodo.ingresosCentavos - resumenPeriodo.gastosCentavos,
    );

    return {
      datos,
      sinConexion:
        "sinConexion" in this.repositorio &&
        this.repositorio.sinConexion === true,
      advertenciaPersistencia:
        "advertenciaPersistencia" in this.repositorio
          ? (this.repositorio.advertenciaPersistencia as string | undefined)
          : undefined,
      modo: this.repositorio.modo,
      perfil: datos.perfil,
      inicio: {
        resumen: resumenCompleto,
        gastosSemanales: Array.from({ length: 7 }, (_, index) => {
          const dia = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate() - 6 + index,
          );
          const finDia = new Date(
            dia.getFullYear(),
            dia.getMonth(),
            dia.getDate() + 1,
          );
          return {
            day: new Intl.DateTimeFormat(datos.perfil.configuracionRegional, {
              weekday: "short",
            }).format(dia),
            amount:
              sumarCentavos(
                movimientosMonedaPerfil
                  .filter(
                    (item) =>
                      item.tipo === "gasto" &&
                      movimientoEnPeriodo(item, {
                        inicioEpochMs: dia.getTime(),
                        finExclusivoEpochMs: finDia.getTime(),
                      }),
                  )
                  .map((item) => item.importeCentavos),
              ) / 100,
          };
        }),
        movimientosRecientes: [...movimientosMonedaPerfil]
          .sort((a, b) => Date.parse(b.ocurridoEn) - Date.parse(a.ocurridoEn))
          .slice(0, 5),
      },
      analisis: {
        ingresosCentavos: resumenPeriodo.ingresosCentavos,
        gastosCentavos: resumenPeriodo.gastosCentavos,
        gastosPorCategoria,
        presupuestos,
      },
      cuentas: {
        elementos: cuentasMonedaPerfil
          .filter((cuenta) => !cuenta.archivada)
          .map((cuenta) => ({
            cuenta,
            saldoCentavos: resumenCompleto.saldosPorCuenta[cuenta.id] ?? 0,
          })),
        patrimonioCentavos: resumenCompleto.balanceTotalCentavos,
        activosCentavos: resumenCompleto.activosCentavos,
        deudasCentavos: resumenCompleto.deudasCentavos,
      },
      perfilFinanciero: {
        metas,
        porcentajeAhorro: porcentajeSeguro(
          ahorroCentavos,
          resumenPeriodo.ingresosCentavos,
        ),
      },
    };
  }

  private async validarNuevoMovimiento(nuevo: NuevoMovimiento): Promise<void> {
    const datos = await this.repositorio.cargarDatos();
    const validacion = validarMovimiento({
      ...nuevo,
      id: "nuevo",
      usuarioId: datos.perfil.usuarioId,
    });
    if (!validacion.valido) throw new Error(validacion.errores[0].mensaje);
    const origen = datos.cuentas.find(
      (item) => item.id === nuevo.cuentaId && !item.archivada,
    );
    if (!origen || origen.codigoMoneda !== nuevo.codigoMoneda)
      throw new Error("Selecciona una cuenta válida para esta moneda.");
    if (nuevo.tipo === "transferencia") {
      const destino = datos.cuentas.find(
        (item) => item.id === nuevo.cuentaDestinoId && !item.archivada,
      );
      if (!destino || destino.codigoMoneda !== origen.codigoMoneda)
        throw new Error(
          "Las cuentas de una transferencia deben tener la misma moneda.",
        );
    } else if (
      !datos.categorias.some(
        (item) =>
          item.id === nuevo.categoriaId &&
          item.tipo === nuevo.tipo &&
          !item.archivada,
      )
    ) {
      throw new Error(
        "Selecciona una categoría válida para este tipo de movimiento.",
      );
    }
    if ((nuevo.descripcion?.length ?? 0) > 500)
      throw new Error("La descripción admite hasta 500 caracteres.");
  }

  async crearMovimiento(nuevo: NuevoMovimiento): Promise<MovimientoConMoneda> {
    await this.validarNuevoMovimiento(nuevo);
    return this.repositorio.crearMovimiento(nuevo);
  }

  async actualizarMovimiento(
    id: string,
    nuevo: NuevoMovimiento,
  ): Promise<MovimientoConMoneda> {
    await this.validarNuevoMovimiento(nuevo);
    return this.repositorio.actualizarMovimiento(id, nuevo);
  }

  private validarNuevaCuenta(nueva: NuevaCuenta): void {
    const resultado = validarCuenta({
      ...nueva,
      id: "nueva",
      usuarioId: "actual",
    });
    if (!resultado.valido) throw new Error(resultado.errores[0].mensaje);
    if (nueva.nombre.trim().length > 80)
      throw new Error("El nombre admite hasta 80 caracteres.");
  }

  crearCuenta(nueva: NuevaCuenta): Promise<Cuenta> {
    this.validarNuevaCuenta(nueva);
    return this.repositorio.crearCuenta(nueva);
  }

  async actualizarCuenta(id: string, nueva: NuevaCuenta): Promise<Cuenta> {
    this.validarNuevaCuenta(nueva);
    const datos = await this.repositorio.cargarDatos();
    const anterior = datos.cuentas.find((item) => item.id === id);
    if (
      anterior?.codigoMoneda !== nueva.codigoMoneda &&
      datos.movimientos.some(
        (item) => item.cuentaId === id || item.cuentaDestinoId === id,
      )
    )
      throw new Error(
        "No puedes cambiar la moneda de una cuenta con movimientos.",
      );
    return this.repositorio.actualizarCuenta(id, nueva);
  }

  eliminarCuenta(id: string): Promise<void> {
    return this.repositorio.eliminarCuenta(id);
  }

  eliminarMovimiento(id: string): Promise<void> {
    return this.repositorio.eliminarMovimiento(id);
  }
  async guardarPlan(plan: Plan): Promise<void> {
    if (
      !Number.isSafeInteger(plan.importeCentavos) ||
      plan.importeCentavos <= 0
    )
      throw new Error("Escribe un importe mayor que cero.");
    const datos = await this.repositorio.cargarDatos();
    if (
      plan.tipo === "meta" &&
      (!plan.nombre.trim() || plan.nombre.trim().length > 80)
    )
      throw new Error("Escribe un nombre de hasta 80 caracteres.");
    if (plan.tipo === "presupuesto") {
      if (
        !datos.categorias.some(
          (c) =>
            c.id === plan.categoriaId && c.tipo === "gasto" && !c.archivada,
        )
      )
        throw new Error("Selecciona una categoría de gasto.");
      if (!/^\d{4}-(0[1-9]|1[0-2])-01$/.test(plan.periodoInicio))
        throw new Error("Selecciona un mes válido.");
    }
    if (
      plan.tipo === "aporte" &&
      !datos.metas.some((m) => m.id === plan.metaId && m.estado === "activa")
    )
      throw new Error("Selecciona una meta activa.");
    if (!this.repositorio.guardarPlan)
      throw new Error("Operación no disponible.");
    return this.repositorio.guardarPlan(plan);
  }
  eliminarPlan(tipo: Plan["tipo"], id: string): Promise<void> {
    if (!this.repositorio.eliminarPlan)
      throw new Error("Operación no disponible.");
    return this.repositorio.eliminarPlan(tipo, id);
  }
  actualizarNombre(nombre: string): Promise<void> {
    if (!nombre.trim() || nombre.trim().length > 80)
      throw new Error("Escribe un nombre de hasta 80 caracteres.");
    if (!this.repositorio.actualizarNombre)
      throw new Error("Operación no disponible.");
    return this.repositorio.actualizarNombre(nombre.trim());
  }
}
