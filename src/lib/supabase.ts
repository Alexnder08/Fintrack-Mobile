import "expo-sqlite/localStorage/install";
import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

declare const process: {
  env: Record<string, string | undefined>;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);
export const isDemoMode = process.env.EXPO_PUBLIC_FINTRACK_DEMO_MODE === "true";

export const supabase = createClient(
  supabaseUrl ?? "https://configuracion-pendiente.supabase.co",
  supabasePublishableKey ?? "configuracion-pendiente",
  {
    auth: {
      storage: globalThis.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
