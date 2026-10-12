import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  useBorradorMovimiento,
  type BorradorMovimiento,
} from "./useBorradorMovimiento";
import { usePreferencias } from "./usePreferencias";

jest.mock("./useSesion", () => ({
  useSesion: () => ({ usuarioId: "usuario-prueba" }),
}));
const inicial: BorradorMovimiento = {
  tipo: "gasto",
  importe: "",
  descripcion: "",
  cuentaId: "cuenta",
  cuentaDestinoId: "",
  categoriaId: "categoria",
  fecha: "2026-10-08",
};
beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("hooks de persistencia", () => {
  test("recupera un borrador tras desmontar y montar el formulario", async () => {
    const primera = await renderHook(() =>
      useBorradorMovimiento("borrador-prueba", inicial),
    );
    await waitFor(() => expect(primera.result.current.listo).toBe(true));
    await act(() =>
      primera.result.current.cambiar({
        descripcion: "Almuerzo pendiente",
        importe: "25.50",
      }),
    );
    await waitFor(async () =>
      expect(await AsyncStorage.getItem("borrador-prueba")).toContain(
        "Almuerzo pendiente",
      ),
    );
    await primera.unmount();
    const segunda = await renderHook(() =>
      useBorradorMovimiento("borrador-prueba", inicial),
    );
    await waitFor(() => expect(segunda.result.current.listo).toBe(true));
    expect(segunda.result.current.borrador.descripcion).toBe(
      "Almuerzo pendiente",
    );
    expect(segunda.result.current.borrador.importe).toBe("25.50");
    await act(async () => {
      await segunda.result.current.descartar();
    });
    expect(await AsyncStorage.getItem("borrador-prueba")).toBeNull();
  });
  test("la privacidad del balance sobrevive al reinicio", async () => {
    const primera = await renderHook(usePreferencias);
    await waitFor(() => expect(primera.result.current.cargando).toBe(false));
    await act(async () => {
      await primera.result.current.alternarBalance();
    });
    expect(primera.result.current.preferencias.balanceOculto).toBe(true);
    await primera.unmount();
    const segunda = await renderHook(usePreferencias);
    await waitFor(() => expect(segunda.result.current.cargando).toBe(false));
    expect(segunda.result.current.preferencias.balanceOculto).toBe(true);
  });
});
