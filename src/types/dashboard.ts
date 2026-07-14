import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";
import type { UserProfile } from "@/src/types/auth";

export interface UsageMetrics {
  documents_uploaded: number;
  rag_queries: number;
  flashcards_reviewed: number;
  study_minutes_this_week: number;
  exams_completed: number;
}

export interface MasteredTopic {
  id: string;
  name: string;
  document_title: string;
  mastery_percent: number;
  last_studied_at: string;
}

export interface ExamPerformance {
  average_score: number;
  best_score: number;
  total_attempts: number;
  recent_scores: number[];
  trend: "up" | "down" | "stable";
}

export interface RecentActivity {
  id: string;
  type: "rag_query" | "flashcard_review" | "exam" | "document_upload";
  title: string;
  timestamp: string;
}

export interface DashboardData {
  user: UserProfile;
  streak: StreakSummary;
  calendar: StreakCalendar;
  usage: UsageMetrics;
  mastered_topics: MasteredTopic[];
  exam_performance: ExamPerformance;
  recent_activity: RecentActivity[];
}
