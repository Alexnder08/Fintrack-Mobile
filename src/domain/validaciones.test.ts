import { GASTO_FIXTURE, TRANSFERENCIA_FIXTURE } from "./fixtures";
import { validarMovimiento, validarPresupuesto } from "./validaciones";

declare const describe: (nombre: string, pruebas: () => void) => void;
declare const test: (nombre: string, prueba: () => void) => void;
declare const expect: (actual: unknown) => {
  toBe(esperado: unknown): void;
};

describe("validaciones de movimientos", () => {
  test("acepta un gasto valido", () => {
    expect(validarMovimiento(GASTO_FIXTURE).valido).toBe(true);
  });

  test("rechaza importes fraccionarios o no positivos", () => {
    expect(
      validarMovimiento({ ...GASTO_FIXTURE, importeCentavos: 10.5 }).valido,
    ).toBe(false);
    expect(
      validarMovimiento({ ...GASTO_FIXTURE, importeCentavos: 0 }).valido,
    ).toBe(false);
  });

  test("rechaza una transferencia hacia la misma cuenta", () => {
    expect(
      validarMovimiento({
        ...TRANSFERENCIA_FIXTURE,
        cuentaDestinoId: TRANSFERENCIA_FIXTURE.cuentaId,
      }).valido,
    ).toBe(false);
  });
});

describe("validaciones de presupuesto", () => {
  test("rechaza limite cero y porcentaje fuera de rango", () => {
    const resultado = validarPresupuesto({
      id: "presupuesto-invalido",
      usuarioId: "usuario-prueba",
      categoriaId: "categoria-comida",
      periodoInicio: "2026-09-01",
      importeCentavos: 0,
      porcentajeAdvertencia: 101,
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.errores.length).toBe(2);
  });
});
