import type { UsageMetrics } from "@/src/types/dashboard";
import { StatCard } from "@/src/components/dashboard/stat-card";

interface UsageMetricsGridProps {
  usage: UsageMetrics;
}

export function UsageMetricsGrid({ usage }: UsageMetricsGridProps) {
  const studyHours = Math.floor(usage.study_minutes_this_week / 60);
  const studyMinutes = usage.study_minutes_this_week % 60;

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Métricas de uso
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Documentos subidos"
          value={usage.documents_uploaded}
          hint="PDFs y presentaciones indexados"
          accent="primary"
        />
        <StatCard
          label="Consultas RAG"
          value={usage.rag_queries}
          hint="Preguntas con respuestas citadas"
        />
        <StatCard
          label="Flashcards repasadas"
          value={usage.flashcards_reviewed}
          hint="Total acumulado"
        />
        <StatCard
          label="Tiempo de estudio"
          value={`${studyHours}h ${studyMinutes}m`}
          hint="Esta semana"
          accent="success"
        />
        <StatCard
          label="Exámenes completados"
          value={usage.exams_completed}
          hint="Práctica con IA"
        />
      </div>
    </section>
  );
}
