"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { API_BASE_URL } from "@/src/lib/api/config";
import { useAuth } from "@/src/features/auth/auth-context";
import { ApiError } from "@/src/lib/api/client";

const loginErrors: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  auth_disabled: "La autenticación no está activa en el backend.",
  validation_error: "Revisa el correo y la contraseña.",
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) { setError("Ingresa tu correo y contraseña."); return; }
    setIsSubmitting(true); setError("");
    try {
      await login({ email, password }, form.get("remember") === "on");
      router.replace("/notebooks");
    } catch (cause) {
      setError(cause instanceof ApiError ? loginErrors[cause.errorCode] ?? "No fue posible iniciar sesión. Intenta de nuevo." : "No fue posible iniciar sesión. Intenta de nuevo.");
    }
    finally { setIsSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="tu@universidad.edu" disabled={isSubmitting} required />
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña</label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-hover">¿Olvidaste tu contraseña?</Link>
        </div>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" disabled={isSubmitting} required className="h-11 w-full rounded-lg border border-border bg-card px-3.5 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isSubmitting} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-foreground" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? "Ocultar" : "Ver"}</button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="remember" disabled={isSubmitting} className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />Recordarme en este dispositivo</label>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <Button type="submit" fullWidth disabled={isSubmitting}>{isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}</Button>
      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-xs text-muted">o</span><span className="h-px flex-1 bg-border" /></div>
      <Button type="button" variant="secondary" fullWidth disabled={isSubmitting} onClick={() => window.location.assign(`${API_BASE_URL}/auth/google/login`)}>Continuar con Google</Button>
      <p className="text-center text-sm text-muted">¿Aún no tienes cuenta? <Link href="/register" className="font-semibold text-primary hover:text-primary-hover">Regístrate gratis</Link></p>
    </form>
  );
}
