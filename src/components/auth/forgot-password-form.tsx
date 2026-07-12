"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { authService } from "@/src/features/auth/service";

const genericMessage = "Si el correo pertenece a una cuenta, recibirás instrucciones para restablecer tu contraseña.";
export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (loading) return; const email = String(new FormData(event.currentTarget).get("email") ?? "").trim(); if (!email) return; setLoading(true); try { await authService.forgotPassword({ email }); } catch {} finally { setMessage(genericMessage); setLoading(false); } }
  return <form onSubmit={submit} className="space-y-5"><Input label="Correo electrónico" name="email" type="email" autoComplete="email" required disabled={loading} />{message && <p className="text-sm text-foreground" role="status">{message}</p>}<Button type="submit" fullWidth disabled={loading}>{loading ? "Enviando…" : "Enviar instrucciones"}</Button><p className="text-center text-sm"><Link href="/login" className="font-semibold text-primary">Volver al inicio de sesión</Link></p></form>;
}
