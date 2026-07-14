import type { StreakCalendar } from "@/src/types/streaks";

interface ActivityCalendarProps {
  calendar: StreakCalendar;
}

const levelColors: Record<StreakCalendar["days"][number]["level"], string> = {
  0: "bg-slate-100",
  1: "bg-emerald-200",
  2: "bg-emerald-400",
  3: "bg-emerald-500",
  4: "bg-emerald-700",
};

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function ActivityCalendar({ calendar }: ActivityCalendarProps) {
  const weeks = groupDaysIntoWeeks(calendar.days);

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Actividad de estudio
          </h2>
          <p className="text-sm text-muted">
            Calendario {calendar.year} · estilo GitHub
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          <span>Menos</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={`h-3 w-3 rounded-sm ${levelColors[level]}`}
            />
          ))}
          <span>Más</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full flex-col gap-1">
          <div className="flex gap-1 pl-8">
            {MONTH_LABELS.map((month, index) => (
              <span
                key={month}
                className="w-8 shrink-0 text-center text-[10px] text-muted"
                style={{ marginLeft: index === 0 ? 0 : "1.5rem" }}
              >
                {index % 2 === 0 ? month : ""}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col gap-1 pr-1 text-[10px] text-muted">
              <span className="h-3">L</span>
              <span className="h-3" />
              <span className="h-3">M</span>
              <span className="h-3" />
              <span className="h-3">V</span>
            </div>

            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const isPadding = day.date.startsWith("pad");
                    return (
                      <div
                        key={day.date}
                        title={
                          isPadding
                            ? undefined
                            : `${day.date}: ${day.activity_count} actividades`
                        }
                        className={`h-3 w-3 rounded-sm ${
                          isPadding ? "bg-transparent" : levelColors[day.level]
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function groupDaysIntoWeeks(
  days: StreakCalendar["days"],
): StreakCalendar["days"][] {
  const weeks: StreakCalendar["days"][] = [];
  let currentWeek: StreakCalendar["days"] = [];

  const firstDay = new Date(days[0].date + "T12:00:00");
  const startPadding = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < startPadding; i++) {
    currentWeek.push({ date: `pad-${i}`, activity_count: 0, level: 0 });
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: `pad-end-${currentWeek.length}`,
        activity_count: 0,
        level: 0,
      });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
