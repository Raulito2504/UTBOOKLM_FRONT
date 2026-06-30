import Link from "next/link";
import type { RecentActivity } from "@/src/types/dashboard";

interface RecentActivityListProps {
  activities: RecentActivity[];
}

const activityIcons: Record<RecentActivity["type"], string> = {
  rag_query: "◉",
  flashcard_review: "▢",
  exam: "✓",
  document_upload: "▤",
};

const activityLabels: Record<RecentActivity["type"], string> = {
  rag_query: "Consulta RAG",
  flashcard_review: "Flashcards",
  exam: "Examen",
  document_upload: "Documento",
};

export function RecentActivityList({ activities }: RecentActivityListProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Actividad reciente
      </h2>

      <ul className="space-y-3">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5"
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-xs text-primary"
              aria-hidden
            >
              {activityIcons[activity.type]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {activity.title}
              </p>
              <p className="text-xs text-muted">
                {activityLabels[activity.type]} ·{" "}
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface QuickActionsProps {
  className?: string;
}

const actions = [
  { label: "Subir documento", href: "/documents", description: "PDF o PPTX" },
  { label: "Hacer una pregunta", href: "/rag", description: "Motor RAG" },
  { label: "Repasar flashcards", href: "/flashcards", description: "Generadas por IA" },
  { label: "Unirse a una sala", href: "/rooms", description: "Estudio colaborativo" },
];

export function QuickActions({ className = "" }: QuickActionsProps) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-6 shadow-sm ${className}`}
    >
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Acciones rápidas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary-light/40"
          >
            <p className="text-sm font-semibold text-foreground">
              {action.label}
            </p>
            <p className="text-xs text-muted">{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "hace unos minutos";
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffHours < 48) return "ayer";

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
