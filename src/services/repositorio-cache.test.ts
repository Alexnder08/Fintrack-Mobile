import { describe, expect, jest, test } from "@jest/globals";
import { clonarDatosDemo } from "../data";
import type { AlmacenClaveValor } from "../lib/almacenamiento";
import { RepositorioFintrackDemo } from "./repositorio-demo";
import { RepositorioConCache } from "./repositorio-cache";
import { ErrorRepositorioFintrack } from "./repositorio-fintrack";

function preparar() {
  const valores = new Map<string, string>();
  const almacen: AlmacenClaveValor = {
    getItem: async (clave) => valores.get(clave) ?? null,
    setItem: async (clave, valor) => {
      valores.set(clave, valor);
    },
    removeItem: async (clave) => {
      valores.delete(clave);
    },
  };
  const remoto = new RepositorioFintrackDemo(almacen);
  const cargar = jest
    .spyOn(remoto, "cargarDatos")
    .mockResolvedValue(clonarDatosDemo());
  const cache = new RepositorioConCache(
    remoto,
    clonarDatosDemo().perfil.usuarioId,
    almacen,
  );
  return { almacen, remoto, cargar, cache };
}
describe("caché de lectura por usuario", () => {
  test("recupera todos los datos ante un error de red y bloquea escrituras", async () => {
    const { cargar, cache } = preparar();
    const datos = await cache.cargarDatos();
    cargar.mockRejectedValue(new TypeError("Network request failed"));
    expect(await cache.cargarDatos()).toEqual(datos);
    expect(cache.sinConexion).toBe(true);
    expect(() => cache.eliminarMovimiento("id")).toThrow("copia guardada");
  });
  test("un rechazo de permisos no utiliza una copia de datos", async () => {
    const { cargar, cache } = preparar();
    await cache.cargarDatos();
    cargar.mockRejectedValue(
      new ErrorRepositorioFintrack("cuentas", {
        code: "42501",
        status: 403,
        message: "permission denied",
      }),
    );
    await expect(cache.cargarDatos()).rejects.toThrow("cuentas");
  });
  test("nunca devuelve los datos guardados de otro usuario", async () => {
    const { almacen, remoto, cargar, cache } = preparar();
    await cache.cargarDatos();
    cargar.mockRejectedValue(new TypeError("Network request failed"));
    const otraSesion = new RepositorioConCache(remoto, "otro-usuario", almacen);
    await expect(otraSesion.cargarDatos()).rejects.toThrow(
      "Network request failed",
    );
  });
});
