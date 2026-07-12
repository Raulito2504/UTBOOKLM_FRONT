"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNavItems } from "@/src/lib/navigation";
import { useAuth } from "@/src/features/auth/auth-context";

interface MobileNavProps {
  currentPath: string;
}

export function MobileNav({ currentPath }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
      <Link href="/dashboard" className="inline-flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
          UT
        </span>
        <span className="text-sm font-bold">UTBookLM</span>
      </Link>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground"
        aria-expanded={open}
        aria-label="Abrir menú de navegación"
      >
        {open ? "Cerrar" : "Menú"}
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-14 z-20 border-b border-border bg-card p-3 shadow-sm">
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = currentPath === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-muted hover:bg-slate-50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => void logout()} className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-primary">Cerrar sesión</button>
        </nav>
      )}
    </header>
  );
}
