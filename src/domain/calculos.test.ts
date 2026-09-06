import {
  calcularProgresoMeta,
  calcularResumenFinanciero,
  calcularResumenPresupuesto,
} from "./calculos";
import {
  APORTE_META_FIXTURE,
  CUENTA_AHORRO_FIXTURE,
  CUENTA_CORRIENTE_FIXTURE,
  CUENTA_CREDITO_FIXTURE,
  GASTO_FIXTURE,
  INGRESO_FIXTURE,
  META_AHORRO_FIXTURE,
  PRESUPUESTO_COMIDA_FIXTURE,
  TRANSFERENCIA_FIXTURE,
} from "./fixtures";

declare const describe: (nombre: string, pruebas: () => void) => void;
declare const test: (nombre: string, prueba: () => void) => void;
declare const expect: (actual: unknown) => {
  toBe(esperado: unknown): void;
};

const SEPTIEMBRE_2026 = {
  inicioEpochMs: Date.parse("2026-09-01T00:00:00.000Z"),
  finExclusivoEpochMs: Date.parse("2026-10-01T00:00:00.000Z"),
};

describe("resumen financiero", () => {
  test("una transferencia cambia cuentas pero no patrimonio, ingresos ni gastos", () => {
    const resumen = calcularResumenFinanciero(
      [CUENTA_CORRIENTE_FIXTURE, CUENTA_AHORRO_FIXTURE],
      [TRANSFERENCIA_FIXTURE],
    );

    expect(resumen.saldosPorCuenta[CUENTA_CORRIENTE_FIXTURE.id]).toBe(80_000);
    expect(resumen.saldosPorCuenta[CUENTA_AHORRO_FIXTURE.id]).toBe(70_000);
    expect(resumen.balanceTotalCentavos).toBe(150_000);
    expect(resumen.ingresosCentavos).toBe(0);
    expect(resumen.gastosCentavos).toBe(0);
  });

  test("los gastos restan del saldo y se separan de los ingresos", () => {
    const resumen = calcularResumenFinanciero(
      [CUENTA_CORRIENTE_FIXTURE],
      [INGRESO_FIXTURE, GASTO_FIXTURE],
    );

    expect(resumen.saldosPorCuenta[CUENTA_CORRIENTE_FIXTURE.id]).toBe(115_000);
    expect(resumen.ingresosCentavos).toBe(25_000);
    expect(resumen.gastosCentavos).toBe(10_000);
  });

  test("los saldos negativos se informan como deuda y reducen el patrimonio", () => {
    const resumen = calcularResumenFinanciero(
      [CUENTA_CORRIENTE_FIXTURE, CUENTA_CREDITO_FIXTURE],
      [],
    );

    expect(resumen.activosCentavos).toBe(100_000);
    expect(resumen.deudasCentavos).toBe(20_000);
    expect(resumen.balanceTotalCentavos).toBe(80_000);
  });
});

describe("presupuestos", () => {
  test("calcula consumo, restante y estado normal", () => {
    const resumen = calcularResumenPresupuesto(
      PRESUPUESTO_COMIDA_FIXTURE,
      [GASTO_FIXTURE, INGRESO_FIXTURE, TRANSFERENCIA_FIXTURE],
      SEPTIEMBRE_2026,
    );

    expect(resumen.gastadoCentavos).toBe(10_000);
    expect(resumen.restanteCentavos).toBe(10_000);
    expect(resumen.porcentajeUsado).toBe(50);
    expect(resumen.estado).toBe("normal");
  });

  test("marca advertencia y exceso sin contar otras categorias ni periodos", () => {
    const cercaDelLimite = {
      ...GASTO_FIXTURE,
      id: "gasto-advertencia",
      importeCentavos: 16_000,
    };
    const fueraDelPeriodo = {
      ...GASTO_FIXTURE,
      id: "gasto-octubre",
      importeCentavos: 50_000,
      ocurridoEn: "2026-10-01T00:00:00.000Z",
    };
    const advertencia = calcularResumenPresupuesto(
      PRESUPUESTO_COMIDA_FIXTURE,
      [cercaDelLimite, fueraDelPeriodo],
      SEPTIEMBRE_2026,
    );
    const excedido = calcularResumenPresupuesto(
      PRESUPUESTO_COMIDA_FIXTURE,
      [{ ...cercaDelLimite, importeCentavos: 21_000 }],
      SEPTIEMBRE_2026,
    );

    expect(advertencia.estado).toBe("advertencia");
    expect(advertencia.porcentajeUsado).toBe(80);
    expect(excedido.estado).toBe("excedido");
    expect(excedido.restanteCentavos).toBe(-1_000);
  });
});

describe("metas de ahorro", () => {
  test("calcula progreso exacto de los aportes de la meta", () => {
    const progreso = calcularProgresoMeta(META_AHORRO_FIXTURE, [
      APORTE_META_FIXTURE,
    ]);

    expect(progreso.aportadoCentavos).toBe(25_000);
    expect(progreso.restanteCentavos).toBe(75_000);
    expect(progreso.porcentajeCompletado).toBe(25);
    expect(progreso.completada).toBe(false);
  });

  test("un objetivo cero defensivo no produce NaN", () => {
    const progreso = calcularProgresoMeta(
      { ...META_AHORRO_FIXTURE, objetivoCentavos: 0 },
      [],
    );

    expect(progreso.porcentajeCompletado).toBe(0);
    expect(Number.isNaN(progreso.porcentajeCompletado)).toBe(false);
  });
});
