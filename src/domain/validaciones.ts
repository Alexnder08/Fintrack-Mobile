import { esCentavos } from "./dinero";
import type {
  AporteMeta,
  Categoria,
  Cuenta,
  MetaAhorro,
  Movimiento,
  Presupuesto,
} from "./modelos";

export interface ErrorValidacion {
  readonly campo: string;
  readonly codigo:
    | "requerido"
    | "formato_invalido"
    | "importe_invalido"
    | "relacion_invalida"
    | "fuera_de_rango";
  readonly mensaje: string;
}

export interface ResultadoValidacion {
  readonly valido: boolean;
  readonly errores: readonly ErrorValidacion[];
}

function resultado(errores: readonly ErrorValidacion[]): ResultadoValidacion {
  return { valido: errores.length === 0, errores };
}

function requerido(valor: string | null | undefined): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

function esCodigoMoneda(valor: string): boolean {
  return /^[A-Z]{3}$/.test(valor);
}

function esFechaValida(valor: string | null): boolean {
  return (
    valor !== null &&
    valor.trim().length > 0 &&
    Number.isFinite(Date.parse(valor))
  );
}

function validarIdentidad(entidad: {
  readonly id: string;
  readonly usuarioId: string;
}): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  if (!requerido(entidad.id)) {
    errores.push({
      campo: "id",
      codigo: "requerido",
      mensaje: "El id es obligatorio",
    });
  }
  if (!requerido(entidad.usuarioId)) {
    errores.push({
      campo: "usuarioId",
      codigo: "requerido",
      mensaje: "El usuario es obligatorio",
    });
  }

  return errores;
}

export function validarCuenta(cuenta: Cuenta): ResultadoValidacion {
  const errores = validarIdentidad(cuenta);

  if (!requerido(cuenta.nombre)) {
    errores.push({
      campo: "nombre",
      codigo: "requerido",
      mensaje: "El nombre es obligatorio",
    });
  }
  if (!esCodigoMoneda(cuenta.codigoMoneda)) {
    errores.push({
      campo: "codigoMoneda",
      codigo: "formato_invalido",
      mensaje: "La moneda debe usar tres letras mayusculas ISO 4217",
    });
  }
  if (!esCentavos(cuenta.saldoInicialCentavos)) {
    errores.push({
      campo: "saldoInicialCentavos",
      codigo: "importe_invalido",
      mensaje: "El saldo debe expresarse como un entero seguro de centavos",
    });
  }

  return resultado(errores);
}

export function validarCategoria(categoria: Categoria): ResultadoValidacion {
  const errores = validarIdentidad(categoria);
  if (!requerido(categoria.nombre)) {
    errores.push({
      campo: "nombre",
      codigo: "requerido",
      mensaje: "El nombre es obligatorio",
    });
  }
  return resultado(errores);
}

export function validarMovimiento(movimiento: Movimiento): ResultadoValidacion {
  const errores = validarIdentidad(movimiento);

  if (
    !esCentavos(movimiento.importeCentavos) ||
    movimiento.importeCentavos <= 0
  ) {
    errores.push({
      campo: "importeCentavos",
      codigo: "importe_invalido",
      mensaje: "El importe debe ser un entero de centavos mayor que cero",
    });
  }
  if (!requerido(movimiento.cuentaId)) {
    errores.push({
      campo: "cuentaId",
      codigo: "requerido",
      mensaje: "La cuenta es obligatoria",
    });
  }
  if (!esFechaValida(movimiento.ocurridoEn)) {
    errores.push({
      campo: "ocurridoEn",
      codigo: "formato_invalido",
      mensaje: "La fecha del movimiento no es valida",
    });
  }

  if (movimiento.tipo === "transferencia") {
    if (!requerido(movimiento.cuentaDestinoId)) {
      errores.push({
        campo: "cuentaDestinoId",
        codigo: "requerido",
        mensaje: "La cuenta de destino es obligatoria",
      });
    } else if (movimiento.cuentaDestinoId === movimiento.cuentaId) {
      errores.push({
        campo: "cuentaDestinoId",
        codigo: "relacion_invalida",
        mensaje:
          "La cuenta de destino debe ser distinta de la cuenta de origen",
      });
    }
    if (movimiento.categoriaId !== null) {
      errores.push({
        campo: "categoriaId",
        codigo: "relacion_invalida",
        mensaje: "Una transferencia no lleva categoria",
      });
    }
  } else {
    if (!requerido(movimiento.categoriaId)) {
      errores.push({
        campo: "categoriaId",
        codigo: "requerido",
        mensaje: "La categoria es obligatoria",
      });
    }
    if (movimiento.cuentaDestinoId !== null) {
      errores.push({
        campo: "cuentaDestinoId",
        codigo: "relacion_invalida",
        mensaje: "Solo una transferencia puede tener cuenta de destino",
      });
    }
  }

  return resultado(errores);
}

