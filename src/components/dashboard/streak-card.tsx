import Link from "next/link";
import type { StreakSummary } from "@/src/types/streaks";
import { Button } from "@/src/components/ui/button";

interface StreakCardProps {
  streak: StreakSummary;
}

export function StreakCard({ streak }: StreakCardProps) {
  return (
    <section className="rounded-xl border border-border bg-linear-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Racha activa
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-bold text-amber-600">
              {streak.current_streak}
            </span>
            <span className="mb-2 text-lg font-medium text-amber-700">
              {streak.current_streak === 1 ? "día" : "días"}
            </span>
          </div>
          <p className="mt-2 text-sm text-amber-800/80">
            {streak.last_activity_date
              ? `Última actividad: ${formatDate(streak.last_activity_date)}`
              : "Aún no registras actividad hoy"}
          </p>
        </div>

        <span className="text-4xl" aria-hidden>
          🔥
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-amber-200/60 pt-4">
        <div>
          <p className="text-xs font-medium uppercase text-amber-700">
            Racha más larga
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {streak.longest_streak} días
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-amber-700">
            Días activos
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {streak.total_active_days}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Link href="/streaks">
          <Button variant="secondary" className="w-full sm:w-auto">
            Ver detalle de rachas
          </Button>
        </Link>
      </div>
    </section>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
  });
}
