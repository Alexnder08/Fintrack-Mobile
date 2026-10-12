import { describe, expect, jest, test } from "@jest/globals";
import {
  AuthSessionMissingError,
  createClient,
  type User,
} from "@supabase/supabase-js";
import { RepositorioFintrackSupabase } from "./repositorio-supabase";
import type { NuevoMovimiento } from "../data";

const usuario: User = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-08T00:00:00Z",
};
const fila = {
  id: "00000000-0000-4000-8000-000000000099",
  usuario_id: usuario.id,
  tipo: "gasto",
  importe: "25.50",
  codigo_moneda: "PEN",
  cuenta_id: "00000000-0000-4000-8000-000000000101",
  cuenta_destino_id: null,
  categoria_id: "00000000-0000-4000-8000-000000000202",
  descripcion: "Almuerzo",
  ocurrido_en: "2026-10-08T17:00:00Z",
};
const nuevo: NuevoMovimiento = {
  tipo: "gasto",
  importeCentavos: 2550,
  codigoMoneda: "PEN",
  cuentaId: fila.cuenta_id,
  categoriaId: fila.categoria_id,
  cuentaDestinoId: null,
  descripcion: "Almuerzo",
  ocurridoEn: fila.ocurrido_en,
};

function preparar(status = 200, respuesta: unknown = fila) {
  const solicitudes: { url: URL; metodo: string; cuerpo: string }[] = [];
  const transporte: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    solicitudes.push({
      url,
      metodo: init?.method ?? "GET",
      cuerpo: String(init?.body ?? ""),
    });
    const cuerpo = typeof respuesta === "function" ? respuesta(url) : respuesta;
    return new Response(JSON.stringify(cuerpo), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
  const cliente = createClient(
    "https://prueba.local",
    "clave-publicable-prueba",
    {
      global: { fetch: transporte },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  jest
    .spyOn(cliente.auth, "getUser")
    .mockResolvedValue({ data: { user: usuario }, error: null });
  return {
    repo: new RepositorioFintrackSupabase(cliente),
    solicitudes,
    cliente,
  };
}

describe("CRUD mediante la API REST de Supabase", () => {
  test("consultar usa GET, pagina los movimientos y filtra los recursos por usuario", async () => {
    const { repo, solicitudes } = preparar(200, (url: URL) => {
      const tabla = url.pathname.split("/").at(-1);
      if (tabla === "perfiles")
        return {
          usuario_id: usuario.id,
          nombre_mostrar: "Usuario de prueba",
          codigo_moneda: "PEN",
          configuracion_regional: "es-PE",
          zona_horaria: "America/Lima",
          ruta_avatar: null,
          onboarding_completado: true,
        };
      if (tabla === "categorias")
        return [
          {
            id: fila.categoria_id,
            usuario_id: usuario.id,
            nombre: "Alimentación",
            tipo: "gasto",
            icono: "receipt",
            color: "#62A8FF",
            esta_archivada: false,
          },
        ];
      if (tabla === "cuentas")
        return [
          {
            id: fila.cuenta_id,
            usuario_id: usuario.id,
            nombre: "Cuenta",
            tipo: "corriente",
            codigo_moneda: "PEN",
            saldo_inicial: "0.00",
            color: "#00D4A8",
            esta_archivada: false,
          },
        ];
      return tabla === "movimientos" ? [fila] : [];
    });
    const datos = await repo.cargarDatos();
    expect(datos.movimientos).toHaveLength(1);
    expect(datos.movimientos[0].importeCentavos).toBe(2550);
    expect(
      solicitudes.every(
        (item) =>
          item.metodo === "GET" &&
          item.url.searchParams.get("usuario_id") === `eq.${usuario.id}`,
      ),
    ).toBe(true);
  });
  test("crear envía POST con centavos exactos y la identidad autenticada", async () => {
    const { repo, solicitudes } = preparar();
    expect((await repo.crearMovimiento(nuevo)).importeCentavos).toBe(2550);
    expect(solicitudes[0].metodo).toBe("POST");
    expect(solicitudes[0].url.pathname).toBe("/rest/v1/movimientos");
    expect(JSON.parse(solicitudes[0].cuerpo)).toMatchObject({
      usuario_id: usuario.id,
      importe: "25.50",
    });
  });
  test("editar usa PATCH y filtra por id y propietario", async () => {
    const { repo, solicitudes } = preparar();
    await repo.actualizarMovimiento(fila.id, nuevo);
    expect(solicitudes[0].metodo).toBe("PATCH");
    expect(solicitudes[0].url.searchParams.get("id")).toBe(`eq.${fila.id}`);
    expect(solicitudes[0].url.searchParams.get("usuario_id")).toBe(
      `eq.${usuario.id}`,
    );
  });
  test("eliminar usa DELETE y exige un registro eliminado", async () => {
    const { repo, solicitudes } = preparar(200, { id: fila.id });
    await repo.eliminarMovimiento(fila.id);
    expect(solicitudes[0].metodo).toBe("DELETE");
    expect(solicitudes[0].url.searchParams.get("usuario_id")).toBe(
      `eq.${usuario.id}`,
    );
    await expect(
      preparar(406, {
        code: "PGRST116",
        message: "No rows",
      }).repo.eliminarMovimiento(fila.id),
    ).rejects.toThrow("eliminar movimiento");
  });
  test("los errores HTTP se propagan y nunca se convierten en datos demo", async () => {
    await expect(
      preparar(403, {
        code: "42501",
        message: "permission denied",
      }).repo.crearMovimiento(nuevo),
    ).rejects.toThrow("crear movimiento");
    await expect(
      preparar(500, { message: "server error" }).repo.actualizarMovimiento(
        fila.id,
        nuevo,
      ),
    ).rejects.toThrow("actualizar movimiento");
  });
  test("sin sesión no se envía ninguna escritura REST", async () => {
    const { repo, solicitudes, cliente } = preparar();
    jest.mocked(cliente.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    await expect(repo.crearMovimiento(nuevo)).rejects.toThrow(
      "sesion autenticada",
    );
    expect(solicitudes).toHaveLength(0);
  });
});
