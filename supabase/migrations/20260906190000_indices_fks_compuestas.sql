create index if not exists movimientos_usuario_cuenta_moneda_idx
  on public.movimientos (usuario_id, cuenta_id, codigo_moneda);

create index if not exists movimientos_usuario_cuenta_destino_moneda_idx
  on public.movimientos (usuario_id, cuenta_destino_id, codigo_moneda)
  where cuenta_destino_id is not null;

create index if not exists movimientos_usuario_categoria_tipo_idx
  on public.movimientos (usuario_id, categoria_id, tipo)
  where categoria_id is not null;

create index if not exists presupuestos_usuario_categoria_tipo_idx
  on public.presupuestos (usuario_id, categoria_id, tipo_categoria);
