import type { DatosFintrack } from "./contratos";

export const ID_USUARIO_DEMO = "00000000-0000-4000-8000-000000000001";

const CUENTA_CORRIENTE_ID = "00000000-0000-4000-8000-000000000101";
const CUENTA_AHORRO_ID = "00000000-0000-4000-8000-000000000102";
const CUENTA_CREDITO_ID = "00000000-0000-4000-8000-000000000103";
const CUENTA_EFECTIVO_ID = "00000000-0000-4000-8000-000000000104";

const CATEGORIA_SALARIO_ID = "00000000-0000-4000-8000-000000000201";
const CATEGORIA_ALIMENTACION_ID = "00000000-0000-4000-8000-000000000202";
const CATEGORIA_TRANSPORTE_ID = "00000000-0000-4000-8000-000000000203";
const CATEGORIA_VIVIENDA_ID = "00000000-0000-4000-8000-000000000204";
const CATEGORIA_SERVICIOS_ID = "00000000-0000-4000-8000-000000000205";
const CATEGORIA_ENTRETENIMIENTO_ID = "00000000-0000-4000-8000-000000000206";

const META_EMERGENCIA_ID = "00000000-0000-4000-8000-000000000501";
const META_VIAJE_ID = "00000000-0000-4000-8000-000000000502";

