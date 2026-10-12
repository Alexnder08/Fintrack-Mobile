-- Plantillas globales. No contienen ni crean datos de usuario.
-- El cliente debe copiar la plantilla elegida con usuario_id = auth.uid() y es_base = false.
insert into public.categorias (id, usuario_id, nombre, tipo, icono, color, es_base)
values
  ('10000000-0000-4000-8000-000000000001', null, 'Salario', 'ingreso', 'briefcase-business', '#00D4A8', true),
  ('10000000-0000-4000-8000-000000000002', null, 'Ingresos extra', 'ingreso', 'circle-dollar-sign', '#38BDF8', true),
  ('20000000-0000-4000-8000-000000000001', null, 'Alimentacion', 'gasto', 'utensils', '#FB7185', true),
  ('20000000-0000-4000-8000-000000000002', null, 'Transporte', 'gasto', 'bus-front', '#38BDF8', true),
  ('20000000-0000-4000-8000-000000000003', null, 'Vivienda', 'gasto', 'house', '#A78BFA', true),
  ('20000000-0000-4000-8000-000000000004', null, 'Servicios', 'gasto', 'receipt-text', '#F59E0B', true),
  ('20000000-0000-4000-8000-000000000005', null, 'Salud', 'gasto', 'heart-pulse', '#F43F5E', true),
  ('20000000-0000-4000-8000-000000000006', null, 'Entretenimiento', 'gasto', 'gamepad-2', '#22D3EE', true)
on conflict do nothing;
