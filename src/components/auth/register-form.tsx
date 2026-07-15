"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useAuth } from "@/src/features/auth/auth-context";
import { ApiError } from "@/src/lib/api/client";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) { setError("Las contraseñas no coinciden."); return; }
    setIsSubmitting(true);
    setError("");
    try {
      await register({ name: String(form.get("name") ?? "").trim(), organization_name: String(form.get("organization_name") ?? "").trim(), email: String(form.get("email") ?? "").trim(), password });
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof ApiError && cause.errorCode === "email_already_registered" ? "Ya existe una cuenta con ese correo electrónico." : "No fue posible crear la cuenta. Intenta de nuevo.");
    } finally { setIsSubmitting(false); }
  }

  return <form onSubmit={handleSubmit} className="space-y-5">
    <Input label="Nombre completo" name="name" type="text" autoComplete="name" placeholder="Esmeralda Mendoza" disabled={isSubmitting} required />
    <Input label="Nombre de la organización" name="organization_name" type="text" autoComplete="organization" placeholder="Universidad Tecnológica" disabled={isSubmitting} required />
    <Input label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="tu@universidad.edu" disabled={isSubmitting} required />
    <div className="space-y-1.5">
      <label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña</label>
      <div className="relative">
        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} maxLength={128} disabled={isSubmitting} required className="h-11 w-full rounded-lg border border-border bg-card px-3.5 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60" />
        <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isSubmitting} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-foreground">{showPassword ? "Ocultar" : "Ver"}</button>
      </div>
      <p className="text-xs text-muted">Usa al menos 8 caracteres con letras y números.</p>
    </div>
    <Input label="Confirmar contraseña" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repite tu contraseña" minLength={8} maxLength={128} disabled={isSubmitting} required />
    <label className="flex items-start gap-2 text-sm text-muted"><input type="checkbox" name="terms" required disabled={isSubmitting} className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30" /><span>Acepto los <Link href="#" className="font-medium text-primary">términos de uso</Link> y la <Link href="#" className="font-medium text-primary">política de privacidad</Link>.</span></label>
    {error && <p className="text-sm text-error" role="alert">{error}</p>}
    <Button type="submit" fullWidth disabled={isSubmitting}>{isSubmitting ? "Creando cuenta…" : "Crear cuenta"}</Button>
    <p className="text-center text-sm text-muted">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">Inicia sesión</Link></p>
  </form>;
}
