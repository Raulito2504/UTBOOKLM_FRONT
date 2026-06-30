import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  getMockStreak,
  getMockStreakCalendar,
} from "@/src/lib/mock/dashboard";
import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";

/** GET /api/v1/streaks/me */
export async function getStreakSummary(): Promise<StreakSummary> {
  if (USE_MOCK_DATA) {
    await delay(200);
    return getMockStreak();
  }
  return apiClient<StreakSummary>("/streaks/me");
}

/** GET /api/v1/streaks/me/calendar */
export async function getStreakCalendar(
  year?: number,
): Promise<StreakCalendar> {
  const targetYear = year ?? new Date().getFullYear();

  if (USE_MOCK_DATA) {
    await delay(200);
    return getMockStreakCalendar(targetYear);
  }

  const query = year ? `?year=${year}` : "";
  return apiClient<StreakCalendar>(`/streaks/me/calendar${query}`);
}

/** POST /api/v1/streaks/ping */
export async function pingStreakActivity(): Promise<void> {
  if (USE_MOCK_DATA) return;
  await apiClient<void>("/streaks/ping", { method: "POST" });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
