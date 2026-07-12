import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { LoginForm } from "@/src/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para continuar con tus documentos, flashcards y rachas de estudio."
    >
      <LoginForm />
    </AuthShell>
  );
}
