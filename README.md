# Fintrack Mobile

Aplicación móvil de finanzas personales construida con Expo, React Native,
TypeScript y Supabase.

## Requisitos

- Node.js 20 LTS o una versión posterior compatible con Expo.
- npm.
- Para Android: Android Studio, el SDK de Android y un emulador iniciado (o un
  dispositivo físico con la depuración USB habilitada).
- JDK 17 para compilar Android.
- Para iOS: macOS con Xcode y CocoaPods.

## Inicialización

1. Clona el repositorio y entra en la carpeta del proyecto:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd "Fintrack IA"
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea el archivo de variables de entorno a partir del ejemplo:

   ```bash
   # macOS o Linux
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env
   ```

4. Para trabajar con los datos de demostración, conserva esta configuración en
   `.env`:

   ```env
   EXPO_PUBLIC_FINTRACK_DEMO_MODE=true
   ```

   Para conectarte a Supabase, completa las credenciales públicas y desactiva el
   modo demo:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publicable
   EXPO_PUBLIC_FINTRACK_DEMO_MODE=false
   ```

   El esquema y los datos iniciales de Supabase se encuentran en
   `supabase/migrations/` y `supabase/seed.sql`, respectivamente.

5. Inicia la aplicación en la plataforma deseada:

   ```bash
   npm run android  # Android
   npm run ios      # iOS (solo macOS)
   npm run web      # Navegador
   npm start        # Servidor de desarrollo de Expo
   ```

Si cambias las variables de `.env` mientras Metro está en ejecución, reinicia el
servidor de desarrollo para que Expo vuelva a cargarlas.

## Uso de la app

La pantalla de acceso permite iniciar sesión o crear una cuenta en Supabase.
También ofrece **Usar en este dispositivo**: un perfil personal sin datos de
ejemplo, independiente del servidor. **Explorar demostración** abre datos
separados para probar la app. La demostración no se activa por un fallo de red.

1. Crea una cuenta y su saldo inicial desde Cuentas.
2. Registra ingresos, gastos y transferencias desde Inicio. En Movimientos puedes
   buscar, editar y eliminar registros. Los saldos se recalculan automáticamente.
3. Define presupuestos por categoría y mes desde Análisis.
4. Crea metas y registra, edita o elimina aportes desde Perfil. Los aportes a
   metas son un seguimiento de ahorro y no modifican saldos de cuentas.
5. Cambia tu nombre y la privacidad del balance, exporta tus datos y cierra
   sesión desde Perfil. Salir conserva los datos y vuelve a la pantalla de acceso.

AsyncStorage conserva el perfil personal, los datos de demostración, el acceso
local, las preferencias y los borradores. Para usuarios de Supabase conserva
sesión y una copia separada por usuario; esa copia permite consulta sin red,
pero los cambios requieren conexión. Los datos locales se pierden al desinstalar.

Para desarrollo, `npm start` inicia Metro en IPv4 local. En el emulador, activa
**Enable keyboard input** para escribir con el teclado de la computadora.

Para crear un APK que no dependa de Metro, compila `assembleRelease` en Android
Studio con JDK 17. El proyecto usa la firma de desarrollo para validar el APK
localmente; antes de distribuirlo en una tienda debe configurarse una firma
de publicación propia. El plugin `with-android-build.js` conserva los ajustes
de JDK y rutas nativas de Windows al regenerar Android.

## Validación

Antes de integrar cambios, ejecuta:

```bash
npm run typecheck
npm run lint
npm run test:ci
```
