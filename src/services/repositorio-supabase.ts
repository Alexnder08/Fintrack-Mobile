import type { SupabaseClient } from "@supabase/supabase-js";

import {
  centavosADecimal,
  mapearAporte,
  mapearCategoria,
  mapearCuenta,
  mapearMeta,
  mapearMovimiento,
  mapearPerfil,
  mapearPresupuesto,
  type DatosFintrack,
  type FilaAporteMeta,
  type FilaCategoria,
  type FilaCuenta,
  type FilaMetaAhorro,
  type FilaMovimiento,
  type FilaPerfil,
  type FilaPresupuesto,
  type MovimientoConMoneda,
  type NuevoMovimiento,
} from "../data";
import type {
  RepositorioFintrack,
  ErrorRepositorioFintrack as TipoErrorRepositorio,
} from "./repositorio-fintrack";
import { ErrorRepositorioFintrack } from "./repositorio-fintrack";

type ResultadoSupabase<T> = {
  readonly data: T | null;
  readonly error: unknown;
};

function exigirDatos<T>(resultado: ResultadoSupabase<T>, recurso: string): T {
  if (resultado.error || resultado.data === null) {
    throw new ErrorRepositorioFintrack(recurso, resultado.error);
  }
  return resultado.data;
}

export class RepositorioFintrackSupabase implements RepositorioFintrack {
  readonly modo = "supabase" as const;

  constructor(private readonly cliente: SupabaseClient) {}

  private async obtenerUsuario() {
    const { data, error } = await this.cliente.auth.getUser();
    if (error || !data.user) {
      throw new ErrorRepositorioFintrack("sesion autenticada", error);
    }
    return data.user;
  }

  private async listarTodosLosMovimientos(
    usuarioId: string,
  ): Promise<FilaMovimiento[]> {
    const filas: FilaMovimiento[] = [];
    const tamanoPagina = 500;

    for (let inicio = 0; ; inicio += tamanoPagina) {
      const resultado = await this.cliente
        .from("movimientos")
        .select(
          "id,usuario_id,tipo,importe,codigo_moneda,cuenta_id,cuenta_destino_id,categoria_id,descripcion,ocurrido_en",
        )
        .eq("usuario_id", usuarioId)
        .order("ocurrido_en", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, inicio + tamanoPagina - 1);
      const pagina = exigirDatos(
        resultado as ResultadoSupabase<FilaMovimiento[]>,
        "movimientos",
      );
      filas.push(...pagina);

      if (pagina.length < tamanoPagina) break;
    }

    return filas;
  }

  async cargarDatos(): Promise<DatosFintrack> {
    const usuario = await this.obtenerUsuario();
    const usuarioId = usuario.id;

    const resultados = await Promise.all([
      this.cliente
        .from("perfiles")
        .select(
          "usuario_id,nombre_mostrar,codigo_moneda,configuracion_regional,zona_horaria,ruta_avatar,onboarding_completado",
        )
        .eq("usuario_id", usuarioId)
        .maybeSingle(),
      this.cliente
        .from("cuentas")
        .select(
          "id,usuario_id,nombre,tipo,codigo_moneda,saldo_inicial,color,esta_archivada",
        )
        .eq("usuario_id", usuarioId)
        .order("creado_en", { ascending: true }),
      this.cliente
        .from("categorias")
        .select("id,usuario_id,nombre,tipo,icono,color,esta_archivada")
        .eq("usuario_id", usuarioId)
        .order("nombre", { ascending: true }),
      this.listarTodosLosMovimientos(usuarioId),
      this.cliente
        .from("presupuestos")
        .select(
          "id,usuario_id,categoria_id,periodo_inicio,importe,porcentaje_advertencia",
        )
        .eq("usuario_id", usuarioId)
        .order("periodo_inicio", { ascending: false }),
      this.cliente
        .from("metas_ahorro")
        .select("id,usuario_id,nombre,importe_objetivo,fecha_objetivo,estado")
        .eq("usuario_id", usuarioId)
        .order("creado_en", { ascending: false }),
      this.cliente
        .from("aportes_meta")
        .select("id,usuario_id,meta_id,importe,aportado_en")
        .eq("usuario_id", usuarioId)
        .order("aportado_en", { ascending: false }),
    ]);

    const filaPerfil = exigirDatos(
      resultados[0] as ResultadoSupabase<FilaPerfil>,
      "perfil",
    );
    if (!filaPerfil) {
      throw new ErrorRepositorioFintrack("perfil inexistente", null);
    }

    return {
      perfil: mapearPerfil(filaPerfil, usuario.email ?? null),
      cuentas: exigirDatos(
        resultados[1] as ResultadoSupabase<FilaCuenta[]>,
        "cuentas",
      ).map(mapearCuenta),
      categorias: exigirDatos(
        resultados[2] as ResultadoSupabase<FilaCategoria[]>,
        "categorias",
      ).map(mapearCategoria),
      movimientos: resultados[3].map(mapearMovimiento),
      presupuestos: exigirDatos(
        resultados[4] as ResultadoSupabase<FilaPresupuesto[]>,
        "presupuestos",
      ).map(mapearPresupuesto),
      metas: exigirDatos(
        resultados[5] as ResultadoSupabase<FilaMetaAhorro[]>,
        "metas de ahorro",
      ).map(mapearMeta),
      aportesMeta: exigirDatos(
        resultados[6] as ResultadoSupabase<FilaAporteMeta[]>,
        "aportes de metas",
      ).map(mapearAporte),
    };
  }

  async crearMovimiento(nuevo: NuevoMovimiento): Promise<MovimientoConMoneda> {
    const usuario = await this.obtenerUsuario();
    const fila = {
      usuario_id: usuario.id,
      tipo: nuevo.tipo,
      importe: centavosADecimal(nuevo.importeCentavos),
      codigo_moneda: nuevo.codigoMoneda,
      cuenta_id: nuevo.cuentaId,
      cuenta_destino_id: nuevo.cuentaDestinoId,
      categoria_id: nuevo.categoriaId,
      descripcion: nuevo.descripcion ?? null,
      ocurrido_en: nuevo.ocurridoEn,
    };
    const resultado = await this.cliente
      .from("movimientos")
      .insert(fila)
      .select(
        "id,usuario_id,tipo,importe,codigo_moneda,cuenta_id,cuenta_destino_id,categoria_id,descripcion,ocurrido_en",
      )
      .single();

    return mapearMovimiento(
      exigirDatos(
        resultado as ResultadoSupabase<FilaMovimiento>,
        "crear movimiento",
      ),
    );
  }

  async eliminarMovimiento(id: string): Promise<void> {
    const usuario = await this.obtenerUsuario();
    const { error } = await this.cliente
      .from("movimientos")
      .delete()
      .eq("id", id)
      .eq("usuario_id", usuario.id);

    if (error) {
      throw new ErrorRepositorioFintrack("eliminar movimiento", error);
    }
  }
}

// Mantiene exportable el tipo de error sin convertirlo en una dependencia de runtime circular.
export type ErrorRepositorioRemoto = TipoErrorRepositorio;
