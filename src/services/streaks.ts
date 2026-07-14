import { ApiError, apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import {
  getMockStreak,
  getMockStreakCalendar,
} from "@/src/lib/mock/dashboard";
import { delay } from "@/src/lib/utils/delay";
import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";

export async function getStreakSummary(): Promise<StreakSummary> {
  if (USE_MOCK_DATA) {
    await delay(200);
    return getMockStreak();
  }
  try {
    return await apiClient<StreakSummary>("/streaks/me");
  } catch (error) {
    if (isUnavailable(error)) return getMockStreak();
    throw error;
  }
}

export async function getStreakCalendar(
  year?: number,
): Promise<StreakCalendar> {
  const targetYear = year ?? new Date().getFullYear();

  if (USE_MOCK_DATA) {
    await delay(200);
    return getMockStreakCalendar(targetYear);
  }

  const query = year ? `?year=${year}` : "";
  try {
    return await apiClient<StreakCalendar>(`/streaks/me/calendar${query}`);
  } catch (error) {
    if (isUnavailable(error)) return getMockStreakCalendar(targetYear);
    throw error;
  }
}

export async function pingStreakActivity(): Promise<void> {
  if (USE_MOCK_DATA) return;
  try {
    await apiClient<void>("/streaks/ping", { method: "POST" });
  } catch (error) {
    if (!isUnavailable(error)) throw error;
  }
}

function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && [404, 405].includes(error.status);
}
