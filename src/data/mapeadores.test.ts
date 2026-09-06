import { decimalACentavos, ErrorContratoDatos } from "./mapeadores";

declare const describe: (nombre: string, pruebas: () => void) => void;
declare const test: (nombre: string, prueba: () => void) => void;
declare const expect: (actual: unknown) => {
  toBe(esperado: unknown): void;
  toThrow(tipo?: unknown): void;
};

describe("mapeo exacto desde PostgreSQL", () => {
  test("convierte numeric a centavos sin punto flotante", () => {
    expect(decimalACentavos("1234.50")).toBe(123_450);
    expect(decimalACentavos("-20.0000")).toBe(-2_000);
  });

  test("rechaza precision inferior a un centavo", () => {
    expect(() => decimalACentavos("10.0010")).toThrow(ErrorContratoDatos);
  });
});
