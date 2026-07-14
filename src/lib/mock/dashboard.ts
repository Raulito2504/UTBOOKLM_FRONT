import type { DashboardData } from "@/src/types/dashboard";
import type { StreakCalendar, StreakSummary } from "@/src/types/streaks";
import type { UserProfile } from "@/src/features/auth/hooks/auth";

const mockUser: UserProfile = {
  id: "usr_001",
  email: "esmeralda@universidad.edu",
  name: "Esmeralda Mendoza",
  avatar_url: null,
  org_id: "org_001",
  role: "member",
  created_at: "2026-01-15T10:00:00Z",
};

const mockStreak: StreakSummary = {
  current_streak: 12,
  longest_streak: 21,
  total_active_days: 47,
  last_activity_date: "2026-06-29",
};

function generateCalendarDays(year: number): StreakCalendar {
  const days: StreakCalendar["days"] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const isFuture = d > new Date();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    let activity_count = 0;

    if (!isFuture) {
      const seed = (d.getMonth() + 1) * d.getDate();
      if (seed % 7 !== 0) {
        level = isWeekend
          ? ((seed % 3) as 0 | 1 | 2 | 3 | 4)
          : ((seed % 5) as 0 | 1 | 2 | 3 | 4);
        activity_count = level * 3;
      }
    }

    days.push({ date: dateStr, activity_count, level });
  }

  return { year, days };
}

export const mockDashboardData: DashboardData = {
  user: mockUser,
  streak: mockStreak,
  calendar: generateCalendarDays(2026),
  usage: {
    documents_uploaded: 8,
    rag_queries: 34,
    flashcards_reviewed: 156,
    study_minutes_this_week: 245,
    exams_completed: 5,
  },
  mastered_topics: [
    {
      id: "topic_001",
      name: "Teoría de grafos",
      document_title: "Matemáticas Discretas — Cap. 4",
      mastery_percent: 92,
      last_studied_at: "2026-06-28T18:30:00Z",
    },
    {
      id: "topic_002",
      name: "Normalización de BD",
      document_title: "Bases de Datos — Unidad 3",
      mastery_percent: 85,
      last_studied_at: "2026-06-27T14:15:00Z",
    },
    {
      id: "topic_003",
      name: "Patrones creacionales",
      document_title: "Ingeniería de Software — Factory Method",
      mastery_percent: 78,
      last_studied_at: "2026-06-26T09:00:00Z",
    },
    {
      id: "topic_004",
      name: "Pipeline RAG",
      document_title: "Proyecto UTBookLM — Arquitectura",
      mastery_percent: 71,
      last_studied_at: "2026-06-25T20:45:00Z",
    },
  ],
  exam_performance: {
    average_score: 82,
    best_score: 95,
    total_attempts: 5,
    recent_scores: [72, 78, 85, 88, 95],
    trend: "up",
  },
  recent_activity: [
    {
      id: "act_001",
      type: "rag_query",
      title: 'Consulta: "¿Qué es el patrón Strategy?"',
      timestamp: "2026-06-29T10:30:00Z",
    },
    {
      id: "act_002",
      type: "flashcard_review",
      title: "Repaso: 24 flashcards de Bases de Datos",
      timestamp: "2026-06-28T19:00:00Z",
    },
    {
      id: "act_003",
      type: "exam",
      title: "Examen de práctica — Matemáticas Discretas (88%)",
      timestamp: "2026-06-28T16:45:00Z",
    },
    {
      id: "act_004",
      type: "document_upload",
      title: "Subido: Ingeniería de Software — Unidad 5.pdf",
      timestamp: "2026-06-27T11:20:00Z",
    },
  ],
};

export function getMockStreak(): StreakSummary {
  return mockDashboardData.streak;
}

export function getMockStreakCalendar(year: number): StreakCalendar {
  if (year === mockDashboardData.calendar.year) {
    return mockDashboardData.calendar;
  }
  return generateCalendarDays(year);
}
