import { describe, expect, jest, test } from "@jest/globals";
import { RepositorioFintrackDemo } from "./repositorio-demo";
import { ServicioFintrack } from "./servicio-fintrack";
import {
  CLAVE_DATOS_DEMO,
  type AlmacenClaveValor,
} from "../lib/almacenamiento";
import type { NuevoMovimiento } from "../data";

function almacenMemoria() {
  const valores = new Map<string, string>();
  const almacen: AlmacenClaveValor = {
    getItem: jest.fn(async (clave: string) => valores.get(clave) ?? null),
    setItem: jest.fn(async (clave: string, valor: string) => {
      valores.set(clave, valor);
    }),
    removeItem: jest.fn(async (clave: string) => {
      valores.delete(clave);
    }),
  };
  return { almacen, valores };
}
async function nuevoGasto(
  repo: RepositorioFintrackDemo,
): Promise<Extract<NuevoMovimiento, { tipo: "gasto" }>> {
  const datos = await repo.cargarDatos();
  return {
    tipo: "gasto",
    importeCentavos: 2550,
    codigoMoneda: "PEN",
    cuentaId: datos.cuentas[0].id,
    categoriaId: datos.categorias.find((item) => item.tipo === "gasto")!.id,
    cuentaDestinoId: null,
    descripcion: "Prueba de persistencia",
    ocurridoEn: "2026-10-08T17:00:00.000Z",
  };
}

describe("CRUD local persistente", () => {
  test("crear, editar y eliminar sobreviven a una nueva instancia de la app", async () => {
    const { almacen } = almacenMemoria();
    const repo = new RepositorioFintrackDemo(almacen);
    const nuevo = await nuevoGasto(repo);
    const movimiento = await new ServicioFintrack(repo).crearMovimiento(nuevo);
    let reiniciado = new RepositorioFintrackDemo(almacen);
    expect(
      (await reiniciado.cargarDatos()).movimientos.find(
        (item) => item.id === movimiento.id,
      )?.importeCentavos,
    ).toBe(2550);
    await reiniciado.actualizarMovimiento(movimiento.id, {
      ...nuevo,
      importeCentavos: 4000,
    });
    reiniciado = new RepositorioFintrackDemo(almacen);
    expect(
      (await reiniciado.cargarDatos()).movimientos.find(
        (item) => item.id === movimiento.id,
      )?.importeCentavos,
    ).toBe(4000);
    await reiniciado.eliminarMovimiento(movimiento.id);
    expect(
      (
        await new RepositorioFintrackDemo(almacen).cargarDatos()
      ).movimientos.some((item) => item.id === movimiento.id),
    ).toBe(false);
  });
  test("escrituras simultáneas conservan ambos movimientos", async () => {
    const { almacen } = almacenMemoria();
    const repo = new RepositorioFintrackDemo(almacen);
    const nuevo = await nuevoGasto(repo);
    const antes = (await repo.cargarDatos()).movimientos.length;
    const creados = await Promise.all([
      repo.crearMovimiento(nuevo),
      repo.crearMovimiento(nuevo),
    ]);
    const despues = await new RepositorioFintrackDemo(almacen).cargarDatos();
    expect(despues.movimientos).toHaveLength(antes + 2);
    expect(creados[0].id).not.toBe(creados[1].id);
  });
  test("un fallo de almacenamiento no muestra un cambio que no se guardó", async () => {
    const { almacen } = almacenMemoria();
    const repo = new RepositorioFintrackDemo(almacen);
    const nuevo = await nuevoGasto(repo);
    const antes = await repo.cargarDatos();
    jest
      .mocked(almacen.setItem)
      .mockRejectedValueOnce(new Error("disco lleno"));
    await expect(repo.crearMovimiento(nuevo)).rejects.toThrow("almacenamiento");
    expect(await repo.cargarDatos()).toEqual(antes);
    expect(await new RepositorioFintrackDemo(almacen).cargarDatos()).toEqual(
      antes,
    );
  });
  test("los datos corruptos no se sobrescriben con una demostración", async () => {
    const { almacen, valores } = almacenMemoria();
    valores.set(CLAVE_DATOS_DEMO, "datos dañados");
    await expect(
      new RepositorioFintrackDemo(almacen).cargarDatos(),
    ).rejects.toThrow("almacenamiento");
    expect(valores.get(CLAVE_DATOS_DEMO)).toBe("datos dañados");
    expect(almacen.setItem).not.toHaveBeenCalled();
  });
  test("persiste el CRUD de cuentas y protege las cuentas con movimientos", async () => {
    const { almacen } = almacenMemoria();
    const repo = new RepositorioFintrackDemo(almacen);
    const nueva = {
      nombre: "Viaje",
      tipo: "ahorro" as const,
      codigoMoneda: "PEN",
      saldoInicialCentavos: 10000,
      archivada: false,
    };
    const cuenta = await repo.crearCuenta(nueva);
    await repo.actualizarCuenta(cuenta.id, {
      ...nueva,
      nombre: "Viaje familiar",
    });
    const reiniciado = new RepositorioFintrackDemo(almacen);
    expect(
      (await reiniciado.cargarDatos()).cuentas.find(
        (item) => item.id === cuenta.id,
      )?.nombre,
    ).toBe("Viaje familiar");
    await reiniciado.eliminarCuenta(cuenta.id);
    expect(
      (await new RepositorioFintrackDemo(almacen).cargarDatos()).cuentas.some(
        (item) => item.id === cuenta.id,
      ),
    ).toBe(false);
    const original = (await repo.cargarDatos()).movimientos[0].cuentaId;
    await expect(repo.eliminarCuenta(original)).rejects.toThrow("movimientos");
  });
  test("el servicio rechaza transferencias a la misma cuenta y categorías incompatibles", async () => {
    const { almacen } = almacenMemoria();
    const repo = new RepositorioFintrackDemo(almacen);
    const servicio = new ServicioFintrack(repo);
    const gasto = await nuevoGasto(repo);
    await expect(
      servicio.crearMovimiento({
        ...gasto,
        tipo: "transferencia",
        categoriaId: null,
        cuentaDestinoId: gasto.cuentaId,
      }),
    ).rejects.toThrow("distinta");
    const categoriaIngreso = (await repo.cargarDatos()).categorias.find(
      (item) => item.tipo === "ingreso",
    )!;
    await expect(
      servicio.crearMovimiento({ ...gasto, categoriaId: categoriaIngreso.id }),
    ).rejects.toThrow("categoría");
    await expect(
      servicio.crearMovimiento({ ...gasto, importeCentavos: 0 }),
    ).rejects.toThrow("mayor que cero");
  });
  test("un gasto creado, editado y eliminado recalcula el patrimonio", async () => {
    const { almacen } = almacenMemoria();
    const repo = new RepositorioFintrackDemo(almacen);
    const servicio = new ServicioFintrack(repo);
    const antes = (await servicio.cargarPantallas()).cuentas.patrimonioCentavos;
    const nuevo = await nuevoGasto(repo);
    const item = await servicio.crearMovimiento(nuevo);
    expect((await servicio.cargarPantallas()).cuentas.patrimonioCentavos).toBe(
      antes - 2550,
    );
    await servicio.actualizarMovimiento(item.id, {
      ...nuevo,
      importeCentavos: 4000,
    });
    expect((await servicio.cargarPantallas()).cuentas.patrimonioCentavos).toBe(
      antes - 4000,
    );
    await servicio.eliminarMovimiento(item.id);
    expect((await servicio.cargarPantallas()).cuentas.patrimonioCentavos).toBe(
      antes,
    );
  });
});
