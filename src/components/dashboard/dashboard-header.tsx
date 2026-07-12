import type { UserProfile } from "@/src/features/auth/hooks/auth";

interface DashboardHeaderProps {
  user: UserProfile;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const firstName = user.name.split(" ")[0];

  return (
    <header className="mb-8">
      <p className="text-sm font-medium text-primary">{getGreeting()}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {firstName}, aquí está tu progreso
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Resumen de tu actividad de estudio: racha activa, temas dominados,
        métricas de uso y rendimiento en exámenes.
      </p>
    </header>
  );
}
