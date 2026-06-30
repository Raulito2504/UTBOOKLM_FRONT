import type { MasteredTopic } from "@/src/types/dashboard";

interface MasteredTopicsProps {
  topics: MasteredTopic[];
}

export function MasteredTopics({ topics }: MasteredTopicsProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Temas dominados
        </h2>
        <p className="text-sm text-muted">
          Progreso por tema según repaso y exámenes
        </p>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-muted">
          Aún no tienes temas dominados. Sube documentos y repasa flashcards
          para empezar.
        </p>
      ) : (
        <ul className="space-y-4">
          {topics.map((topic) => (
            <li key={topic.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{topic.name}</p>
                  <p className="truncate text-xs text-muted">
                    {topic.document_title}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-emerald-600">
                  {topic.mastery_percent}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${topic.mastery_percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                Último repaso: {formatRelativeDate(topic.last_studied_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
