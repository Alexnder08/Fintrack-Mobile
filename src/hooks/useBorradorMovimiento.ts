import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { almacenamiento } from "../lib/almacenamiento";

const esquemaBorrador = z.object({
  tipo: z.enum(["ingreso", "gasto", "transferencia"]),
  importe: z.string(),
  descripcion: z.string().max(500),
  cuentaId: z.string(),
  cuentaDestinoId: z.string(),
  categoriaId: z.string(),
  fecha: z.string(),
});
export type BorradorMovimiento = z.infer<typeof esquemaBorrador>;

export function useBorradorMovimiento(
  clave: string,
  inicial: BorradorMovimiento,
) {
  const [borrador, setBorrador] = useState(inicial);
  const [listo, setListo] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [modificado, setModificado] = useState(false);
  const terminado = useRef(false);
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const inicialRef = useRef(inicial);

  useEffect(() => {
    let activo = true;
    void almacenamiento
      .getItem(clave)
      .then((texto) => {
        if (activo)
          setBorrador(
            texto
              ? esquemaBorrador.parse(JSON.parse(texto))
              : inicialRef.current,
          );
      })
      .catch(() => {
        if (activo)
          setErrorLocal(
            "No pudimos recuperar el borrador. Puedes completar el formulario nuevamente.",
          );
      })
      .finally(() => {
        if (activo) setListo(true);
      });
    return () => {
      activo = false;
    };
  }, [clave]);

  useEffect(() => {
    if (!listo || !modificado || terminado.current) return;
    // Guardado inmediato y ordenado: salir rápido no pierde el último cambio.
    cola.current = cola.current
      .catch(() => undefined)
      .then(() =>
        terminado.current
          ? undefined
          : almacenamiento.setItem(clave, JSON.stringify(borrador)),
      )
      .catch(() =>
        setErrorLocal(
          "No pudimos guardar el borrador en este dispositivo. Mantén abierto el formulario hasta guardar el movimiento.",
        ),
      );
  }, [borrador, clave, listo, modificado]);

  function cambiar(cambios: Partial<BorradorMovimiento>) {
    setModificado(true);
    setBorrador((actual) => ({ ...actual, ...cambios }));
  }
  async function descartar() {
    terminado.current = true;
    await cola.current;
    await almacenamiento.removeItem(clave);
  }
  return { borrador, cambiar, listo, errorLocal, descartar };
}
