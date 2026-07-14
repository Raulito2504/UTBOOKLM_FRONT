"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityCalendar } from "@/src/components/dashboard/activity-calendar";
import { StreakCard } from "@/src/components/dashboard/streak-card";
import { StatCard } from "@/src/components/dashboard/stat-card";
import { PageHeader } from "@/src/components/ui/page-header";
import { getStreakCalendar, getStreakSummary } from "@/src/services/streaks";
import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";

const milestones = [
  { days: 7, label: "Una semana", emoji: "⭐" },
  { days: 14, label: "Dos semanas", emoji: "🏅" },
  { days: 30, label: "Un mes", emoji: "🏆" },
  { days: 100, label: "Centenario", emoji: "💎" },
];

export function StreaksView() {
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [calendar, setCalendar] = useState<StreakCalendar | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [streakData, calendarData] = await Promise.all([
        getStreakSummary(),
        getStreakCalendar(new Date().getFullYear()),
      ]);
      setStreak(streakData);
      setCalendar(calendarData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  if (loading || !streak || !calendar) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-48 rounded-xl bg-slate-200" />
        <div className="h-40 rounded-xl bg-slate-200" />
      </div>
    );
  }

  const nextMilestone = milestones.find((m) => m.days > streak.current_streak);
  const daysToMilestone = nextMilestone
    ? nextMilestone.days - streak.current_streak
    : 0;

  return (
    <div>
      <PageHeader
        title="Rachas de estudio"
        description="Registra tu constancia diaria, visualiza tu historial y mantén la motivación estilo Duolingo."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <StreakCard streak={streak} />
          <ActivityCalendar calendar={calendar} />

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">
              Hitos de racha
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {milestones.map((milestone) => {
                const achieved = streak.longest_streak >= milestone.days;
                return (
                  <div
                    key={milestone.days}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                      achieved
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-border bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {milestone.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {milestone.label}
                      </p>
                      <p className="text-xs text-muted">
                        {milestone.days} días consecutivos
                        {achieved ? " · Logrado" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            <StatCard
              label="Racha actual"
              value={`${streak.current_streak} días`}
              accent="warning"
            />
            <StatCard
              label="Mejor racha"
              value={`${streak.longest_streak} días`}
              accent="success"
            />
            <StatCard
              label="Total días activos"
              value={streak.total_active_days}
            />
          </div>

          {nextMilestone && (
            <section className="rounded-xl border border-border bg-linear-to-br from-indigo-50 to-violet-50 p-5">
              <p className="text-sm font-semibold text-indigo-700">
                Próximo hito: {nextMilestone.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {daysToMilestone}{" "}
                {daysToMilestone === 1 ? "día" : "días"} restantes
              </p>
              <p className="mt-2 text-xs text-indigo-600/80">
                Estudia hoy para mantener tu racha activa. El frontend registra
                actividad automáticamente vía POST /streaks/ping.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">
              Consejos de constancia
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>· Repasa al menos 5 flashcards al día</li>
              <li>· Haz una consulta RAG sobre tu material</li>
              <li>· Completa un examen de práctica semanal</li>
              <li>· Únete a una sala de estudio colaborativa</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
