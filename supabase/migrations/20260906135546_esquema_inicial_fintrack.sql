begin;

-- Los objetos auxiliares permanecen fuera del esquema expuesto por la Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- La exposicion futura de objetos en public debe ser opt-in.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

create table public.perfiles (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  nombre_mostrar text not null,
  codigo_moneda text not null default 'PEN',
  configuracion_regional text not null default 'es-PE',
  zona_horaria text not null default 'America/Lima',
  ruta_avatar text,
  onboarding_completado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint perfiles_nombre_mostrar_valido check (
    char_length(btrim(nombre_mostrar)) between 1 and 80
  ),
  constraint perfiles_codigo_moneda_valido check (codigo_moneda ~ '^[A-Z]{3}$'),
  constraint perfiles_configuracion_regional_valida check (
    configuracion_regional ~ '^[a-z]{2,3}(-[A-Z0-9]{2,3})?$'
  ),
  constraint perfiles_zona_horaria_valida check (
    char_length(btrim(zona_horaria)) between 1 and 64
  ),
  constraint perfiles_ruta_avatar_valida check (
    ruta_avatar is null or char_length(ruta_avatar) <= 500
  )
);

create table public.cuentas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null,
  codigo_moneda text not null,
  saldo_inicial numeric(20, 4) not null default 0,
  color text not null default '#00D4A8',
  esta_archivada boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint cuentas_nombre_valido check (char_length(btrim(nombre)) between 1 and 80),
  constraint cuentas_tipo_valido check (tipo in ('efectivo', 'corriente', 'ahorro', 'credito')),
  constraint cuentas_codigo_moneda_valido check (codigo_moneda ~ '^[A-Z]{3}$'),
  constraint cuentas_color_valido check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint cuentas_usuario_id_id_unicos unique (usuario_id, id),
  constraint cuentas_usuario_id_id_moneda_unicos unique (usuario_id, id, codigo_moneda)
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null,
  icono text not null,
  color text not null,
  es_base boolean not null default false,
  esta_archivada boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint categorias_nombre_valido check (char_length(btrim(nombre)) between 1 and 60),
  constraint categorias_tipo_valido check (tipo in ('ingreso', 'gasto')),
  constraint categorias_icono_valido check (char_length(btrim(icono)) between 1 and 60),
  constraint categorias_color_valido check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint categorias_base_sin_usuario check (
    (es_base and usuario_id is null) or (not es_base and usuario_id is not null)
  ),
  constraint categorias_usuario_id_id_unicos unique (usuario_id, id),
  constraint categorias_usuario_id_id_tipo_unicos unique (usuario_id, id, tipo)
);

comment on table public.categorias is
  'Las filas es_base=true son plantillas globales de solo lectura. Deben copiarse al usuario antes de asociarlas a movimientos o presupuestos.';

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  importe numeric(20, 4) not null,
  codigo_moneda text not null,
  cuenta_id uuid not null,
  cuenta_destino_id uuid,
  categoria_id uuid,
  descripcion text,
  ocurrido_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint movimientos_tipo_valido check (tipo in ('ingreso', 'gasto', 'transferencia')),
  constraint movimientos_importe_positivo check (importe > 0),
  constraint movimientos_codigo_moneda_valido check (codigo_moneda ~ '^[A-Z]{3}$'),
  constraint movimientos_descripcion_valida check (
    descripcion is null or char_length(descripcion) <= 500
  ),
  constraint movimientos_campos_segun_tipo check (
    (
      tipo in ('ingreso', 'gasto')
      and categoria_id is not null
      and cuenta_destino_id is null
    )
    or
    (
      tipo = 'transferencia'
      and categoria_id is null
      and cuenta_destino_id is not null
      and cuenta_destino_id <> cuenta_id
    )
  ),
  constraint movimientos_usuario_cuenta_moneda_fkey
    foreign key (usuario_id, cuenta_id, codigo_moneda)
    references public.cuentas (usuario_id, id, codigo_moneda)
    on update restrict on delete restrict,
  constraint movimientos_usuario_cuenta_destino_moneda_fkey
    foreign key (usuario_id, cuenta_destino_id, codigo_moneda)
    references public.cuentas (usuario_id, id, codigo_moneda)
    on update restrict on delete restrict,
  constraint movimientos_usuario_categoria_tipo_fkey
    foreign key (usuario_id, categoria_id, tipo)
    references public.categorias (usuario_id, id, tipo)
    on update restrict on delete restrict
);

