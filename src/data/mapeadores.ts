import { asegurarCentavos } from "../domain";
import type {
  AporteMeta,
  Categoria,
  Cuenta,
  MetaAhorro,
  Presupuesto,
} from "../domain";
import type {
  FilaAporteMeta,
  FilaCategoria,
  FilaCuenta,
  FilaMetaAhorro,
  FilaMovimiento,
  FilaPerfil,
  FilaPresupuesto,
  MovimientoConMoneda,
  PerfilUsuario,
} from "./contratos";

export class ErrorContratoDatos extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorContratoDatos";
  }
}

/**
 * Convierte numeric(20, 4) a centavos sin pasar por aritmetica de punto flotante.
 * Rechaza fracciones menores a un centavo para no redondear dinero implicitamente.
 */
export function decimalACentavos(valor: string | number): number {
  const texto = String(valor);
  const coincidencia = /^(-?)(\d+)(?:\.(\d{1,4}))?$/.exec(texto);

  if (!coincidencia) {
    throw new ErrorContratoDatos(`Importe decimal no valido: ${texto}`);
  }

  const signo = coincidencia[1] === "-" ? -1n : 1n;
  const enteros = BigInt(coincidencia[2]);
  const fraccion = (coincidencia[3] ?? "").padEnd(4, "0");

  if (fraccion.slice(2) !== "00") {
    throw new ErrorContratoDatos(
      `El importe ${texto} tiene precision menor a un centavo`,
    );
  }

  const centavosBigInt =
    signo * (enteros * 100n + BigInt(fraccion.slice(0, 2) || "0"));
  const centavos = Number(centavosBigInt);

  try {
    return asegurarCentavos(centavos);
  } catch {
    throw new ErrorContratoDatos(
      `El importe ${texto} excede el rango seguro del cliente`,
    );
  }
}

export function centavosADecimal(centavos: number): string {
  asegurarCentavos(centavos);
  const absoluto = Math.abs(centavos);
  const signo = centavos < 0 ? "-" : "";
  const parteEntera = Math.floor(absoluto / 100);
  const parteDecimal = String(absoluto % 100).padStart(2, "0");
  return `${signo}${parteEntera}.${parteDecimal}`;
}

export function mapearPerfil(
  fila: FilaPerfil,
  correo: string | null,
): PerfilUsuario {
  return {
    usuarioId: fila.usuario_id,
    nombreMostrar: fila.nombre_mostrar,
    correo,
    codigoMoneda: fila.codigo_moneda,
    configuracionRegional: fila.configuracion_regional,
    zonaHoraria: fila.zona_horaria,
    rutaAvatar: fila.ruta_avatar,
    onboardingCompletado: fila.onboarding_completado,
  };
}

export function mapearCuenta(fila: FilaCuenta): Cuenta {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    codigoMoneda: fila.codigo_moneda,
    saldoInicialCentavos: decimalACentavos(fila.saldo_inicial),
    color: fila.color,
    archivada: fila.esta_archivada,
  };
}

export function mapearCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    icono: fila.icono,
    color: fila.color,
    archivada: fila.esta_archivada,
  };
}

export function mapearMovimiento(fila: FilaMovimiento): MovimientoConMoneda {
  const base = {
    id: fila.id,
    usuarioId: fila.usuario_id,
    importeCentavos: decimalACentavos(fila.importe),
    codigoMoneda: fila.codigo_moneda,
    cuentaId: fila.cuenta_id,
    descripcion: fila.descripcion ?? undefined,
    ocurridoEn: fila.ocurrido_en,
  };

  if (fila.tipo === "transferencia") {
    if (!fila.cuenta_destino_id || fila.categoria_id !== null) {
      throw new ErrorContratoDatos(
        `Transferencia remota incoherente: ${fila.id}`,
      );
    }
    return {
      ...base,
      tipo: "transferencia",
      cuentaDestinoId: fila.cuenta_destino_id,
      categoriaId: null,
    };
  }

  if (!fila.categoria_id || fila.cuenta_destino_id !== null) {
    throw new ErrorContratoDatos(`Movimiento remoto incoherente: ${fila.id}`);
  }

  return {
    ...base,
    tipo: fila.tipo,
    categoriaId: fila.categoria_id,
    cuentaDestinoId: null,
  };
}

export function mapearPresupuesto(fila: FilaPresupuesto): Presupuesto {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    categoriaId: fila.categoria_id,
    periodoInicio: fila.periodo_inicio,
    importeCentavos: decimalACentavos(fila.importe),
    porcentajeAdvertencia: Number(fila.porcentaje_advertencia),
  };
}

export function mapearMeta(fila: FilaMetaAhorro): MetaAhorro {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    nombre: fila.nombre,
    objetivoCentavos: decimalACentavos(fila.importe_objetivo),
    fechaObjetivo: fila.fecha_objetivo,
    estado: fila.estado,
  };
}

export function mapearAporte(fila: FilaAporteMeta): AporteMeta {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    metaId: fila.meta_id,
    importeCentavos: decimalACentavos(fila.importe),
    aportadoEn: fila.aportado_en,
  };
}
