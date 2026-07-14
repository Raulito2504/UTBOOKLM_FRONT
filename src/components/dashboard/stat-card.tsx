interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "success" | "warning" | "primary";
}

const accentStyles = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  primary: "text-primary",
};

export function StatCard({
  label,
  value,
  hint,
  accent = "default",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${accentStyles[accent]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