create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid not null,
  tipo_categoria text generated always as ('gasto'::text) stored,
  periodo_inicio date not null,
  importe numeric(20, 4) not null,
  porcentaje_advertencia numeric(5, 2) not null default 80,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint presupuestos_importe_positivo check (importe > 0),
  constraint presupuestos_porcentaje_advertencia_valido check (
    porcentaje_advertencia > 0 and porcentaje_advertencia <= 100
  ),
  constraint presupuestos_periodo_mensual check (extract(day from periodo_inicio) = 1),
  constraint presupuestos_usuario_categoria_periodo_unicos unique (
    usuario_id,
    categoria_id,
    periodo_inicio
  ),
  constraint presupuestos_usuario_categoria_tipo_fkey
    foreign key (usuario_id, categoria_id, tipo_categoria)
    references public.categorias (usuario_id, id, tipo)
    on update restrict on delete restrict
);

create table public.metas_ahorro (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  importe_objetivo numeric(20, 4) not null,
  fecha_objetivo date,
  estado text not null default 'activa',
  color text not null default '#00D4A8',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint metas_ahorro_nombre_valido check (char_length(btrim(nombre)) between 1 and 100),
  constraint metas_ahorro_importe_objetivo_positivo check (importe_objetivo > 0),
  constraint metas_ahorro_estado_valido check (estado in ('activa', 'completada', 'cancelada')),
  constraint metas_ahorro_color_valido check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint metas_ahorro_usuario_id_id_unicos unique (usuario_id, id)
);

create table public.aportes_meta (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  meta_id uuid not null,
  importe numeric(20, 4) not null,
  aportado_en timestamptz not null default now(),
  descripcion text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint aportes_meta_importe_positivo check (importe > 0),
  constraint aportes_meta_descripcion_valida check (
    descripcion is null or char_length(descripcion) <= 300
  ),
  constraint aportes_meta_usuario_meta_fkey
    foreign key (usuario_id, meta_id)
    references public.metas_ahorro (usuario_id, id)
    on update restrict on delete cascade
);

create table public.preferencias_notificacion (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  advertencia_presupuesto boolean not null default true,
  presupuesto_excedido boolean not null default true,
  recordatorios_habilitados boolean not null default false,
  hora_recordatorio time,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint preferencias_notificacion_hora_coherente check (
    recordatorios_habilitados or hora_recordatorio is null
  )
);

-- Unicidad legible sin impedir que un usuario reutilice el nombre de una categoria archivada.
create unique index categorias_base_tipo_nombre_unicos
  on public.categorias (tipo, lower(nombre))
  where usuario_id is null;
create unique index categorias_usuario_tipo_nombre_activos_unicos
  on public.categorias (usuario_id, tipo, lower(nombre))
  where usuario_id is not null and not esta_archivada;
create unique index cuentas_usuario_nombre_activo_unico
  on public.cuentas (usuario_id, lower(nombre))
  where not esta_archivada;

-- Indices alineados con RLS, relaciones y paginacion por cursor.
create index movimientos_usuario_ocurrido_id_idx
  on public.movimientos (usuario_id, ocurrido_en desc, id desc);
create index movimientos_usuario_cuenta_ocurrido_id_idx
  on public.movimientos (usuario_id, cuenta_id, ocurrido_en desc, id desc);
create index movimientos_usuario_cuenta_destino_idx
  on public.movimientos (usuario_id, cuenta_destino_id)
  where cuenta_destino_id is not null;
create index movimientos_usuario_categoria_ocurrido_id_idx
  on public.movimientos (usuario_id, categoria_id, ocurrido_en desc, id desc)
  where categoria_id is not null;
create index presupuestos_usuario_periodo_idx
  on public.presupuestos (usuario_id, periodo_inicio desc);
create index metas_ahorro_usuario_estado_idx
  on public.metas_ahorro (usuario_id, estado, creado_en desc);
create index aportes_meta_usuario_meta_aportado_id_idx
  on public.aportes_meta (usuario_id, meta_id, aportado_en desc, id desc);

-- Mantiene actualizado_en bajo control de la base sin usar SECURITY DEFINER.
create function private.establecer_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = pg_catalog.statement_timestamp();
  return new;
end;
$$;

revoke all on function private.establecer_actualizado_en() from public, anon, authenticated;

