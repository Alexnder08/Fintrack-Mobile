import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { clonarDatosDemo } from "../../data";
import { MovimientoEditor } from "./MovimientoEditor";

const mockMutate = jest.fn<(datos: unknown) => Promise<unknown>>();
const mockRouter = {
  back: jest.fn(),
  canGoBack: () => true,
  replace: jest.fn(),
  push: jest.fn(),
};
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("lucide-react-native", () => ({ ArrowLeft: () => null }));
jest.mock("../../hooks/useSesion", () => ({
  useSesion: () => ({ usuarioId: "demo" }),
}));
jest.mock("../../hooks/useOperaciones", () => ({
  useOperaciones: () => ({ mutateAsync: mockMutate, isPending: false }),
}));
jest.mock(
  "react-native-safe-area-context",
  () =>
    jest.requireActual<{ default: unknown }>(
      "react-native-safe-area-context/jest/mock",
    ).default,
);

beforeEach(async () => {
  await AsyncStorage.clear();
  mockMutate.mockReset().mockResolvedValue({ id: "nuevo" });
  mockRouter.back.mockClear();
});
async function abrir() {
  await render(<MovimientoEditor datos={clonarDatosDemo()} />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    ).toBeEnabled(),
  );
}
describe("formulario móvil de movimientos", () => {
  test("rechaza un importe inválido antes de escribir datos", async () => {
    await abrir();
    await fireEvent.changeText(screen.getByLabelText("Importe (PEN)"), "-10");
    await fireEvent.press(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(screen.getByText(/Escribe un importe mayor que cero/)).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });
  test("convierte un decimal con coma a centavos y guarda el movimiento", async () => {
    await abrir();
    await fireEvent.changeText(screen.getByLabelText("Importe (PEN)"), "25,50");
    await fireEvent.changeText(
      screen.getByLabelText("Descripción"),
      "Almuerzo",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "crearMovimiento",
          datos: expect.objectContaining({
            importeCentavos: 2550,
            descripcion: "Almuerzo",
            tipo: "gasto",
          }),
        }),
      ),
    );
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
  test("un error conserva el formulario y permite reintentar", async () => {
    mockMutate.mockRejectedValueOnce(new Error("Sin conexión"));
    await abrir();
    await fireEvent.changeText(screen.getByLabelText("Importe (PEN)"), "25.50");
    await fireEvent.changeText(
      screen.getByLabelText("Descripción"),
      "Compra pendiente",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    await waitFor(() => expect(screen.getByText("Sin conexión")).toBeTruthy());
    expect(screen.getByLabelText("Descripción").props.value).toBe(
      "Compra pendiente",
    );
    expect(mockRouter.back).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(mockMutate).toHaveBeenCalledTimes(2);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
  test("eliminar exige confirmar y envía el id correcto", async () => {
    const datos = clonarDatosDemo();
    const movimiento = datos.movimientos[0];
    await render(<MovimientoEditor datos={datos} movimiento={movimiento} />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Eliminar movimiento" }),
      ).toBeEnabled(),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Eliminar movimiento" }),
    );
    expect(mockMutate).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Confirmar eliminación" }),
    );
    expect(mockMutate).toHaveBeenCalledWith({
      tipo: "eliminarMovimiento",
      id: movimiento.id,
    });
  });
});
