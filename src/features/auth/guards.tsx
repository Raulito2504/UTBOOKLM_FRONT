"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { AUTH_PREVIEW_MODE } from "@/src/lib/api/config";

function Loading() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted" role="status">Cargando sesión…</div>;
}

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!AUTH_PREVIEW_MODE && !isLoading && !isAuthenticated) router.replace("/login"); }, [isAuthenticated, isLoading, router]);
  if (!AUTH_PREVIEW_MODE && (isLoading || !isAuthenticated)) return <Loading />;
  return children;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!isLoading && isAuthenticated) router.replace("/notebooks"); }, [isAuthenticated, isLoading, router]);
  if (isLoading || isAuthenticated) return <Loading />;
  return children;
}
