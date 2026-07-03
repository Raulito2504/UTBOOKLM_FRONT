"use client";

import { useEffect, useState } from "react";
import { ActivityCalendar } from "@/src/components/dashboard/activity-calendar";
import { DashboardHeader } from "@/src/components/dashboard/dashboard-header";
import { ExamPerformanceCard } from "@/src/components/dashboard/exam-performance";
import { MasteredTopics } from "@/src/components/dashboard/mastered-topics";
import {
  QuickActions,
  RecentActivityList,
} from "@/src/components/dashboard/recent-activity";
import { StreakCard } from "@/src/components/dashboard/streak-card";
import { UsageMetricsGrid } from "@/src/components/dashboard/usage-metrics";
import { getDashboardData } from "@/src/services/dashboard";
import type { DashboardData } from "@/src/types/dashboard";

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const dashboard = await getDashboardData();
        if (!cancelled) {
          setData(dashboard);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el dashboard",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Error desconocido al cargar el panel."}
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader user={data.user} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <StreakCard streak={data.streak} />
          <UsageMetricsGrid usage={data.usage} />
          <ActivityCalendar calendar={data.calendar} />
        </div>

        <div className="space-y-6">
          <QuickActions />
          <MasteredTopics topics={data.mastered_topics} />
          <ExamPerformanceCard performance={data.exam_performance} />
          <RecentActivityList activities={data.recent_activity} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-8 w-72 rounded bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-200" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="h-48 rounded-xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-28 rounded-xl bg-slate-200" />
            <div className="h-28 rounded-xl bg-slate-200" />
          </div>
          <div className="h-40 rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-6">
          <div className="h-44 rounded-xl bg-slate-200" />
          <div className="h-56 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
