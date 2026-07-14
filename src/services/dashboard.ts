import { apiClient } from "@/src/lib/api/client";
import { USE_MOCK_DATA } from "@/src/lib/api/config";
import { mockDashboardData } from "@/src/lib/mock/dashboard";
import { delay } from "@/src/lib/utils/delay";
import type { DashboardData, RecentActivity } from "@/src/types/dashboard";
import type { UserProfile } from "@/src/features/auth/hooks/auth";
import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";

interface BackendDashboardMetrics {
  documents: {
    total: number;
    ready: number;
    processing: number;
    failed: number;
  };
  chats: {
    total: number;
    messages: number;
  };
  flashcards: {
    decks: number;
    cards: number;
    reviewed: number;
  };
  quizzes: {
    total: number;
    attempts: number;
    average_score: number | null;
  };
  activity: {
    current_streak: number;
    longest_streak: number;
    total_active_days: number;
  };
}

interface BackendActivity {
  id: string;
  activity_type: string;
  activity_date: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export async function getDashboardData(): Promise<DashboardData> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return mockDashboardData;
  }

  const [user, metrics, activities] = await Promise.all([
    apiClient<UserProfile>("/auth/me"),
    apiClient<BackendDashboardMetrics>("/dashboard/metrics"),
    apiClient<BackendActivity[]>("/dashboard/activity?limit=20&offset=0"),
  ]);

  const streak: StreakSummary = {
    current_streak: metrics.activity.current_streak,
    longest_streak: metrics.activity.longest_streak,
    total_active_days: metrics.activity.total_active_days,
    last_activity_date: activities[0]?.activity_date.slice(0, 10) ?? null,
  };

  return {
    user,
    streak,
    calendar: buildCalendar(new Date().getFullYear(), activities),
    usage: {
      documents_uploaded: metrics.documents.total,
      rag_queries: metrics.chats.messages,
      flashcards_reviewed: metrics.flashcards.reviewed,
      study_minutes_this_week: 0,
      exams_completed: metrics.quizzes.attempts,
    },
    mastered_topics: [],
    exam_performance: {
      average_score: metrics.quizzes.average_score ?? 0,
      best_score: metrics.quizzes.average_score ?? 0,
      total_attempts: metrics.quizzes.attempts,
      recent_scores: [],
      trend: "stable",
    },
    recent_activity: activities.map(toRecentActivity),
  };
}

function buildCalendar(year: number, activities: BackendActivity[]): StreakCalendar {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    const key = activity.activity_date.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: StreakCalendar["days"] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const activity_count = counts.get(date) ?? 0;
    const level = Math.min(activity_count, 4) as 0 | 1 | 2 | 3 | 4;
    days.push({ date, activity_count, level });
  }

  return { year, days };
}

function toRecentActivity(activity: BackendActivity): RecentActivity {
  const title = activityTitle(activity);
  return {
    id: activity.id,
    type: activityType(activity.activity_type),
    title,
    timestamp: activity.activity_date,
  };
}

function activityType(value: string): RecentActivity["type"] {
  if (value.includes("flashcard")) return "flashcard_review";
  if (value.includes("quiz")) return "exam";
  if (value.includes("document")) return "document_upload";
  return "rag_query";
}

function activityTitle(activity: BackendActivity): string {
  const metadata = activity.metadata_json ?? {};
  const title = typeof metadata.title === "string" ? metadata.title : null;
  if (activity.activity_type === "document_uploaded") return title ? `Documento subido: ${title}` : "Documento subido";
  if (activity.activity_type === "chat_created") return title ? `Notebook creado: ${title}` : "Notebook creado";
  if (activity.activity_type === "rag_message_sent") return "Pregunta respondida por RAG";
  if (activity.activity_type === "flashcard_deck_generated") return title ? `Flashcards generadas: ${title}` : "Flashcards generadas";
  if (activity.activity_type === "quiz_generated") return title ? `Examen generado: ${title}` : "Examen generado";
  return activity.activity_type.replaceAll("_", " ");
}
