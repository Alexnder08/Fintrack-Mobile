import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NuevoMovimiento, NuevaCuenta } from "../data";
import { useSesion } from "./useSesion";
import type { Plan } from "../services";

type Operacion =
  | { tipo: "guardarPlan"; datos: Plan }
  | { tipo: "eliminarPlan"; recurso: Plan["tipo"]; id: string }
  | { tipo: "actualizarNombre"; nombre: string }
  | { tipo: "crearMovimiento"; datos: NuevoMovimiento }
  | { tipo: "actualizarMovimiento"; id: string; datos: NuevoMovimiento }
  | { tipo: "eliminarMovimiento"; id: string }
  | { tipo: "crearCuenta"; datos: NuevaCuenta }
  | { tipo: "actualizarCuenta"; id: string; datos: NuevaCuenta }
  | { tipo: "eliminarCuenta"; id: string };

export function useOperaciones() {
  const { servicio, usuarioId } = useSesion();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (operacion: Operacion) => {
      switch (operacion.tipo) {
        case "guardarPlan":
          return servicio.guardarPlan(operacion.datos);
        case "eliminarPlan":
          return servicio.eliminarPlan(operacion.recurso, operacion.id);
        case "actualizarNombre":
          return servicio.actualizarNombre(operacion.nombre);
        case "crearMovimiento":
          return servicio.crearMovimiento(operacion.datos);
        case "actualizarMovimiento":
          return servicio.actualizarMovimiento(operacion.id, operacion.datos);
        case "eliminarMovimiento":
          return servicio.eliminarMovimiento(operacion.id);
        case "crearCuenta":
          return servicio.crearCuenta(operacion.datos);
        case "actualizarCuenta":
          return servicio.actualizarCuenta(operacion.id, operacion.datos);
        case "eliminarCuenta":
          return servicio.eliminarCuenta(operacion.id);
      }
    },
    retry: false,
    onSuccess: async () => {
      await cliente.invalidateQueries({ queryKey: ["fintrack", usuarioId] });
    },
  });
}