create trigger perfiles_establecer_actualizado_en
  before update on public.perfiles
  for each row execute function private.establecer_actualizado_en();
create trigger cuentas_establecer_actualizado_en
  before update on public.cuentas
  for each row execute function private.establecer_actualizado_en();
create trigger categorias_establecer_actualizado_en
  before update on public.categorias
  for each row execute function private.establecer_actualizado_en();
create trigger movimientos_establecer_actualizado_en
  before update on public.movimientos
  for each row execute function private.establecer_actualizado_en();
create trigger presupuestos_establecer_actualizado_en
  before update on public.presupuestos
  for each row execute function private.establecer_actualizado_en();
create trigger metas_ahorro_establecer_actualizado_en
  before update on public.metas_ahorro
  for each row execute function private.establecer_actualizado_en();
create trigger aportes_meta_establecer_actualizado_en
  before update on public.aportes_meta
  for each row execute function private.establecer_actualizado_en();
create trigger preferencias_notificacion_establecer_actualizado_en
  before update on public.preferencias_notificacion
  for each row execute function private.establecer_actualizado_en();

alter table public.perfiles enable row level security;
alter table public.cuentas enable row level security;
alter table public.categorias enable row level security;
alter table public.movimientos enable row level security;
alter table public.presupuestos enable row level security;
alter table public.metas_ahorro enable row level security;
alter table public.aportes_meta enable row level security;
alter table public.preferencias_notificacion enable row level security;

create policy perfiles_seleccionar_propios on public.perfiles
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy perfiles_insertar_propios on public.perfiles
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy perfiles_actualizar_propios on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy perfiles_eliminar_propios on public.perfiles
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy cuentas_seleccionar_propias on public.cuentas
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy cuentas_insertar_propias on public.cuentas
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy cuentas_actualizar_propias on public.cuentas
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy cuentas_eliminar_propias on public.cuentas
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy categorias_seleccionar_propias_o_base on public.categorias
  for select to authenticated
  using (
    (select auth.uid()) = usuario_id
    or (usuario_id is null and es_base)
  );
create policy categorias_insertar_propias on public.categorias
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id and not es_base);
create policy categorias_actualizar_propias on public.categorias
  for update to authenticated
  using ((select auth.uid()) = usuario_id and not es_base)
  with check ((select auth.uid()) = usuario_id and not es_base);
create policy categorias_eliminar_propias on public.categorias
  for delete to authenticated
  using ((select auth.uid()) = usuario_id and not es_base);

create policy movimientos_seleccionar_propios on public.movimientos
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy movimientos_insertar_propios on public.movimientos
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy movimientos_actualizar_propios on public.movimientos
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy movimientos_eliminar_propios on public.movimientos
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy presupuestos_seleccionar_propios on public.presupuestos
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy presupuestos_insertar_propios on public.presupuestos
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy presupuestos_actualizar_propios on public.presupuestos
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy presupuestos_eliminar_propios on public.presupuestos
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy metas_ahorro_seleccionar_propias on public.metas_ahorro
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy metas_ahorro_insertar_propias on public.metas_ahorro
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy metas_ahorro_actualizar_propias on public.metas_ahorro
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy metas_ahorro_eliminar_propias on public.metas_ahorro
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy aportes_meta_seleccionar_propios on public.aportes_meta
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy aportes_meta_insertar_propios on public.aportes_meta
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy aportes_meta_actualizar_propios on public.aportes_meta
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy aportes_meta_eliminar_propios on public.aportes_meta
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

create policy preferencias_notificacion_seleccionar_propias
  on public.preferencias_notificacion
  for select to authenticated
  using ((select auth.uid()) = usuario_id);
create policy preferencias_notificacion_insertar_propias
  on public.preferencias_notificacion
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);
create policy preferencias_notificacion_actualizar_propias
  on public.preferencias_notificacion
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy preferencias_notificacion_eliminar_propias
  on public.preferencias_notificacion
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- RLS controla las filas; los grants controlan si la tabla es alcanzable por Data API.
revoke all on table
  public.perfiles,
  public.cuentas,
  public.categorias,
  public.movimientos,
  public.presupuestos,
  public.metas_ahorro,
  public.aportes_meta,
  public.preferencias_notificacion
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.perfiles,
  public.cuentas,
  public.categorias,
  public.movimientos,
  public.presupuestos,
  public.metas_ahorro,
  public.aportes_meta,
  public.preferencias_notificacion
to authenticated;

commit;
