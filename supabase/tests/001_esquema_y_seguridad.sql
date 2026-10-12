begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_tables
    where schemaname = 'public'
      and tablename in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
  ),
  8,
  'existen las ocho tablas del dominio'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
      and c.relrowsecurity
  ),
  8,
  'RLS esta habilitado en todas las tablas expuestas'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
  ),
  32,
  'cada tabla tiene politicas separadas para select, insert, update y delete'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
      and roles = array['authenticated']::name[]
  ),
  32,
  'todas las politicas se limitan al rol authenticated'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and cmd = 'UPDATE'
      and qual is not null
      and with_check is not null
      and tablename in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
  ),
  8,
  'todas las politicas update tienen using y with check'
);

select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
      and table_name in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
  ),
  0,
  'anon no posee privilegios sobre datos financieros'
);

select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'authenticated'
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      and table_name in (
        'perfiles',
        'cuentas',
        'categorias',
        'movimientos',
        'presupuestos',
        'metas_ahorro',
        'aportes_meta',
        'preferencias_notificacion'
      )
  ),
  32,
  'authenticated posee solo las cuatro operaciones requeridas por tabla'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'movimientos_usuario_cuenta_moneda_fkey'
      and contype = 'f'
  ),
  'la cuenta origen se valida con propietario y moneda'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'movimientos_usuario_categoria_tipo_fkey'
      and contype = 'f'
  ),
  'la categoria se valida con propietario y tipo de movimiento'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and indexname = 'movimientos_usuario_ocurrido_id_idx'
  ),
  'existe el indice para paginacion por cursor de movimientos'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'establecer_actualizado_en'
      and p.prosecdef
  ),
  0,
  'el trigger auxiliar no usa security definer'
);

select * from finish();
rollback;
