import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { RegisterForm } from "@/src/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Regístrate para subir material académico y aprovechar el motor RAG de UTBookLM."
    >
      <RegisterForm />
    </AuthShell>
  );
}
