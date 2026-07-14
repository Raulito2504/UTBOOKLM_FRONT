export interface StreakSummary {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  last_activity_date: string | null;
}

export interface StreakCalendarDay {
  date: string;
  activity_count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface StreakCalendar {
  year: number;
  days: StreakCalendarDay[];
}
