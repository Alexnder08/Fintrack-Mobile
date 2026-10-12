import { beforeEach, expect, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RepositorioFintrackDemo } from "./repositorio-demo";
import { ServicioFintrack } from "./servicio-fintrack";

beforeEach(async () => {
  await AsyncStorage.clear();
});

test("uso personal completo: cuenta, ingreso, presupuesto, meta y aporte sobreviven al reinicio", async () => {
  const repositorio = new RepositorioFintrackDemo(undefined, true);
  const servicio = new ServicioFintrack(repositorio);
  const inicio = await repositorio.cargarDatos();
  expect(inicio.cuentas).toHaveLength(0);
  expect(inicio.movimientos).toHaveLength(0);
  expect(inicio.metas).toHaveLength(0);
  expect(repositorio.modo).toBe("local");
  await servicio.actualizarNombre("Joel");
  const cuenta = await servicio.crearCuenta({
    nombre: "Principal",
    tipo: "corriente",
    codigoMoneda: "PEN",
    saldoInicialCentavos: 0,
    archivada: false,
  });
  const categoriaIngreso = inicio.categorias.find((c) => c.tipo === "ingreso")!;
  await servicio.crearMovimiento({
    tipo: "ingreso",
    importeCentavos: 100000,
    cuentaId: cuenta.id,
    cuentaDestinoId: null,
    categoriaId: categoriaIngreso.id,
    codigoMoneda: "PEN",
    ocurridoEn: "2026-10-08T12:00:00.000Z",
    descripcion: "Sueldo",
  });
  const categoriaGasto = inicio.categorias.find((c) => c.tipo === "gasto")!;
  await servicio.guardarPlan({
    tipo: "presupuesto",
    categoriaId: categoriaGasto.id,
    periodoInicio: "2026-10-01",
    importeCentavos: 20000,
  });
  await servicio.guardarPlan({
    tipo: "meta",
    nombre: "Emergencia",
    importeCentavos: 50000,
  });
  const meta = (await repositorio.cargarDatos()).metas[0];
  await servicio.guardarPlan({
    tipo: "aporte",
    metaId: meta.id,
    importeCentavos: 10000,
  });
  const reiniciado = new RepositorioFintrackDemo(undefined, true);
  const datos = await reiniciado.cargarDatos();
  expect(datos.perfil.nombreMostrar).toBe("Joel");
  expect(datos.movimientos[0].importeCentavos).toBe(100000);
  expect(datos.presupuestos[0].importeCentavos).toBe(20000);
  expect(datos.aportesMeta[0].importeCentavos).toBe(10000);
  const panel = await new ServicioFintrack(reiniciado).cargarPantallas(
    new Date("2026-10-08T12:00:00Z"),
  );
  expect(panel.inicio.resumen.balanceTotalCentavos).toBe(100000);
  expect(panel.perfilFinanciero.metas[0].aportadoCentavos).toBe(10000);
  expect(
    (await new RepositorioFintrackDemo().cargarDatos()).perfil.usuarioId,
  ).not.toBe("dispositivo");
});

test("edición y eliminación de planes se guardan; las referencias inválidas se rechazan", async () => {
  const repo = new RepositorioFintrackDemo(undefined, true);
  const servicio = new ServicioFintrack(repo);
  await expect(
    servicio.guardarPlan({
      tipo: "aporte",
      metaId: "inexistente",
      importeCentavos: 100,
    }),
  ).rejects.toThrow("meta activa");
  await expect(
    servicio.guardarPlan({ tipo: "meta", nombre: "", importeCentavos: 100 }),
  ).rejects.toThrow("nombre");
  await servicio.guardarPlan({
    tipo: "meta",
    nombre: "Viaje",
    importeCentavos: 20000,
  });
  const meta = (await repo.cargarDatos()).metas[0];
  await servicio.guardarPlan({
    tipo: "meta",
    id: meta.id,
    nombre: "Vacaciones",
    importeCentavos: 30000,
  });
  await servicio.guardarPlan({
    tipo: "aporte",
    metaId: meta.id,
    importeCentavos: 5000,
  });
  await expect(servicio.eliminarPlan("meta", meta.id)).rejects.toThrow(
    "aportes",
  );
  const aporte = (await repo.cargarDatos()).aportesMeta[0];
  await servicio.guardarPlan({
    tipo: "aporte",
    id: aporte.id,
    metaId: meta.id,
    importeCentavos: 7000,
  });
  expect((await repo.cargarDatos()).aportesMeta[0].importeCentavos).toBe(7000);
  await servicio.eliminarPlan("aporte", aporte.id);
  await servicio.eliminarPlan("meta", meta.id);
  expect(
    (await new RepositorioFintrackDemo(undefined, true).cargarDatos()).metas,
  ).toHaveLength(0);
});
