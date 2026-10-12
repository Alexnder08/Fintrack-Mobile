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
  type NuevaCuenta,
} from "../data";
import type { Cuenta } from "../domain";
import type {
  RepositorioFintrack,
  ErrorRepositorioFintrack as TipoErrorRepositorio,
  Plan,
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

  async actualizarNombre(nombre: string): Promise<void> {
    const usuario = await this.obtenerUsuario();
    exigirDatos(
      await this.cliente
        .from("perfiles")
        .update({ nombre_mostrar: nombre })
        .eq("usuario_id", usuario.id)
        .select("usuario_id")
        .single(),
      "actualizar perfil",
    );
  }
  async guardarPlan(plan: Plan): Promise<void> {
    const usuario = await this.obtenerUsuario();
    const tabla =
      plan.tipo === "meta"
        ? "metas_ahorro"
        : plan.tipo === "presupuesto"
          ? "presupuestos"
          : "aportes_meta";
    const campos =
      plan.tipo === "meta"
        ? {
            nombre: plan.nombre,
            importe_objetivo: centavosADecimal(plan.importeCentavos),
          }
        : plan.tipo === "presupuesto"
          ? {
              categoria_id: plan.categoriaId,
              periodo_inicio: plan.periodoInicio,
              importe: centavosADecimal(plan.importeCentavos),
              porcentaje_advertencia: 80,
            }
          : {
              meta_id: plan.metaId,
              importe: centavosADecimal(plan.importeCentavos),
            };
    const consulta = plan.id
      ? this.cliente
          .from(tabla)
          .update(campos)
          .eq("id", plan.id)
          .eq("usuario_id", usuario.id)
      : this.cliente.from(tabla).insert({ ...campos, usuario_id: usuario.id });
    exigirDatos(await consulta.select("id").single(), "guardar " + plan.tipo);
  }
  async eliminarPlan(tipo: Plan["tipo"], id: string): Promise<void> {
    const usuario = await this.obtenerUsuario();
    const tabla =
      tipo === "meta"
        ? "metas_ahorro"
        : tipo === "presupuesto"
          ? "presupuestos"
          : "aportes_meta";
    exigirDatos(
      await this.cliente
        .from(tabla)
        .delete()
        .eq("id", id)
        .eq("usuario_id", usuario.id)
        .select("id")
        .single(),
      "eliminar " + tipo,
    );
  }

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
    await this.prepararPerfil(usuarioId, usuario.email ?? "");

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

  private async prepararPerfil(
    usuarioId: string,
    correo: string,
  ): Promise<void> {
    const perfil = await this.cliente
      .from("perfiles")
      .select("usuario_id")
      .eq("usuario_id", usuarioId)
      .maybeSingle();
    if (perfil.error)
      throw new ErrorRepositorioFintrack("perfil", perfil.error);
    if (!perfil.data) {
      const { error } = await this.cliente.from("perfiles").upsert(
        {
          usuario_id: usuarioId,
          nombre_mostrar: correo.split("@")[0] || "Mi perfil",
          codigo_moneda: "PEN",
          configuracion_regional: "es-PE",
          zona_horaria: "America/Lima",
          onboarding_completado: true,
        },
        { onConflict: "usuario_id", ignoreDuplicates: true },
      );
      if (error) throw new ErrorRepositorioFintrack("crear perfil", error);
    }
    const categorias = await this.cliente
      .from("categorias")
      .select("id")
      .eq("usuario_id", usuarioId)
      .limit(1);
    if (categorias.error)
      throw new ErrorRepositorioFintrack("categorias", categorias.error);
    if (categorias.data?.length === 0) {
      const { error } = await this.cliente.from("categorias").insert([
        {
          usuario_id: usuarioId,
          nombre: "Ingresos",
          tipo: "ingreso",
          icono: "wallet",
          color: "#00D4A8",
        },
        {
          usuario_id: usuarioId,
          nombre: "Alimentación",
          tipo: "gasto",
          icono: "shopping-cart",
          color: "#62A8FF",
        },
        {
          usuario_id: usuarioId,
          nombre: "Transporte",
          tipo: "gasto",
          icono: "bus",
          color: "#FFB454",
        },
        {
          usuario_id: usuarioId,
          nombre: "Otros gastos",
          tipo: "gasto",
          icono: "receipt",
          color: "#A78BFA",
        },
      ]);
      if (error && error.code !== "23505")
        throw new ErrorRepositorioFintrack("crear categorias", error);
    }
  }

  async actualizarMovimiento(
    id: string,
    nuevo: NuevoMovimiento,
  ): Promise<MovimientoConMoneda> {
    const usuario = await this.obtenerUsuario();
    const resultado = await this.cliente
      .from("movimientos")
      .update({
        tipo: nuevo.tipo,
        importe: centavosADecimal(nuevo.importeCentavos),
        codigo_moneda: nuevo.codigoMoneda,
        cuenta_id: nuevo.cuentaId,
        cuenta_destino_id: nuevo.cuentaDestinoId,
        categoria_id: nuevo.categoriaId,
        descripcion: nuevo.descripcion ?? null,
        ocurrido_en: nuevo.ocurridoEn,
      })
      .eq("id", id)
      .eq("usuario_id", usuario.id)
      .select(
        "id,usuario_id,tipo,importe,codigo_moneda,cuenta_id,cuenta_destino_id,categoria_id,descripcion,ocurrido_en",
      )
      .single();
    return mapearMovimiento(
      exigirDatos(
        resultado as ResultadoSupabase<FilaMovimiento>,
        "actualizar movimiento",
      ),
    );
  }

  async crearCuenta(nueva: NuevaCuenta): Promise<Cuenta> {
    const usuario = await this.obtenerUsuario();
    const resultado = await this.cliente
      .from("cuentas")
      .insert({
        usuario_id: usuario.id,
        nombre: nueva.nombre,
        tipo: nueva.tipo,
        codigo_moneda: nueva.codigoMoneda,
        saldo_inicial: centavosADecimal(nueva.saldoInicialCentavos),
        color: nueva.color ?? "#00D4A8",
        esta_archivada: nueva.archivada,
      })
      .select(
        "id,usuario_id,nombre,tipo,codigo_moneda,saldo_inicial,color,esta_archivada",
      )
      .single();
    return mapearCuenta(
      exigirDatos(resultado as ResultadoSupabase<FilaCuenta>, "crear cuenta"),
    );
  }

  async actualizarCuenta(id: string, nueva: NuevaCuenta): Promise<Cuenta> {
    const usuario = await this.obtenerUsuario();
    const resultado = await this.cliente
      .from("cuentas")
      .update({
        nombre: nueva.nombre,
        tipo: nueva.tipo,
        codigo_moneda: nueva.codigoMoneda,
        saldo_inicial: centavosADecimal(nueva.saldoInicialCentavos),
        color: nueva.color ?? "#00D4A8",
        esta_archivada: nueva.archivada,
      })
      .eq("id", id)
      .eq("usuario_id", usuario.id)
      .select(
        "id,usuario_id,nombre,tipo,codigo_moneda,saldo_inicial,color,esta_archivada",
      )
      .single();
    return mapearCuenta(
      exigirDatos(
        resultado as ResultadoSupabase<FilaCuenta>,
        "actualizar cuenta",
      ),
    );
  }

  async eliminarCuenta(id: string): Promise<void> {
    const usuario = await this.obtenerUsuario();
    const resultado = await this.cliente
      .from("cuentas")
      .delete()
      .eq("id", id)
      .eq("usuario_id", usuario.id)
      .select("id")
      .single();
    exigirDatos(resultado, "eliminar cuenta");
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
    const resultado = await this.cliente
      .from("movimientos")
      .delete()
      .eq("id", id)
      .eq("usuario_id", usuario.id)
      .select("id")
      .single();
    exigirDatos(resultado, "eliminar movimiento");
  }
}

// Mantiene exportable el tipo de error sin convertirlo en una dependencia de runtime circular.
export type ErrorRepositorioRemoto = TipoErrorRepositorio;
