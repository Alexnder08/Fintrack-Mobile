# Fintrack Mobile

Aplicación móvil de finanzas personales construida con Expo, React Native,
TypeScript y Supabase.

## Requisitos

- Node.js 20 LTS o una versión posterior compatible con Expo.
- npm.
- Para Android: Android Studio, el SDK de Android y un emulador iniciado (o un
  dispositivo físico con la depuración USB habilitada).
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

## Comprobaciones

Antes de integrar cambios, ejecuta:

```bash
npm run typecheck
npm run lint
npm run test:ci
```
