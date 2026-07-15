import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import { mockDashboardData } from "@/src/lib/mock/dashboard";
import { delay } from "@/src/lib/utils/delay";
import type { DashboardData, RecentActivity } from "@/src/types/dashboard";
import type { StreakCalendar } from "@/src/types/streaks";

interface ApiUser {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
}

interface DashboardMetrics {
  documents: { total: number };
  chats: { messages: number };
  flashcards: { reviewed: number };
  quizzes: { attempts: number; average_score: number | null };
  activity: { current_streak: number; longest_streak: number; total_active_days: number };
}

interface ApiActivity {
  id: string;
  activity_type: string;
  activity_date: string;
  metadata_json: { title?: string } | null;
}

function activityType(value: string): RecentActivity["type"] {
  if (value.includes("flashcard")) return "flashcard_review";
  if (value.includes("quiz") || value.includes("exam")) return "exam";
  if (value.includes("document")) return "document_upload";
  return "rag_query";
}

function calendarFromActivities(activities: ApiActivity[]): StreakCalendar {
  const year = new Date().getFullYear();
  const counts = new Map<string, number>();
  for (const activity of activities) {
    const date = activity.activity_date.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  const days: StreakCalendar["days"] = [];
  for (let date = new Date(year, 0, 1); date.getFullYear() === year; date.setDate(date.getDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    const count = counts.get(key) ?? 0;
    days.push({ date: key, activity_count: count, level: count === 0 ? 0 : Math.min(count, 4) as 1 | 2 | 3 | 4 });
  }
  return { year, days };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return mockDashboardData;
  }

  const [user, metrics, activity] = await Promise.all([
    apiClient<ApiUser>("/users/me"),
    apiClient<DashboardMetrics>("/dashboard/metrics"),
    apiClient<ApiActivity[]>("/dashboard/activity?limit=100&offset=0"),
  ]);
  const average = metrics.quizzes.average_score ?? 0;
  return {
    user: { id: user.id, email: user.email, name: user.name, avatar_url: null, org_id: user.organization_id, role: user.role, created_at: "" },
    streak: {
      current_streak: metrics.activity.current_streak,
      longest_streak: metrics.activity.longest_streak,
      total_active_days: metrics.activity.total_active_days,
      last_activity_date: activity[0]?.activity_date.slice(0, 10) ?? null,
    },
    calendar: calendarFromActivities(activity),
    usage: {
      documents_uploaded: metrics.documents.total,
      rag_queries: metrics.chats.messages,
      flashcards_reviewed: metrics.flashcards.reviewed,
      study_minutes_this_week: 0,
      exams_completed: metrics.quizzes.attempts,
    },
    mastered_topics: [],
    exam_performance: { average_score: average, best_score: average, total_attempts: metrics.quizzes.attempts, recent_scores: [], trend: "stable" },
    recent_activity: activity.map((item) => ({
      id: item.id,
      type: activityType(item.activity_type),
      title: item.metadata_json?.title ?? item.activity_type.replaceAll("_", " "),
      timestamp: item.activity_date,
    })),
  };
}
