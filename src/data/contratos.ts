import type {
  AporteMeta,
  Categoria,
  Cuenta,
  MetaAhorro,
  Movimiento,
  Presupuesto,
} from "../domain";

export interface PerfilUsuario {
  readonly usuarioId: string;
  readonly nombreMostrar: string;
  readonly correo: string | null;
  readonly codigoMoneda: string;
  readonly configuracionRegional: string;
  readonly zonaHoraria: string;
  readonly rutaAvatar: string | null;
  readonly onboardingCompletado: boolean;
}

export type MovimientoConMoneda = Movimiento & {
  readonly codigoMoneda: string;
};

export interface DatosFintrack {
  readonly perfil: PerfilUsuario;
  readonly cuentas: readonly Cuenta[];
  readonly categorias: readonly Categoria[];
  readonly movimientos: readonly MovimientoConMoneda[];
  readonly presupuestos: readonly Presupuesto[];
  readonly metas: readonly MetaAhorro[];
  readonly aportesMeta: readonly AporteMeta[];
}

export interface FilaPerfil {
  readonly usuario_id: string;
  readonly nombre_mostrar: string;
  readonly codigo_moneda: string;
  readonly configuracion_regional: string;
  readonly zona_horaria: string;
  readonly ruta_avatar: string | null;
  readonly onboarding_completado: boolean;
}

export interface FilaCuenta {
  readonly id: string;
  readonly usuario_id: string;
  readonly nombre: string;
  readonly tipo: Cuenta["tipo"];
  readonly codigo_moneda: string;
  readonly saldo_inicial: string | number;
  readonly color: string;
  readonly esta_archivada: boolean;
}

export interface FilaCategoria {
  readonly id: string;
  readonly usuario_id: string;
  readonly nombre: string;
  readonly tipo: Categoria["tipo"];
  readonly icono: string;
  readonly color: string;
  readonly esta_archivada: boolean;
}

export interface FilaMovimiento {
  readonly id: string;
  readonly usuario_id: string;
  readonly tipo: Movimiento["tipo"];
  readonly importe: string | number;
  readonly codigo_moneda: string;
  readonly cuenta_id: string;
  readonly cuenta_destino_id: string | null;
  readonly categoria_id: string | null;
  readonly descripcion: string | null;
  readonly ocurrido_en: string;
}

export interface FilaPresupuesto {
  readonly id: string;
  readonly usuario_id: string;
  readonly categoria_id: string;
  readonly periodo_inicio: string;
  readonly importe: string | number;
  readonly porcentaje_advertencia: string | number;
}

export interface FilaMetaAhorro {
  readonly id: string;
  readonly usuario_id: string;
  readonly nombre: string;
  readonly importe_objetivo: string | number;
  readonly fecha_objetivo: string | null;
  readonly estado: "activa" | "completada" | "cancelada";
}

export interface FilaAporteMeta {
  readonly id: string;
  readonly usuario_id: string;
  readonly meta_id: string;
  readonly importe: string | number;
  readonly aportado_en: string;
}

type SinIdentidad<T> = T extends unknown ? Omit<T, "id" | "usuarioId"> : never;

/** Conserva la union discriminada y evita combinaciones de campos invalidas. */
export type NuevoMovimiento = SinIdentidad<MovimientoConMoneda>;
