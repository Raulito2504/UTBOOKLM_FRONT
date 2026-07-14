"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Nombre completo"
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder="Esmeralda Mendoza"
        required
      />

      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@universidad.edu"
        required
      />

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            className="h-11 w-full rounded-lg border border-border bg-card px-3.5 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-foreground"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Usa al menos 8 caracteres con letras y números.
        </p>
      </div>

      <Input
        label="Confirmar contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Repite tu contraseña"
        minLength={8}
        required
      />

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
        />
        <span>
          Acepto los{" "}
          <Link href="#" className="font-medium text-primary hover:text-primary-hover">
            términos de uso
          </Link>{" "}
          y la{" "}
          <Link href="#" className="font-medium text-primary hover:text-primary-hover">
            política de privacidad
          </Link>
          .
        </span>
      </label>

      <Button type="submit" fullWidth>
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
