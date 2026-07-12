import { Suspense } from "react";
import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/src/features/auth/components/reset-password-form";
export default function ResetPasswordPage() { return <AuthShell title="Crea una nueva contraseña" subtitle="Tu nueva contraseña debe tener entre 8 y 128 caracteres."><Suspense fallback={<p className="text-sm text-muted">Validando enlace…</p>}><ResetPasswordForm /></Suspense></AuthShell>; }
