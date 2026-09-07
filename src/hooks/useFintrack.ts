import { useQuery } from "@tanstack/react-query";

import type { AccountsScreenProps } from "../features/accounts";
import type { AnalysisScreenProps } from "../features/analysis";
import type { HomeScreenProps } from "../features/home";
import type { ProfileScreenProps } from "../features/profile";
import type { FeatureStatus, TransactionItem } from "../features/shared";
import {
  crearRepositorioFintrack,
  ServicioFintrack,
  type DatosPantallasFintrack,
} from "../services";
import { colors } from "../theme";

const servicio = new ServicioFintrack(crearRepositorioFintrack());
const A_UNIDADES = 100;

function aUnidades(centavos: number): number {
  return centavos / A_UNIDADES;
}

function etiquetaMovimiento(tipo: "ingreso" | "gasto" | "transferencia") {
  if (tipo === "ingreso") return "Ingreso";
  if (tipo === "gasto") return "Gasto";
  return "Transferencia";
}

function aMovimientoVisual(
  movimiento: DatosPantallasFintrack["inicio"]["movimientosRecientes"][number],
  locale: string,
): TransactionItem {
  const fecha = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(movimiento.ocurridoEn));

  return {
    id: movimiento.id,
    title:
      movimiento.descripcion?.trim() || etiquetaMovimiento(movimiento.tipo),
    detail: `${etiquetaMovimiento(movimiento.tipo)} · ${fecha}`,
    amount: aUnidades(movimiento.importeCentavos),
    kind:
      movimiento.tipo === "transferencia"
        ? "transfer"
        : movimiento.tipo === "ingreso"
          ? "income"
          : "expense",
  };
}

function propsDesdeDatos(datos: DatosPantallasFintrack) {
  const currency = datos.perfil.codigoMoneda;
  const locale = datos.perfil.configuracionRegional;
  const transactions = datos.inicio.movimientosRecientes.map((movimiento) =>
    aMovimientoVisual(movimiento, locale),
  );
  const isDemo = datos.modo === "demo";

  const home: HomeScreenProps = {
    isDemo,
    userName: datos.perfil.nombreMostrar.split(/\s+/)[0],
    balance: aUnidades(datos.inicio.resumen.balanceTotalCentavos),
    income: aUnidades(datos.inicio.resumen.ingresosCentavos),
    expenses: aUnidades(datos.inicio.resumen.gastosCentavos),
    comparisonPercent: null,
    currency,
    locale,
    transactions,
    ...(isDemo ? {} : { weeklyExpenses: [] }),
  };

  const analysis: AnalysisScreenProps = {
    isDemo,
    totalSpent: aUnidades(datos.analisis.gastosCentavos),
    currency,
    locale,
    categories: datos.analisis.gastosPorCategoria.map((item) => ({
      id: item.categoria.id,
      name: item.categoria.nombre,
      amount: aUnidades(item.importeCentavos),
      percentage: item.porcentaje,
      color: item.categoria.color ?? colors.info,
    })),
    budgets: datos.analisis.presupuestos.map((item, index) => ({
      id: item.categoria?.id ?? `presupuesto-${index}`,
      name: item.categoria?.nombre ?? "Presupuesto",
      spent: aUnidades(item.resumen.gastadoCentavos),
      limit: aUnidades(
        item.resumen.gastadoCentavos + item.resumen.restanteCentavos,
      ),
    })),
  };

  const kinds = {
    corriente: "checking",
    ahorro: "savings",
    efectivo: "cash",
    credito: "credit",
  } as const;
  const accounts: AccountsScreenProps = {
    isDemo,
    netWorth: aUnidades(datos.cuentas.patrimonioCentavos),
    assets: aUnidades(datos.cuentas.activosCentavos),
    debts: aUnidades(datos.cuentas.deudasCentavos),
    currency,
    locale,
    accounts: datos.cuentas.elementos.map(({ cuenta, saldoCentavos }) => ({
      id: cuenta.id,
      name: cuenta.nombre,
      kind: kinds[cuenta.tipo],
      balance: aUnidades(saldoCentavos),
      detail:
        cuenta.tipo === "credito"
          ? "Crédito"
          : cuenta.tipo[0].toUpperCase() + cuenta.tipo.slice(1),
      color: cuenta.color ?? colors.primary,
    })),
    transactions,
  };

  const profile: ProfileScreenProps = {
    isDemo,
    name: datos.perfil.nombreMostrar,
    email:
      datos.perfil.correo ??
      (isDemo ? "joel.demo@fintrack.app" : "Correo no disponible"),
    savingsRate: datos.perfilFinanciero.porcentajeAhorro,
    activeGoals: datos.perfilFinanciero.metas.filter((meta) => !meta.completada)
      .length,
    goals: datos.perfilFinanciero.metas.map((meta) => ({
      id: meta.id,
      name: meta.nombre,
      saved: aUnidades(meta.aportadoCentavos),
      target: aUnidades(meta.objetivoCentavos),
      deadline: meta.fechaObjetivo ?? undefined,
    })),
    currency,
    locale,
    streakDays: isDemo ? 12 : 0,
  };

  return { home, analysis, accounts, profile };
}

export function useFintrack() {
  const query = useQuery({
    queryKey: ["fintrack", "pantallas"],
    queryFn: () => servicio.cargarPantallas(),
  });
  const status: FeatureStatus = query.isPending
    ? "loading"
    : query.isError
      ? "error"
      : "ready";

  return {
    ...query,
    status,
    mode: query.data?.modo,
    props: query.data ? propsDesdeDatos(query.data) : undefined,
  };
}
