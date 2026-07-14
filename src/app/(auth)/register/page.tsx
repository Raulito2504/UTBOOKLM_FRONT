import { AuthShell } from "@/src/components/auth/auth-shell";
import { RegisterForm } from "@/src/components/auth/register-form";

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