export function validarPresupuesto(
  presupuesto: Presupuesto,
): ResultadoValidacion {
  const errores = validarIdentidad(presupuesto);

  if (!requerido(presupuesto.categoriaId)) {
    errores.push({
      campo: "categoriaId",
      codigo: "requerido",
      mensaje: "La categoria es obligatoria",
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(presupuesto.periodoInicio)) {
    errores.push({
      campo: "periodoInicio",
      codigo: "formato_invalido",
      mensaje: "El inicio del periodo debe tener formato AAAA-MM-DD",
    });
  }
  if (
    !esCentavos(presupuesto.importeCentavos) ||
    presupuesto.importeCentavos <= 0
  ) {
    errores.push({
      campo: "importeCentavos",
      codigo: "importe_invalido",
      mensaje: "El limite debe ser un entero de centavos mayor que cero",
    });
  }
  if (
    !Number.isFinite(presupuesto.porcentajeAdvertencia) ||
    presupuesto.porcentajeAdvertencia <= 0 ||
    presupuesto.porcentajeAdvertencia > 100
  ) {
    errores.push({
      campo: "porcentajeAdvertencia",
      codigo: "fuera_de_rango",
      mensaje: "El porcentaje de advertencia debe estar entre 0 y 100",
    });
  }

  return resultado(errores);
}

export function validarMetaAhorro(meta: MetaAhorro): ResultadoValidacion {
  const errores = validarIdentidad(meta);

  if (!requerido(meta.nombre)) {
    errores.push({
      campo: "nombre",
      codigo: "requerido",
      mensaje: "El nombre es obligatorio",
    });
  }
  if (!esCentavos(meta.objetivoCentavos) || meta.objetivoCentavos <= 0) {
    errores.push({
      campo: "objetivoCentavos",
      codigo: "importe_invalido",
      mensaje: "El objetivo debe ser un entero de centavos mayor que cero",
    });
  }
  if (meta.fechaObjetivo !== null && !esFechaValida(meta.fechaObjetivo)) {
    errores.push({
      campo: "fechaObjetivo",
      codigo: "formato_invalido",
      mensaje: "La fecha objetivo no es valida",
    });
  }

  return resultado(errores);
}

export function validarAporteMeta(aporte: AporteMeta): ResultadoValidacion {
  const errores = validarIdentidad(aporte);

  if (!requerido(aporte.metaId)) {
    errores.push({
      campo: "metaId",
      codigo: "requerido",
      mensaje: "La meta es obligatoria",
    });
  }
  if (!esCentavos(aporte.importeCentavos) || aporte.importeCentavos <= 0) {
    errores.push({
      campo: "importeCentavos",
      codigo: "importe_invalido",
      mensaje: "El aporte debe ser un entero de centavos mayor que cero",
    });
  }
  if (!esFechaValida(aporte.aportadoEn)) {
    errores.push({
      campo: "aportadoEn",
      codigo: "formato_invalido",
      mensaje: "La fecha del aporte no es valida",
    });
  }

  return resultado(errores);
}
