export type Identificador = string;
export type Centavos = number;
export type FechaISO = string;
export type FechaHoraISO = string;

export type TipoCuenta = "efectivo" | "corriente" | "ahorro" | "credito";

export interface Cuenta {
  readonly id: Identificador;
  readonly usuarioId: Identificador;
  readonly nombre: string;
  readonly tipo: TipoCuenta;
  readonly codigoMoneda: string;
  /**
   * Saldo con signo. Una deuda se representa con un importe negativo.
   */
  readonly saldoInicialCentavos: Centavos;
  readonly color?: string;
  readonly archivada: boolean;
}

export type TipoCategoria = "ingreso" | "gasto";

export interface Categoria {
  readonly id: Identificador;
  readonly usuarioId: Identificador;
  readonly nombre: string;
  readonly tipo: TipoCategoria;
  readonly icono?: string;
  readonly color?: string;
  readonly archivada: boolean;
}

interface MovimientoBase {
  readonly id: Identificador;
  readonly usuarioId: Identificador;
  readonly importeCentavos: Centavos;
  readonly cuentaId: Identificador;
  readonly descripcion?: string;
  readonly ocurridoEn: FechaHoraISO;
}

export interface Ingreso extends MovimientoBase {
  readonly tipo: "ingreso";
  readonly categoriaId: Identificador;
  readonly cuentaDestinoId: null;
}

export interface Gasto extends MovimientoBase {
  readonly tipo: "gasto";
  readonly categoriaId: Identificador;
  readonly cuentaDestinoId: null;
}

export interface Transferencia extends MovimientoBase {
  readonly tipo: "transferencia";
  readonly categoriaId: null;
  readonly cuentaDestinoId: Identificador;
}

export type Movimiento = Ingreso | Gasto | Transferencia;

export interface Presupuesto {
  readonly id: Identificador;
  readonly usuarioId: Identificador;
  readonly categoriaId: Identificador;
  /** Fecha civil ISO que identifica el inicio del periodo persistido. */
  readonly periodoInicio: FechaISO;
  readonly importeCentavos: Centavos;
  readonly porcentajeAdvertencia: number;
}

export type EstadoMeta = "activa" | "completada" | "cancelada";

export interface MetaAhorro {
  readonly id: Identificador;
  readonly usuarioId: Identificador;
  readonly nombre: string;
  readonly objetivoCentavos: Centavos;
  readonly fechaObjetivo: FechaISO | null;
  readonly estado: EstadoMeta;
}

export interface AporteMeta {
  readonly id: Identificador;
  readonly usuarioId: Identificador;
  readonly metaId: Identificador;
  readonly importeCentavos: Centavos;
  readonly aportadoEn: FechaHoraISO;
}

export interface PeriodoTiempo {
  readonly inicioEpochMs: number;
  readonly finExclusivoEpochMs: number;
}
