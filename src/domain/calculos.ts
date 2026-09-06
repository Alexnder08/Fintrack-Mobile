import {
  asegurarCentavos,
  calcularPorcentajeSeguro,
  sumarCentavos,
} from "./dinero";
import type {
  AporteMeta,
  Centavos,
  Cuenta,
  MetaAhorro,
  Movimiento,
  PeriodoTiempo,
  Presupuesto,
} from "./modelos";

export interface ResumenFinanciero {
  readonly saldosPorCuenta: Readonly<Record<string, Centavos>>;
  readonly balanceTotalCentavos: Centavos;
  readonly activosCentavos: Centavos;
  readonly deudasCentavos: Centavos;
  readonly ingresosCentavos: Centavos;
  readonly gastosCentavos: Centavos;
}

export type EstadoPresupuesto = "normal" | "advertencia" | "excedido";

export interface ResumenPresupuesto {
  readonly gastadoCentavos: Centavos;
  readonly restanteCentavos: Centavos;
  readonly porcentajeUsado: number;
  readonly estado: EstadoPresupuesto;
}

export interface ProgresoMeta {
  readonly aportadoCentavos: Centavos;
  readonly restanteCentavos: Centavos;
  readonly porcentajeCompletado: number;
  readonly completada: boolean;
}

function aplicarMovimientoASaldo(
  saldo: Centavos,
  cuentaId: string,
  movimiento: Movimiento,
): Centavos {
  asegurarCentavos(movimiento.importeCentavos, "importeCentavos");

  if (movimiento.tipo === "ingreso" && movimiento.cuentaId === cuentaId) {
    return sumarCentavos([saldo, movimiento.importeCentavos], "saldo");
  }

  if (movimiento.tipo === "gasto" && movimiento.cuentaId === cuentaId) {
    return sumarCentavos([saldo, -movimiento.importeCentavos], "saldo");
  }

  if (movimiento.tipo === "transferencia") {
    let resultado = saldo;

    if (movimiento.cuentaId === cuentaId) {
      resultado = sumarCentavos(
        [resultado, -movimiento.importeCentavos],
        "saldo",
      );
    }

    if (movimiento.cuentaDestinoId === cuentaId) {
      resultado = sumarCentavos(
        [resultado, movimiento.importeCentavos],
        "saldo",
      );
    }

    return resultado;
  }

  return saldo;
}

export function calcularSaldoCuenta(
  cuenta: Cuenta,
  movimientos: readonly Movimiento[],
): Centavos {
  return movimientos.reduce<Centavos>(
    (saldo, movimiento) =>
      aplicarMovimientoASaldo(saldo, cuenta.id, movimiento),
    asegurarCentavos(cuenta.saldoInicialCentavos, "saldoInicialCentavos"),
  );
}

export function calcularResumenFinanciero(
  cuentas: readonly Cuenta[],
  movimientos: readonly Movimiento[],
): ResumenFinanciero {
  const saldosPorCuenta: Record<string, Centavos> = {};

  for (const cuenta of cuentas) {
    saldosPorCuenta[cuenta.id] = calcularSaldoCuenta(cuenta, movimientos);
  }

  const saldos = Object.values(saldosPorCuenta);
  const activos = saldos.filter((saldo) => saldo > 0);
  const deudas = saldos.filter((saldo) => saldo < 0).map((saldo) => -saldo);
  const ingresos = movimientos
    .filter((movimiento) => movimiento.tipo === "ingreso")
    .map((movimiento) => movimiento.importeCentavos);
  const gastos = movimientos
    .filter((movimiento) => movimiento.tipo === "gasto")
    .map((movimiento) => movimiento.importeCentavos);

  return {
    saldosPorCuenta,
    balanceTotalCentavos: sumarCentavos(saldos, "balanceTotalCentavos"),
    activosCentavos: sumarCentavos(activos, "activosCentavos"),
    deudasCentavos: sumarCentavos(deudas, "deudasCentavos"),
    ingresosCentavos: sumarCentavos(ingresos, "ingresosCentavos"),
    gastosCentavos: sumarCentavos(gastos, "gastosCentavos"),
  };
}

function estaDentroDelPeriodo(
  fechaISO: string,
  periodo: PeriodoTiempo,
): boolean {
  const instante = Date.parse(fechaISO);
  return (
    Number.isFinite(instante) &&
    instante >= periodo.inicioEpochMs &&
    instante < periodo.finExclusivoEpochMs
  );
}

export function calcularResumenPresupuesto(
  presupuesto: Presupuesto,
  movimientos: readonly Movimiento[],
  periodo: PeriodoTiempo,
): ResumenPresupuesto {
  const gastos = movimientos
    .filter(
      (movimiento) =>
        movimiento.tipo === "gasto" &&
        movimiento.categoriaId === presupuesto.categoriaId &&
        estaDentroDelPeriodo(movimiento.ocurridoEn, periodo),
    )
    .map((movimiento) => movimiento.importeCentavos);
  const gastadoCentavos = sumarCentavos(gastos, "gastadoCentavos");
  const restanteCentavos = asegurarCentavos(
    presupuesto.importeCentavos - gastadoCentavos,
    "restanteCentavos",
  );
  const porcentajeUsado = calcularPorcentajeSeguro(
    gastadoCentavos,
    presupuesto.importeCentavos,
  );

  let estado: EstadoPresupuesto = "normal";
  if (
    presupuesto.importeCentavos > 0 &&
    gastadoCentavos >= presupuesto.importeCentavos
  ) {
    estado = "excedido";
  } else if (porcentajeUsado >= presupuesto.porcentajeAdvertencia) {
    estado = "advertencia";
  }

  return {
    gastadoCentavos,
    restanteCentavos,
    porcentajeUsado,
    estado,
  };
}

export function calcularProgresoMeta(
  meta: MetaAhorro,
  aportes: readonly AporteMeta[],
): ProgresoMeta {
  const aportadoCentavos = sumarCentavos(
    aportes
      .filter((aporte) => aporte.metaId === meta.id)
      .map((aporte) => aporte.importeCentavos),
    "aportadoCentavos",
  );
  const restanteCentavos = asegurarCentavos(
    Math.max(0, meta.objetivoCentavos - aportadoCentavos),
    "restanteCentavos",
  );

  return {
    aportadoCentavos,
    restanteCentavos,
    porcentajeCompletado: calcularPorcentajeSeguro(
      aportadoCentavos,
      meta.objetivoCentavos,
    ),
    completada:
      meta.objetivoCentavos > 0 && aportadoCentavos >= meta.objetivoCentavos,
  };
}
