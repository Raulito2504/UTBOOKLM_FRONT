import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import { getMockStreak, getMockStreakCalendar } from "@/src/lib/mock/dashboard";
import { delay } from "@/src/lib/utils/delay";
import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";

interface DashboardMetrics {
  activity: { current_streak: number; longest_streak: number; total_active_days: number };
}

interface DashboardActivity { activity_date: string }

async function getActivity() {
  return apiClient<DashboardActivity[]>("/dashboard/activity?limit=100&offset=0");
}

/** La API actual expone rachas dentro de las métricas del dashboard. */
export async function getStreakSummary(): Promise<StreakSummary> {
  if (USE_MOCK_DATA) {
    await delay(200);
    return getMockStreak();
  }
  const [metrics, activity] = await Promise.all([
    apiClient<DashboardMetrics>("/dashboard/metrics"),
    getActivity(),
  ]);
  return {
    ...metrics.activity,
    last_activity_date: activity[0]?.activity_date.slice(0, 10) ?? null,
  };
}

/** Construye el calendario a partir del historial real de actividad disponible. */
export async function getStreakCalendar(year = new Date().getFullYear()): Promise<StreakCalendar> {
  if (USE_MOCK_DATA) {
    await delay(200);
    return getMockStreakCalendar(year);
  }
  const activity = await getActivity();
  const counts = new Map<string, number>();
  activity.forEach(({ activity_date }) => {
    const date = activity_date.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  });
  const days: StreakCalendar["days"] = [];
  for (let date = new Date(year, 0, 1); date.getFullYear() === year; date.setDate(date.getDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    const count = counts.get(key) ?? 0;
    days.push({ date: key, activity_count: count, level: count === 0 ? 0 : Math.min(count, 4) as 1 | 2 | 3 | 4 });
  }
  return { year, days };
}

/** El backend develop aún no expone una ruta para registrar actividad manualmente. */
export async function pingStreakActivity(): Promise<void> {
  if (USE_MOCK_DATA) return;
  throw new Error("El backend todavía no expone POST /streaks/ping.");
}
