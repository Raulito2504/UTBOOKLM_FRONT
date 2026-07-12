import { AuthShell } from "@/src/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/src/components/auth/forgot-password-form";
export default function ForgotPasswordPage() { return <AuthShell title="Recupera tu contraseña" subtitle="Ingresa el correo asociado a tu cuenta."><ForgotPasswordForm /></AuthShell>; }
