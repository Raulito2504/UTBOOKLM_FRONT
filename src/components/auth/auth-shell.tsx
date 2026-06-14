import Link from "next/link";

const features = [
  {
    title: "Consulta inteligente",
    description: "Pregunta sobre tus PDFs y apuntes con respuestas citadas.",
  },
  {
    title: "Flashcards y exámenes",
    description: "Genera material de repaso automáticamente con IA.",
  },
  {
    title: "Rachas de estudio",
    description: "Mantén la constancia con métricas diarias motivacionales.",
  },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur-sm">
            UT
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight">UTBookLM</p>
            <p className="text-sm text-indigo-100">Estudio universitario con IA</p>
          </div>
        </Link>
      </div>

      <div className="relative space-y-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Transforma tu material académico en conocimiento accionable
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-indigo-100">
            Plataforma inspirada en NotebookLM, diseñada para el contexto
            estudiantil latinoamericano.
          </p>
        </div>

        <ul className="space-y-4">
          {features.map((feature) => (
            <li key={feature.title} className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
                ✓
              </span>
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-indigo-100">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-indigo-200">
        Proyecto académico · Motor RAG · Multi-tenant · Colaboración en tiempo real
      </p>
    </div>
  );
}

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AuthBrandPanel />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              UT
            </span>
            <span className="font-bold text-foreground">UTBookLM</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted">{subtitle}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
