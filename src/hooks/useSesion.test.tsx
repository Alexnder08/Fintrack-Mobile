import { expect, jest, test } from "@jest/globals";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { SesionProvider, useSesion } from "./useSesion";

jest.mock("../lib/supabase", () => ({
  isDemoMode: true,
  isSupabaseConfigured: false,
  supabase: { auth: { signOut: jest.fn() } },
}));

test("salir de demostración vuelve al acceso y permite regresar sin perder datos", async () => {
  const cliente = new QueryClient();
  await AsyncStorage.removeItem("fintrack:acceso-local:v1");
  await AsyncStorage.setItem("datos-conservados", "movimiento");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>
      <SesionProvider>{children}</SesionProvider>
    </QueryClientProvider>
  );
  const vista = await renderHook(useSesion, { wrapper });
  expect(vista.result.current.local).toBe(false);
  await act(async () => {
    await vista.result.current.entrarDemo();
  });
  expect(vista.result.current.local).toBe(true);
  expect(vista.result.current.usuarioId).toBe("demo");
  cliente.setQueryData(["fintrack", "demo", "pantallas"], { balance: 100 });
  await act(async () => {
    await vista.result.current.cerrarSesion();
  });
  expect(vista.result.current.local).toBe(false);
  expect(vista.result.current.sesion).toBeNull();
  expect(
    cliente.getQueryData(["fintrack", "demo", "pantallas"]),
  ).toBeUndefined();
  expect(await AsyncStorage.getItem("datos-conservados")).toBe("movimiento");
  await act(async () => {
    await vista.result.current.entrarDemo();
  });
  expect(vista.result.current.local).toBe(true);
  expect(vista.result.current.usuarioId).toBe("demo");
});

test("el acceso personal persiste y salir también persiste tras reiniciar", async () => {
  await AsyncStorage.removeItem("fintrack:acceso-local:v1");
  const cliente = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>
      <SesionProvider>{children}</SesionProvider>
    </QueryClientProvider>
  );
  const primera = await renderHook(useSesion, { wrapper });
  await act(async () => {
    await primera.result.current.entrarPersonal();
  });
  expect(primera.result.current.usuarioId).toBe("dispositivo");
  await primera.unmount();
  const segunda = await renderHook(useSesion, { wrapper });
  expect(segunda.result.current.usuarioId).toBe("dispositivo");
  await act(async () => {
    await segunda.result.current.cerrarSesion();
  });
  await segunda.unmount();
  const tercera = await renderHook(useSesion, { wrapper });
  expect(tercera.result.current.local).toBe(false);
});
