import { StateView } from "../../components";

export type FeatureStatus = "ready" | "loading" | "empty" | "error" | "offline";

interface FeatureStateProps {
  status: FeatureStatus;
  emptyTitle: string;
  emptyDescription: string;
  onRetry?: () => void;
}

export function FeatureState({
  status,
  emptyTitle,
  emptyDescription,
  onRetry,
}: FeatureStateProps) {
  if (status === "ready") return null;

  const content = {
    loading: {
      title: "Actualizando tus datos",
      description: "Esto tomará solo un momento.",
    },
    empty: { title: emptyTitle, description: emptyDescription },
    error: {
      title: "No pudimos cargar esta sección",
      description: "Revisa tu conexión e inténtalo nuevamente.",
    },
    offline: {
      title: "Estás sin conexión",
      description:
        "Mostraremos la información más reciente cuando vuelvas a conectarte.",
    },
  } as const;
  const current = content[status];

  return (
    <StateView
      actionLabel={
        status === "error" || status === "offline" ? "Reintentar" : undefined
      }
      description={current.description}
      kind={status}
      onAction={onRetry}
      title={current.title}
    />
  );
}
