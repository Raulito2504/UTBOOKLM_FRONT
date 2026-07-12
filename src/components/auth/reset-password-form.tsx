"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { authService } from "@/src/features/auth/service";
import { ApiError } from "@/src/lib/api/client";

const tokenErrors: Record<string, string> = {
  password_reset_token_invalid: "El enlace no es válido.",
  password_reset_token_expired: "El enlace ha expirado. Solicita uno nuevo.",
  password_reset_token_used: "Este enlace ya fue utilizado. Solicita uno nuevo.",
};
export function ResetPasswordForm() {
  const token = useSearchParams().get("token"); const router = useRouter();
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading || !token) return;
    const form = new FormData(event.currentTarget); const password = String(form.get("password") ?? "");
    if (password.length < 8 || password.length > 128) { setError("La contraseña debe tener entre 8 y 128 caracteres."); return; }
    if (password !== String(form.get("confirmPassword") ?? "")) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true); setError("");
    try { await authService.resetPassword({ reset_token: token, new_password: password }); setSuccess(true); window.setTimeout(() => router.replace("/login"), 1800); }
    catch (cause) { setError(cause instanceof ApiError ? tokenErrors[cause.errorCode] ?? "No fue posible cambiar la contraseña. Revisa los datos." : "No fue posible cambiar la contraseña."); }
    finally { setLoading(false); }
  }
  if (!token) return <div className="space-y-4"><p className="text-sm text-error" role="alert">El enlace no contiene un token válido.</p><Link href="/forgot-password" className="text-sm font-semibold text-primary">Solicitar un enlace nuevo</Link></div>;
  if (success) return <p className="text-sm text-foreground" role="status">Contraseña actualizada. Te redirigiremos al inicio de sesión…</p>;
  return <form onSubmit={submit} className="space-y-5"><Input label="Nueva contraseña" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={loading} /><Input label="Confirmar contraseña" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={loading} />{error && <p className="text-sm text-error" role="alert">{error}</p>}<Button type="submit" fullWidth disabled={loading}>{loading ? "Actualizando…" : "Cambiar contraseña"}</Button></form>;
}
