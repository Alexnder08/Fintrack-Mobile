import type {
  AporteMeta,
  Categoria,
  Cuenta,
  Gasto,
  Ingreso,
  MetaAhorro,
  Presupuesto,
  Transferencia,
} from "./modelos";

export const USUARIO_PRUEBA_ID = "usuario-prueba";

export const CUENTA_CORRIENTE_FIXTURE: Cuenta = {
  id: "cuenta-corriente",
  usuarioId: USUARIO_PRUEBA_ID,
  nombre: "Cuenta principal",
  tipo: "corriente",
  codigoMoneda: "PEN",
  saldoInicialCentavos: 100_000,
  color: "#00D4A8",
  archivada: false,
};

export const CUENTA_AHORRO_FIXTURE: Cuenta = {
  id: "cuenta-ahorro",
  usuarioId: USUARIO_PRUEBA_ID,
  nombre: "Ahorros",
  tipo: "ahorro",
  codigoMoneda: "PEN",
  saldoInicialCentavos: 50_000,
  archivada: false,
};

export const CUENTA_CREDITO_FIXTURE: Cuenta = {
  id: "cuenta-credito",
  usuarioId: USUARIO_PRUEBA_ID,
  nombre: "Tarjeta",
  tipo: "credito",
  codigoMoneda: "PEN",
  saldoInicialCentavos: -20_000,
  archivada: false,
};

export const CATEGORIA_SUELDO_FIXTURE: Categoria = {
  id: "categoria-sueldo",
  usuarioId: USUARIO_PRUEBA_ID,
  nombre: "Sueldo",
  tipo: "ingreso",
  archivada: false,
};

export const CATEGORIA_COMIDA_FIXTURE: Categoria = {
  id: "categoria-comida",
  usuarioId: USUARIO_PRUEBA_ID,
  nombre: "Comida",
  tipo: "gasto",
  archivada: false,
};

export const INGRESO_FIXTURE: Ingreso = {
  id: "movimiento-ingreso",
  usuarioId: USUARIO_PRUEBA_ID,
  tipo: "ingreso",
  importeCentavos: 25_000,
  cuentaId: CUENTA_CORRIENTE_FIXTURE.id,
  cuentaDestinoId: null,
  categoriaId: CATEGORIA_SUELDO_FIXTURE.id,
  ocurridoEn: "2026-09-02T12:00:00.000Z",
};

export const GASTO_FIXTURE: Gasto = {
  id: "movimiento-gasto",
  usuarioId: USUARIO_PRUEBA_ID,
  tipo: "gasto",
  importeCentavos: 10_000,
  cuentaId: CUENTA_CORRIENTE_FIXTURE.id,
  cuentaDestinoId: null,
  categoriaId: CATEGORIA_COMIDA_FIXTURE.id,
  ocurridoEn: "2026-09-03T12:00:00.000Z",
};

export const TRANSFERENCIA_FIXTURE: Transferencia = {
  id: "movimiento-transferencia",
  usuarioId: USUARIO_PRUEBA_ID,
  tipo: "transferencia",
  importeCentavos: 20_000,
  cuentaId: CUENTA_CORRIENTE_FIXTURE.id,
  cuentaDestinoId: CUENTA_AHORRO_FIXTURE.id,
  categoriaId: null,
  ocurridoEn: "2026-09-04T12:00:00.000Z",
};

export const PRESUPUESTO_COMIDA_FIXTURE: Presupuesto = {
  id: "presupuesto-comida",
  usuarioId: USUARIO_PRUEBA_ID,
  categoriaId: CATEGORIA_COMIDA_FIXTURE.id,
  periodoInicio: "2026-09-01",
  importeCentavos: 20_000,
  porcentajeAdvertencia: 80,
};

export const META_AHORRO_FIXTURE: MetaAhorro = {
  id: "meta-emergencia",
  usuarioId: USUARIO_PRUEBA_ID,
  nombre: "Fondo de emergencia",
  objetivoCentavos: 100_000,
  fechaObjetivo: "2027-01-01",
  estado: "activa",
};

export const APORTE_META_FIXTURE: AporteMeta = {
  id: "aporte-meta-1",
  usuarioId: USUARIO_PRUEBA_ID,
  metaId: META_AHORRO_FIXTURE.id,
  importeCentavos: 25_000,
  aportadoEn: "2026-09-05T12:00:00.000Z",
};
