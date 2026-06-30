import type { ExamPerformance } from "@/src/types/dashboard";

interface ExamPerformanceCardProps {
  performance: ExamPerformance;
}

const trendLabels = {
  up: { label: "En ascenso", color: "text-emerald-600" },
  down: { label: "En descenso", color: "text-red-600" },
  stable: { label: "Estable", color: "text-muted" },
};

export function ExamPerformanceCard({ performance }: ExamPerformanceCardProps) {
  const trend = trendLabels[performance.trend];
  const maxScore = Math.max(...performance.recent_scores, 100);

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Rendimiento en exámenes
        </h2>
        <p className="text-sm text-muted">
          Promedio y tendencia de tus últimos intentos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted">Promedio</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {performance.average_score}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted">Mejor nota</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {performance.best_score}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted">Intentos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {performance.total_attempts}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Últimos resultados</p>
          <p className={`text-xs font-semibold ${trend.color}`}>{trend.label}</p>
        </div>

        <div className="flex h-24 items-end gap-2">
          {performance.recent_scores.map((score, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-muted">{score}%</span>
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{ height: `${(score / maxScore) * 100}%`, minHeight: "8px" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
