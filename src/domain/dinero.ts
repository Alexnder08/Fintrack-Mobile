import type { Centavos } from "./modelos";

export function esCentavos(valor: unknown): valor is Centavos {
  return typeof valor === "number" && Number.isSafeInteger(valor);
}

export function asegurarCentavos(valor: number, campo = "importe"): Centavos {
  if (!esCentavos(valor)) {
    throw new RangeError(
      `${campo} debe ser un entero seguro expresado en centavos`,
    );
  }

  return valor;
}

export function sumarCentavos(
  valores: readonly Centavos[],
  campo = "resultado",
): Centavos {
  return valores.reduce<Centavos>((total, valor) => {
    asegurarCentavos(valor, campo);
    return asegurarCentavos(total + valor, campo);
  }, 0);
}

/** Devuelve un porcentaje finito redondeado a dos decimales. */
export function calcularPorcentajeSeguro(parte: number, total: number): number {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const porcentaje = (parte / total) * 100;
  return Number.isFinite(porcentaje) ? Math.round(porcentaje * 100) / 100 : 0;
}
