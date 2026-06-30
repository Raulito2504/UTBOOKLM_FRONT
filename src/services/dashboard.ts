import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import { mockDashboardData } from "@/src/lib/mock/dashboard";
import { delay } from "@/src/lib/utils/delay";
import type { DashboardData } from "@/src/types/dashboard";
import type { UserProfile } from "@/src/types/auth";
import { getStreakCalendar, getStreakSummary } from "@/src/services/streaks";

/**
 * Agrega datos del dashboard desde múltiples endpoints.
 * Cuando el backend exponga GET /api/v1/dashboard, reemplazar esta composición.
 */
export async function getDashboardData(): Promise<DashboardData> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return mockDashboardData;
  }

  const [user, streak, calendar] = await Promise.all([
    apiClient<UserProfile>("/auth/me"),
    getStreakSummary(),
    getStreakCalendar(),
  ]);

  const dashboard = await apiClient<Omit<DashboardData, "user" | "streak" | "calendar">>(
    "/dashboard",
  );

  return { user, streak, calendar, ...dashboard };
}

