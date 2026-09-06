import { RepositorioFintrackDemo } from "./repositorio-demo";
import { ServicioFintrack } from "./servicio-fintrack";

declare const describe: (nombre: string, pruebas: () => void) => void;
declare const test: (nombre: string, prueba: () => Promise<void>) => void;
declare const expect: (actual: unknown) => {
  toBe(esperado: unknown): void;
};

describe("datos demo para las cuatro pantallas", () => {
  test("entrega un resumen coherente en PEN para septiembre de 2026", async () => {
    const servicio = new ServicioFintrack(new RepositorioFintrackDemo());
    const pantallas = await servicio.cargarPantallas(
      new Date("2026-09-06T12:00:00-05:00"),
    );

    expect(pantallas.modo).toBe("demo");
    expect(pantallas.perfil.codigoMoneda).toBe("PEN");
    expect(pantallas.inicio.resumen.balanceTotalCentavos).toBe(1_274_410);
    expect(pantallas.analisis.ingresosCentavos).toBe(600_000);
    expect(pantallas.analisis.gastosCentavos).toBe(220_590);
    expect(pantallas.analisis.presupuestos.length).toBe(3);
    expect(pantallas.cuentas.deudasCentavos).toBe(125_900);
    expect(pantallas.perfilFinanciero.metas.length).toBe(2);
    expect(pantallas.perfilFinanciero.porcentajeAhorro).toBe(63.24);
  });
});