export const DATOS_DEMO: DatosFintrack = {
  perfil: {
    usuarioId: ID_USUARIO_DEMO,
    nombreMostrar: "Valeria Torres",
    correo: "valeria@fintrack.demo",
    codigoMoneda: "PEN",
    configuracionRegional: "es-PE",
    zonaHoraria: "America/Lima",
    rutaAvatar: null,
    onboardingCompletado: true,
  },
  cuentas: [
    {
      id: CUENTA_CORRIENTE_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Cuenta principal",
      tipo: "corriente",
      codigoMoneda: "PEN",
      saldoInicialCentavos: 180_000,
      color: "#00D4A8",
      archivada: false,
    },
    {
      id: CUENTA_AHORRO_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Ahorros",
      tipo: "ahorro",
      codigoMoneda: "PEN",
      saldoInicialCentavos: 800_000,
      color: "#38BDF8",
      archivada: false,
    },
    {
      id: CUENTA_CREDITO_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Tarjeta de credito",
      tipo: "credito",
      codigoMoneda: "PEN",
      saldoInicialCentavos: -120_000,
      color: "#FB7185",
      archivada: false,
    },
    {
      id: CUENTA_EFECTIVO_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Efectivo",
      tipo: "efectivo",
      codigoMoneda: "PEN",
      saldoInicialCentavos: 35_000,
      color: "#F59E0B",
      archivada: false,
    },
  ],
  categorias: [
    {
      id: CATEGORIA_SALARIO_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Salario",
      tipo: "ingreso",
      icono: "briefcase-business",
      color: "#00D4A8",
      archivada: false,
    },
    {
      id: CATEGORIA_ALIMENTACION_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Alimentacion",
      tipo: "gasto",
      icono: "utensils",
      color: "#FB7185",
      archivada: false,
    },
    {
      id: CATEGORIA_TRANSPORTE_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Transporte",
      tipo: "gasto",
      icono: "bus-front",
      color: "#38BDF8",
      archivada: false,
    },
    {
      id: CATEGORIA_VIVIENDA_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Vivienda",
      tipo: "gasto",
      icono: "house",
      color: "#A78BFA",
      archivada: false,
    },
    {
      id: CATEGORIA_SERVICIOS_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Servicios",
      tipo: "gasto",
      icono: "receipt-text",
      color: "#F59E0B",
      archivada: false,
    },
    {
      id: CATEGORIA_ENTRETENIMIENTO_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Entretenimiento",
      tipo: "gasto",
      icono: "gamepad-2",
      color: "#22D3EE",
      archivada: false,
    },
  ],
  movimientos: [
    {
      id: "00000000-0000-4000-8000-000000000301",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "ingreso",
      importeCentavos: 600_000,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_CORRIENTE_ID,
      cuentaDestinoId: null,
      categoriaId: CATEGORIA_SALARIO_ID,
      descripcion: "Sueldo de septiembre",
      ocurridoEn: "2026-09-01T14:00:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000302",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "gasto",
      importeCentavos: 180_000,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_CORRIENTE_ID,
      cuentaDestinoId: null,
      categoriaId: CATEGORIA_VIVIENDA_ID,
      descripcion: "Alquiler",
      ocurridoEn: "2026-09-02T16:00:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000303",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "transferencia",
      importeCentavos: 150_000,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_CORRIENTE_ID,
      cuentaDestinoId: CUENTA_AHORRO_ID,
      categoriaId: null,
      descripcion: "Ahorro del mes",
      ocurridoEn: "2026-09-03T15:30:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000304",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "gasto",
      importeCentavos: 24_500,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_CORRIENTE_ID,
      cuentaDestinoId: null,
      categoriaId: CATEGORIA_ALIMENTACION_ID,
      descripcion: "Compras del mercado",
      ocurridoEn: "2026-09-04T19:10:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000305",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "gasto",
      importeCentavos: 1_200,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_EFECTIVO_ID,
      cuentaDestinoId: null,
      categoriaId: CATEGORIA_TRANSPORTE_ID,
      descripcion: "Pasaje",
      ocurridoEn: "2026-09-05T13:20:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000306",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "gasto",
      importeCentavos: 5_900,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_CREDITO_ID,
      cuentaDestinoId: null,
      categoriaId: CATEGORIA_ENTRETENIMIENTO_ID,
      descripcion: "Cine",
      ocurridoEn: "2026-09-05T23:00:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000307",
      usuarioId: ID_USUARIO_DEMO,
      tipo: "gasto",
      importeCentavos: 8_990,
      codigoMoneda: "PEN",
      cuentaId: CUENTA_CORRIENTE_ID,
      cuentaDestinoId: null,
      categoriaId: CATEGORIA_SERVICIOS_ID,
      descripcion: "Internet del hogar",
      ocurridoEn: "2026-09-06T15:00:00.000Z",
    },
  ],
  presupuestos: [
    {
      id: "00000000-0000-4000-8000-000000000401",
      usuarioId: ID_USUARIO_DEMO,
      categoriaId: CATEGORIA_ALIMENTACION_ID,
      periodoInicio: "2026-09-01",
      importeCentavos: 60_000,
      porcentajeAdvertencia: 80,
    },
    {
      id: "00000000-0000-4000-8000-000000000402",
      usuarioId: ID_USUARIO_DEMO,
      categoriaId: CATEGORIA_TRANSPORTE_ID,
      periodoInicio: "2026-09-01",
      importeCentavos: 30_000,
      porcentajeAdvertencia: 80,
    },
    {
      id: "00000000-0000-4000-8000-000000000403",
      usuarioId: ID_USUARIO_DEMO,
      categoriaId: CATEGORIA_ENTRETENIMIENTO_ID,
      periodoInicio: "2026-09-01",
      importeCentavos: 20_000,
      porcentajeAdvertencia: 80,
    },
  ],
  metas: [
    {
      id: META_EMERGENCIA_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Fondo de emergencia",
      objetivoCentavos: 1_500_000,
      fechaObjetivo: "2027-06-30",
      estado: "activa",
    },
    {
      id: META_VIAJE_ID,
      usuarioId: ID_USUARIO_DEMO,
      nombre: "Viaje a Cusco",
      objetivoCentavos: 300_000,
      fechaObjetivo: "2027-02-28",
      estado: "activa",
    },
  ],
  aportesMeta: [
    {
      id: "00000000-0000-4000-8000-000000000601",
      usuarioId: ID_USUARIO_DEMO,
      metaId: META_EMERGENCIA_ID,
      importeCentavos: 800_000,
      aportadoEn: "2026-09-03T15:30:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000602",
      usuarioId: ID_USUARIO_DEMO,
      metaId: META_VIAJE_ID,
      importeCentavos: 125_000,
      aportadoEn: "2026-08-28T15:30:00.000Z",
    },
  ],
};

export function clonarDatosDemo(): DatosFintrack {
  return {
    perfil: { ...DATOS_DEMO.perfil },
    cuentas: DATOS_DEMO.cuentas.map((cuenta) => ({ ...cuenta })),
    categorias: DATOS_DEMO.categorias.map((categoria) => ({ ...categoria })),
    movimientos: DATOS_DEMO.movimientos.map((movimiento) => ({
      ...movimiento,
    })),
    presupuestos: DATOS_DEMO.presupuestos.map((presupuesto) => ({
      ...presupuesto,
    })),
    metas: DATOS_DEMO.metas.map((meta) => ({ ...meta })),
    aportesMeta: DATOS_DEMO.aportesMeta.map((aporte) => ({ ...aporte })),
  };
}
