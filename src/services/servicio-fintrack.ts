import {
  calcularProgresoMeta,
  calcularResumenFinanciero,
  calcularResumenPresupuesto,
  sumarCentavos,
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
} from "../data";
import type { RepositorioFintrack } from "./repositorio-fintrack";

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
  readonly modo: RepositorioFintrack["modo"];
  readonly perfil: PerfilUsuario;
  readonly inicio: {
    readonly resumen: ResumenFinanciero;
    readonly movimientosRecientes: readonly MovimientoConMoneda[];
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

  async cargarPantallas(ahora = new Date()): Promise<DatosPantallasFintrack> {
    const datos = await this.repositorio.cargarDatos();
    const periodo = periodoMesLocal(ahora);
    const movimientosPeriodo = datos.movimientos.filter((movimiento) =>
      movimientoEnPeriodo(movimiento, periodo),
    );
    const resumenCompleto = calcularResumenFinanciero(
      datos.cuentas,
      datos.movimientos,
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
          movimientosPeriodo,
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
      modo: this.repositorio.modo,
      perfil: datos.perfil,
      inicio: {
        resumen: resumenCompleto,
        movimientosRecientes: [...datos.movimientos]
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
        elementos: datos.cuentas
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

  crearMovimiento(nuevo: NuevoMovimiento): Promise<MovimientoConMoneda> {
    return this.repositorio.crearMovimiento(nuevo);
  }

  eliminarMovimiento(id: string): Promise<void> {
    return this.repositorio.eliminarMovimiento(id);
  }
}
