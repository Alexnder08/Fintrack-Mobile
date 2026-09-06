import {
  asegurarCentavos,
  calcularPorcentajeSeguro,
  sumarCentavos,
} from "./dinero";

declare const describe: (nombre: string, pruebas: () => void) => void;
declare const test: (nombre: string, prueba: () => void) => void;
declare const expect: (actual: unknown) => {
  toBe(esperado: unknown): void;
  toThrow(tipo?: unknown): void;
};

describe("dinero exacto", () => {
  test("suma importes como enteros de centavos", () => {
    expect(sumarCentavos([10, 20, -5])).toBe(25);
  });

  test("rechaza decimales y desbordamientos", () => {
    expect(() => asegurarCentavos(10.5)).toThrow(RangeError);
    expect(() => asegurarCentavos(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      RangeError,
    );
  });

  test("el porcentaje nunca produce NaN ni infinito al dividir por cero", () => {
    expect(calcularPorcentajeSeguro(0, 0)).toBe(0);
    expect(calcularPorcentajeSeguro(100, 0)).toBe(0);
    expect(Number.isFinite(calcularPorcentajeSeguro(100, 0))).toBe(true);
  });
});
