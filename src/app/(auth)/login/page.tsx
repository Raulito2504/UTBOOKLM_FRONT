import { AuthShell } from "@/src/components/auth/auth-shell";
import { LoginForm } from "@/src/components/auth/login-form";

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
