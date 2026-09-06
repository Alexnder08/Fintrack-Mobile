# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Delegado y aprobado mediante el plan de ejecución: React Native con Expo y TypeScript para Android e iOS; Supabase para autenticación y persistencia.

## Users

Inferido del brief: personas hispanohablantes que quieren registrar y entender sus finanzas personales desde el teléfono sin conectar credenciales bancarias.

## Product Purpose

Fintrack Mobile permite saber cuánto dinero tiene el usuario, en qué lo gasta y si está cumpliendo sus presupuestos y metas. El éxito significa que una persona puede registrar un movimiento en segundos y confiar en que sus balances y análisis son correctos.

## Positioning

Una vista financiera personal clara y verificable que convierte movimientos manuales en balance, patrimonio, presupuestos y progreso de ahorro sin ejecutar operaciones bancarias reales.

## Operating Context

- Uso frecuente desde Android e iOS.
- Registro manual de ingresos, gastos y transferencias entre cuentas propias.
- Consulta rápida del dashboard y revisión periódica de presupuestos.
- Experiencia en español con moneda, región y zona horaria configurables.

## Capabilities and Constraints

- MVP con acceso por correo, onboarding, cuentas, categorías, movimientos, transferencias, presupuestos, metas, perfil y exportación.
- Enviar, Recibir y Pagar registran movimientos; no transfieren dinero real.
- No se almacenan contraseñas ni credenciales bancarias.
- Los datos de cada usuario deben quedar aislados mediante Row Level Security.
- El MVP es online-first con caché de lectura, no sincronización offline completa.
- Decisión abierta: país, moneda y región predeterminados para el primer lanzamiento.

## Brand Commitments

- Nombre: Fintrack Mobile.
- La referencia visual vinculante es el prototipo de Figma Make entregado por el usuario.
- Interfaz oscura, datos legibles y tono directo en español.
- Acento teal para acciones/estados positivos y rose para estados negativos.

## Evidence on Hand

- `plan.md`, mantenido localmente y fuera de Git.
- Prototipo Figma Make con cuatro pantallas: Inicio, Análisis, Cuentas y Perfil.
- Datos del prototipo son demostrativos; no deben presentarse como datos reales ni como evidencia comercial.

## Product Principles

1. Exactitud financiera antes que ornamentación.
2. Cada dato debe poder entenderse y verificarse rápidamente.
3. Privacidad y aislamiento por usuario desde la base de datos.
4. Registrar un movimiento debe requerir el mínimo esfuerzo razonable.
5. Las convenciones nativas de Android e iOS prevalecen sobre efectos visuales.

## Accessibility & Inclusion

- Compatibilidad con tamaños de texto del sistema.
- Objetivos táctiles mínimos de 48 dp en Android y 44 pt en iOS.
- Los estados financieros no dependen únicamente del color.
- Gráficas acompañadas por resúmenes textuales accesibles.
