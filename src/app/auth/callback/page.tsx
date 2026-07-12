"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-context";

const oauthErrors: Record<string, string> = {
  google_auth_disabled: "El acceso con Google no está disponible.",
  google_auth_config_missing: "El acceso con Google no está configurado.",
  google_auth_state_invalid: "La solicitud de acceso expiró o no es válida.",
  google_auth_code_invalid: "Google no pudo validar el acceso.",
  google_profile_invalid: "No fue posible obtener un perfil válido de Google.",
  google_email_not_verified: "Tu correo de Google debe estar verificado.",
  google_user_inactive: "Esta cuenta está inactiva.",
};
export default function GoogleCallbackPage() {
  const { acceptOAuthSession } = useAuth(); const router = useRouter(); const started = useRef(false); const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return; started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1)); const query = new URLSearchParams(window.location.search);
    const accessToken = hash.get("access_token"); const refreshToken = hash.get("refresh_token"); const tokenType = hash.get("token_type"); const errorCode = hash.get("error_code") ?? query.get("error_code");
    window.history.replaceState(null, "", "/auth/callback");
    if (errorCode) { window.setTimeout(() => setError(oauthErrors[errorCode] ?? "No fue posible iniciar sesión con Google."), 0); return; }
    if (!accessToken || !refreshToken || !tokenType) { window.setTimeout(() => setError("La respuesta de autenticación está incompleta."), 0); return; }
    acceptOAuthSession(accessToken, refreshToken, tokenType).then(() => router.replace("/dashboard")).catch(() => setError("No fue posible completar el inicio de sesión con Google."));
  }, [acceptOAuthSession, router]);
  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">{error ? <><p className="text-sm text-error" role="alert">{error}</p><Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary">Volver al inicio de sesión</Link></> : <p className="text-sm text-muted" role="status">Completando inicio de sesión…</p>}</div></main>;
}
