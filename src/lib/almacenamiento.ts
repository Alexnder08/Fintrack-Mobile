import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import type { DatosFintrack } from "../data/contratos";

export interface AlmacenClaveValor {
  getItem(clave: string): Promise<string | null>;
  setItem(clave: string, valor: string): Promise<void>;
  removeItem(clave: string): Promise<void>;
}
export const almacenamiento: AlmacenClaveValor = AsyncStorage;
export const CLAVE_DATOS_DEMO = "@fintrack/datos-demo/v1";
export const claveCache = (usuarioId: string) =>
  `@fintrack/cache/${usuarioId}/v1`;
export const clavePreferencias = (usuarioId: string) =>
  `@fintrack/preferencias/${usuarioId}/v1`;
export const claveBorrador = (usuarioId: string, id = "nuevo") =>
  `@fintrack/borrador/${usuarioId}/${id}/v1`;

const identidad = { id: z.string().min(1), usuarioId: z.string().min(1) };
const centavos = z.number().int().refine(Number.isSafeInteger);
const fecha = z.string().refine((valor) => Number.isFinite(Date.parse(valor)));
const cuenta = z.object({
  ...identidad,
  nombre: z.string().trim().min(1).max(80),
  tipo: z.enum(["efectivo", "corriente", "ahorro", "credito"]),
  codigoMoneda: z.string().regex(/^[A-Z]{3}$/),
  saldoInicialCentavos: centavos,
  color: z.string().optional(),
  archivada: z.boolean(),
});
const categoria = z.object({
  ...identidad,
  nombre: z.string().min(1),
  tipo: z.enum(["ingreso", "gasto"]),
  icono: z.string().optional(),
  color: z.string().optional(),
  archivada: z.boolean(),
});
const baseMovimiento = {
  ...identidad,
  importeCentavos: centavos.positive(),
  cuentaId: z.string().min(1),
  codigoMoneda: z.string().regex(/^[A-Z]{3}$/),
  descripcion: z.string().max(500).optional(),
  ocurridoEn: fecha,
};
const movimiento = z.discriminatedUnion("tipo", [
  z.object({
    ...baseMovimiento,
    tipo: z.literal("ingreso"),
    categoriaId: z.string().min(1),
    cuentaDestinoId: z.null(),
  }),
  z.object({
    ...baseMovimiento,
    tipo: z.literal("gasto"),
    categoriaId: z.string().min(1),
    cuentaDestinoId: z.null(),
  }),
  z.object({
    ...baseMovimiento,
    tipo: z.literal("transferencia"),
    categoriaId: z.null(),
    cuentaDestinoId: z.string().min(1),
  }),
]);
export const esquemaDatos = z.object({
  perfil: z.object({
    usuarioId: z.string().min(1),
    nombreMostrar: z.string().min(1),
    correo: z.string().nullable(),
    codigoMoneda: z.string().regex(/^[A-Z]{3}$/),
    configuracionRegional: z.string().min(1),
    zonaHoraria: z.string().min(1),
    rutaAvatar: z.string().nullable(),
    onboardingCompletado: z.boolean(),
  }),
  cuentas: z.array(cuenta),
  categorias: z.array(categoria),
  movimientos: z.array(movimiento),
  presupuestos: z.array(
    z.object({
      ...identidad,
      categoriaId: z.string(),
      periodoInicio: fecha,
      importeCentavos: centavos.positive(),
      porcentajeAdvertencia: z.number().positive().max(100),
    }),
  ),
  metas: z.array(
    z.object({
      ...identidad,
      nombre: z.string(),
      objetivoCentavos: centavos.positive(),
      fechaObjetivo: fecha.nullable(),
      estado: z.enum(["activa", "completada", "cancelada"]),
    }),
  ),
  aportesMeta: z.array(
    z.object({
      ...identidad,
      metaId: z.string(),
      importeCentavos: centavos.positive(),
      aportadoEn: fecha,
    }),
  ),
});

/** Los datos inválidos se conservan para recuperación; nunca se sobrescriben con el demo. */
export async function leerDatos(
  clave: string,
  almacen = almacenamiento,
): Promise<DatosFintrack | null> {
  const texto = await almacen.getItem(clave);
  if (texto === null) return null;
  const sobre = z
    .object({ version: z.literal(1), datos: esquemaDatos })
    .parse(JSON.parse(texto));
  return sobre.datos;
}
export async function guardarDatos(
  clave: string,
  datos: DatosFintrack,
  almacen = almacenamiento,
): Promise<void> {
  esquemaDatos.parse(datos);
  await almacen.setItem(clave, JSON.stringify({ version: 1, datos }));
}
