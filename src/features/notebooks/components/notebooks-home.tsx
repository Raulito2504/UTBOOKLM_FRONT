"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/features/auth/auth-context";
import { listNotebooks } from "../api/service";
import type { NotebookCard as NotebookCardType } from "../types";
import { CreateNotebookButton } from "./create-notebook-button";
import { NotebookCard } from "./notebook-card";

type Status = "idle" | "loading" | "success" | "error";

export function NotebooksHome() {
  const { user, logout } = useAuth();
  const [notebooks, setNotebooks] = useState<NotebookCardType[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [query, setQuery] = useState("");

  const loadNotebooks = useCallback(async () => {
    setStatus("loading");
    try {
      setNotebooks(await listNotebooks());
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotebooks(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotebooks]);

  const filteredNotebooks = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return notebooks;
    return notebooks.filter((notebook) =>
      notebook.title.toLowerCase().includes(value),
    );
  }, [notebooks, query]);

  function removeNotebookFromList(notebookId: string) {
    setNotebooks((current) => current.filter((item) => item.id !== notebookId));
  }

  return (
    <section className="min-h-screen bg-[#20242a] px-5 py-5 text-white sm:px-8 lg:px-12 lg:py-8">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/55">UTBookLM</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              Mis cuadernos
            </h1>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative block">
              <span className="sr-only">Buscar cuadernos</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar"
                className="h-10 w-full rounded-full border border-white/12 bg-[#171b20] px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/35 md:w-72"
              />
            </label>
            <CreateNotebookButton onCreated={() => void loadNotebooks()} />
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-xs font-semibold uppercase">
                {(user?.name || user?.email || "U").slice(0, 1)}
              </div>
              <div className="min-w-0 text-sm leading-tight">
                <p className="max-w-40 truncate font-medium text-white">
                  {user?.name || "Usuario"}
                </p>
                <p className="max-w-40 truncate text-xs text-white/50">
                  {user?.email || "Sesion activa"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-10 w-full max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cuadernos recientes</h2>
          {status === "success" ? (
            <span className="text-sm text-white/45">
              {filteredNotebooks.length} resultados
            </span>
          ) : null}
        </div>

        {status === "loading" || status === "idle" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="min-h-40 animate-pulse rounded-lg bg-white/[0.06]"
              />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-lg border border-red-300/30 bg-red-400/10 p-5 text-sm text-red-100">
            No fue posible cargar tus cuadernos. Revisa que el backend este
            activo e intenta de nuevo.
          </div>
        ) : null}

        {status === "success" && filteredNotebooks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredNotebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                onDeleted={removeNotebookFromList}
              />
            ))}
          </div>
        ) : null}

        {status === "success" && filteredNotebooks.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
            <h3 className="text-lg font-semibold">Todavia no hay cuadernos</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
              Crea uno para reunir fuentes, preguntas y materiales de estudio en
              un solo lugar.
            </p>
            <div className="mt-5 flex justify-center">
              <CreateNotebookButton onCreated={() => void loadNotebooks()} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
