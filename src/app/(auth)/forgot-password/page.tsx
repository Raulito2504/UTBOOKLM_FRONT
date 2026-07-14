import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/src/features/auth/components/forgot-password-form";
export default function ForgotPasswordPage() { return <AuthShell title="Recupera tu contraseña" subtitle="Ingresa el correo asociado a tu cuenta."><ForgotPasswordForm /></AuthShell>; }
